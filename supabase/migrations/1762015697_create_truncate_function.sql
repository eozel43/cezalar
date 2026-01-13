-- Migration: create_truncate_function
-- Created at: 1762015697

-- Create a stored function to truncate varakalar table
CREATE OR REPLACE FUNCTION truncate_varakalar()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE varakalar;
END;
$$;

-- Grant execute permission to service_role and anon
GRANT EXECUTE ON FUNCTION truncate_varakalar() TO service_role;
GRANT EXECUTE ON FUNCTION truncate_varakalar() TO anon;;