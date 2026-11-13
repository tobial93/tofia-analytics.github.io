# Health Check Worker

Nimmt die Angaben aus Stufe 2 des Health Checks entgegen, prüft sie und schickt Tobias eine Mail.
Die Zieladresse steht nicht im Code (das Repo ist öffentlich), sondern als Secret bei Cloudflare.

## Einrichten (einmalig, Reihenfolge einhalten)

### 1. Absender-Domain bei Cloudflare freischalten
1. Cloudflare-Dashboard öffnen, Domain `tofia-analytics.com` muss dort mit Cloudflare-DNS liegen.
2. Menü **Compute > Email Service > Email Sending**, dann **Onboard Domain**, `tofia-analytics.com` wählen, **Done**.
3. Cloudflare legt DNS-Einträge an (MX und SPF auf `cf-bounce.…`, DKIM, DMARC). Warte 5 bis 15 Minuten und prüfe unter **Email Sending > Settings > DNS records**, dass alles als konfiguriert gilt.
4. Danach eine Testmail an `tobias@tofia-analytics.com` schicken: Die bestehende Weiterleitung muss weiter funktionieren.

### 2. Zieladresse prüfen
Unter **Email > Email Routing > Destination addresses** muss deine GMX-Adresse den Status **Verified** haben.
Der Worker darf nur an verifizierte Adressen senden (im kostenlosen Tarif).

### 3. Worker veröffentlichen
Im Ordner `worker` (Node.js muss installiert sein):

```
npx wrangler login
npx wrangler deploy
npx wrangler secret put TO_ADDRESS
```

- `login` öffnet den Browser, dort meldest du dich selbst an.
- `deploy` legt den Worker an und hängt ihn an `api.tofia-analytics.com`.
- `secret put` fragt nach der Zieladresse (deine GMX-Adresse). Sie wird nur bei Cloudflare gespeichert.

### 4. Testen
Windows PowerShell:

```
$b = '{"v":1,"consent":true,"website":"","scores":{"daten":[2,2],"vertrauen":[2,2],"reporting":[1,1],"wissen":[1,1],"betrieb":[0,1]},"ctx":{"email":"test@example.org","name":"Test","branche":"","groesse":"","systeme":[],"entscheider":"","zeitrahmen":"","budget":"","freitext":"Testanfrage"}}'
Invoke-RestMethod -Method Post -Uri https://api.tofia-analytics.com -ContentType "application/json" -Headers @{Origin="https://tofia-analytics.com"} -Body $b
```

Erwartet: `ok  True` und kurz danach eine Mail in deinem Postfach.

### 5. Auf der Seite einschalten
In `js/health-check.js` die Zeile `var ENDPOINT = "";` auf `"https://api.tofia-analytics.com"` setzen. Erst danach erscheint auf der Seite der Button „Genaueren Report anfordern“.

## Fehlersuche
| Symptom | Ursache |
|---|---|
| 403 | Aufruf kam nicht von `tofia-analytics.com` (Origin), oder `ALLOWED_ORIGINS` stimmt nicht |
| 429 | Mehr als 5 Anfragen in 10 Minuten von derselben IP |
| 502 | Versand fehlgeschlagen. Live-Protokoll mit `npx wrangler tail` ansehen |
| Keine Mail | Spam-Ordner prüfen, Zieladresse bei Email Routing verifiziert? DNS-Einträge aus Schritt 1 vollständig? |

## Hinweise
- Der Versanddienst von Cloudflare ist bei Erstellung dieser Datei noch in der Beta-Phase.
- Senden an beliebige Empfänger bräuchte den bezahlten Tarif. Dieser Worker sendet nur an dich.
- Tests der Prüflogik: `node --test test/*.test.js`
