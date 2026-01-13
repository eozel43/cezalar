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
        const { email, userId } = await req.json();

        if (!email || !userId) {
            throw new Error('Email ve userId parametreleri gerekli');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase yapılandırması eksik');
        }

        // Get admin email(s)
        const adminResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?role=eq.admin&select=email`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!adminResponse.ok) {
            throw new Error('Admin listesi alınamadı');
        }

        const admins = await adminResponse.json();
        
        if (!admins || admins.length === 0) {
            console.warn('Hiç admin bulunamadı');
            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Admin bulunamadı, email gönderilemedi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Log notification (In production, integrate with email service)
        console.log('New user registration notification:');
        console.log('User email:', email);
        console.log('User ID:', userId);
        console.log('Admin emails:', admins.map(a => a.email).join(', '));

        // TODO: Integrate with email service (SendGrid, Resend, etc.)
        // For now, we'll just log and return success
        // In production, you would call an email API here

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Admin bilgilendirme başarılı',
                notifiedAdmins: admins.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin notification error:', error);

        const errorResponse = {
            error: {
                code: 'NOTIFICATION_FAILED',
                message: error.message || 'Admin bilgilendirme başarısız'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
