import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { cleanMeta, buildRow, INSERT_SQL } from "../src/store.js";
import { evaluate } from "../src/validate.js";

const ORIGIN = "https://tofia-analytics.com";
const body = (meta) => JSON.stringify({
  v: 1, consent: true, website: "",
  scores: { daten: [3, 3], vertrauen: [2, 2], reporting: [1, 1], wissen: [1, 1], betrieb: [0, 0] },
  ctx: { email: "kunde@firma.de", name: "Anna", branche: "Industrie", groesse: "", systeme: ["ERP", "CRM"], entscheider: "", zeitrahmen: "", budget: "", freitext: "geheim" },
  meta
});
const post = (b, ip) => new Request("https://api.example/x", { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: b });

// Attrappe fuer D1: merkt sich SQL und Werte statt sie zu speichern
const fakeDb = (fail = false) => {
  const rows = [];
  return { rows, prepare: (sql) => ({ bind: (...vals) => ({ run: async () => { if (fail) throw new Error("db down"); rows.push({ sql, vals }); } }) }) };
};
const mkEnv = (db) => ({ ALLOWED_ORIGINS: ORIGIN, TO_ADDRESS: "z@example.org", LEAD_DB: db, sendMail: async () => {} });

test("cleanMeta: saeubert und begrenzt Herkunftsangaben", () => {
  const m = cleanMeta({ utm_source: "LinkedIn<script>", utm_campaign: "x".repeat(200), referrer: "https://www.linkedin.com/feed" });
  assert.equal(m.utm_source, "linkedinscript");
  assert.equal(m.utm_campaign.length, 60);
  assert.equal(m.utm_medium, "");
  assert.equal(m.referrer, "httpswww.linkedin.comfeed".slice(0, 100));
  assert.deepEqual(cleanMeta(undefined), { utm_source: "", utm_medium: "", utm_campaign: "", referrer: "" });
});

test("buildRow passt zur Spaltenzahl im INSERT", () => {
  const data = { branche: "", groesse: "", systeme: [], entscheider: "", zeitrahmen: "", budget: "" };
  const ev = evaluate({ daten: [1, 1], vertrauen: [1, 1], reporting: [1, 1], wissen: [1, 1], betrieb: [1, 1] });
  const row = buildRow(data, ev, cleanMeta({}), true);
  assert.equal(row.length, (INSERT_SQL.match(/\?/g) || []).length);
});

test("Absendung wird anonym gespeichert (ohne E-Mail, Name, Freitext)", async () => {
  const db = fakeDb();
  const res = await worker.fetch(post(body({ utm_source: "linkedin", referrer: "www.linkedin.com" }), "7.7.7.7"), mkEnv(db));
  assert.equal(res.status, 200);
  assert.equal(db.rows.length, 1);
  const vals = db.rows[0].vals;
  assert.ok(vals.includes("linkedin") && vals.includes("www.linkedin.com") && vals.includes("Industrie") && vals.includes("ERP, CRM"));
  assert.ok(!vals.includes("kunde@firma.de") && !vals.includes("Anna") && !vals.includes("geheim"));
  assert.equal(vals.at(-1), 1); // mail_ok
});

test("Datenbankfehler bricht die Anfrage nicht ab", async () => {
  const res = await worker.fetch(post(body(), "8.8.8.8"), mkEnv(fakeDb(true)));
  assert.equal(res.status, 200);
});

test("ohne Binding LEAD_DB laeuft alles wie bisher", async () => {
  const res = await worker.fetch(post(body(), "9.9.9.9"), mkEnv(undefined));
  assert.equal(res.status, 200);
});

test("Versandfehler wird mit mail_ok = 0 gespeichert", async () => {
  const db = fakeDb();
  const env = mkEnv(db); env.sendMail = async () => { throw new Error("x"); };
  const res = await worker.fetch(post(body(), "10.10.10.10"), env);
  assert.equal(res.status, 502);
  assert.equal(db.rows[0].vals.at(-1), 0);
});
