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
                plaka_no: varaka.plaka_no,
                isim: varaka.isim,
                kabahat: varaka.kabahat,
                ceza_miktari: parseFloat(varaka.ceza_miktari) || 0,
                ay: parseInt(varaka.ay) || null,
                mevsim: varaka.mevsim || null,
                ceza_turu: varaka.ceza_turu || null,
                ceza_detay: varaka.ceza_detay || null
            };
        });

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
