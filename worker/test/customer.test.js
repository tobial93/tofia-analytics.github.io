import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/validate.js";
import { buildCustomerMail, calUrl } from "../src/customer.js";
import worker from "../src/index.js";

const payload = (scores, ctx = {}) => ({
  v: 1, consent: true, website: "", scores,
  ctx: { email: "kunde@firma.de", name: "Anna", branche: "", groesse: "", systeme: [], entscheider: "", zeitrahmen: "", budget: "", freitext: "", ...ctx }
});
const high = { daten: [3, 3], vertrauen: [3, 3], reporting: [3, 3], wissen: [3, 3], betrieb: [3, 3] };
const low = { daten: [0, 0], vertrauen: [1, 1], reporting: [0, 1], wissen: [1, 1], betrieb: [1, 0] };
const data = (s, c) => validate(payload(s, c), 500).data;

test("Kundenmail: hoher Wert, Erstgespraech, Anrede mit Namen", () => {
  const m = buildCustomerMail(data(high));
  assert.match(m.subject, /Souverän/);
  assert.ok(m.text.startsWith("Guten Tag Anna,"));
  assert.ok(m.text.includes("Erstgespräch buchen"));
  assert.ok(m.html.includes("Erstgespräch buchen"));
});

test("Kundenmail: niedriger Wert empfiehlt Audit, Anrede ohne Namen", () => {
  const m = buildCustomerMail(data(low, { name: "" }));
  assert.ok(m.text.startsWith("Guten Tag,"));
  assert.ok(m.text.includes("Audit besprechen"));
});

test("Kundenmail: Name wird maskiert, Cal-Link kodiert, keine Gedankenstriche", () => {
  const d = data(low, { name: "<b>X</b> & Y" });
  const m = buildCustomerMail(d);
  assert.ok(!m.html.includes("<b>X"));
  assert.ok(m.html.includes("&lt;b&gt;X&lt;/b&gt; &amp; Y"));
  assert.ok(calUrl(d).includes("name=%3Cb%3EX%3C%2Fb%3E%20%26%20Y"));
  assert.ok(calUrl(d).includes("email=kunde%40firma.de"));
  assert.ok(!m.text.includes("—") && !m.html.includes("—"));
});

const ORIGIN = "https://tofia-analytics.com";
const mk = (extra) => { const sent = [], cust = []; return { sent, cust, ALLOWED_ORIGINS: ORIGIN, TO_ADDRESS: "ziel@example.org", sendMail: async (_e, m) => { sent.push(m); }, sendCustomerMail: async (_e, m) => { cust.push(m); }, ...extra }; };
const req = (ip) => new Request("https://api.example/x", { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: JSON.stringify(payload(low)) });

test("Worker: CUSTOMER_MAIL=on sendet Bestaetigung an den Besucher", async () => {
  const env = mk({ CUSTOMER_MAIL: "on" });
  const res = await worker.fetch(req("10.0.0.1"), env);
  assert.equal(res.status, 200);
  assert.equal(env.sent.length, 1);
  assert.equal(env.cust.length, 1);
  assert.equal(env.cust[0].to, "kunde@firma.de");
  assert.equal(env.cust[0].replyTo, "tobias@tofia-analytics.com");
});

test("Worker: ohne Schalter keine Kundenmail", async () => {
  const env = mk({});
  await worker.fetch(req("10.0.0.2"), env);
  assert.equal(env.cust.length, 0);
});

test("Worker: Fehler bei der Kundenmail ist kein Fehler der Anfrage", async () => {
  const env = mk({ CUSTOMER_MAIL: "on", sendCustomerMail: async () => { throw Object.assign(new Error("x"), { code: "E_SENDER_NOT_VERIFIED" }); } });
  const res = await worker.fetch(req("10.0.0.3"), env);
  assert.equal(res.status, 200);
  assert.equal(env.sent.length, 1);
});
