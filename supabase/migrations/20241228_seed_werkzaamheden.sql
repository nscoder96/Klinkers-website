-- =====================================================
-- SEED DATA: WERKZAAMHEDEN
-- Alle werkzaamheden per categorie met sub-taken
-- =====================================================

-- =====================================================
-- BESTRATING
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('bestrating', 'Bestrating aanleggen', 'Complete bestrating inclusief voorbereiding', 'always', true, 1, 'm²', 0.75);

-- Sub-taken bestrating (parent wordt later gelinkt)
INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('bestrating', 'Uitmeten en markeren', 'always', NULL, 1, 'm²', 0.05),
  ('bestrating', 'Bestaande bestrating verwijderen', 'optional', 'Ligt er bestaande bestrating?', 2, 'm²', 0.25),
  ('bestrating', 'Uitgraven cunet', 'optional', 'Moet er uitgegraven worden?', 3, 'm²', 0.15),
  ('bestrating', 'KLIC-melding', 'optional', 'Dieper dan 30cm graven?', 4, 'stuk', 1.0),
  ('bestrating', 'Grond afvoeren', 'optional', 'Moet grond worden afgevoerd?', 5, 'm³', 0.5),
  ('bestrating', 'Worteldoek plaatsen', 'optional', 'Worteldoek gewenst?', 6, 'm²', 0.05),
  ('bestrating', 'Drainage aanleggen', 'optional', 'Drainage nodig?', 7, 'm¹', 0.25),
  ('bestrating', 'Ophoogzand aanbrengen', 'conditional', NULL, 8, 'm³', 0.5),
  ('bestrating', 'Verdichten met trilplaat', 'always', NULL, 9, 'm²', 0.05),
  ('bestrating', 'Straatzand egaliseren', 'always', NULL, 10, 'm²', 0.08),
  ('bestrating', 'Opsluitbanden plaatsen', 'always', NULL, 11, 'm¹', 0.2),
  ('bestrating', 'Bestrating leggen', 'always', NULL, 12, 'm²', 0.3),
  ('bestrating', 'Aftrillen', 'always', NULL, 13, 'm²', 0.05),
  ('bestrating', 'Invoegen', 'always', NULL, 14, 'm²', 0.08);

-- =====================================================
-- ERFAFSCHEIDING (Schuttingen)
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('erfafscheiding', 'Schutting plaatsen', 'Complete schutting inclusief palen en schermen', 'always', true, 1, 'm¹', 0.8);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('erfafscheiding', 'Erfgrens bepalen', 'always', NULL, 1, 'm¹', 0.02),
  ('erfafscheiding', 'Oude schutting verwijderen', 'optional', 'Staat er een oude schutting?', 2, 'm¹', 0.2),
  ('erfafscheiding', 'Oude schutting afvoeren', 'optional', 'Moet oude schutting afgevoerd?', 3, 'm¹', 0.1),
  ('erfafscheiding', 'Gaten graven', 'always', NULL, 4, 'stuk', 0.25),
  ('erfafscheiding', 'Palen plaatsen', 'always', NULL, 5, 'stuk', 0.2),
  ('erfafscheiding', 'Snelbeton aanbrengen', 'always', NULL, 6, 'stuk', 0.1),
  ('erfafscheiding', 'Waterpas stellen', 'always', NULL, 7, 'm¹', 0.05),
  ('erfafscheiding', 'Schermen bevestigen', 'always', NULL, 8, 'stuk', 0.3),
  ('erfafscheiding', 'Afdeklat plaatsen', 'always', NULL, 9, 'm¹', 0.05),
  ('erfafscheiding', 'Poort plaatsen', 'optional', 'Moet er een poort in?', 10, 'stuk', 2.0);

