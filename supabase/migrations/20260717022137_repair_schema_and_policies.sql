/*
# Repair Schema: Add Missing Columns, Profiles Table, and All RLS Policies

## Overview
The existing tables (events, tickets, settings) were created with integer IDs
and some missing columns. This migration:
1. Adds missing `created_at` to events and `updated_at` to settings.
2. Creates the `profiles` table (was missing).
3. Creates `is_admin()` and `is_staff()` helper functions.
4. Creates ALL RLS policies for every table.

## Changes

### Column additions (non-destructive)
- `events.created_at` — timestamptz, defaults to now()
- `settings.updated_at` — timestamptz, defaults to now()

### New table: profiles
- `id` (uuid, PK, FK to auth.users)
- `email` (text)
- `full_name` (text)
- `role` (text: 'admin' | 'scanner', default 'scanner')
- `created_at` (timestamptz)

### Helper functions
- `is_admin()` — checks if current user is admin
- `is_staff()` — checks if current user is admin or scanner

### RLS Policies
- events: public SELECT, admin INSERT/UPDATE/DELETE
- tickets: staff SELECT, public INSERT, staff UPDATE, admin DELETE
- settings: public SELECT, admin INSERT/UPDATE
- profiles: authenticated self SELECT/INSERT/UPDATE

## Important Notes
1. Uses `ADD COLUMN IF NOT EXISTS` for safe column additions.
2. Uses `DROP POLICY IF EXISTS` before each CREATE POLICY for idempotency.
3. The `handle_new_user` trigger already exists from a prior migration.
*/

-- ============================================================
-- ADD MISSING COLUMNS
-- ============================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'scanner' CHECK (role IN ('admin', 'scanner')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'scanner')
  );
$$;

-- ============================================================
-- EVENTS POLICIES
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_events" ON events;
CREATE POLICY "public_select_events"
ON events FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events"
ON events FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events"
ON events FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events"
ON events FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- TICKETS POLICIES
-- ============================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_tickets" ON tickets;
CREATE POLICY "staff_read_tickets"
ON tickets FOR SELECT
TO authenticated
USING (is_staff());

DROP POLICY IF EXISTS "public_insert_tickets" ON tickets;
CREATE POLICY "public_insert_tickets"
ON tickets FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_tickets" ON tickets;
CREATE POLICY "staff_update_tickets"
ON tickets FOR UPDATE
TO authenticated
USING (is_staff())
WITH CHECK (is_staff());

DROP POLICY IF EXISTS "admin_delete_tickets" ON tickets;
CREATE POLICY "admin_delete_tickets"
ON tickets FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- SETTINGS POLICIES
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_settings" ON settings;
CREATE POLICY "public_select_settings"
ON settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings"
ON settings FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_insert_settings" ON settings;
CREATE POLICY "admin_insert_settings"
ON settings FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- ============================================================
-- SEED: Ensure default settings row exists
-- ============================================================
INSERT INTO settings (yape_number)
SELECT '950 123 456'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
