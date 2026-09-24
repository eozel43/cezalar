// Admin-only user management: list users, approve / reject requests, delete users
Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    const fail = (status: number, message: string) =>
        respond(status, { error: { code: 'USER_MANAGEMENT_FAILED', message } });

    try {
        const { userId, action } = await req.json();

        if (!['list', 'approve', 'reject', 'delete'].includes(action)) {
            return fail(400, 'Geçersiz işlem');
        }
        if (action !== 'list' && !/^[0-9a-f-]{36}$/i.test(String(userId || ''))) {
            return fail(400, 'Geçersiz kullanıcı');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase yapılandırması eksik');
        }

        const service = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        };

        // Caller must be an active admin
        const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
        if (!token) {
            return fail(401, 'Yetkilendirme başlığı eksik');
        }

        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
        });
        if (!userResponse.ok) {
            return fail(401, 'Oturum geçersiz. Lütfen tekrar giriş yapın.');
        }
        const currentUserId = (await userResponse.json()).id;

        const adminResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${currentUserId}&select=role,status`,
            { headers: service }
        );
        const adminData = adminResponse.ok ? await adminResponse.json() : [];
        if (!adminData.length || adminData[0].role !== 'admin' || adminData[0].status !== 'active') {
            return fail(403, 'Bu işlem için yönetici yetkisi gerekli');
        }

        if (action === 'list') {
            const profilesResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?select=user_id,email,role,status,created_at&order=created_at.asc`,
                { headers: service }
            );
            if (!profilesResponse.ok) {
                throw new Error('Kullanıcılar okunamadı');
            }
            const profiles = await profilesResponse.json();

            // Last sign-in lives in auth.users, readable only with the service role
            const lastSignIn = new Map<string, string | null>();
            for (let page = 1; ; page++) {
                const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, {
                    headers: service
                });
                if (!authResponse.ok) break;
                const { users = [] } = await authResponse.json();
                users.forEach((u: { id: string; last_sign_in_at: string | null }) => lastSignIn.set(u.id, u.last_sign_in_at));
                if (users.length < 1000) break;
            }

            return respond(200, {
                data: {
                    users: profiles.map((p: Record<string, unknown>) => ({
                        ...p,
                        has_account: lastSignIn.has(p.user_id as string),
                        last_sign_in_at: lastSignIn.get(p.user_id as string) ?? null,
                        is_self: p.user_id === currentUserId
                    }))
                }
            });
        }

        const targetResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=role,email`,
            { headers: service }
        );
        const target = targetResponse.ok ? (await targetResponse.json())[0] : null;
        if (!target) {
            return fail(404, 'Kullanıcı bulunamadı');
        }

        if (action === 'delete') {
            if (userId === currentUserId) {
                return fail(400, 'Kendi hesabınızı silemezsiniz');
            }
            if (target.role === 'admin') {
                return fail(400, 'Yönetici hesapları buradan silinemez');
            }

            // Remove the sign-in account (already missing is fine), then the profile
            const deleteAuth = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
                method: 'DELETE',
                headers: service
            });
            if (!deleteAuth.ok && deleteAuth.status !== 404) {
                throw new Error(`Hesap silinemedi: ${await deleteAuth.text()}`);
            }

            const deleteProfile = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
                method: 'DELETE',
                headers: { ...service, 'Prefer': 'return=minimal' }
            });
            if (!deleteProfile.ok) {
                throw new Error(`Profil silinemedi: ${await deleteProfile.text()}`);
            }

            return respond(200, { data: { success: true, message: `${target.email} silindi` } });
        }

        // approve / reject
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: { ...service, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify(
                action === 'approve' ? { role: 'user', status: 'active' } : { role: 'rejected', status: 'rejected' }
            )
        });
        if (!updateResponse.ok) {
            throw new Error(`Kullanıcı güncellemesi başarısız: ${await updateResponse.text()}`);
        }

        return respond(200, {
            data: {
                success: true,
                message: action === 'approve' ? 'Kullanıcı başarıyla onaylandı' : 'Kullanıcı reddedildi',
                profile: (await updateResponse.json())[0]
            }
        });
    } catch (error) {
        console.error('User management error:', error);
        return fail(500, error.message || 'Kullanıcı işlemi başarısız');
    }
});
