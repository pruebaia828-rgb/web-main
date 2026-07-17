/*
# Fix tickets table: phone nullable + payment_method check + Storage bucket

## Changes
1. Makes `phone` column nullable — the form allows empty phone numbers.
2. Adds a CHECK constraint on `payment_method` (if not already present) to enforce
   valid values: 'Yape' or 'Efectivo'.
3. Creates the `flyers` storage bucket for event flyer image uploads.

## Important Notes
- `ALTER COLUMN ... DROP NOT NULL` is safe and non-destructive.
- The storage bucket insert uses the Supabase storage schema.
*/

-- Make phone nullable (it was NOT NULL but form sends null for empty phone)
ALTER TABLE tickets ALTER COLUMN phone DROP NOT NULL;

-- Add CHECK constraint on payment_method if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_payment_method_check'
    AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets ADD CONSTRAINT tickets_payment_method_check
      CHECK (payment_method IN ('Yape', 'Efectivo'));
  END IF;
END $$;

-- Create the flyers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('flyers', 'flyers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on flyers bucket
DROP POLICY IF EXISTS "public_read_flyers" ON storage.objects;
CREATE POLICY "public_read_flyers"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'flyers');

-- Allow authenticated users to upload flyers
DROP POLICY IF EXISTS "auth_upload_flyers" ON storage.objects;
CREATE POLICY "auth_upload_flyers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'flyers');

-- Allow authenticated users to update flyers
DROP POLICY IF EXISTS "auth_update_flyers" ON storage.objects;
CREATE POLICY "auth_update_flyers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'flyers');

-- Allow authenticated users to delete flyers
DROP POLICY IF EXISTS "auth_delete_flyers" ON storage.objects;
CREATE POLICY "auth_delete_flyers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'flyers');
