-- Migration: backfill_missing_profiles
-- Accounts created before the on_auth_user_created trigger (when the client
-- inserted profiles itself) could end up without a profile. Such users saw
-- "Onay bekleniyor" but never appeared in the admin's request list.
-- Applied on 2026-09-24 (4 accounts).
INSERT INTO public.user_profiles (user_id, email, role, status, created_at)
SELECT u.id, u.email, 'pending', 'pending', u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.email = u.email);
