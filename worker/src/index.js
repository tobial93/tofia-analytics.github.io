import { validate, buildMail } from "./validate.js";
import { sendViaCloudflare } from "./send.js";

// Einfache Mengenbegrenzung pro Worker-Instanz (best effort, nur im Arbeitsspeicher):
// maximal 5 Anfragen pro IP in 10 Minuten. IP-Adressen werden nicht gespeichert, nur gezaehlt.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map();

function limited(ip, now) {
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > LIMIT;
}

function corsHeaders(origin, allowed) {
  if (!origin || !allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...(headers || {}) } });
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      return cors ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
    }
    if (request.method !== "POST") return json({ ok: false, error: "Nicht erlaubt." }, 405, cors);
    if (!cors) return json({ ok: false, error: "Nicht erlaubt." }, 403);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (limited(ip, Date.now())) return json({ ok: false, error: "Zu viele Anfragen. Bitte später erneut versuchen." }, 429, cors);

    let raw;
    try { raw = await request.text(); } catch { return json({ ok: false, error: "Ungültige Anfrage." }, 400, cors); }
    let payload;
    try { payload = JSON.parse(raw); } catch { return json({ ok: false, error: "Ungültige Anfrage." }, 400, cors); }

    const result = validate(payload, new TextEncoder().encode(raw).length);
    if (!result.ok) return json(result, 400, cors);
    if (result.spam) return json({ ok: true }, 200, cors); // Bot bekommt keine Rueckmeldung

    const mail = buildMail(result.data);
    try {
      // env.sendMail nur fuer Tests: dort ersetzt eine Attrappe den echten Versand
      await (env.sendMail || sendViaCloudflare)(env, {
        to: env.TO_ADDRESS,
        from: env.FROM_ADDRESS || "noreply@tofia-analytics.com",
        fromName: "tofia analytics Health Check",
        replyTo: result.data.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html
      });
    } catch (e) {
      console.error("Mailversand fehlgeschlagen:", e && e.code, e && e.message);
      return json({ ok: false, error: "Versand fehlgeschlagen." }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  }
};
