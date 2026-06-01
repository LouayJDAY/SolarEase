-- V10: Create product catalog table for reusable quote items
CREATE TABLE IF NOT EXISTS product_catalog (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    reference   VARCHAR(100),
    default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category    VARCHAR(50)     NOT NULL DEFAULT 'MATERIEL',
    description TEXT,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Seed common solar installation products (Tunisia market)
INSERT INTO product_catalog (name, reference, default_price, category, description) VALUES
('Panneau solaire monocristallin 400W',  'JA-400M',      250.00,  'MATERIEL',     'Panneau JA Solar 400Wc monocristallin'),
('Panneau solaire monocristallin 550W',  'JA-550M',      320.00,  'MATERIEL',     'Panneau JA Solar 550Wc monocristallin'),
('Panneau solaire polycristallin 300W',  'POL-300W',     180.00,  'MATERIEL',     'Panneau polycristallin standard'),
('Onduleur hybride 3kW',                 'HW-3K',        850.00,  'MATERIEL',     'Onduleur hybride triphasé 3kW'),
('Onduleur hybride 5kW Huawei',          'HW-5K',       1200.00,  'MATERIEL',     'Onduleur hybride Huawei 5kW'),
('Onduleur hybride 10kW Huawei',         'HW-10K',      2100.00,  'MATERIEL',     'Onduleur hybride Huawei 10kW'),
('Batterie LFP 5kWh BYD',               'BYD-5K',      2000.00,  'MATERIEL',     'Batterie lithium fer phosphate 5kWh'),
('Batterie LFP 10kWh BYD',              'BYD-10K',     3800.00,  'MATERIEL',     'Batterie lithium fer phosphate 10kWh'),
('Structure de montage toiture (kit)',   'STR-TOIT-KIT', 180.00,  'MATERIEL',     'Kit de fixation panneaux sur toiture'),
('Structure de montage sol (kit)',       'STR-SOL-KIT',  220.00,  'MATERIEL',     'Kit de fixation panneaux au sol'),
('Câblage DC 4mm² (par mètre)',          'CAB-DC-4',       2.50,  'MATERIEL',     'Câble solaire DC 4mm² rouge/noir'),
('Câblage AC (forfait)',                 'CAB-AC',        150.00,  'MATERIEL',     'Câblage AC depuis onduleur tableau'),
('Boîte de jonction DC',                'BOJ-DC',         45.00,  'MATERIEL',     'Boîte de jonction protection DC'),
('Disjoncteur DC',                      'DIS-DC',         60.00,  'MATERIEL',     'Disjoncteur de protection DC'),
('Parafoudre DC + AC',                  'PAR-DC-AC',      90.00,  'MATERIEL',     'Protection contre la foudre DC et AC'),
('Compteur bidirectionnel STEG',        'CTR-BI',        350.00,  'MATERIEL',     'Compteur de production/injection STEG'),
('Main d''œuvre installation (journée)','MO-JOUR',       300.00,  'MAIN_OEUVRE',  'Forfait journée technicien installateur'),
('Mise en service et tests',            'MES-TEST',      150.00,  'MAIN_OEUVRE',  'Mise en service, tests et réglages'),
('Étude technique et plans',            'ETUDE-TECH',    200.00,  'MAIN_OEUVRE',  'Étude de faisabilité et plans d''exécution'),
('Démarches administratives STEG',      'ADM-STEG',      250.00,  'MAIN_OEUVRE',  'Dossier raccordement et autorisation STEG'),
('Transport et logistique',             'TRANS',         200.00,  'TRANSPORT',    'Transport matériel et déplacement équipe'),
('Garantie extension 5 ans',            'GAR-5ANS',      400.00,  'AUTRE',        'Extension de garantie main d''œuvre 5 ans');
