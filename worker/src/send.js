import { buildRawMail } from "./mime.js";

// Versand ueber die Email-Routing-Anbindung (send_email). Sie darf nur an in Email Routing
// verifizierte Zieladressen senden, funktioniert aber im kostenlosen Workers-Tarif.
// "cloudflare:email" gibt es nur in der Cloudflare-Umgebung, daher der spaete Import.
export async function sendViaCloudflare(env, mail) {
  const { EmailMessage } = await import("cloudflare:email");
  const raw = buildRawMail({
    from: mail.from, fromName: mail.fromName, to: mail.to, replyTo: mail.replyTo, subject: mail.subject, text: mail.text
  });
  await env.EMAIL.send(new EmailMessage(mail.from, mail.to, raw));
}
