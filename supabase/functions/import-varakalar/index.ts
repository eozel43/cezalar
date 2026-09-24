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
        // Get request data
        const { varakalar, clearExisting } = await req.json();

        if (!varakalar || !Array.isArray(varakalar) || varakalar.length === 0) {
            throw new Error('Varaka kayıtları gerekli (array formatında)');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase yapılandırması eksik');
        }

        // Verify caller is an approved (active) user
        const forbidden = (status: number, message: string) => new Response(JSON.stringify({
            error: { code: 'UNAUTHORIZED', message }
        }), {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

        const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
        if (!token) {
            return forbidden(401, 'Yetkilendirme başlığı eksik');
        }

        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            return forbidden(401, 'Oturum geçersiz. Lütfen tekrar giriş yapın.');
        }

        const currentUser = await userResponse.json();
        if (!currentUser?.id) {
            return forbidden(401, 'Oturum geçersiz. Lütfen tekrar giriş yapın.');
        }

        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUser.id)}&select=status`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const profiles = profileResponse.ok ? await profileResponse.json() : [];
        if (!profiles.length || profiles[0].status !== 'active') {
            return forbidden(403, 'Bu işlem için onaylı bir hesap gerekli');
        }

        // Trim and collapse repeated whitespace
        const cleanText = (value: any) => String(value).trim().replace(/\s+/g, ' ');

        // Validate and transform data
        const transformedData = varakalar.map((varaka: any) => {
            // Basic validation
            if (!varaka.tarih || !varaka.plaka_no || !varaka.isim || !varaka.kabahat) {
                throw new Error('Eksik alan: tarih, plaka_no, isim ve kabahat gerekli');
            }

            return {
                sira_no: varaka.sira_no || null,
                tarih: varaka.tarih,
                gun: varaka.gun || '',
                plaka_no: cleanText(varaka.plaka_no),
                isim: cleanText(varaka.isim),
                kabahat: cleanText(varaka.kabahat),
                ceza_miktari: parseFloat(varaka.ceza_miktari) || 0,
                ay: parseInt(varaka.ay) || null,
                mevsim: varaka.mevsim || null,
                ceza_turu: varaka.ceza_turu || null,
                ceza_detay: varaka.ceza_detay || null
            };
        });

        // Unify kabahat spellings that differ only in letter case
        // (e.g. "müşteriye Kötü Söz" vs "Müşteriye Kötü Söz"): every variant is
        // mapped to the most frequent spelling across the file and, when
        // appending, the existing records
        const kabahatKey = (value: string) => value.toLocaleLowerCase('tr-TR');
        const variantCounts = new Map<string, Map<string, number>>();
        const countVariant = (variant: string) => {
            const key = kabahatKey(variant);
            const variants = variantCounts.get(key) || new Map<string, number>();
            variants.set(variant, (variants.get(variant) || 0) + 1);
            variantCounts.set(key, variants);
        };

        transformedData.forEach((row) => countVariant(row.kabahat));

        const existingVariants: string[] = [];
        if (!clearExisting) {
            const pageSize = 1000;
            for (let from = 0; ; from += pageSize) {
                const pageResponse = await fetch(`${supabaseUrl}/rest/v1/varakalar?select=kabahat&order=id`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Range': `${from}-${from + pageSize - 1}`
                    }
                });
                if (!pageResponse.ok) {
                    throw new Error('Mevcut kabahat türleri okunamadı');
                }
                const page = await pageResponse.json();
                page.forEach((row: { kabahat: string }) => {
                    countVariant(row.kabahat);
                    existingVariants.push(row.kabahat);
                });
                if (page.length < pageSize) break;
            }
        }

        const canonicalKabahat = new Map<string, string>();
        variantCounts.forEach((variants, key) => {
            const [best] = [...variants.entries()].sort((a, b) =>
                b[1] - a[1] ||
                Number(/^\p{Lu}/u.test(b[0])) - Number(/^\p{Lu}/u.test(a[0])) ||
                a[0].localeCompare(b[0], 'tr')
            );
            canonicalKabahat.set(key, best[0]);
        });

        transformedData.forEach((row) => {
            row.kabahat = canonicalKabahat.get(kabahatKey(row.kabahat)) || row.kabahat;
        });

        // Existing records with a non-canonical spelling are renamed too
        for (const variant of new Set(existingVariants)) {
            const canonical = canonicalKabahat.get(kabahatKey(variant));
            if (canonical && canonical !== variant) {
                const renameResponse = await fetch(
                    `${supabaseUrl}/rest/v1/varakalar?kabahat=eq.${encodeURIComponent(variant)}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ kabahat: canonical, updated_at: new Date().toISOString() })
                    }
                );
                if (!renameResponse.ok) {
                    console.error('Kabahat rename error:', await renameResponse.text());
                }
            }
        }

        // Track deleted record count
        let deletedCount = 0;

        // If clearExisting is true, delete all existing records first
        if (clearExisting) {
            // First, get the count of existing records
            const countResponse = await fetch(`${supabaseUrl}/rest/v1/varakalar?select=count`, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Prefer': 'count=exact'
                }
            });

            const countHeader = countResponse.headers.get('content-range');
            if (countHeader) {
                const match = countHeader.match(/\/(\d+)/);
                if (match) {
                    deletedCount = parseInt(match[1]);
                }
            }

            // Use SQL query to truncate table (delete all rows)
            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/truncate_varakalar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            // If RPC function doesn't exist, fallback to deleting with a broad filter
            if (!deleteResponse.ok) {
                // Try alternative: delete where sira_no is not null (catches all records)
                const fallbackDelete = await fetch(`${supabaseUrl}/rest/v1/varakalar?sira_no=gte.0`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Prefer': 'return=minimal'
                    }
                });

                if (!fallbackDelete.ok) {
                    const errorText = await fallbackDelete.text();
                    console.error('Delete error:', errorText);
                    throw new Error(`Mevcut kayıtlar silinemedi: ${errorText}`);
                }
            }

            console.log(`Deleted ${deletedCount} existing records`);
        }

        // Batch insert (100 records at a time)
        const batchSize = 100;
        let totalInserted = 0;
        const errors = [];

        for (let i = 0; i < transformedData.length; i += batchSize) {
            const batch = transformedData.slice(i, i + batchSize);

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/varakalar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(batch)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                errors.push({
                    batch: Math.floor(i / batchSize) + 1,
                    error: errorText
                });
            } else {
                totalInserted += batch.length;
            }
        }

        // Return success response
        const message = clearExisting && deletedCount > 0
            ? `${deletedCount} eski kayıt silindi, ${totalInserted} yeni kayıt eklendi`
            : `${totalInserted} kayıt başarıyla içe aktarıldı`;

        return new Response(JSON.stringify({
            data: {
                success: true,
                totalRecords: varakalar.length,
                inserted: totalInserted,
                deleted: deletedCount,
                errors: errors.length > 0 ? errors : null,
                message
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import error:', error);

        const errorResponse = {
            error: {
                code: 'IMPORT_FAILED',
                message: error.message || 'İçe aktarma başarısız'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
