-- Admin kullanıcı oluştur (önce auth.users'da ozel.emre@gmail.com hesabı olmalı)
INSERT INTO user_profiles (user_id, email, role, status)
SELECT 
    id,
    'ozel.emre@gmail.com',
    'admin',
    'active'
FROM auth.users
WHERE email = 'ozel.emre@gmail.com'
ON CONFLICT (email) DO UPDATE
SET role = 'admin', status = 'active';
