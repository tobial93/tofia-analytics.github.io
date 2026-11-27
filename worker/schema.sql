-- Anonyme Statistik zum Health Check. Einspielen mit:
--   npx wrangler@latest d1 execute tofia-leads --remote --file=schema.sql
-- Keine E-Mail-Adressen, Namen, Freitexte oder IP-Adressen.
CREATE TABLE IF NOT EXISTS submissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')), -- UTC
  total           REAL NOT NULL,   -- Gesamtpunkte, 0 bis 15
  level           TEXT NOT NULL,   -- Excel-Welt, Gewachsen, Stabil, Souveraen
  critical        TEXT,            -- kritische Bereiche, kommagetrennt
  score_daten     REAL,
  score_vertrauen REAL,
  score_reporting REAL,
  score_wissen    REAL,
  score_betrieb   REAL,
  branche         TEXT,
  groesse         TEXT,
  systeme         TEXT,            -- kommagetrennt
  entscheider     TEXT,
  zeitrahmen      TEXT,
  budget          TEXT,
  utm_source      TEXT,            -- z. B. linkedin
  utm_medium      TEXT,            -- z. B. social
  utm_campaign    TEXT,            -- z. B. healthcheck
  referrer        TEXT,            -- nur Hostname, z. B. www.linkedin.com
  mail_ok         INTEGER NOT NULL -- 1 = Mail an Tobias ging raus, 0 = Versand fehlgeschlagen
);

CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions (created_at);
