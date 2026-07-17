/*
# Dulcinea Club - Event Management Platform Schema

## Overview
Creates the complete database schema for the Dulcinea Club event management platform.
This app uses Supabase Auth with role-based access control via a profiles table.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) - one-to-one with Supabase auth users
- `email` (text) - denormalized email for convenience
- `full_name` (text) - display name
- `role` (text: 'admin' | 'scanner', default 'scanner') - access level
- `created_at` (timestamptz) - record creation time

### events
- `id` (uuid, PK) - unique event identifier
- `title` (text) - event name
- `description` (text) - event details
- `price` (numeric) - ticket price in soles
- `flyer_url` (text) - promotional image URL
- `event_date` (timestamptz) - when the event takes place
- `capacity` (integer) - max tickets available
- `created_at` (timestamptz) - record creation time

### tickets
- `id` (uuid, PK) - unique ticket identifier
- `event_id` (uuid, FK to events) - associated event
- `name` (text) - buyer full name
- `email` (text) - buyer email
- `phone` (text) - buyer phone
- `payment_method` (text: 'Yape' | 'Efectivo') - how they paid
- `operation_number` (text) - Yape operation reference
- `status` (text: 'pending' | 'approved', default 'pending') - approval state
- `qr_code` (text) - QR code payload for validation
- `is_used` (boolean, default false) - whether ticket was scanned at entry
- `created_at` (timestamptz) - purchase time

### settings
- `id` (uuid, PK) - singleton row
- `yape_number` (text) - Yape payment number for display
- `updated_at` (timestamptz) - last modification time

## Security (RLS)

All tables have RLS enabled.

### profiles
- SELECT/INSERT/UPDATE: authenticated users can manage their own profile.

### events
- SELECT: public (anon + authenticated) - anyone can view events.
- INSERT/UPDATE/DELETE: admin only (via is_admin() function).

### tickets
- SELECT: staff (admin/scanner) can read all.
- INSERT: public (anon + authenticated) - anyone can buy a ticket.
- UPDATE: staff only (approve, mark used).
- DELETE: admin only.

### settings
- SELECT: public (anon + authenticated) - yape number shown to buyers.
- INSERT/UPDATE: admin only.

## Helper Functions
- `is_admin()` - returns true if current user has role 'admin'.
- `is_staff()` - returns true if current user has role 'admin' or 'scanner'.

## Important Notes
1. Role-based access is enforced via profiles table joins in RLS policies.
2. The `is_admin()` and `is_staff()` functions check the profiles table for the
   current auth.uid() and return a boolean, used in policy predicates.
3. Ticket buyers (public) can insert tickets but cannot read them back unless
   they are staff. This protects buyer privacy while allowing public purchases.
4. The settings table is a singleton (one row) enforced by a partial unique index.
*/

-- ============================================================
-- PROFILES TABLE (linked to auth.users for role management)
-- Must be created BEFORE helper functions that reference it.
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
-- HELPER FUNCTIONS for role-based RLS (profiles table now exists)
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
-- EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  flyer_url text,
  event_date timestamptz NOT NULL,
  capacity integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
-- TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  payment_method text NOT NULL CHECK (payment_method IN ('Yape', 'Efectivo')),
  operation_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  qr_code text,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Staff can read all tickets
DROP POLICY IF EXISTS "staff_read_tickets" ON tickets;
CREATE POLICY "staff_read_tickets"
ON tickets FOR SELECT
TO authenticated
USING (is_staff());

-- Public can buy tickets (insert)
DROP POLICY IF EXISTS "public_insert_tickets" ON tickets;
CREATE POLICY "public_insert_tickets"
ON tickets FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only staff can update tickets (approve, mark used)
DROP POLICY IF EXISTS "staff_update_tickets" ON tickets;
CREATE POLICY "staff_update_tickets"
ON tickets FOR UPDATE
TO authenticated
USING (is_staff())
WITH CHECK (is_staff());

-- Only admins can delete tickets
DROP POLICY IF EXISTS "admin_delete_tickets" ON tickets;
CREATE POLICY "admin_delete_tickets"
ON tickets FOR DELETE
TO authenticated
USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);

-- ============================================================
-- SETTINGS TABLE (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yape_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_singleton ON settings((1));

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
-- SEED: Insert default settings row
-- ============================================================
INSERT INTO settings (yape_number)
SELECT '950 123 456'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- ============================================================
-- INDEXES for events
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
