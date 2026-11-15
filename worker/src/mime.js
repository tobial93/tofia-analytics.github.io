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

export function buildRawMail({ from, fromName, to, replyTo, subject, text, html, date = new Date(), id = crypto.randomUUID() }) {
  assertHeaderValue(from, "from");
  assertHeaderValue(to, "to");
  assertHeaderValue(subject, "subject");
  if (replyTo) assertHeaderValue(replyTo, "replyTo");
  const domain = from.split("@")[1] || "localhost";
  const fromHeader = fromName ? `${encodeHeaderText(assertHeaderValue(fromName, "fromName"))} <${from}>` : `<${from}>`;
  const b64 = (s) => utf8ToBase64(s).replace(/.{1,76}/g, "$&" + CRLF).trimEnd();
  const common = [
    `Date: ${date.toUTCString().replace("GMT", "+0000")}`,
    `From: ${fromHeader}`,
    `To: <${to}>`,
    replyTo ? `Reply-To: <${replyTo}>` : null,
    `Message-ID: <${id}@${domain}>`,
    `Subject: ${encodeHeaderText(subject)}`,
    "MIME-Version: 1.0"
  ].filter(Boolean);

  if (!html) {
    const headers = [...common, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64"];
    return headers.join(CRLF) + CRLF + CRLF + b64(text) + CRLF;
  }
  const boundary = "=_tofia_" + id.replace(/[^A-Za-z0-9]/g, "");
  const part = (type, content) => [`--${boundary}`, `Content-Type: ${type}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", b64(content)].join(CRLF);
  const headers = [...common, `Content-Type: multipart/alternative; boundary="${boundary}"`];
  return headers.join(CRLF) + CRLF + CRLF + part("text/plain", text) + CRLF + part("text/html", html) + CRLF + `--${boundary}--` + CRLF;
}
