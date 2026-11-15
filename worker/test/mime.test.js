import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRawMail, encodeHeaderText } from "../src/mime.js";

const base = { from: "noreply@tofia-analytics.com", fromName: "tofia analytics Health Check", to: "ziel@example.org", replyTo: "kunde@firma.de", subject: "Health Check: Gewachsen (7,5/15), kritisch", text: "Zeile 1\nÜmläute und ß", date: new Date("2026-11-15T12:00:00Z"), id: "abc" };

test("Rohmail hat die wichtigen Kopfzeilen, Reply-To korrekt geschrieben", () => {
  const raw = buildRawMail(base);
  assert.match(raw, /^Date: Sun, 15 Nov 2026 12:00:00 \+0000\r\n/);
  assert.match(raw, /\r\nReply-To: <kunde@firma\.de>\r\n/);
  assert.match(raw, /\r\nTo: <ziel@example\.org>\r\n/);
  assert.match(raw, /\r\nMessage-ID: <abc@tofia-analytics\.com>\r\n/);
  assert.match(raw, /\r\nContent-Type: text\/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n/);
  assert.ok(!/ReplyTo/.test(raw));
});

test("Textteil laesst sich aus base64 zurueck lesen (Umlaute bleiben erhalten)", () => {
  const raw = buildRawMail(base);
  const body = raw.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  assert.equal(Buffer.from(body, "base64").toString("utf8"), base.text);
});

test("Betreff mit Umlauten wird als encoded word kodiert, ASCII bleibt unveraendert", () => {
  assert.equal(encodeHeaderText("Health Check"), "Health Check");
  const enc = encodeHeaderText("Souverän – größtes Problem äöü ".repeat(3));
  assert.match(enc, /^=\?UTF-8\?B\?/);
  const decoded = enc.split("\r\n ").map((w) => Buffer.from(w.slice(10, -2), "base64").toString("utf8")).join("");
  assert.equal(decoded, "Souverän – größtes Problem äöü ".repeat(3));
  for (const line of enc.split("\r\n ")) assert.ok(line.length <= 75, line.length + "");
});

test("Zeilenumbrueche in Kopfzeilen werden abgelehnt (Header-Injection)", () => {
  assert.throws(() => buildRawMail({ ...base, replyTo: "a@b.de\r\nBcc: x@y.de" }));
  assert.throws(() => buildRawMail({ ...base, subject: "x\nBcc: y" }));
  assert.throws(() => buildRawMail({ ...base, to: "a@b.de\nBcc: y" }));
});

test("Textzeilen im Body sind hoechstens 76 Zeichen lang", () => {
  const raw = buildRawMail({ ...base, text: "x".repeat(5000) });
  for (const line of raw.split("\r\n")) assert.ok(line.length <= 998);
  const bodyLines = raw.split("\r\n\r\n")[1].trimEnd().split("\r\n");
  for (const l of bodyLines) assert.ok(l.length <= 76);
});