-- =====================================================
-- VLONDERS & TERRASSEN
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('vlonders', 'Vlonder aanleggen', 'Complete vlonder inclusief onderconstructie', 'always', true, 1, 'm²', 1.2);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('vlonders', 'Positie bepalen', 'always', NULL, 1, 'm²', 0.02),
  ('vlonders', 'Bestaande ondergrond verwijderen', 'optional', 'Moet bestaande ondergrond weg?', 2, 'm²', 0.2),
  ('vlonders', 'Uitgraven', 'always', NULL, 3, 'm²', 0.15),
  ('vlonders', 'Worteldoek plaatsen', 'always', NULL, 4, 'm²', 0.05),
  ('vlonders', 'Fundatie maken', 'always', NULL, 5, 'm²', 0.2),
  ('vlonders', 'Onderconstructie leggen', 'always', NULL, 6, 'm²', 0.25),
  ('vlonders', 'Waterpas stellen met afschot', 'always', NULL, 7, 'm²', 0.1),
  ('vlonders', 'Voorboren (hardhout)', 'conditional', NULL, 8, 'm²', 0.15),
  ('vlonders', 'Planken bevestigen', 'always', NULL, 9, 'm²', 0.3),
  ('vlonders', 'Kantafwerking', 'always', NULL, 10, 'm¹', 0.15),
  ('vlonders', 'Verlichting integreren', 'optional', 'Spots in vlonder gewenst?', 11, 'stuk', 0.5),
  ('vlonders', 'Behandelen (olie/beits)', 'optional', 'Hout behandelen?', 12, 'm²', 0.1);

-- =====================================================
-- GAZON
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('gazon', 'Graszoden leggen', 'Gazon aanleggen met graszoden', 'always', true, 1, 'm²', 0.25),
  ('gazon', 'Kunstgras aanleggen', 'Kunstgras inclusief ondergrond', 'always', true, 2, 'm²', 0.4);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('gazon', 'Oud gazon verwijderen', 'optional', 'Staat er bestaand gras?', 1, 'm²', 0.1),
  ('gazon', 'Afgraven', 'always', NULL, 2, 'm²', 0.08),
  ('gazon', 'Grond afvoeren', 'optional', 'Moet grond afgevoerd?', 3, 'm³', 0.5),
  ('gazon', 'Drainage aanleggen', 'optional', 'Wateroverlast?', 4, 'm¹', 0.25),
  ('gazon', 'Bodemverbetering/bemesting', 'always', NULL, 5, 'm²', 0.03),
  ('gazon', 'Egaliseren', 'always', NULL, 6, 'm²', 0.05),
  ('gazon', 'Graszoden leggen', 'always', NULL, 7, 'm²', 0.1),
  ('gazon', 'Aandrukken/walsen', 'always', NULL, 8, 'm²', 0.02),
  ('gazon', 'Naden vullen', 'always', NULL, 9, 'm²', 0.02),
  ('gazon', 'Besproeien', 'always', NULL, 10, 'm²', 0.01),
  -- Kunstgras specifiek
  ('gazon', 'Egaliseren met brekerzand', 'always', NULL, 11, 'm²', 0.08),
  ('gazon', 'Verdichten', 'always', NULL, 12, 'm²', 0.05),
  ('gazon', 'Stabilisatiedoek plaatsen', 'always', NULL, 13, 'm²', 0.05),
  ('gazon', 'Kunstgras uitrollen', 'always', NULL, 14, 'm²', 0.1),
  ('gazon', 'Naden verlijmen', 'conditional', NULL, 15, 'm¹', 0.15),
  ('gazon', 'Randen vastzetten', 'always', NULL, 16, 'm¹', 0.1),
  ('gazon', 'Instrooien met zand', 'always', NULL, 17, 'm²', 0.05),
  ('gazon', 'Opborstelen', 'always', NULL, 18, 'm²', 0.03);

