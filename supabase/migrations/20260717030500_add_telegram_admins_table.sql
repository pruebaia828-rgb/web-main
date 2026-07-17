-- Add table for Telegram bot administrators

CREATE TABLE IF NOT EXISTS telegram_admins (
  telegram_id bigint PRIMARY KEY,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telegram_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_telegram_admins" ON telegram_admins;
CREATE POLICY "select_telegram_admins"
ON telegram_admins FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "insert_telegram_admins" ON telegram_admins;
CREATE POLICY "insert_telegram_admins"
ON telegram_admins FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "update_telegram_admins" ON telegram_admins;
CREATE POLICY "update_telegram_admins"
ON telegram_admins FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "delete_telegram_admins" ON telegram_admins;
CREATE POLICY "delete_telegram_admins"
ON telegram_admins FOR DELETE
TO authenticated
USING (true);
