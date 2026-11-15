import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const ORIGIN = "https://tofia-analytics.com";
const body = () => JSON.stringify({
  v: 1, consent: true, website: "",
  scores: { daten: [3, 3], vertrauen: [3, 3], reporting: [3, 3], wissen: [3, 3], betrieb: [0, 0] },
  ctx: { email: "kunde@firma.de", name: "", branche: "", groesse: "", systeme: [], entscheider: "", zeitrahmen: "", budget: "", freitext: "" }
});
const mkEnv = () => { const sent = []; return { sent, ALLOWED_ORIGINS: ORIGIN, TO_ADDRESS: "ziel@example.org", FROM_ADDRESS: "noreply@tofia-analytics.com", sendMail: async (_env, m) => { sent.push(m); } }; };
const post = (b, origin = ORIGIN, ip = "1.1.1.1") => new Request("https://api.example/health-check", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: b });

test("erlaubte Herkunft: Mail wird gesendet, Reply-To gesetzt", async () => {
  const env = mkEnv();
  const res = await worker.fetch(post(body(), ORIGIN, "2.2.2.2"), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.equal(env.sent.length, 1);
  assert.equal(env.sent[0].replyTo, "kunde@firma.de");
  assert.equal(env.sent[0].to, "ziel@example.org");
  assert.match(env.sent[0].subject, /kritisch/);
});

test("fremde Herkunft: 403, keine Mail", async () => {
  const env = mkEnv();
  const res = await worker.fetch(post(body(), "https://evil.example", "3.3.3.3"), env);
  assert.equal(res.status, 403);
  assert.equal(env.sent.length, 0);
});

test("Preflight nur fuer erlaubte Herkunft", async () => {
  const env = mkEnv();
  const ok = await worker.fetch(new Request("https://api.example/x", { method: "OPTIONS", headers: { Origin: ORIGIN } }), env);
  assert.equal(ok.status, 204);
  const bad = await worker.fetch(new Request("https://api.example/x", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), env);
  assert.equal(bad.status, 403);
});

test("GET nicht erlaubt, kaputtes JSON: 400", async () => {
  const env = mkEnv();
  assert.equal((await worker.fetch(new Request("https://api.example/x", { method: "GET", headers: { Origin: ORIGIN } }), env)).status, 405);
  assert.equal((await worker.fetch(post("{kaputt", ORIGIN, "4.4.4.4"), env)).status, 400);
});

test("Mengenbegrenzung: sechste Anfrage derselben IP wird abgelehnt", async () => {
  const env = mkEnv();
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await worker.fetch(post(body(), ORIGIN, "5.5.5.5"), env)).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});

test("Versandfehler: 502 ohne Details nach aussen", async () => {
  const env = mkEnv(); env.sendMail = async () => { throw Object.assign(new Error("boom"), { code: "E_X" }); };
  const res = await worker.fetch(post(body(), ORIGIN, "6.6.6.6"), env);
  assert.equal(res.status, 502);
  assert.ok(!(await res.text()).includes("boom"));
});
