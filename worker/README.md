# Health Check Worker

Nimmt die Angaben aus Stufe 2 des Health Checks entgegen, prüft sie und schickt Tobias eine Mail.
Die Zieladresse steht nicht im Code (das Repo ist öffentlich), sondern als Secret bei Cloudflare.

Der Versand läuft über die Email-Routing-Anbindung von Cloudflare (`send_email`). Sie ist im kostenlosen
Workers-Tarif nutzbar, sendet aber nur an Adressen, die in Email Routing verifiziert sind (also an dich).
Der neuere Dienst "Email Sending" ist dagegen nur mit dem bezahlten Tarif verfügbar und wird hier nicht gebraucht.

## Einrichten (einmalig)

### 1. Email Routing prüfen
Im Cloudflare-Dashboard bei der Domain `tofia-analytics.com` unter **Email > Email Routing**:
- Email Routing ist aktiv (Weiterleitung von `tobias@tofia-analytics.com` funktioniert bereits).
- Unter **Destination addresses** hat deine GMX-Adresse den Status **Verified**.

### 2. Code holen
```
cd C:\Users\tle\ProjectRepos
git clone https://github.com/tobial93/tofia-analytics.github.io
cd tofia-analytics.github.io
git checkout website-v11
cd worker
```

### 3. Worker veröffentlichen
```
npx wrangler@latest login
npx wrangler@latest deploy
npx wrangler@latest secret put TO_ADDRESS
```
- `login` öffnet den Browser, dort meldest du dich selbst an.
- `deploy` legt den Worker an und hängt ihn an `api.tofia-analytics.com` (der DNS-Eintrag entsteht automatisch, es darf noch keinen mit diesem Namen geben).
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
| 502 | Versand fehlgeschlagen. Live-Protokoll mit `npx wrangler@latest tail` ansehen. Meist ist die Zieladresse nicht verifiziert oder Email Routing nicht aktiv |
| Keine Mail | Spam-Ordner prüfen. Ist sie dort, einmal "kein Spam" markieren und bei GMX einen Filter für den Absender `noreply@tofia-analytics.com` anlegen |

## Hinweise
- Der Absender `noreply@tofia-analytics.com` ist nur ein Absendername. Antworten gehen dank Reply-To an den Besucher, nicht an `noreply`.
- Senden an beliebige Empfänger (zum Beispiel Reports an Besucher) wäre mit diesem Weg nicht möglich. Dafür bräuchte es den bezahlten Tarif oder einen anderen Mail-Dienst.
- Tests der Prüflogik und des Mailaufbaus: `node --test test/*.test.js`
