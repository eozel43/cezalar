-- Migration: security_hardening
-- Canlı veritabanına uygulanan güvenlik düzeltmeleri (2026-09-24).
-- Önceki migration'lardaki anon INSERT / public SELECT kuralları canlıda zaten kaldırılmıştı;
-- bu dosya güncel ve güvenli durumu tek yerde toplar.

-- 1. truncate_varakalar: sadece service_role (import-varakalar edge function) çalıştırabilir
REVOKE ALL ON FUNCTION public.truncate_varakalar() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.truncate_varakalar() TO service_role;
ALTER FUNCTION public.truncate_varakalar() SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.check_user_profile_mutation() SET search_path = public;
ALTER FUNCTION public.auto_confirm_email() SET search_path = public;
REVOKE ALL ON FUNCTION public.check_user_profile_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_confirm_email() FROM PUBLIC, anon, authenticated;

-- 2. Profil kaydı istemciden değil, auth.users trigger'ı ile (pending olarak) oluşturulur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role, status)
  VALUES (NEW.id, NEW.email, 'pending', 'pending')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Anonim profil ekleme ve kullanıcının kendi profilini (rol/durum/e-posta) değiştirmesi kapatılır.
-- Rol/durum değişikliği yalnızca user-approval edge function (service_role) üzerinden yapılır.
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile viewing" ON public.user_profiles;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check,
  DROP CONSTRAINT IF EXISTS user_profiles_status_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'user', 'pending', 'rejected')),
  ADD CONSTRAINT user_profiles_status_check CHECK (status IN ('active', 'pending', 'rejected'));

-- 3. Okuma kuralları yalnızca oturum açmış kullanıcılara tanımlı
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Varaka kayıtları (ad-soyad, plaka) yalnızca onaylı kullanıcılara açık; yazma sadece service_role
DROP POLICY IF EXISTS "Allow public read access" ON public.varakalar;
DROP POLICY IF EXISTS "Allow insert via edge function" ON public.varakalar;
DROP POLICY IF EXISTS "Allow read access for authenticated active users" ON public.varakalar;
CREATE POLICY "Allow read access for authenticated active users" ON public.varakalar
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid() AND user_profiles.status = 'active'
  ));

DROP POLICY IF EXISTS "Service role insert only" ON public.varakalar;
CREATE POLICY "Service role insert only" ON public.varakalar
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 4. Kullanılmayan excel-uploads bucket'ı: herkese açık okuma ve anonim yükleme kapatılır
UPDATE storage.buckets SET public = false WHERE id = 'excel-uploads';
DROP POLICY IF EXISTS "Public read for excel-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to excel-uploads" ON storage.objects;
