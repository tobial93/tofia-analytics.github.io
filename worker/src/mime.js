// Baut eine einfache E-Mail im Rohformat (RFC 5322/2045), ohne externe Bibliothek.
// Reine Funktion, damit sie sich mit "node --test" pruefen laesst.

const CRLF = "\r\n";

function assertHeaderValue(v, what) {
  if (typeof v !== "string" || /[\r\n\u0000]/.test(v)) throw new Error("Ungültiger Wert für " + what);
  return v;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Betreff mit Umlauten: RFC 2047 "encoded words", in Stuecken, damit keine Zeile zu lang wird.
export function encodeHeaderText(text) {
  if (/^[\x20-\x7E]*$/.test(text)) return text;
  const words = [];
  let chunk = "";
  for (const ch of text) {
    if (new TextEncoder().encode(chunk + ch).length > 36) { words.push(chunk); chunk = ""; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${utf8ToBase64(w)}?=`).join(CRLF + " ");
}

export function buildRawMail({ from, fromName, to, replyTo, subject, text, date = new Date(), id = crypto.randomUUID() }) {
  assertHeaderValue(from, "from");
  assertHeaderValue(to, "to");
  assertHeaderValue(subject, "subject");
  if (replyTo) assertHeaderValue(replyTo, "replyTo");
  const domain = from.split("@")[1] || "localhost";
  const fromHeader = fromName ? `${encodeHeaderText(assertHeaderValue(fromName, "fromName"))} <${from}>` : `<${from}>`;
  const body = utf8ToBase64(text).replace(/.{1,76}/g, "$&" + CRLF).trimEnd();
  const headers = [
    `Date: ${date.toUTCString().replace("GMT", "+0000")}`,
    `From: ${fromHeader}`,
    `To: <${to}>`,
    replyTo ? `Reply-To: <${replyTo}>` : null,
    `Message-ID: <${id}@${domain}>`,
    `Subject: ${encodeHeaderText(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64"
  ].filter(Boolean);
  return headers.join(CRLF) + CRLF + CRLF + body + CRLF;
}
