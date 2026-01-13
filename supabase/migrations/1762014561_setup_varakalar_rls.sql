-- Migration: setup_varakalar_rls
-- Created at: 1762014561

-- Enable RLS on varakalar table
ALTER TABLE varakalar ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON varakalar
  FOR SELECT USING (true);

-- Allow insert via edge function (both anon and service_role)
CREATE POLICY "Allow insert via edge function" ON varakalar
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));

-- Allow delete only for service_role (cleanup capability)
CREATE POLICY "Service role delete only" ON varakalar
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Allow update only for service_role
CREATE POLICY "Service role update only" ON varakalar
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Storage RLS for excel-uploads bucket
CREATE POLICY "Public read for excel-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'excel-uploads');

CREATE POLICY "Allow upload to excel-uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'excel-uploads'
    AND (auth.role() IN ('anon', 'service_role', 'authenticated'))
  );

CREATE POLICY "Service role delete excel files" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'excel-uploads' AND auth.role() = 'service_role');;