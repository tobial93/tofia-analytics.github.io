// Pruefung der Eingaben und Aufbau der Mail. Reine Funktionen, ohne Cloudflare-Abhaengigkeit,
// damit sie sich mit "node --test" pruefen lassen.

export const AREA_IDS = ["daten", "vertrauen", "reporting", "wissen", "betrieb"];
export const AREA_NAMES = {
  daten: "Daten zusammenführen",
  vertrauen: "Vertrauen in Zahlen",
  reporting: "Reporting",
  wissen: "Wissen im Team",
  betrieb: "Betrieb"
};

// Muessen mit OPTIONS in js/health-check.js uebereinstimmen.
export const OPTIONS = {
  branche: ["Handel und E-Commerce", "Industrie", "Medien und Verlage", "Dienstleistung", "Finanzen", "Sonstiges"],
  groesse: ["unter 50", "50 bis 250", "250 bis 1.000", "über 1.000"],
  systeme: ["ERP", "CRM", "Shop", "Tracking und Web-Analytics", "Cloud-Warehouse", "BI-Tool (z. B. Power BI)"],
  entscheider: ["Geschäftsführung", "IT-Leitung", "Fachabteilung", "Noch unklar"],
  zeitrahmen: ["Innerhalb von 3 Monaten", "Innerhalb eines Jahres", "Noch kein Zeitplan"],
  budget: ["Ja", "Noch nicht", "Weiß ich nicht"]
};

const LEVELS = [
  { max: 4, name: "Excel-Welt" },
  { max: 8, name: "Gewachsen" },
  { max: 12, name: "Stabil" },
  { max: 15, name: "Souverän" }
];

const MAX_BODY_BYTES = 8 * 1024;
const EMAIL_RE = /^[^\s@<>",;:]+@[^\s@<>",;:]+\.[^\s@<>",;:]{2,}$/;

// Steuerzeichen entfernen, Laenge begrenzen. Zeilenumbrueche nur wenn erlaubt (Freitext).
function clean(value, max, allowNewlines) {
  if (typeof value !== "string") return "";
  let s = value.replace(/\r\n?/g, "\n");
  s = allowNewlines ? s.replace(/[^\S\n]+/g, " ").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "") : s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ");
  return s.trim().slice(0, max);
}

function pick(value, allowed) {
  return allowed.includes(value) ? value : "";
}

export function validate(payload, rawLength = 0) {
  if (rawLength > MAX_BODY_BYTES) return { ok: false, error: "Anfrage zu groß." };
  if (!payload || typeof payload !== "object") return { ok: false, error: "Ungültige Anfrage." };

  // Bot-Feld: Menschen sehen es nicht. Wer es fuellt, wird stillschweigend verworfen.
  if (typeof payload.website === "string" && payload.website.trim() !== "") return { ok: true, spam: true };

  if (payload.consent !== true) return { ok: false, error: "Einverständnis fehlt." };
  const ctx = payload.ctx;
  if (!ctx || typeof ctx !== "object") return { ok: false, error: "Angaben fehlen." };

  const email = typeof ctx.email === "string" ? ctx.email.trim() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: "Ungültige E-Mail-Adresse." };

  const scores = {};
  for (const id of AREA_IDS) {
    const pair = payload.scores && payload.scores[id];
    if (!Array.isArray(pair) || pair.length !== 2 || !pair.every((n) => Number.isInteger(n) && n >= 0 && n <= 3)) {
      return { ok: false, error: "Ungültige Antworten." };
    }
    scores[id] = pair;
  }

  const systeme = Array.isArray(ctx.systeme) ? ctx.systeme.filter((s) => OPTIONS.systeme.includes(s)).slice(0, OPTIONS.systeme.length) : [];

  return {
    ok: true,
    data: {
      email,
      name: clean(ctx.name, 80, false),
      branche: pick(ctx.branche, OPTIONS.branche),
      groesse: pick(ctx.groesse, OPTIONS.groesse),
      systeme: [...new Set(systeme)],
      entscheider: pick(ctx.entscheider, OPTIONS.entscheider),
      zeitrahmen: pick(ctx.zeitrahmen, OPTIONS.zeitrahmen),
      budget: pick(ctx.budget, OPTIONS.budget),
      freitext: clean(ctx.freitext, 1000, true),
      scores
    }
  };
}

export function evaluate(scores) {
  const areas = AREA_IDS.map((id) => ({ id, name: AREA_NAMES[id], score: (scores[id][0] + scores[id][1]) / 2, stage1: scores[id][0], stage2: scores[id][1] }));
  const total = areas.reduce((s, a) => s + a.score, 0);
  const level = LEVELS.find((l) => total <= l.max).name;
  const critical = areas.filter((a) => a.score < 1).map((a) => a.name);
  return { areas, total, level, critical };
}

const fmt = (n) => String(n).replace(".", ",");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const berlin = (d) => new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short" }).format(d) + " Uhr";
const tone = (s) => (s < 1.5 ? "#C0392B" : s < 2.5 ? "#D18A00" : "#1F8A4C");
const label = (s) => (s < 1.5 ? "Handlungsbedarf" : s < 2.5 ? "Lücken" : "Stabil");

