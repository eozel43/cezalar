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
        const resendApiKey = Deno.env.get('RESEND_API_KEY'); // Optional

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
                    message: 'Admin bulunamadı, bildirim gönderilemedi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Log notification (always log regardless of email service)
        console.log('=== Yeni Kullanıcı Kaydı ===');
        console.log('Kullanıcı Email:', email);
        console.log('Kullanıcı ID:', userId);
        console.log('Admin Emails:', admins.map(a => a.email).join(', '));
        console.log('========================');

        let emailSent = false;
        let emailError = null;

        // Try to send email if RESEND_API_KEY is configured
        if (resendApiKey) {
            try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Varakalar Dashboard <noreply@yourdomain.com>', // TODO: Update domain
                        to: admins.map(a => a.email),
                        subject: 'Yeni Kullanıcı Kaydı - Onay Bekliyor',
                        html: `
                            <h2>Yeni Kullanıcı Kaydı</h2>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Durum:</strong> Onay bekliyor</p>
                            <p>Admin panelinden onaylayabilir veya reddedebilirsiniz.</p>
                            <hr>
                            <p><small>Bu otomatik bir bildirimidir.</small></p>
                        `
                    })
                });

                if (emailResponse.ok) {
                    emailSent = true;
                    console.log('Email başarıyla gönderildi');
                } else {
                    const errorText = await emailResponse.text();
                    emailError = `Email gönderimi başarısız: ${errorText}`;
                    console.error(emailError);
                }
            } catch (err) {
                emailError = `Email servis hatası: ${err.message}`;
                console.error(emailError);
            }
        } else {
            console.warn('RESEND_API_KEY tanımlı değil, email gönderilmedi');
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: emailSent 
                    ? `Admin bildirim email'i ${admins.length} kişiye gönderildi` 
                    : 'Admin konsol loglarında bilgilendirildi (email servisi aktif değil)',
                notifiedAdmins: admins.length,
                emailSent,
                emailError
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
