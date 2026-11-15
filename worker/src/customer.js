import { evaluate, areaRows, esc, fmt } from "./validate.js";

const CAL = "https://cal.com/tobias-lewen-nzmbl3/15min";
const CONTACT = "tobias@tofia-analytics.com";
const SITE = "https://tofia-analytics.com";
const REPLY_TIME = "in der Regel innerhalb von zwei Werktagen";

// Audit empfehlen, wenn die Gesamtstufe niedrig ist oder ein Bereich kritisch ist (gleiche Regel wie auf der Seite).
function wantsAudit(ev) {
  return ev.total <= 8 || ev.critical.length > 0;
}

function lowestArea(ev) {
  return ev.areas.reduce((m, a) => (a.score < m.score ? a : m), ev.areas[0]);
}

export function calUrl(data) {
  const p = [];
  if (data.name) p.push("name=" + encodeURIComponent(data.name));
  p.push("email=" + encodeURIComponent(data.email));
  return CAL + "?" + p.join("&");
}

// Logo (Punktraster) als Tabelle statt Bild: funktioniert in jedem Mailprogramm, auch wenn Bilder blockiert sind.
// Hervorgehobene Punkte sind weiss, die uebrigen ein helles Blau (Raster wie in img/dot-grid.svg).
const LOGO_ON = [[1, 4], [2], [0, 3, 5], [1, 4]];
function logoHtml() {
  const dot = (on) => `<td width="6" height="6" style="width:6px;height:6px;border-radius:3px;background:${on ? "#FFFFFF" : "#7F9BEA"};font-size:0;line-height:0">&nbsp;</td>`;
  const gap = '<td width="5" style="width:5px;font-size:0;line-height:0">&nbsp;</td>';
  const rows = LOGO_ON.map((on) => `<tr>${[0, 1, 2, 3, 4, 5].map((c) => dot(on.includes(c))).join(gap)}</tr><tr><td colspan="11" height="5" style="height:5px;font-size:0;line-height:0">&nbsp;</td></tr>`);
  return `<table role="presentation" cellpadding="0" cellspacing="0" aria-hidden="true">${rows.join("")}</table>`;
}

// Bestaetigungsmail an den Besucher. Sachlich, ohne Werbung, mit einem einzigen Button.
export function buildCustomerMail(data) {
  const ev = evaluate(data.scores);
  const audit = wantsAudit(ev);
  const cta = audit ? "Audit besprechen" : "Erstgespräch buchen";
  const link = calUrl(data);
  const hebel = lowestArea(ev);
  const greeting = data.name ? `Guten Tag ${data.name},` : "Guten Tag,";
  const subject = `Ihr Health Check: ${ev.level} (${fmt(ev.total)} von 15 Punkten)`;
  const intro = `vielen Dank für Ihre Anfrage. Ich habe Ihre Angaben erhalten und melde mich persönlich bei Ihnen, ${REPLY_TIME}.`;
  const hebelText = `Den größten Hebel sehe ich beim Bereich "${hebel.name}".`;
  const foot = "Sie erhalten diese Mail einmalig, weil Sie auf tofia-analytics.com einen Health Check mit Report angefordert haben. Es folgt kein Newsletter. Waren Sie das nicht, können Sie diese Mail ignorieren. Auf Wunsch lösche ich Ihre Angaben, eine kurze Nachricht an " + CONTACT + " genügt.";

  const text = [
    greeting, "", intro, "",
    `Ihr Ergebnis: ${ev.level} (${fmt(ev.total)} von 15 Punkten)`,
    ...ev.areas.map((a) => `- ${a.name}: ${fmt(a.score)} von 3`),
    "", hebelText, "",
    `${cta}: ${link}`, "",
    "Viele Grüße", "Tobias Lewen", "tofia analytics, Berlin", `${SITE}`, "", foot
  ].join("\n");

  const F = "font-family:Arial,Helvetica,sans-serif;";
  const html = `<!DOCTYPE html><html lang="de"><body style="margin:0;padding:0;background:#F4F6FA">
<div style="display:none;max-height:0;overflow:hidden;color:#F4F6FA">Ihr Ergebnis: ${esc(ev.level)}. Ich melde mich ${esc(REPLY_TIME)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF">
<tr><td style="background:#1E4FDB;padding:18px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td style="${F}font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#FFFFFF">tofia analytics &middot; Ihr Health Check</td>
  <td align="right" width="80" style="width:80px">${logoHtml()}</td></tr></table></td></tr>
<tr><td style="padding:28px 28px 8px;${F}font-size:15px;line-height:1.55;color:#111">
  <p style="margin:0 0 12px">${esc(greeting)}</p>
  <p style="margin:0 0 24px">${esc(intro)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px"><tr>
    <td style="${F}font-size:30px;font-weight:bold;color:#111;letter-spacing:-.02em">${esc(ev.level)}</td>
    <td align="right" style="${F}font-size:14px;color:#667085">${esc(fmt(ev.total))} von 15 Punkten</td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">${areaRows(ev)}</table>
  <p style="margin:0 0 24px">${esc(hebelText)}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px"><tr><td style="background:#1E4FDB"><a href="${esc(link)}" style="display:inline-block;padding:13px 26px;${F}font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none">${esc(cta)}</a></td></tr></table>
  <p style="margin:0 0 4px">Viele Grüße</p>
  <p style="margin:0 0 20px"><strong>Tobias Lewen</strong><br><span style="color:#667085">tofia analytics, Berlin</span></p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #E4E7EC;${F}font-size:12px;line-height:1.5;color:#667085">${esc(foot)}<br><a href="${SITE}/impressum.html" style="color:#667085">Impressum</a> &middot; <a href="${SITE}/datenschutz.html" style="color:#667085">Datenschutz</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
