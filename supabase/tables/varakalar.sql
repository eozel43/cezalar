CREATE TABLE varakalar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sira_no INTEGER,
    tarih DATE NOT NULL,
    gun TEXT NOT NULL,
    plaka_no TEXT NOT NULL,
    isim TEXT NOT NULL,
    kabahat TEXT NOT NULL,
    ceza_miktari NUMERIC NOT NULL DEFAULT 0,
    ay INTEGER,
    mevsim TEXT,
    ceza_turu TEXT,
    ceza_detay TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);