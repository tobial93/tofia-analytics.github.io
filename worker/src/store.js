// Anonyme Statistik je Health-Check-Absendung in D1 (Binding LEAD_DB).
// Bewusst OHNE E-Mail, Vorname, Freitext und IP-Adresse: Diese Angaben landen nur in der Mail an Tobias.
import { AREA_IDS } from "./validate.js";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];

// Herkunftsangaben aus dem Browser saeubern. Sie kommen vom Besucher, also nichts ungeprueft uebernehmen:
// nur Kleinbuchstaben, Ziffern und wenige Sonderzeichen, Laenge begrenzt.
export function cleanMeta(meta) {
  const m = meta && typeof meta === "object" ? meta : {};
  const out = {};
  for (const k of UTM_KEYS) {
    out[k] = typeof m[k] === "string" ? m[k].toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 60) : "";
  }
  // Nur der Hostname der verweisenden Seite (z. B. "www.linkedin.com"), keine vollstaendige URL
  out.referrer = typeof m.referrer === "string" ? m.referrer.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 100) : "";
  return out;
}

// Spalten der Tabelle "submissions" (siehe schema.sql) in genau der Reihenfolge von buildRow.
const COLUMNS = [
  "total", "level", "critical",
  ...AREA_IDS.map((id) => `score_${id}`),
  "branche", "groesse", "systeme", "entscheider", "zeitrahmen", "budget",
  "utm_source", "utm_medium", "utm_campaign", "referrer",
  "mail_ok"
];

// Ein "?" pro Spalte: Die Werte werden getrennt uebergeben (bind), dadurch ist keine SQL-Injection moeglich.
export const INSERT_SQL = `INSERT INTO submissions (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`;

// Baut die Werte fuer eine Zeile. Leere Angaben werden zu NULL, das ist in SQL leichter auszuwerten.
export function buildRow(data, ev, meta, mailOk) {
  const score = Object.fromEntries(ev.areas.map((a) => [a.id, a.score]));
  const orNull = (v) => (v === "" || v === undefined ? null : v);
  return [
    ev.total, ev.level, orNull(ev.critical.join(", ")),
    ...AREA_IDS.map((id) => score[id]),
    orNull(data.branche), orNull(data.groesse), orNull(data.systeme.join(", ")),
    orNull(data.entscheider), orNull(data.zeitrahmen), orNull(data.budget),
    orNull(meta.utm_source), orNull(meta.utm_medium), orNull(meta.utm_campaign), orNull(meta.referrer),
    mailOk ? 1 : 0
  ];
}

export async function storeSubmission(db, row) {
  await db.prepare(INSERT_SQL).bind(...row).run();
}