-- =====================================================
-- BEPLANTING
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('beplanting', 'Haag planten', 'Haag aanleggen inclusief plantgeul', 'always', true, 1, 'm¹', 0.4),
  ('beplanting', 'Boom planten', 'Boom planten inclusief plantgat', 'always', true, 2, 'stuk', 1.5),
  ('beplanting', 'Borders beplanten', 'Vaste planten en heesters', 'always', true, 3, 'm²', 0.5);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('beplanting', 'Plantgeul graven', 'always', NULL, 1, 'm¹', 0.15),
  ('beplanting', 'Grond verbeteren', 'always', NULL, 2, 'm¹', 0.05),
  ('beplanting', 'Planten positioneren', 'always', NULL, 3, 'm¹', 0.1),
  ('beplanting', 'Aanvullen en aandrukken', 'always', NULL, 4, 'm¹', 0.05),
  ('beplanting', 'Water geven', 'always', NULL, 5, 'm¹', 0.02),
  ('beplanting', 'Mulchen', 'optional', 'Mulch aanbrengen?', 6, 'm²', 0.05),
  ('beplanting', 'Plantgat graven', 'always', NULL, 7, 'stuk', 0.5),
  ('beplanting', 'Boompaal plaatsen', 'optional', 'Boompaal nodig?', 8, 'stuk', 0.25),
  ('beplanting', 'Wortelscherm plaatsen', 'optional', 'Nabij bestrating?', 9, 'm¹', 0.2);

-- =====================================================
-- GRONDWERK
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('grondwerk', 'Grondwerk uitvoeren', 'Graven, afvoeren en ophogen', 'always', true, 1, 'm³', 1.0);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('grondwerk', 'Afgraven', 'always', NULL, 1, 'm²', 0.1),
  ('grondwerk', 'Grond afvoeren', 'optional', 'Moet grond afgevoerd?', 2, 'm³', 0.5),
  ('grondwerk', 'Ophogen met zand', 'optional', 'Moet er opgehoogd worden?', 3, 'm³', 0.4),
  ('grondwerk', 'Egaliseren', 'always', NULL, 4, 'm²', 0.05),
  ('grondwerk', 'Verdichten', 'always', NULL, 5, 'm²', 0.05);

-- =====================================================
-- OVERKAPPINGEN
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('overkappingen', 'Overkapping bouwen', 'Complete overkapping inclusief fundatie', 'always', true, 1, 'm²', 2.5);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('overkappingen', 'Vergunningscheck', 'always', NULL, 1, 'stuk', 1.0),
  ('overkappingen', 'Uitmeten positie', 'always', NULL, 2, 'stuk', 0.5),
  ('overkappingen', 'Fundatie maken (betonpoeren)', 'always', NULL, 3, 'stuk', 1.0),
  ('overkappingen', 'Staanders plaatsen', 'always', NULL, 4, 'stuk', 0.5),
  ('overkappingen', 'Schoren bevestigen', 'always', NULL, 5, 'stuk', 0.25),
  ('overkappingen', 'Bovenliggers monteren', 'always', NULL, 6, 'stuk', 0.5),
  ('overkappingen', 'Dakconstructie', 'always', NULL, 7, 'm²', 0.5),
  ('overkappingen', 'Dakbedekking', 'always', NULL, 8, 'm²', 0.3),
  ('overkappingen', 'Hemelwaterafvoer', 'always', NULL, 9, 'stuk', 1.0),
  ('overkappingen', 'Zijwanden', 'optional', 'Zijwanden gewenst?', 10, 'm²', 0.4),
  ('overkappingen', 'Verlichting', 'optional', 'Verlichting in overkapping?', 11, 'stuk', 0.5),
  ('overkappingen', 'Terrasverwarming', 'optional', 'Terrasverwarming?', 12, 'stuk', 2.0);

-- =====================================================
-- WATERWERKEN (Vijvers)
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('waterwerken', 'Vijver aanleggen', 'Folievijver inclusief randafwerking', 'always', true, 1, 'm²', 2.0);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('waterwerken', 'Ontwerp maken', 'always', NULL, 1, 'stuk', 2.0),
  ('waterwerken', 'Locatie bepalen', 'always', NULL, 2, 'stuk', 0.5),
  ('waterwerken', 'Uitgraven per plateau', 'always', NULL, 3, 'm³', 1.0),
  ('waterwerken', 'Scherpe objecten verwijderen', 'always', NULL, 4, 'm²', 0.1),
  ('waterwerken', 'Zandbed aanbrengen', 'always', NULL, 5, 'm²', 0.15),
  ('waterwerken', 'Beschermingsdoek plaatsen', 'always', NULL, 6, 'm²', 0.1),
  ('waterwerken', 'Vijverfolie plaatsen', 'always', NULL, 7, 'm²', 0.2),
  ('waterwerken', 'Randafwerking', 'always', NULL, 8, 'm¹', 0.3),
  ('waterwerken', 'Vullen met water', 'always', NULL, 9, 'm³', 0.1),
  ('waterwerken', 'Filtersysteem', 'optional', 'Filtersysteem gewenst?', 10, 'stuk', 3.0),
  ('waterwerken', 'Pomp/waterval', 'optional', 'Pomp of waterval?', 11, 'stuk', 2.0),
  ('waterwerken', 'Vijververlichting', 'optional', 'Vijververlichting?', 12, 'stuk', 1.0),
  ('waterwerken', 'Vijverbeplanting', 'optional', 'Beplanting in vijver?', 13, 'm²', 0.5);

