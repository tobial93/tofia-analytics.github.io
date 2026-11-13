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
  return { subject, text: lines.join("\n") };
}
