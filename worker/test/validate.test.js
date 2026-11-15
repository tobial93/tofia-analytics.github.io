import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, evaluate, buildMail } from "../src/validate.js";

const good = () => ({
  v: 1, consent: true, website: "",
  scores: { daten: [3, 3], vertrauen: [2, 1], reporting: [0, 1], wissen: [1, 1], betrieb: [3, 0] },
  ctx: { email: "kunde@firma.de", name: "Anna", branche: "Industrie", groesse: "50 bis 250", systeme: ["ERP", "CRM", "Unbekannt"], entscheider: "IT-Leitung", zeitrahmen: "Innerhalb von 3 Monaten", budget: "Ja", freitext: "Zahlen\nstimmen nicht." }
});

test("gueltige Anfrage wird angenommen, unbekannte Auswahl entfernt", () => {
  const r = validate(good(), 500);
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.systeme, ["ERP", "CRM"]);
  assert.equal(r.data.branche, "Industrie");
});

test("Bot-Feld ausgefuellt: still verworfen", () => {
  const p = good(); p.website = "http://spam.example";
  const r = validate(p, 500);
  assert.equal(r.ok, true); assert.equal(r.spam, true);
});

test("ohne Einverstaendnis abgelehnt", () => {
  const p = good(); p.consent = false;
  assert.equal(validate(p, 500).ok, false);
});

test("ungueltige E-Mail-Adressen abgelehnt (auch Header-Einschleusung)", () => {
  for (const bad of ["", "keine-mail", "a@b", "a b@c.de", "a@b.de\nBcc: x@y.de", "<a@b.de>", "a@b.de,c@d.de"]) {
    const p = good(); p.ctx.email = bad;
    assert.equal(validate(p, 500).ok, false, bad);
  }
});

test("Punktewerte ausserhalb 0 bis 3 oder falscher Typ abgelehnt", () => {
  for (const bad of [4, -1, 1.5, "2", null]) {
    const p = good(); p.scores.daten = [bad, 1];
    assert.equal(validate(p, 500).ok, false, String(bad));
  }
  const p = good(); delete p.scores.betrieb;
  assert.equal(validate(p, 500).ok, false);
});

test("zu grosse Anfrage abgelehnt", () => {
  assert.equal(validate(good(), 9000).ok, false);
});

test("Name und Freitext werden bereinigt und gekuerzt", () => {
  const p = good(); p.ctx.name = "A\nB\u0000C".padEnd(500, "x"); p.ctx.freitext = "y".repeat(5000);
  const r = validate(p, 500);
  assert.equal(r.ok, true);
  assert.ok(!/[\n\u0000]/.test(r.data.name));
  assert.ok(r.data.name.length <= 80);
  assert.equal(r.data.freitext.length, 1000);
});

test("Auswertung: Mittelwert, Stufe, kritische Bereiche", () => {
  const ev = evaluate(good().scores);
  // 3 + 1,5 + 0,5 + 1 + 1,5 = 7,5
  assert.equal(ev.total, 7.5);
  assert.equal(ev.level, "Gewachsen");
  assert.deepEqual(ev.critical, ["Reporting"]);
});

test("Mailtext enthaelt Kerndaten, Betreff ohne Freitext", () => {
  const r = validate(good(), 500);
  const m = buildMail(r.data, new Date("2026-11-13T12:00:00Z"));
  assert.match(m.subject, /^Health Check: Gewachsen \(7,5\/15\), kritisch$/);
  assert.ok(!m.subject.includes("Zahlen"));
  assert.ok(m.text.includes("kunde@firma.de"));
  assert.ok(m.text.includes("Reporting: 0,5 von 3 (Handlungsbedarf)"));
  assert.ok(m.text.includes("2026-11-13T12:00:00.000Z"));
});

test("HTML-Mail: Angaben des Besuchers werden maskiert, Struktur vorhanden", () => {
  const p = good(); p.ctx.freitext = '<script>alert(1)</script> & "x"'; p.ctx.name = "<b>Anna</b>";
  const r = validate(p, 500);
  const m = buildMail(r.data, new Date("2026-11-15T16:03:51Z"));
  assert.ok(m.html.includes("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;"));
  assert.ok(!m.html.includes("<script>"));
  assert.ok(!m.html.includes("<b>Anna"));
  assert.ok(m.html.includes("Gewachsen"));
  assert.ok(m.html.includes("mailto:kunde@firma.de"));
  assert.ok(m.html.includes("15.11.2026, 17:03 Uhr"));
  assert.ok(m.html.includes("Kritisch:"));
});