-- =====================================================
-- VERLICHTING & IRRIGATIE
-- =====================================================
INSERT INTO work_activities (category, name, description, activity_type, is_main_activity, display_order, unit, default_hours_per_unit) VALUES
  ('verlichting', 'Tuinverlichting aanleggen', 'Inclusief bekabeling', 'always', true, 1, 'stuk', 1.5),
  ('verlichting', 'Irrigatiesysteem aanleggen', 'Automatische bewatering', 'always', true, 2, 'm²', 0.3);

INSERT INTO work_activities (category, name, activity_type, trigger_question, display_order, unit, default_hours_per_unit) VALUES
  ('verlichting', 'Kabelgoot graven', 'always', NULL, 1, 'm¹', 0.15),
  ('verlichting', 'Bekabeling leggen', 'always', NULL, 2, 'm¹', 0.1),
  ('verlichting', 'Armaturen plaatsen', 'always', NULL, 3, 'stuk', 0.5),
  ('verlichting', 'Transformator installeren', 'always', NULL, 4, 'stuk', 1.0),
  ('verlichting', 'Aansluiten en testen', 'always', NULL, 5, 'stuk', 0.5);

-- =====================================================
-- SEED DATA: MATERIALEN
-- =====================================================

-- Bestrating materialen
INSERT INTO material_types (category, name, unit, price_low, price_medium, price_high, quantity_per_unit, waste_percentage, display_order) VALUES
  ('bestrating', 'Betontegels 30×30cm', 'm²', 10, 15, 25, 11, 5, 1),
  ('bestrating', 'Betontegels 40×40cm', 'm²', 12, 20, 30, 6.25, 5, 2),
  ('bestrating', 'Betontegels 50×50cm', 'm²', 15, 25, 40, 4, 5, 3),
  ('bestrating', 'Betontegels 60×60cm', 'm²', 20, 35, 55, 2.78, 5, 4),
  ('bestrating', 'Gebakken klinkers waalformaat', 'm²', 25, 35, 50, 100, 8, 5),
  ('bestrating', 'Gebakken klinkers dikformaat', 'm²', 30, 40, 55, 70, 8, 6),
  ('bestrating', 'Keramische tegels 60×60cm', 'm²', 40, 70, 100, 2.78, 5, 7),
  ('bestrating', 'Keramische tegels 80×80cm', 'm²', 50, 80, 120, 1.56, 5, 8),
  ('bestrating', 'Natuursteen', 'm²', 30, 50, 80, NULL, 10, 9),
  ('bestrating', 'Betonklinkers', 'm²', 15, 25, 35, 46, 5, 10),
  ('bestrating', 'Opsluitbanden', 'm¹', 5, 8, 12, NULL, 0, 11),
  ('bestrating', 'Straatzand', 'ton', 25, 30, 35, NULL, 0, 12),
  ('bestrating', 'Ophoogzand', 'ton', 20, 25, 30, NULL, 0, 13),
  ('bestrating', 'Inveegzand', 'zak', 5, 7, 10, NULL, 0, 14);

