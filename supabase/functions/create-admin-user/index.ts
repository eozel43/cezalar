// Devre dışı: bu fonksiyon yetki kontrolü olmadan kullanıcı oluşturabiliyordu.
// Admin atamak için create-admin-user.sql dosyasını Supabase SQL Editor'de çalıştırın.
Deno.serve(() => new Response(JSON.stringify({
    error: { code: 'GONE', message: 'Bu fonksiyon devre dışı bırakıldı' }
}), {
    status: 410,
    headers: { 'Content-Type': 'application/json' }
}));
