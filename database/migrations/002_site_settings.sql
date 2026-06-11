CREATE TABLE IF NOT EXISTS site_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value)
VALUES ('work_status', 'open')
ON CONFLICT (key) DO NOTHING;