-- Schutting materialen
INSERT INTO material_types (category, name, unit, price_low, price_medium, price_high, lifespan_years, display_order) VALUES
  ('erfafscheiding', 'Schutting vuren geïmpregneerd (180cm)', 'm¹', 50, 75, 100, 15, 1),
  ('erfafscheiding', 'Schutting douglas (180cm)', 'm¹', 70, 95, 120, 18, 2),
  ('erfafscheiding', 'Schutting lariks (180cm)', 'm¹', 80, 105, 130, 20, 3),
  ('erfafscheiding', 'Schutting hardhout (180cm)', 'm¹', 100, 140, 180, 25, 4),
  ('erfafscheiding', 'Schutting composiet (180cm)', 'm¹', 120, 160, 200, 30, 5),
  ('erfafscheiding', 'Betonpalen', 'stuk', 25, 35, 50, NULL, 6),
  ('erfafscheiding', 'Betonplaten (onderplaten)', 'stuk', 15, 20, 30, NULL, 7),
  ('erfafscheiding', 'Tuinpoort enkel', 'stuk', 150, 250, 400, NULL, 8),
  ('erfafscheiding', 'Tuinpoort dubbel', 'stuk', 300, 450, 700, NULL, 9),
  ('erfafscheiding', 'Snelbeton', 'zak', 8, 10, 12, NULL, 10);

-- Vlonder materialen
INSERT INTO material_types (category, name, unit, price_low, price_medium, price_high, lifespan_years, display_order) VALUES
  ('vlonders', 'Vlonderplanken grenen geïmpregneerd', 'm²', 35, 50, 70, 12, 1),
  ('vlonders', 'Vlonderplanken douglas', 'm²', 45, 65, 85, 15, 2),
  ('vlonders', 'Vlonderplanken bangkirai', 'm²', 80, 110, 140, 22, 3),
  ('vlonders', 'Vlonderplanken ipé', 'm²', 100, 140, 180, 25, 4),
  ('vlonders', 'Vlonderplanken composiet', 'm²', 80, 120, 180, 25, 5),
  ('vlonders', 'Onderliggers (per m¹)', 'm¹', 8, 12, 18, NULL, 6),
  ('vlonders', 'RVS schroeven (per 100)', 'doos', 15, 25, 40, NULL, 7),
  ('vlonders', 'Clips systeem', 'm²', 8, 12, 18, NULL, 8);

-- Gazon materialen
INSERT INTO material_types (category, name, unit, price_low, price_medium, price_high, display_order) VALUES
  ('gazon', 'Graszoden', 'm²', 3.50, 4.50, 6.00, 1),
  ('gazon', 'Kunstgras standaard (25mm)', 'm²', 15, 22, 30, 2),
  ('gazon', 'Kunstgras premium (35mm)', 'm²', 25, 35, 50, 3),
  ('gazon', 'Kunstgras luxe (45mm)', 'm²', 40, 55, 75, 4),
  ('gazon', 'Graszaad nieuw gazon', 'kg', 8, 12, 18, 5),
  ('gazon', 'Graszaad doorzaaien', 'kg', 6, 10, 15, 6),
  ('gazon', 'Instrooizand kunstgras', 'zak', 15, 20, 25, 7),
  ('gazon', 'Kunstgras tape', 'rol', 25, 35, 50, 8);

-- Beplanting materialen (prijzen indicatief)
INSERT INTO material_types (category, name, unit, price_low, price_medium, price_high, display_order) VALUES
  ('beplanting', 'Haagplanten beuk (60-80cm)', 'stuk', 3, 5, 8, 1),
  ('beplanting', 'Haagplanten taxus (40-60cm)', 'stuk', 8, 12, 18, 2),
  ('beplanting', 'Haagplanten laurier (60-80cm)', 'stuk', 5, 8, 12, 3),
  ('beplanting', 'Vaste planten', 'stuk', 4, 7, 12, 4),
  ('beplanting', 'Sierheesters', 'stuk', 15, 30, 60, 5),
  ('beplanting', 'Sierboom (klein)', 'stuk', 50, 100, 200, 6),
  ('beplanting', 'Sierboom (groot)', 'stuk', 150, 300, 600, 7),
  ('beplanting', 'Mulch (per m³)', 'm³', 40, 60, 90, 8),
  ('beplanting', 'Boompaal', 'stuk', 8, 12, 18, 9),
  ('beplanting', 'Boombandjes', 'stuk', 3, 5, 8, 10);