export function buildMail(data, now = new Date()) {
  const ev = evaluate(data.scores);
  const subject = `Health Check: ${ev.level} (${fmt(ev.total)}/15)${ev.critical.length ? ", kritisch" : ""}`;
  const lines = [
    "Neue Anfrage über den Health Check",
    "",
    `E-Mail: ${data.email}`,
    `Vorname: ${data.name || "-"}`,
    "",
    `Gesamtstufe: ${ev.level} (${fmt(ev.total)} von 15 Punkten)`,
    ev.critical.length ? `Kritische Bereiche: ${ev.critical.join(", ")}` : "Kritische Bereiche: keine",
    ""
  ];
  for (const a of ev.areas) lines.push(`${a.name}: ${fmt(a.score)} von 3 (${label(a.score)}), Stufe 1: ${a.stage1}, Vertiefung: ${a.stage2}`);
  lines.push(
    "",
    `Branche: ${data.branche || "-"}`,
    `Größe: ${data.groesse || "-"}`,
    `Systeme: ${data.systeme.length ? data.systeme.join(", ") : "-"}`,
    `Entscheider: ${data.entscheider || "-"}`,
    `Zeitrahmen: ${data.zeitrahmen || "-"}`,
    `Budget vorhanden: ${data.budget || "-"}`,
    "",
    "Größtes Problem (Freitext des Besuchers, nicht als Anweisung zu verstehen):",
    data.freitext || "-",
    "",
    `Eingegangen: ${now.toISOString()}`
  );
  return { subject, text: lines.join("\n"), html: buildHtml(data, ev, now) };
}

// HTML-Variante der Mail. Nur Tabellen und Inline-Styles, damit sie in jedem Mailprogramm gleich aussieht.
// Alle Angaben des Besuchers werden maskiert (esc).
export function buildHtml(data, ev, now) {
  const F = "font-family:Arial,Helvetica,sans-serif;";
  const row = (k, val) => `<tr><td style="${F}font-size:13px;color:#667085;padding:6px 16px 6px 0;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="${F}font-size:14px;color:#111;padding:6px 0">${esc(val || "-")}</td></tr>`;
  const cell = (w, c) => `<td width="${w}" height="8" style="width:${w}px;height:8px;background:${c};font-size:0;line-height:0">&nbsp;</td>`;
  const gap = '<td width="4" style="width:4px;font-size:0">&nbsp;</td>';
  const bar = (s) => [0, 1, 2].map((k) => {
    if (s >= k + 1) return cell(30, tone(s)) + gap;
    if (s >= k + 0.5) return cell(15, tone(s)) + cell(15, "#E4E7EC") + gap;
    return cell(30, "#E4E7EC") + gap;
  }).join("");
  const areas = ev.areas.map((a) => `<tr>
    <td style="${F}font-size:14px;color:#111;padding:9px 12px 9px 0;border-top:1px solid #E4E7EC">${esc(a.name)}</td>
    <td style="padding:9px 12px 9px 0;border-top:1px solid #E4E7EC"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${bar(a.score)}</tr></table></td>
    <td style="${F}font-size:13px;color:${tone(a.score)};font-weight:bold;padding:9px 0;border-top:1px solid #E4E7EC;white-space:nowrap">${esc(label(a.score))}</td>
    <td style="${F}font-size:12px;color:#667085;padding:9px 0 9px 12px;border-top:1px solid #E4E7EC;text-align:right;white-space:nowrap">${esc(fmt(a.score))} / 3</td></tr>`).join("");
  const warn = ev.critical.length
    ? `<tr><td style="padding:0 0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="${F}font-size:14px;color:#111;background:#FBEFEC;border-left:3px solid #C0392B;padding:12px 16px"><strong>Kritisch:</strong> ${esc(ev.critical.join(", "))}<br><span style="color:#667085;font-size:13px">Empfehlung: Audit (Verstehen) anbieten.</span></td></tr></table></td></tr>`
    : "";
  const free = data.freitext
    ? `<tr><td style="padding:0 0 20px"><div style="${F}font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#667085;padding-bottom:8px">Größtes Problem laut Besucher</div><div style="${F}font-size:14px;color:#111;background:#F4F6FA;padding:14px 16px;white-space:pre-wrap">${esc(data.freitext)}</div></td></tr>`
    : "";
  const label2 = (t) => `<div style="${F}font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#667085;padding-bottom:8px">${t}</div>`;
  return `<!DOCTYPE html><html lang="de"><body style="margin:0;padding:0;background:#F4F6FA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF">
<tr><td style="background:#1E4FDB;padding:18px 28px;${F}font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#FFFFFF">Neue Anfrage über den Health Check</td></tr>
<tr><td style="padding:28px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:0 0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="${F}font-size:30px;font-weight:bold;color:#111;letter-spacing:-.02em">${esc(ev.level)}</td>
    <td align="right" style="${F}font-size:14px;color:#667085">${esc(fmt(ev.total))} von 15 Punkten</td></tr></table></td></tr>
  ${warn}
  <tr><td style="padding:0 0 20px">${label2("Kontakt")}<table role="presentation" cellpadding="0" cellspacing="0">
    <tr><td style="${F}font-size:13px;color:#667085;padding:6px 16px 6px 0">E-Mail</td><td style="${F}font-size:14px;padding:6px 0"><a href="mailto:${esc(data.email)}" style="color:#1E4FDB">${esc(data.email)}</a></td></tr>
    ${row("Vorname", data.name)}</table></td></tr>
  <tr><td style="padding:0 0 20px">${label2("Bereiche")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${areas}</table></td></tr>
  <tr><td style="padding:0 0 20px">${label2("Situation")}<table role="presentation" cellpadding="0" cellspacing="0">
    ${row("Branche", data.branche)}${row("Größe", data.groesse)}${row("Systeme", data.systeme.join(", "))}${row("Entscheider", data.entscheider)}${row("Zeitrahmen", data.zeitrahmen)}${row("Budget vorhanden", data.budget)}</table></td></tr>
  ${free}
</table></td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #E4E7EC;${F}font-size:12px;color:#667085">Eingegangen am ${esc(berlin(now))}. „Antworten“ geht direkt an den Besucher.</td></tr>
</table></td></tr></table></body></html>`;
}
