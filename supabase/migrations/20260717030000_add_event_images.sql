-- Migration: add event_images table to store multiple images per event

CREATE TABLE IF NOT EXISTS event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_event_images" ON event_images;
CREATE POLICY "public_select_event_images"
ON event_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
