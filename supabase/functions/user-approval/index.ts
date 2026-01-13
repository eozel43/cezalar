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

    try {
        const { userId, action } = await req.json();

        if (!userId || !action) {
            throw new Error('userId ve action parametreleri gerekli');
        }

        if (!['approve', 'reject'].includes(action)) {
            throw new Error('Geçersiz action. "approve" veya "reject" olmalı');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase yapılandırması eksik');
        }

        // Verify requesting user is admin
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Yetkilendirme başlığı eksik');
        }

        const token = authHeader.replace('Bearer ', '');

        // Get current user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Geçersiz token');
        }

        const currentUserData = await userResponse.json();
        const currentUserId = currentUserData.id;

        // Check if current user is admin
        const adminCheckResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${currentUserId}&select=role`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!adminCheckResponse.ok) {
            throw new Error('Admin kontrolü başarısız');
        }

        const adminData = await adminCheckResponse.json();
        if (!adminData || adminData.length === 0 || adminData[0].role !== 'admin') {
            throw new Error('Bu işlem için admin yetkisi gerekli');
        }

        // Update user profile
        const newRole = action === 'approve' ? 'user' : 'rejected';
        const newStatus = action === 'approve' ? 'active' : 'rejected';

        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    role: newRole,
                    status: newStatus
                })
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Kullanıcı güncellemesi başarısız: ${errorText}`);
        }

        const updatedProfile = await updateResponse.json();

        const message = action === 'approve' 
            ? 'Kullanıcı başarıyla onaylandı'
            : 'Kullanıcı reddedildi';

        return new Response(JSON.stringify({
            data: {
                success: true,
                message,
                profile: updatedProfile[0]
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('User approval error:', error);

        const errorResponse = {
            error: {
                code: 'USER_APPROVAL_FAILED',
                message: error.message || 'Kullanıcı onay işlemi başarısız'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
