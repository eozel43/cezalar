-- Migration: fix_security_vulnerabilities
-- Updated at: 1762162000 (Phase 2 Hardening)

-- 1. Fix Truncate Function Access Control
REVOKE EXECUTE ON FUNCTION truncate_varakalar() FROM public, anon;
GRANT EXECUTE ON FUNCTION truncate_varakalar() TO service_role;

-- 2. Fix User Profiles Reading Leak
DROP POLICY IF EXISTS "Allow profile viewing" ON user_profiles;

-- 3. Create Recursion-Safe Admin Verification Function
CREATE OR REPLACE FUNCTION is_admin(user_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = user_id_to_check AND role = 'admin' AND status = 'active'
  );
END;
$$;

-- 4. Create Strict Policy for Admins to View All Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT
    USING (is_admin(auth.uid()));

-- 5. Fix Privilege Escalation on Both INSERT and UPDATE
-- Prevents creating user profiles directly with 'admin' or 'active' status on insert,
-- and prevents modifying role/status columns on update unless done by service_role or admin.
CREATE OR REPLACE FUNCTION check_user_profile_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- TG_OP check: TG_OP = 'INSERT'
  IF (TG_OP = 'INSERT') THEN
    -- If trying to set role or status to something other than pending, verify permissions
    IF (NEW.role IS DISTINCT FROM 'pending' OR NEW.status IS DISTINCT FROM 'pending') THEN
      IF (auth.role() != 'service_role') THEN
        IF NOT EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        ) THEN
          RAISE EXCEPTION 'Yetkisiz islem: Yeni profil kaydinda yetki yukseltemezsiniz.';
        END IF;
      END IF;
    END IF;
  -- TG_OP check: TG_OP = 'UPDATE'
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Prevent modifying role or status unless done by service_role or admin
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status) THEN
      IF (auth.role() != 'service_role') THEN
        IF NOT EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        ) THEN
          RAISE EXCEPTION 'Yetkisiz islem: Rol veya durum sutunlarini degistiremezsiniz.';
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to user_profiles table for both INSERT and UPDATE
DROP TRIGGER IF EXISTS protect_user_profile_role_status ON user_profiles;
CREATE TRIGGER protect_user_profile_role_status
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_user_profile_mutation();

-- 6. Fix Varakalar SELECT Policy (KVKK Leak)
-- Restrict data reading only to authenticated active users
DROP POLICY IF EXISTS "Allow public read access" ON varakalar;
CREATE POLICY "Allow read access for authenticated active users" ON varakalar
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 7. Fix Varakalar INSERT Policy (Bypass Leak)
-- Remove the public/anon insert policy and restrict to service_role only
DROP POLICY IF EXISTS "Allow insert via edge function" ON varakalar;
CREATE POLICY "Service role insert only" ON varakalar
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
