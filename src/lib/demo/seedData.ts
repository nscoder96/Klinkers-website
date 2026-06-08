// Demo seed data voor video opnames
// Realistische nep-klanten uit Gouda en omstreken

// Helper om datums te genereren
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const demoLeads = [
  // === NIEUWE LEADS (3) ===
  {
    id: 'demo-lead-001',
    name: 'Familie de Vries',
    email: 'devries@example.com',
    phone: '06 12345678',
    address: 'Markt 15',
    postcode: '2801 JK',
    city: 'Gouda',
    source: 'chat',
    source_detail: 'Website chatbot',
    project_type: ['bestrating', 'tuinaanleg'],
    description: 'Achtertuin van 60m² opnieuw inrichten. Willen een nieuw terras met klinkers en mooie borders met beplanting. Huidige tuin is verouderd en de bestrating ligt scheef.',
    estimated_m2: 60,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 85,
    ai_notes: 'Hoge conversiekans: concreet project, realistisch budget, korte termijn urgentie',
    status: 'new',
    conversation_history: [
      { role: 'user', content: 'Hallo, ik ben op zoek naar een hovenier voor onze achtertuin', timestamp: hoursAgo(2) },
      { role: 'assistant', content: 'Goedemiddag! Wat leuk dat u contact opneemt. Ik help u graag verder. Kunt u iets meer vertellen over wat u in gedachten heeft voor uw tuin?', timestamp: hoursAgo(2) },
      { role: 'user', content: 'Onze tuin is ongeveer 60m2 en we willen graag een nieuw terras met klinkers en mooie borders', timestamp: hoursAgo(1.5) },
      { role: 'assistant', content: 'Dat klinkt als een mooi project! Mag ik vragen in welke plaats u woont?', timestamp: hoursAgo(1.5) },
      { role: 'user', content: 'We wonen in Gouda, centrum. En we willen het liefst deze maand nog beginnen', timestamp: hoursAgo(1) },
      { role: 'assistant', content: 'Gouda centrum, dat is bij ons in de buurt! Niek neemt binnen 24 uur contact met u op.', timestamp: hoursAgo(1) },
    ],
    created_at: hoursAgo(0.5)
  },
  {
    id: 'demo-lead-002',
    name: 'Marcel Koster',
    email: 'm.koster@example.com',
    phone: '06 23456789',
    address: 'Karnemelksloot 88',
    postcode: '2806 BG',
    city: 'Gouda',
    source: 'website',
    project_type: ['bestrating'],
    description: 'Achterpad laten bestraten, nu grind maar dat loopt steeds weg. Ongeveer 15m lang en 1m breed.',
    estimated_m2: 15,
    budget_range: 'under_2500',
    urgency: 'this_quarter',
    ai_score: 68,
    status: 'new',
    created_at: hoursAgo(3)
  },
  {
    id: 'demo-lead-003',
    name: 'Linda Vermeulen',
    email: 'l.vermeulen@example.com',
    phone: '06 34567890',
    address: 'Prins Hendrikstraat 12',
    postcode: '2802 LR',
    city: 'Gouda',
    source: 'chat',
    project_type: ['tuinaanleg', 'beplanting'],
    description: 'Kleine stadstuin van 25m² volledig opnieuw inrichten. Willen onderhoudsarm met mooie uitstraling.',
    estimated_m2: 25,
    budget_range: '2500_5000',
    urgency: 'this_month',
    ai_score: 76,
    status: 'new',
    created_at: hoursAgo(8)
  },

  // === GECONTACTEERD (5) ===
  {
    id: 'demo-lead-004',
    name: 'Henk Jansen',
    email: 'h.jansen@example.com',
    phone: '06 98765432',
    address: 'Burgemeester Martenssingel 42',
    postcode: '2801 BR',
    city: 'Gouda',
    source: 'website',
    project_type: ['bestrating'],
    description: 'Oprit van 35m² laten bestraten met gebakken klinkers. Huidige oprit is van grind.',
    estimated_m2: 35,
    budget_range: '2500_5000',
    urgency: 'this_quarter',
    ai_score: 72,
    status: 'contacted',
    created_at: daysAgo(3)
  },
  {
    id: 'demo-lead-005',
    name: 'Familie Groen',
    email: 'groen.fam@example.com',
    phone: '06 45678901',
    address: 'Westerkade 55',
    postcode: '2805 PL',
    city: 'Gouda',
    source: 'referral',
    source_detail: 'Via buurman (klant vorig jaar)',
    project_type: ['tuinaanleg', 'bestrating'],
    description: 'Tuin compleet opnieuw, ongeveer 70m². Terras, gazon en borders.',
    estimated_m2: 70,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 82,
    status: 'contacted',
    created_at: daysAgo(4)
  },
  {
    id: 'demo-lead-006',
    name: 'Pieter van Dam',
    email: 'p.vandam@example.com',
    phone: '06 56789012',
    address: 'Blekerssingel 30',
    postcode: '2806 AC',
    city: 'Gouda',
    source: 'phone',
    project_type: ['grondwerk', 'bestrating'],
    description: 'Tuin is verzakt na bouwwerkzaamheden, moet opgehoogd worden. Daarna nieuwe bestrating.',
    estimated_m2: 40,
    budget_range: '5000_10000',
    urgency: 'asap',
    ai_score: 88,
    status: 'contacted',
    created_at: daysAgo(2)
  },
  {
    id: 'demo-lead-007',
    name: 'Annemarie Smit',
    email: 'a.smit@example.com',
    phone: '06 67890123',
    address: 'Krugerlaan 18',
    postcode: '2803 LT',
    city: 'Gouda',
    source: 'website',
    project_type: ['beplanting'],
    description: 'Borders vernieuwen, huidige beplanting is dood na droge zomer.',
    estimated_m2: 20,
    budget_range: 'under_2500',
    urgency: 'exploring',
    ai_score: 55,
    status: 'contacted',
    created_at: daysAgo(5)
  },
  {
    id: 'demo-lead-008',
    name: 'Robert Visser',
    email: 'r.visser@example.com',
    phone: '06 78901234',
    address: 'Van Baerlestraat 7',
    postcode: '2802 VP',
    city: 'Gouda',
    source: 'werkspot',
    project_type: ['bestrating', 'grondwerk'],
    description: 'Achtertuin van 50m², alles eruit en opnieuw beginnen.',
    estimated_m2: 50,
    budget_range: '5000_10000',
    urgency: 'this_quarter',
    ai_score: 74,
    status: 'contacted',
    created_at: daysAgo(6)
  },

  // === AFSPRAAK GEPLAND (4) ===
  {
    id: 'demo-lead-009',
    name: 'Peter de Groot',
    email: 'pdegroot@example.com',
    phone: '06 55667788',
    address: 'Fluwelensingel 100',
    postcode: '2806 CH',
    city: 'Gouda',
    source: 'phone',
    project_type: ['grondwerk', 'bestrating'],
    description: 'Tuin ophogen (verzakt) en daarna nieuwe bestrating. Ongeveer 45m².',
    estimated_m2: 45,
    budget_range: '5000_10000',
    urgency: 'asap',
    ai_score: 88,
    status: 'site_visit_scheduled',
    created_at: daysAgo(5)
  },
  {
    id: 'demo-lead-010',
    name: 'Ellen Meijer',
    email: 'e.meijer@example.com',
    phone: '06 89012345',
    address: 'Breevaarthoek 22',
    postcode: '2804 RG',
    city: 'Gouda',
    source: 'website',
    project_type: ['tuinaanleg', 'beplanting', 'bestrating'],
    description: 'Volledige tuinrenovatie van 90m². Hebben al ideeën over ontwerp.',
    estimated_m2: 90,
    budget_range: '10000_plus',
    urgency: 'this_month',
    ai_score: 94,
    status: 'site_visit_scheduled',
    created_at: daysAgo(7)
  },
  {
    id: 'demo-lead-011',
    name: 'Mark Brouwer',
    email: 'm.brouwer@example.com',
    phone: '06 90123456',
    address: 'Goudseweg 145',
    postcode: '2411 HK',
    city: 'Bodegraven',
    source: 'referral',
    project_type: ['bestrating'],
    description: 'Terras vergroten van 15m² naar 30m². Aansluiten op bestaande bestrating.',
    estimated_m2: 15,
    budget_range: '2500_5000',
    urgency: 'this_quarter',
    ai_score: 70,
    status: 'site_visit_scheduled',
    created_at: daysAgo(4)
  },
  {
    id: 'demo-lead-012',
    name: 'Sandra Dekker',
    email: 's.dekker@example.com',
    phone: '06 01234567',
    address: 'Dorpsstraat 78',
    postcode: '2771 AP',
    city: 'Boskoop',
    source: 'chat',
    project_type: ['tuinaanleg'],
    description: 'Nieuwe tuin bij nieuwbouwwoning. 65m² kale grond.',
    estimated_m2: 65,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 86,
    status: 'site_visit_scheduled',
    created_at: daysAgo(3)
  },

  // === OFFERTE VERSTUURD (6) ===
  {
    id: 'demo-lead-013',
    name: 'Maria van der Berg',
    email: 'maria.vdberg@example.com',
    phone: '06 11223344',
    address: 'Joubertstraat 8',
    postcode: '2802 LM',
    city: 'Gouda',
    source: 'referral',
    source_detail: 'Via buurman (klant vorig jaar)',
    project_type: ['tuinaanleg', 'beplanting'],
    description: 'Complete tuinrenovatie. Tuin is 80m², willen graag gazon, borders en een klein terras.',
    estimated_m2: 80,
    budget_range: '10000_plus',
    urgency: 'this_month',
    ai_score: 92,
    status: 'quote_sent',
    created_at: daysAgo(10)
  },
  {
    id: 'demo-lead-014',
    name: 'Jan de Boer',
    email: 'j.deboer@example.com',
    phone: '06 22334455',
    address: 'Nieuwe Gouwe O.Z. 3',
    postcode: '2801 SB',
    city: 'Gouda',
    source: 'website',
    project_type: ['bestrating', 'grondwerk'],
    description: 'Voortuin opnieuw bestraten, huidige tegels zijn kapot en scheef.',
    estimated_m2: 25,
    budget_range: '2500_5000',
    urgency: 'this_quarter',
    ai_score: 68,
    status: 'quote_sent',
    created_at: daysAgo(8)
  },
  {
    id: 'demo-lead-015',
    name: 'Karin Janssen',
    email: 'k.janssen@example.com',
    phone: '06 33445566',
    address: 'Wilhelminastraat 90',
    postcode: '2805 HE',
    city: 'Gouda',
    source: 'phone',
    project_type: ['tuinaanleg', 'bestrating'],
    description: 'Achtertuin van 55m², willen groot terras met daaromheen beplanting.',
    estimated_m2: 55,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 80,
    status: 'quote_sent',
    created_at: daysAgo(9)
  },
  {
    id: 'demo-lead-016',
    name: 'Thomas Mulder',
    email: 't.mulder@example.com',
    phone: '06 44556677',
    address: 'Haastrechtsebrug 12',
    postcode: '2851 AB',
    city: 'Haastrecht',
    source: 'referral',
    project_type: ['bestrating'],
    description: 'Terras van 40m² met keramische tegels, premium kwaliteit.',
    estimated_m2: 40,
    budget_range: '5000_10000',
    urgency: 'this_quarter',
    ai_score: 78,
    status: 'quote_sent',
    created_at: daysAgo(6)
  },
  {
    id: 'demo-lead-017',
    name: 'Nicole Peters',
    email: 'n.peters@example.com',
    phone: '06 55667788',
    address: 'Molenweg 5',
    postcode: '2411 JB',
    city: 'Bodegraven',
    source: 'website',
    project_type: ['tuinaanleg', 'beplanting', 'bestrating'],
    description: 'Complete achtertuin 100m², kindvriendelijk met speelruimte.',
    estimated_m2: 100,
    budget_range: '10000_plus',
    urgency: 'this_month',
    ai_score: 90,
    status: 'quote_sent',
    created_at: daysAgo(5)
  },
  {
    id: 'demo-lead-018',
    name: 'Familie Willems',
    email: 'willems@example.com',
    phone: '06 66778899',
    address: 'Zoutmansweg 34',
    postcode: '2771 EP',
    city: 'Boskoop',
    source: 'werkspot',
    project_type: ['grondwerk', 'bestrating'],
    description: 'Oprit en pad naar achtertuin bestraten, totaal 45m².',
    estimated_m2: 45,
    budget_range: '5000_10000',
    urgency: 'this_quarter',
    ai_score: 72,
    status: 'quote_sent',
    created_at: daysAgo(7)
  },

  // === IN ONDERHANDELING (3) ===
  {
    id: 'demo-lead-019',
    name: 'Erik van Leeuwen',
    email: 'e.vanleeuwen@example.com',
    phone: '06 77889900',
    address: 'Lazaruskade 20',
    postcode: '2801 RT',
    city: 'Gouda',
    source: 'referral',
    project_type: ['tuinaanleg', 'bestrating'],
    description: 'Dakterras van 35m² inrichten met tegels en plantenbakken.',
    estimated_m2: 35,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 84,
    status: 'negotiating',
    created_at: daysAgo(14)
  },
  {
    id: 'demo-lead-020',
    name: 'Lisa Kuiper',
    email: 'l.kuiper@example.com',
    phone: '06 88990011',
    address: 'Turfsingel 8',
    postcode: '2801 BD',
    city: 'Gouda',
    source: 'website',
    project_type: ['bestrating', 'beplanting'],
    description: 'Achtertuin 60m², vraagt om korting vanwege meerdere projecten in straat.',
    estimated_m2: 60,
    budget_range: '5000_10000',
    urgency: 'this_quarter',
    ai_score: 76,
    status: 'negotiating',
    created_at: daysAgo(12)
  },
  {
    id: 'demo-lead-021',
    name: 'Wouter Hendriks',
    email: 'w.hendriks@example.com',
    phone: '06 99001122',
    address: 'Spoorstraat 67',
    postcode: '2801 BA',
    city: 'Gouda',
    source: 'phone',
    project_type: ['tuinaanleg'],
    description: 'Wil graag extra opties bespreken voor offerte.',
    estimated_m2: 75,
    budget_range: '10000_plus',
    urgency: 'this_month',
    ai_score: 88,
    status: 'negotiating',
    created_at: daysAgo(11)
  },

  // === GEWONNEN (8) ===
  {
    id: 'demo-lead-022',
    name: 'Familie Bakker',
    email: 'bakker.fam@example.com',
    phone: '06 44332211',
    address: 'Bloemendaalseweg 22',
    postcode: '2803 PK',
    city: 'Gouda',
    source: 'website',
    project_type: ['tuinaanleg', 'bestrating', 'beplanting'],
    description: 'Volledige achtertuin aanleggen bij nieuwbouwwoning. 100m² kale grond.',
    estimated_m2: 100,
    budget_range: '10000_plus',
    urgency: 'this_month',
    ai_score: 95,
    status: 'won',
    created_at: daysAgo(21)
  },
  {
    id: 'demo-lead-023',
    name: 'Gerard Mol',
    email: 'g.mol@example.com',
    phone: '06 11223344',
    address: 'Plataanweg 5',
    postcode: '2803 JK',
    city: 'Gouda',
    source: 'referral',
    project_type: ['bestrating'],
    description: 'Terras van 25m² vernieuwd met gebakken klinkers.',
    estimated_m2: 25,
    budget_range: '2500_5000',
    urgency: 'this_quarter',
    ai_score: 82,
    status: 'won',
    created_at: daysAgo(35)
  },
  {
    id: 'demo-lead-024',
    name: 'Marianne Vos',
    email: 'm.vos@example.com',
    phone: '06 22334455',
    address: 'Groenendaal 15',
    postcode: '2802 NM',
    city: 'Gouda',
    source: 'website',
    project_type: ['tuinaanleg', 'beplanting'],
    description: 'Stadstuin van 30m² volledig gerenoveerd.',
    estimated_m2: 30,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 78,
    status: 'won',
    created_at: daysAgo(28)
  },
  {
    id: 'demo-lead-025',
    name: 'Hans van Dijk',
    email: 'h.vandijk@example.com',
    phone: '06 33445566',
    address: 'Westhaven 88',
    postcode: '2801 PK',
    city: 'Gouda',
    source: 'phone',
    project_type: ['grondwerk', 'bestrating'],
    description: 'Tuin opgehoogd en nieuwe bestrating aangelegd.',
    estimated_m2: 55,
    budget_range: '5000_10000',
    urgency: 'asap',
    ai_score: 86,
    status: 'won',
    created_at: daysAgo(42)
  },
  {
    id: 'demo-lead-026',
    name: 'Ria Hermans',
    email: 'r.hermans@example.com',
    phone: '06 44556677',
    address: 'Oosthaven 12',
    postcode: '2801 PC',
    city: 'Gouda',
    source: 'referral',
    project_type: ['tuinaanleg', 'bestrating', 'beplanting'],
    description: 'Complete tuinrenovatie inclusief vijver.',
    estimated_m2: 85,
    budget_range: '10000_plus',
    urgency: 'this_quarter',
    ai_score: 92,
    status: 'won',
    created_at: daysAgo(56)
  },
  {
    id: 'demo-lead-027',
    name: 'Bert Koning',
    email: 'b.koning@example.com',
    phone: '06 55667788',
    address: 'Nieuwehaven 45',
    postcode: '2801 SH',
    city: 'Gouda',
    source: 'website',
    project_type: ['bestrating'],
    description: 'Oprit en terras bestraat.',
    estimated_m2: 50,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 80,
    status: 'won',
    created_at: daysAgo(49)
  },
  {
    id: 'demo-lead-028',
    name: 'Els Verhoeven',
    email: 'e.verhoeven@example.com',
    phone: '06 66778899',
    address: 'Korte Akkeren 33',
    postcode: '2802 BS',
    city: 'Gouda',
    source: 'chat',
    project_type: ['tuinaanleg'],
    description: 'Achtertuin 45m² opnieuw ingericht.',
    estimated_m2: 45,
    budget_range: '5000_10000',
    urgency: 'this_month',
    ai_score: 84,
    status: 'won',
    created_at: daysAgo(63)
  },
  {
    id: 'demo-lead-029',
    name: 'Familie Van der Linden',
    email: 'vanderlinden@example.com',
    phone: '06 77889900',
    address: 'Lange Tiendeweg 80',
    postcode: '2801 KL',
    city: 'Gouda',
    source: 'referral',
    project_type: ['tuinaanleg', 'bestrating', 'beplanting'],
    description: 'Grote tuinrenovatie inclusief overkapping.',
    estimated_m2: 120,
    budget_range: '10000_plus',
    urgency: 'this_quarter',
    ai_score: 96,
    status: 'won',
    created_at: daysAgo(70)
  },

  // === VERLOREN (4) ===
  {
    id: 'demo-lead-030',
    name: 'Sandra Willems',
    email: 'swillems@example.com',
    phone: '06 99887766',
    address: 'Graaf Florisweg 55',
    postcode: '2805 AM',
    city: 'Gouda',
    source: 'werkspot',
    project_type: ['onderhoud'],
    description: 'Jaarlijks tuinonderhoud, snoeien hagen en borders bijhouden.',
    estimated_m2: 50,
    budget_range: 'under_2500',
    urgency: 'exploring',
    ai_score: 45,
    status: 'lost',
    lost_reason: 'Te duur',
    created_at: daysAgo(25)
  },
  {
    id: 'demo-lead-031',
    name: 'Frank Pietersen',
    email: 'f.pietersen@example.com',
    phone: '06 88990011',
    address: 'Stolwijkse Vaart 12',
    postcode: '2821 GB',
    city: 'Stolwijk',
    source: 'website',
    project_type: ['bestrating'],
    description: 'Klein terras vervangen.',
    estimated_m2: 12,
    budget_range: 'under_2500',
    urgency: 'exploring',
    ai_score: 40,
    status: 'lost',
    lost_reason: 'Kiest voor concurrent',
    created_at: daysAgo(30)
  },
  {
    id: 'demo-lead-032',
    name: 'Diana Prins',
    email: 'd.prins@example.com',
    phone: '06 99001122',
    address: 'Reigerstraat 8',
    postcode: '2803 EB',
    city: 'Gouda',
    source: 'phone',
    project_type: ['tuinaanleg'],
    description: 'Wilde offerte maar heeft project uitgesteld.',
    estimated_m2: 40,
    budget_range: '5000_10000',
    urgency: 'exploring',
    ai_score: 55,
    status: 'lost',
    lost_reason: 'Project uitgesteld',
    created_at: daysAgo(45)
  },
  {
    id: 'demo-lead-033',
    name: 'Cor van den Berg',
    email: 'c.vdberg@example.com',
    phone: '06 00112233',
    address: 'Plasweg 100',
    postcode: '2804 WM',
    city: 'Gouda',
    source: 'website',
    project_type: ['grondwerk'],
    description: 'Alleen grondwerk, geen bestrating.',
    estimated_m2: 60,
    budget_range: 'under_2500',
    urgency: 'this_quarter',
    ai_score: 35,
    status: 'lost',
    lost_reason: 'Te klein project',
    created_at: daysAgo(38)
  },

  // === SLAPEND (2) ===
  {
    id: 'demo-lead-034',
    name: 'Paul Jongman',
    email: 'p.jongman@example.com',
    phone: '06 11223344',
    address: 'Burg. van Reenensingel 50',
    postcode: '2803 PA',
    city: 'Gouda',
    source: 'website',
    project_type: ['tuinaanleg'],
    description: 'Wil pas volgend jaar beginnen.',
    estimated_m2: 70,
    budget_range: '5000_10000',
    urgency: 'exploring',
    ai_score: 60,
    status: 'dormant',
    created_at: daysAgo(60)
  },
  {
    id: 'demo-lead-035',
    name: 'Ingrid Schouten',
    email: 'i.schouten@example.com',
    phone: '06 22334455',
    address: 'Herenstraat 33',
    postcode: '2801 JE',
    city: 'Gouda',
    source: 'chat',
    project_type: ['bestrating', 'beplanting'],
    description: 'Wacht op vergunning gemeente.',
    estimated_m2: 50,
    budget_range: '5000_10000',
    urgency: 'exploring',
    ai_score: 65,
    status: 'dormant',
    created_at: daysAgo(55)
  }
];

export const demoQuotes = [
  // === CONCEPT OFFERTES (3) ===
  {
    id: 'demo-quote-001',
    quote_number: 'OFF-2024-048',
    lead_id: 'demo-lead-004', // Henk Jansen
    project_description: 'Oprit bestraten met gebakken klinkers',
    project_address: 'Burgemeester Martenssingel 42, 2801 BR Gouda',
    valid_until: daysFromNow(21).split('T')[0],
    line_items: [
      { description: 'Verwijderen grind en ondergrond', quantity: 35, unit: 'm²', unit_price: 12.00, total: 420 },
      { description: 'Zandbed aanbrengen en verdichten', quantity: 2, unit: 'm³', unit_price: 45.00, total: 90 },
      { description: 'Gebakken klinkers (keiformaat)', quantity: 35, unit: 'm²', unit_price: 75.00, total: 2625 },
      { description: 'Opsluitbanden rondom', quantity: 24, unit: 'm¹', unit_price: 22.00, total: 528 }
    ],
    subtotal: 3663,
    btw_percentage: 21,
    btw_amount: 769.23,
    total: 4432.23,
    status: 'draft',
    internal_notes: 'Wacht op bevestiging kleur klinkers van klant',
    created_at: daysAgo(1)
  },
  {
    id: 'demo-quote-002',
    quote_number: 'OFF-2024-047',
    lead_id: 'demo-lead-005', // Familie Groen
    project_description: 'Complete tuinrenovatie met terras, gazon en borders',
    project_address: 'Westerkade 55, 2805 PL Gouda',
    valid_until: daysFromNow(14).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaande tuin', quantity: 70, unit: 'm²', unit_price: 8.00, total: 560 },
      { description: 'Grondwerk en egaliseren', quantity: 70, unit: 'm²', unit_price: 10.00, total: 700 },
      { description: 'Terras gebakken klinkers', quantity: 25, unit: 'm²', unit_price: 85.00, total: 2125 },
      { description: 'Gazon aanleggen', quantity: 30, unit: 'm²', unit_price: 18.00, total: 540 },
      { description: 'Borders met beplanting', quantity: 15, unit: 'm²', unit_price: 95.00, total: 1425 }
    ],
    subtotal: 5350,
    btw_percentage: 21,
    btw_amount: 1123.50,
    total: 6473.50,
    status: 'draft',
    internal_notes: 'Klant wil eerst planning zien',
    created_at: daysAgo(2)
  },
  {
    id: 'demo-quote-003',
    quote_number: 'OFF-2024-046',
    lead_id: 'demo-lead-006', // Pieter van Dam
    project_description: 'Tuin ophogen en nieuwe bestrating',
    project_address: 'Blekerssingel 30, 2806 AC Gouda',
    valid_until: daysFromNow(14).split('T')[0],
    line_items: [
      { description: 'Ophogen tuin met zand', quantity: 12, unit: 'm³', unit_price: 45.00, total: 540 },
      { description: 'Verdichten en egaliseren', quantity: 40, unit: 'm²', unit_price: 12.00, total: 480 },
      { description: 'Bestrating betontegels 60x60', quantity: 40, unit: 'm²', unit_price: 55.00, total: 2200 },
      { description: 'Opsluitbanden', quantity: 30, unit: 'm¹', unit_price: 22.00, total: 660 }
    ],
    subtotal: 3880,
    btw_percentage: 21,
    btw_amount: 814.80,
    total: 4694.80,
    status: 'draft',
    internal_notes: 'Urgente klant, snel versturen',
    created_at: daysAgo(1)
  },

  // === VERSTUURDE OFFERTES (6) ===
  {
    id: 'demo-quote-004',
    quote_number: 'OFF-2024-045',
    lead_id: 'demo-lead-013', // Maria van der Berg
    project_description: 'Complete tuinrenovatie met gazon, borders en terras',
    project_address: 'Joubertstraat 8, 2802 LM Gouda',
    valid_until: daysFromNow(14).split('T')[0],
    line_items: [
      { description: 'Verwijderen oude beplanting en bestrating', quantity: 80, unit: 'm²', unit_price: 8.50, total: 680 },
      { description: 'Egaliseren en grondwerk', quantity: 80, unit: 'm²', unit_price: 12.00, total: 960 },
      { description: 'Aanleggen gazon (incl. bemesting)', quantity: 50, unit: 'm²', unit_price: 18.00, total: 900 },
      { description: 'Terras van gebakken klinkers', quantity: 20, unit: 'm²', unit_price: 85.00, total: 1700 },
      { description: 'Borders aanleggen met beplanting', quantity: 10, unit: 'm²', unit_price: 95.00, total: 950 },
      { description: 'Opsluitbanden plaatsen', quantity: 25, unit: 'm¹', unit_price: 22.00, total: 550 },
      { description: 'Afvoer grond en puin', quantity: 8, unit: 'm³', unit_price: 65.00, total: 520 }
    ],
    subtotal: 6260,
    btw_percentage: 21,
    btw_amount: 1314.60,
    total: 7574.60,
    status: 'sent',
    sent_at: daysAgo(2),
    internal_notes: 'Klant wil graag voor het voorjaar klaar zijn.',
    created_at: daysAgo(5)
  },
  {
    id: 'demo-quote-005',
    quote_number: 'OFF-2024-044',
    lead_id: 'demo-lead-014', // Jan de Boer
    project_description: 'Voortuin bestraten',
    project_address: 'Nieuwe Gouwe O.Z. 3, 2801 SB Gouda',
    valid_until: daysFromNow(10).split('T')[0],
    line_items: [
      { description: 'Verwijderen oude tegels', quantity: 25, unit: 'm²', unit_price: 12.00, total: 300 },
      { description: 'Nieuwe zandbed', quantity: 1.5, unit: 'm³', unit_price: 45.00, total: 67.50 },
      { description: 'Betontegels 30x30', quantity: 25, unit: 'm²', unit_price: 45.00, total: 1125 },
      { description: 'Opsluitbanden', quantity: 18, unit: 'm¹', unit_price: 22.00, total: 396 }
    ],
    subtotal: 1888.50,
    btw_percentage: 21,
    btw_amount: 396.59,
    total: 2285.09,
    status: 'sent',
    sent_at: daysAgo(3),
    created_at: daysAgo(6)
  },
  {
    id: 'demo-quote-006',
    quote_number: 'OFF-2024-043',
    lead_id: 'demo-lead-015', // Karin Janssen
    project_description: 'Achtertuin met groot terras en beplanting',
    project_address: 'Wilhelminastraat 90, 2805 HE Gouda',
    valid_until: daysFromNow(12).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaande tuin', quantity: 55, unit: 'm²', unit_price: 8.00, total: 440 },
      { description: 'Grondwerk', quantity: 55, unit: 'm²', unit_price: 10.00, total: 550 },
      { description: 'Terras gebakken klinkers waaltjes', quantity: 35, unit: 'm²', unit_price: 95.00, total: 3325 },
      { description: 'Borders met beplanting', quantity: 20, unit: 'm²', unit_price: 95.00, total: 1900 },
      { description: 'Opsluitbanden', quantity: 28, unit: 'm¹', unit_price: 22.00, total: 616 }
    ],
    subtotal: 6831,
    btw_percentage: 21,
    btw_amount: 1434.51,
    total: 8265.51,
    status: 'sent',
    sent_at: daysAgo(4),
    viewed_at: daysAgo(3),
    created_at: daysAgo(7)
  },
  {
    id: 'demo-quote-007',
    quote_number: 'OFF-2024-042',
    lead_id: 'demo-lead-016', // Thomas Mulder
    project_description: 'Premium terras met keramische tegels',
    project_address: 'Haastrechtsebrug 12, 2851 AB Haastrecht',
    valid_until: daysFromNow(8).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaande bestrating', quantity: 40, unit: 'm²', unit_price: 12.00, total: 480 },
      { description: 'Fundering en egaliseren', quantity: 40, unit: 'm²', unit_price: 15.00, total: 600 },
      { description: 'Keramische tegels 60x60', quantity: 40, unit: 'm²', unit_price: 110.00, total: 4400 },
      { description: 'Opsluitbanden', quantity: 26, unit: 'm¹', unit_price: 22.00, total: 572 }
    ],
    subtotal: 6052,
    btw_percentage: 21,
    btw_amount: 1270.92,
    total: 7322.92,
    status: 'sent',
    sent_at: daysAgo(3),
    viewed_at: daysAgo(2),
    created_at: daysAgo(5)
  },
  {
    id: 'demo-quote-008',
    quote_number: 'OFF-2024-041',
    lead_id: 'demo-lead-017', // Nicole Peters
    project_description: 'Kindvriendelijke tuinaanleg',
    project_address: 'Molenweg 5, 2411 JB Bodegraven',
    valid_until: daysFromNow(10).split('T')[0],
    line_items: [
      { description: 'Egaliseren terrein', quantity: 100, unit: 'm²', unit_price: 10.00, total: 1000 },
      { description: 'Terras bestrating', quantity: 30, unit: 'm²', unit_price: 75.00, total: 2250 },
      { description: 'Gazon aanleggen', quantity: 50, unit: 'm²', unit_price: 18.00, total: 900 },
      { description: 'Speelzone met rubber tegels', quantity: 15, unit: 'm²', unit_price: 85.00, total: 1275 },
      { description: 'Borders', quantity: 5, unit: 'm²', unit_price: 95.00, total: 475 },
      { description: 'Opsluitbanden', quantity: 40, unit: 'm¹', unit_price: 22.00, total: 880 }
    ],
    subtotal: 6780,
    btw_percentage: 21,
    btw_amount: 1423.80,
    total: 8203.80,
    status: 'sent',
    sent_at: daysAgo(2),
    created_at: daysAgo(4)
  },
  {
    id: 'demo-quote-009',
    quote_number: 'OFF-2024-040',
    lead_id: 'demo-lead-018', // Familie Willems
    project_description: 'Oprit en pad naar achtertuin',
    project_address: 'Zoutmansweg 34, 2771 EP Boskoop',
    valid_until: daysFromNow(14).split('T')[0],
    line_items: [
      { description: 'Grondwerk en uitgraven', quantity: 45, unit: 'm²', unit_price: 10.00, total: 450 },
      { description: 'Zandbed', quantity: 3, unit: 'm³', unit_price: 45.00, total: 135 },
      { description: 'Gebakken klinkers oprit', quantity: 35, unit: 'm²', unit_price: 75.00, total: 2625 },
      { description: 'Gebakken klinkers pad', quantity: 10, unit: 'm²', unit_price: 75.00, total: 750 },
      { description: 'Opsluitbanden', quantity: 32, unit: 'm¹', unit_price: 22.00, total: 704 }
    ],
    subtotal: 4664,
    btw_percentage: 21,
    btw_amount: 979.44,
    total: 5643.44,
    status: 'sent',
    sent_at: daysAgo(4),
    created_at: daysAgo(6)
  },

  // === IN ONDERHANDELING (3) ===
  {
    id: 'demo-quote-010',
    quote_number: 'OFF-2024-039',
    lead_id: 'demo-lead-019', // Erik van Leeuwen
    project_description: 'Dakterras inrichting',
    project_address: 'Lazaruskade 20, 2801 RT Gouda',
    valid_until: daysFromNow(7).split('T')[0],
    line_items: [
      { description: 'Tegels 60x60 antislip', quantity: 35, unit: 'm²', unit_price: 65.00, total: 2275 },
      { description: 'Plantenbakken cortenstaal (4x)', quantity: 4, unit: 'stuk', unit_price: 350.00, total: 1400 },
      { description: 'Beplanting voor bakken', quantity: 4, unit: 'stuk', unit_price: 125.00, total: 500 },
      { description: 'Tuinverlichting spots (6x)', quantity: 6, unit: 'stuk', unit_price: 175.00, total: 1050 }
    ],
    subtotal: 5225,
    btw_percentage: 21,
    btw_amount: 1097.25,
    total: 6322.25,
    status: 'sent',
    sent_at: daysAgo(8),
    viewed_at: daysAgo(7),
    internal_notes: 'Klant vraagt korting, onderhandelen.',
    created_at: daysAgo(12)
  },
  {
    id: 'demo-quote-011',
    quote_number: 'OFF-2024-038',
    lead_id: 'demo-lead-020', // Lisa Kuiper
    project_description: 'Achtertuin renovatie',
    project_address: 'Turfsingel 8, 2801 BD Gouda',
    valid_until: daysFromNow(5).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaand', quantity: 60, unit: 'm²', unit_price: 8.00, total: 480 },
      { description: 'Bestrating keiformaat', quantity: 40, unit: 'm²', unit_price: 75.00, total: 3000 },
      { description: 'Borders met beplanting', quantity: 20, unit: 'm²', unit_price: 95.00, total: 1900 },
      { description: 'Opsluitbanden', quantity: 30, unit: 'm¹', unit_price: 22.00, total: 660 }
    ],
    subtotal: 6040,
    btw_percentage: 21,
    btw_amount: 1268.40,
    total: 7308.40,
    status: 'sent',
    sent_at: daysAgo(6),
    viewed_at: daysAgo(5),
    internal_notes: 'Wil 10% korting, buren zijn ook geïnteresseerd.',
    created_at: daysAgo(10)
  },
  {
    id: 'demo-quote-012',
    quote_number: 'OFF-2024-037',
    lead_id: 'demo-lead-021', // Wouter Hendriks
    project_description: 'Tuinaanleg met extra opties',
    project_address: 'Spoorstraat 67, 2801 BA Gouda',
    valid_until: daysFromNow(7).split('T')[0],
    line_items: [
      { description: 'Grondwerk en egaliseren', quantity: 75, unit: 'm²', unit_price: 10.00, total: 750 },
      { description: 'Terras natuursteen look', quantity: 30, unit: 'm²', unit_price: 85.00, total: 2550 },
      { description: 'Gazon premium', quantity: 30, unit: 'm²', unit_price: 22.00, total: 660 },
      { description: 'Borders seizoensbeplanting', quantity: 15, unit: 'm²', unit_price: 110.00, total: 1650 },
      { description: 'Tuinverlichting (8x)', quantity: 8, unit: 'stuk', unit_price: 175.00, total: 1400 },
      { description: 'Schutting plaatsen', quantity: 12, unit: 'm¹', unit_price: 85.00, total: 1020 }
    ],
    subtotal: 8030,
    btw_percentage: 21,
    btw_amount: 1686.30,
    total: 9716.30,
    status: 'sent',
    sent_at: daysAgo(5),
    viewed_at: daysAgo(4),
    internal_notes: 'Wil extra opties bespreken, mogelijk upsell.',
    created_at: daysAgo(9)
  },

  // === GEACCEPTEERDE OFFERTES (8) ===
  {
    id: 'demo-quote-013',
    quote_number: 'OFF-2024-036',
    lead_id: 'demo-lead-022', // Familie Bakker
    project_description: 'Volledige tuinaanleg nieuwbouwwoning',
    project_address: 'Bloemendaalseweg 22, 2803 PK Gouda',
    valid_until: daysAgo(7).split('T')[0],
    line_items: [
      { description: 'Egaliseren en grondwerk', quantity: 100, unit: 'm²', unit_price: 10.00, total: 1000 },
      { description: 'Drainage systeem aanleggen', quantity: 1, unit: 'stuk', unit_price: 850.00, total: 850 },
      { description: 'Terras gebakken klinkers (waaltjes)', quantity: 30, unit: 'm²', unit_price: 95.00, total: 2850 },
      { description: 'Tuinpad klinkers', quantity: 8, unit: 'm²', unit_price: 85.00, total: 680 },
      { description: 'Gazon aanleggen premium', quantity: 45, unit: 'm²', unit_price: 22.00, total: 990 },
      { description: 'Borders met seizoensbeplanting', quantity: 15, unit: 'm²', unit_price: 110.00, total: 1650 },
      { description: 'Opsluitbanden en kantopsluiting', quantity: 40, unit: 'm¹', unit_price: 22.00, total: 880 },
      { description: 'Tuinverlichting (4 spots)', quantity: 4, unit: 'stuk', unit_price: 175.00, total: 700 },
      { description: 'Afvoer overtollige grond', quantity: 12, unit: 'm³', unit_price: 65.00, total: 780 }
    ],
    subtotal: 10380,
    btw_percentage: 21,
    btw_amount: 2179.80,
    total: 12559.80,
    status: 'accepted',
    sent_at: daysAgo(18),
    viewed_at: daysAgo(17),
    responded_at: daysAgo(14),
    customer_signature: 'R. Bakker',
    internal_notes: 'Klant enthousiast, start gepland week 12.',
    created_at: daysAgo(20)
  },
  {
    id: 'demo-quote-014',
    quote_number: 'OFF-2024-032',
    lead_id: 'demo-lead-023', // Gerard Mol
    project_description: 'Terras vernieuwen',
    project_address: 'Plataanweg 5, 2803 JK Gouda',
    valid_until: daysAgo(14).split('T')[0],
    line_items: [
      { description: 'Verwijderen oud terras', quantity: 25, unit: 'm²', unit_price: 12.00, total: 300 },
      { description: 'Gebakken klinkers', quantity: 25, unit: 'm²', unit_price: 75.00, total: 1875 },
      { description: 'Opsluitbanden', quantity: 20, unit: 'm¹', unit_price: 22.00, total: 440 }
    ],
    subtotal: 2615,
    btw_percentage: 21,
    btw_amount: 549.15,
    total: 3164.15,
    status: 'accepted',
    sent_at: daysAgo(30),
    viewed_at: daysAgo(29),
    responded_at: daysAgo(28),
    customer_signature: 'G. Mol',
    created_at: daysAgo(33)
  },
  {
    id: 'demo-quote-015',
    quote_number: 'OFF-2024-030',
    lead_id: 'demo-lead-024', // Marianne Vos
    project_description: 'Stadstuin renovatie',
    project_address: 'Groenendaal 15, 2802 NM Gouda',
    valid_until: daysAgo(7).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaand', quantity: 30, unit: 'm²', unit_price: 8.00, total: 240 },
      { description: 'Bestrating', quantity: 15, unit: 'm²', unit_price: 75.00, total: 1125 },
      { description: 'Borders met beplanting', quantity: 15, unit: 'm²', unit_price: 95.00, total: 1425 },
      { description: 'Opsluitbanden', quantity: 22, unit: 'm¹', unit_price: 22.00, total: 484 }
    ],
    subtotal: 3274,
    btw_percentage: 21,
    btw_amount: 687.54,
    total: 3961.54,
    status: 'accepted',
    sent_at: daysAgo(22),
    viewed_at: daysAgo(21),
    responded_at: daysAgo(20),
    customer_signature: 'M. Vos',
    created_at: daysAgo(25)
  },
  {
    id: 'demo-quote-016',
    quote_number: 'OFF-2024-028',
    lead_id: 'demo-lead-025', // Hans van Dijk
    project_description: 'Tuin ophogen en bestraten',
    project_address: 'Westhaven 88, 2801 PK Gouda',
    valid_until: daysAgo(21).split('T')[0],
    line_items: [
      { description: 'Ophogen met zand', quantity: 15, unit: 'm³', unit_price: 45.00, total: 675 },
      { description: 'Verdichten', quantity: 55, unit: 'm²', unit_price: 8.00, total: 440 },
      { description: 'Bestrating', quantity: 55, unit: 'm²', unit_price: 75.00, total: 4125 },
      { description: 'Opsluitbanden', quantity: 32, unit: 'm¹', unit_price: 22.00, total: 704 }
    ],
    subtotal: 5944,
    btw_percentage: 21,
    btw_amount: 1248.24,
    total: 7192.24,
    status: 'accepted',
    sent_at: daysAgo(38),
    viewed_at: daysAgo(37),
    responded_at: daysAgo(35),
    customer_signature: 'H. van Dijk',
    created_at: daysAgo(40)
  },
  {
    id: 'demo-quote-017',
    quote_number: 'OFF-2024-025',
    lead_id: 'demo-lead-026', // Ria Hermans
    project_description: 'Complete tuinrenovatie met vijver',
    project_address: 'Oosthaven 12, 2801 PC Gouda',
    valid_until: daysAgo(28).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaande tuin', quantity: 85, unit: 'm²', unit_price: 8.50, total: 722.50 },
      { description: 'Grondwerk', quantity: 85, unit: 'm²', unit_price: 10.00, total: 850 },
      { description: 'Terras', quantity: 30, unit: 'm²', unit_price: 85.00, total: 2550 },
      { description: 'Gazon', quantity: 35, unit: 'm²', unit_price: 18.00, total: 630 },
      { description: 'Borders', quantity: 15, unit: 'm²', unit_price: 95.00, total: 1425 },
      { description: 'Vijver aanleggen', quantity: 1, unit: 'stuk', unit_price: 2500.00, total: 2500 },
      { description: 'Opsluitbanden', quantity: 40, unit: 'm¹', unit_price: 22.00, total: 880 }
    ],
    subtotal: 9557.50,
    btw_percentage: 21,
    btw_amount: 2007.08,
    total: 11564.58,
    status: 'accepted',
    sent_at: daysAgo(50),
    viewed_at: daysAgo(49),
    responded_at: daysAgo(48),
    customer_signature: 'R. Hermans',
    created_at: daysAgo(54)
  },
  {
    id: 'demo-quote-018',
    quote_number: 'OFF-2024-022',
    lead_id: 'demo-lead-027', // Bert Koning
    project_description: 'Oprit en terras bestraten',
    project_address: 'Nieuwehaven 45, 2801 SH Gouda',
    valid_until: daysAgo(21).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaand', quantity: 50, unit: 'm²', unit_price: 12.00, total: 600 },
      { description: 'Zandbed', quantity: 3, unit: 'm³', unit_price: 45.00, total: 135 },
      { description: 'Oprit klinkers', quantity: 30, unit: 'm²', unit_price: 75.00, total: 2250 },
      { description: 'Terras klinkers', quantity: 20, unit: 'm²', unit_price: 75.00, total: 1500 },
      { description: 'Opsluitbanden', quantity: 35, unit: 'm¹', unit_price: 22.00, total: 770 }
    ],
    subtotal: 5255,
    btw_percentage: 21,
    btw_amount: 1103.55,
    total: 6358.55,
    status: 'accepted',
    sent_at: daysAgo(44),
    viewed_at: daysAgo(43),
    responded_at: daysAgo(42),
    customer_signature: 'B. Koning',
    created_at: daysAgo(47)
  },
  {
    id: 'demo-quote-019',
    quote_number: 'OFF-2024-019',
    lead_id: 'demo-lead-028', // Els Verhoeven
    project_description: 'Achtertuin herinrichting',
    project_address: 'Korte Akkeren 33, 2802 BS Gouda',
    valid_until: daysAgo(35).split('T')[0],
    line_items: [
      { description: 'Verwijderen', quantity: 45, unit: 'm²', unit_price: 8.00, total: 360 },
      { description: 'Grondwerk', quantity: 45, unit: 'm²', unit_price: 10.00, total: 450 },
      { description: 'Terras', quantity: 20, unit: 'm²', unit_price: 85.00, total: 1700 },
      { description: 'Gazon', quantity: 15, unit: 'm²', unit_price: 18.00, total: 270 },
      { description: 'Borders', quantity: 10, unit: 'm²', unit_price: 95.00, total: 950 }
    ],
    subtotal: 3730,
    btw_percentage: 21,
    btw_amount: 783.30,
    total: 4513.30,
    status: 'accepted',
    sent_at: daysAgo(58),
    viewed_at: daysAgo(57),
    responded_at: daysAgo(56),
    customer_signature: 'E. Verhoeven',
    created_at: daysAgo(61)
  },
  {
    id: 'demo-quote-020',
    quote_number: 'OFF-2024-015',
    lead_id: 'demo-lead-029', // Familie Van der Linden
    project_description: 'Grote tuinrenovatie met overkapping',
    project_address: 'Lange Tiendeweg 80, 2801 KL Gouda',
    valid_until: daysAgo(42).split('T')[0],
    line_items: [
      { description: 'Verwijderen bestaande tuin', quantity: 120, unit: 'm²', unit_price: 8.50, total: 1020 },
      { description: 'Grondwerk', quantity: 120, unit: 'm²', unit_price: 10.00, total: 1200 },
      { description: 'Terras', quantity: 45, unit: 'm²', unit_price: 95.00, total: 4275 },
      { description: 'Gazon', quantity: 50, unit: 'm²', unit_price: 22.00, total: 1100 },
      { description: 'Borders', quantity: 20, unit: 'm²', unit_price: 110.00, total: 2200 },
      { description: 'Overkapping', quantity: 1, unit: 'stuk', unit_price: 4500.00, total: 4500 },
      { description: 'Verlichting', quantity: 10, unit: 'stuk', unit_price: 175.00, total: 1750 }
    ],
    subtotal: 16045,
    btw_percentage: 21,
    btw_amount: 3369.45,
    total: 19414.45,
    status: 'accepted',
    sent_at: daysAgo(65),
    viewed_at: daysAgo(64),
    responded_at: daysAgo(63),
    customer_signature: 'J. van der Linden',
    created_at: daysAgo(68)
  },

  // === AFGEWEZEN OFFERTES (3) ===
  {
    id: 'demo-quote-021',
    quote_number: 'OFF-2024-035',
    lead_id: 'demo-lead-030', // Sandra Willems
    project_description: 'Tuinonderhoud jaarpakket',
    project_address: 'Graaf Florisweg 55, 2805 AM Gouda',
    valid_until: daysAgo(10).split('T')[0],
    line_items: [
      { description: 'Jaarlijks onderhoud (12x)', quantity: 12, unit: 'beurt', unit_price: 175.00, total: 2100 }
    ],
    subtotal: 2100,
    btw_percentage: 21,
    btw_amount: 441,
    total: 2541,
    status: 'declined',
    sent_at: daysAgo(20),
    viewed_at: daysAgo(19),
    responded_at: daysAgo(18),
    decline_reason: 'Te duur',
    created_at: daysAgo(23)
  },
  {
    id: 'demo-quote-022',
    quote_number: 'OFF-2024-033',
    lead_id: 'demo-lead-031', // Frank Pietersen
    project_description: 'Klein terras vervangen',
    project_address: 'Stolwijkse Vaart 12, 2821 GB Stolwijk',
    valid_until: daysAgo(14).split('T')[0],
    line_items: [
      { description: 'Verwijderen oud', quantity: 12, unit: 'm²', unit_price: 12.00, total: 144 },
      { description: 'Nieuw terras', quantity: 12, unit: 'm²', unit_price: 75.00, total: 900 }
    ],
    subtotal: 1044,
    btw_percentage: 21,
    btw_amount: 219.24,
    total: 1263.24,
    status: 'declined',
    sent_at: daysAgo(25),
    viewed_at: daysAgo(24),
    responded_at: daysAgo(23),
    decline_reason: 'Kiest concurrent',
    created_at: daysAgo(28)
  },
  {
    id: 'demo-quote-023',
    quote_number: 'OFF-2024-029',
    lead_id: 'demo-lead-032', // Diana Prins
    project_description: 'Tuinaanleg',
    project_address: 'Reigerstraat 8, 2803 EB Gouda',
    valid_until: daysAgo(21).split('T')[0],
    line_items: [
      { description: 'Grondwerk', quantity: 40, unit: 'm²', unit_price: 10.00, total: 400 },
      { description: 'Bestrating', quantity: 25, unit: 'm²', unit_price: 75.00, total: 1875 },
      { description: 'Beplanting', quantity: 15, unit: 'm²', unit_price: 95.00, total: 1425 }
    ],
    subtotal: 3700,
    btw_percentage: 21,
    btw_amount: 777,
    total: 4477,
    status: 'declined',
    sent_at: daysAgo(40),
    viewed_at: daysAgo(38),
    responded_at: daysAgo(35),
    decline_reason: 'Project uitgesteld',
    created_at: daysAgo(43)
  }
];

export const demoMessages = [
  // Berichten voor Familie de Vries (nieuwe lead)
  {
    id: 'demo-msg-001',
    lead_id: 'demo-lead-001',
    channel: 'website_chat',
    direction: 'inbound',
    content: 'Hallo, ik ben op zoek naar een hovenier voor onze achtertuin',
    ai_generated: false,
    created_at: hoursAgo(2)
  },
  {
    id: 'demo-msg-002',
    lead_id: 'demo-lead-001',
    channel: 'website_chat',
    direction: 'outbound',
    content: 'Goedemiddag! Wat leuk dat u contact opneemt. Ik help u graag verder.',
    ai_generated: true,
    created_at: hoursAgo(2)
  },
  // Berichten voor Henk Jansen
  {
    id: 'demo-msg-003',
    lead_id: 'demo-lead-004',
    channel: 'email',
    direction: 'outbound',
    content: 'Beste meneer Jansen,\n\nBedankt voor uw aanvraag. Ik kom graag langs voor een vrijblijvende offerte.\n\nMet vriendelijke groet,\nNiek',
    ai_generated: false,
    subject: 'Re: Aanvraag oprit bestraten',
    created_at: daysAgo(2)
  }
];

export const demoPricing = [
  // ===== GRONDWERK =====
  // Arbeid
  { category: 'grondwerk', item_name: 'Ontgraven tot 30cm', item_type: 'arbeid', unit: 'm²', selling_price_min: 10, selling_price_default: 12, selling_price_max: 16, is_active: true },
  { category: 'grondwerk', item_name: 'Ontgraven tot 50cm', item_type: 'arbeid', unit: 'm²', selling_price_min: 15, selling_price_default: 18, selling_price_max: 24, is_active: true },
  { category: 'grondwerk', item_name: 'Egaliseren', item_type: 'arbeid', unit: 'm²', selling_price_min: 5, selling_price_default: 7, selling_price_max: 10, is_active: true },
  { category: 'grondwerk', item_name: 'Zandbed aanbrengen en verdichten', item_type: 'arbeid', unit: 'm³', selling_price_min: 20, selling_price_default: 25, selling_price_max: 35, is_active: true },
  { category: 'grondwerk', item_name: 'Afvoer grond', item_type: 'arbeid', unit: 'm³', selling_price_min: 38, selling_price_default: 45, selling_price_max: 58, is_active: true },
  { category: 'grondwerk', item_name: 'Aarde opvullen borders', item_type: 'arbeid', unit: 'm³', selling_price_min: 25, selling_price_default: 30, selling_price_max: 40, is_active: true },
  { category: 'grondwerk', item_name: 'Drainage aanleggen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 15, selling_price_default: 18, selling_price_max: 25, is_active: true },
  { category: 'grondwerk', item_name: 'Oude bestrating afbreken en afvoeren', item_type: 'arbeid', unit: 'm²', selling_price_min: 15, selling_price_default: 18, selling_price_max: 24, is_active: true },
  { category: 'grondwerk', item_name: 'Boomstronk verwijderen (klein)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 60, selling_price_default: 75, selling_price_max: 110, is_active: true },
  { category: 'grondwerk', item_name: 'Boomstronk verwijderen (groot)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 120, selling_price_default: 150, selling_price_max: 220, is_active: true },
  { category: 'grondwerk', item_name: 'Beplanting verwijderen', item_type: 'arbeid', unit: 'm²', selling_price_min: 8, selling_price_default: 12, selling_price_max: 18, is_active: true },
  // Materialen
  { category: 'grondwerk', item_name: 'Straatzand', item_type: 'materiaal', unit: 'm³', cost_price: 35, selling_price_min: 42, selling_price_default: 50, selling_price_max: 60, is_active: true },
  { category: 'grondwerk', item_name: 'Ophoogzand', item_type: 'materiaal', unit: 'm³', cost_price: 28, selling_price_min: 35, selling_price_default: 42, selling_price_max: 52, is_active: true },
  { category: 'grondwerk', item_name: 'Tuinaarde', item_type: 'materiaal', unit: 'm³', cost_price: 30, selling_price_min: 38, selling_price_default: 46, selling_price_max: 58, is_active: true },
  { category: 'grondwerk', item_name: 'Compost', item_type: 'materiaal', unit: 'm³', cost_price: 50, selling_price_min: 62, selling_price_default: 75, selling_price_max: 90, is_active: true },
  { category: 'grondwerk', item_name: 'Puinfundering', item_type: 'materiaal', unit: 'm³', cost_price: 35, selling_price_min: 42, selling_price_default: 52, selling_price_max: 62, is_active: true },
  { category: 'grondwerk', item_name: 'Drainagebuis 80mm', item_type: 'materiaal', unit: 'm¹', cost_price: 1.50, selling_price_min: 2.00, selling_price_default: 2.80, selling_price_max: 3.50, is_active: true },
  { category: 'grondwerk', item_name: 'Drainagebuis 100mm', item_type: 'materiaal', unit: 'm¹', cost_price: 2.00, selling_price_min: 2.80, selling_price_default: 3.50, selling_price_max: 4.50, is_active: true },
  { category: 'grondwerk', item_name: 'Infiltratiekrat', item_type: 'materiaal', unit: 'stuk', cost_price: 45, selling_price_min: 62, selling_price_default: 75, selling_price_max: 95, is_active: true },
  { category: 'grondwerk', item_name: 'Worteldoek', item_type: 'materiaal', unit: 'm²', cost_price: 1.00, selling_price_min: 1.80, selling_price_default: 2.50, selling_price_max: 3.20, is_active: true },
  { category: 'grondwerk', item_name: 'Anti-worteldoek (zwart)', item_type: 'materiaal', unit: 'm²', cost_price: 1.50, selling_price_min: 2.50, selling_price_default: 3.20, selling_price_max: 4.00, is_active: true },

  // ===== BESTRATING =====
  // Arbeid
  { category: 'bestrating', item_name: 'Bestrating leggen (tegels 30x30)', item_type: 'arbeid', unit: 'm²', selling_price_min: 15, selling_price_default: 18, selling_price_max: 24, is_active: true },
  { category: 'bestrating', item_name: 'Bestrating leggen (tegels 50x50)', item_type: 'arbeid', unit: 'm²', selling_price_min: 17, selling_price_default: 20, selling_price_max: 26, is_active: true },
  { category: 'bestrating', item_name: 'Bestrating leggen (tegels 60x60)', item_type: 'arbeid', unit: 'm²', selling_price_min: 18, selling_price_default: 22, selling_price_max: 28, is_active: true },
  { category: 'bestrating', item_name: 'Bestrating leggen (klinkers)', item_type: 'arbeid', unit: 'm²', selling_price_min: 20, selling_price_default: 25, selling_price_max: 32, is_active: true },
  { category: 'bestrating', item_name: 'Bestrating leggen (keramisch)', item_type: 'arbeid', unit: 'm²', selling_price_min: 25, selling_price_default: 30, selling_price_max: 38, is_active: true },
  { category: 'bestrating', item_name: 'Bestrating leggen (natuursteen)', item_type: 'arbeid', unit: 'm²', selling_price_min: 28, selling_price_default: 35, selling_price_max: 45, is_active: true },
  { category: 'bestrating', item_name: 'Herstraten (bestaande stenen herleggen)', item_type: 'arbeid', unit: 'm²', selling_price_min: 14, selling_price_default: 18, selling_price_max: 24, is_active: true },
  { category: 'bestrating', item_name: 'Opsluitbanden plaatsen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 10, selling_price_default: 12, selling_price_max: 16, is_active: true },
  { category: 'bestrating', item_name: 'Opsluitbanden plaatsen (gebogen)', item_type: 'arbeid', unit: 'm¹', selling_price_min: 14, selling_price_default: 18, selling_price_max: 24, is_active: true },
  { category: 'bestrating', item_name: 'Palissaden plaatsen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 20, selling_price_default: 25, selling_price_max: 32, is_active: true },
  { category: 'bestrating', item_name: 'Traptreden plaatsen', item_type: 'arbeid', unit: 'stuk', selling_price_min: 38, selling_price_default: 45, selling_price_max: 60, is_active: true },
  { category: 'bestrating', item_name: 'Grind/split aanbrengen', item_type: 'arbeid', unit: 'm²', selling_price_min: 5, selling_price_default: 6, selling_price_max: 9, is_active: true },
  // Materialen
  { category: 'bestrating', item_name: 'Betontegels 30x30', item_type: 'materiaal', unit: 'm²', cost_price: 18, selling_price_min: 24, selling_price_default: 30, selling_price_max: 38, is_active: true },
  { category: 'bestrating', item_name: 'Betontegels 40x40', item_type: 'materiaal', unit: 'm²', cost_price: 20, selling_price_min: 26, selling_price_default: 34, selling_price_max: 42, is_active: true },
  { category: 'bestrating', item_name: 'Betontegels 50x50', item_type: 'materiaal', unit: 'm²', cost_price: 25, selling_price_min: 32, selling_price_default: 40, selling_price_max: 50, is_active: true },
  { category: 'bestrating', item_name: 'Betontegels 60x60', item_type: 'materiaal', unit: 'm²', cost_price: 28, selling_price_min: 36, selling_price_default: 45, selling_price_max: 56, is_active: true },
  { category: 'bestrating', item_name: 'Keramische tegels (basis)', item_type: 'materiaal', unit: 'm²', cost_price: 35, selling_price_min: 48, selling_price_default: 60, selling_price_max: 75, is_active: true },
  { category: 'bestrating', item_name: 'Keramische tegels (midden)', item_type: 'materiaal', unit: 'm²', cost_price: 70, selling_price_min: 95, selling_price_default: 118, selling_price_max: 145, is_active: true },
  { category: 'bestrating', item_name: 'Keramische tegels (luxe)', item_type: 'materiaal', unit: 'm²', cost_price: 95, selling_price_min: 128, selling_price_default: 158, selling_price_max: 195, is_active: true },
  { category: 'bestrating', item_name: 'Natuursteen tegels', item_type: 'materiaal', unit: 'm²', cost_price: 110, selling_price_min: 148, selling_price_default: 185, selling_price_max: 230, is_active: true },
  { category: 'bestrating', item_name: 'Betonklinkers (grijs)', item_type: 'materiaal', unit: 'm²', cost_price: 22, selling_price_min: 30, selling_price_default: 38, selling_price_max: 48, is_active: true },
  { category: 'bestrating', item_name: 'Betonklinkers (gekleurd)', item_type: 'materiaal', unit: 'm²', cost_price: 32, selling_price_min: 42, selling_price_default: 52, selling_price_max: 65, is_active: true },
  { category: 'bestrating', item_name: 'BKK klinkers 8cm (oprit)', item_type: 'materiaal', unit: 'm²', cost_price: 42, selling_price_min: 56, selling_price_default: 70, selling_price_max: 88, is_active: true },
  { category: 'bestrating', item_name: 'Gebakken klinkers', item_type: 'materiaal', unit: 'm²', cost_price: 62, selling_price_min: 80, selling_price_default: 98, selling_price_max: 122, is_active: true },
  { category: 'bestrating', item_name: 'Gebakken waaltjes', item_type: 'materiaal', unit: 'm²', cost_price: 55, selling_price_min: 72, selling_price_default: 88, selling_price_max: 110, is_active: true },
  { category: 'bestrating', item_name: 'Opsluitbanden (grijs)', item_type: 'materiaal', unit: 'm¹', cost_price: 6, selling_price_min: 8, selling_price_default: 10, selling_price_max: 13, is_active: true },
  { category: 'bestrating', item_name: 'Opsluitbanden (antraciet)', item_type: 'materiaal', unit: 'm¹', cost_price: 8, selling_price_min: 10, selling_price_default: 13, selling_price_max: 16, is_active: true },
  { category: 'bestrating', item_name: 'Palissaden 8x25x50', item_type: 'materiaal', unit: 'm¹', cost_price: 12, selling_price_min: 16, selling_price_default: 20, selling_price_max: 26, is_active: true },
  { category: 'bestrating', item_name: 'Traptreden beton', item_type: 'materiaal', unit: 'stuk', cost_price: 45, selling_price_min: 60, selling_price_default: 75, selling_price_max: 95, is_active: true },
  { category: 'bestrating', item_name: 'Traptreden natuursteen', item_type: 'materiaal', unit: 'stuk', cost_price: 85, selling_price_min: 110, selling_price_default: 138, selling_price_max: 175, is_active: true },
  { category: 'bestrating', item_name: 'Grind 8-16mm', item_type: 'materiaal', unit: 'm³', cost_price: 55, selling_price_min: 72, selling_price_default: 88, selling_price_max: 110, is_active: true },
  { category: 'bestrating', item_name: 'Grind 16-32mm', item_type: 'materiaal', unit: 'm³', cost_price: 70, selling_price_min: 90, selling_price_default: 112, selling_price_max: 138, is_active: true },
  { category: 'bestrating', item_name: 'Siergrind (wit/gekleurd)', item_type: 'materiaal', unit: 'm³', cost_price: 175, selling_price_min: 225, selling_price_default: 275, selling_price_max: 340, is_active: true },
  { category: 'bestrating', item_name: 'Split (basalt)', item_type: 'materiaal', unit: 'm³', cost_price: 85, selling_price_min: 110, selling_price_default: 135, selling_price_max: 168, is_active: true },

  // ===== ERFAFSCHEIDING =====
  // Arbeid
  { category: 'erfafscheiding', item_name: 'Schutting plaatsen (standaard)', item_type: 'arbeid', unit: 'm¹', selling_price_min: 20, selling_price_default: 25, selling_price_max: 32, is_active: true },
  { category: 'erfafscheiding', item_name: 'Schutting plaatsen (luxe/hardhouten)', item_type: 'arbeid', unit: 'm¹', selling_price_min: 28, selling_price_default: 35, selling_price_max: 45, is_active: true },
  { category: 'erfafscheiding', item_name: 'Schutting verwijderen en afvoeren', item_type: 'arbeid', unit: 'm¹', selling_price_min: 12, selling_price_default: 15, selling_price_max: 20, is_active: true },
  { category: 'erfafscheiding', item_name: 'Poort plaatsen (enkel)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 80, selling_price_default: 100, selling_price_max: 135, is_active: true },
  { category: 'erfafscheiding', item_name: 'Poort plaatsen (dubbel)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 120, selling_price_default: 150, selling_price_max: 200, is_active: true },
  { category: 'erfafscheiding', item_name: 'Palen plaatsen (beton)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 20, selling_price_default: 25, selling_price_max: 32, is_active: true },
  { category: 'erfafscheiding', item_name: 'Palen plaatsen (hout ingekuild)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 16, selling_price_default: 20, selling_price_max: 28, is_active: true },
  // Materialen
  { category: 'erfafscheiding', item_name: 'Schuttingscherm hout 180x180', item_type: 'materiaal', unit: 'stuk', cost_price: 75, selling_price_min: 95, selling_price_default: 120, selling_price_max: 148, is_active: true },
  { category: 'erfafscheiding', item_name: 'Schuttingscherm hout luxe 180x180', item_type: 'materiaal', unit: 'stuk', cost_price: 95, selling_price_min: 122, selling_price_default: 152, selling_price_max: 185, is_active: true },
  { category: 'erfafscheiding', item_name: 'Schuttingscherm composiet', item_type: 'materiaal', unit: 'stuk', cost_price: 165, selling_price_min: 210, selling_price_default: 262, selling_price_max: 322, is_active: true },
  { category: 'erfafscheiding', item_name: 'Betonpaal grijs', item_type: 'materiaal', unit: 'stuk', cost_price: 32, selling_price_min: 40, selling_price_default: 50, selling_price_max: 62, is_active: true },
  { category: 'erfafscheiding', item_name: 'Betonpaal antraciet', item_type: 'materiaal', unit: 'stuk', cost_price: 38, selling_price_min: 48, selling_price_default: 60, selling_price_max: 75, is_active: true },
  { category: 'erfafscheiding', item_name: 'Hardhouten paal', item_type: 'materiaal', unit: 'stuk', cost_price: 45, selling_price_min: 58, selling_price_default: 72, selling_price_max: 90, is_active: true },
  { category: 'erfafscheiding', item_name: 'Betonplaat grijs', item_type: 'materiaal', unit: 'stuk', cost_price: 12, selling_price_min: 16, selling_price_default: 20, selling_price_max: 26, is_active: true },
  { category: 'erfafscheiding', item_name: 'Schutting pakket beton (per m)', item_type: 'materiaal', unit: 'm¹', cost_price: 95, selling_price_min: 122, selling_price_default: 152, selling_price_max: 188, is_active: true },
  { category: 'erfafscheiding', item_name: 'Schutting pakket hardhouten (per m)', item_type: 'materiaal', unit: 'm¹', cost_price: 135, selling_price_min: 172, selling_price_default: 215, selling_price_max: 265, is_active: true },

  // ===== VLONDERS =====
  // Arbeid
  { category: 'vlonders', item_name: 'Vlonder aanleggen (hardhouten)', item_type: 'arbeid', unit: 'm²', selling_price_min: 28, selling_price_default: 35, selling_price_max: 45, is_active: true },
  { category: 'vlonders', item_name: 'Vlonder aanleggen (composiet)', item_type: 'arbeid', unit: 'm²', selling_price_min: 32, selling_price_default: 40, selling_price_max: 52, is_active: true },
  { category: 'vlonders', item_name: 'Vlonder fundering / stelvoeten plaatsen', item_type: 'arbeid', unit: 'm²', selling_price_min: 12, selling_price_default: 15, selling_price_max: 20, is_active: true },
  { category: 'vlonders', item_name: 'Vlonder verwijderen', item_type: 'arbeid', unit: 'm²', selling_price_min: 10, selling_price_default: 12, selling_price_max: 18, is_active: true },
  // Materialen
  { category: 'vlonders', item_name: 'Hardhouten vlonderplanken (bankirai)', item_type: 'materiaal', unit: 'm²', cost_price: 45, selling_price_min: 58, selling_price_default: 72, selling_price_max: 90, is_active: true },
  { category: 'vlonders', item_name: 'Composiet vlonderplanken', item_type: 'materiaal', unit: 'm²', cost_price: 85, selling_price_min: 108, selling_price_default: 135, selling_price_max: 168, is_active: true },
  { category: 'vlonders', item_name: 'Douglas vlonderplanken', item_type: 'materiaal', unit: 'm²', cost_price: 35, selling_price_min: 45, selling_price_default: 56, selling_price_max: 70, is_active: true },
  { category: 'vlonders', item_name: 'Stalen draagconstructie vlonder', item_type: 'materiaal', unit: 'm²', cost_price: 28, selling_price_min: 36, selling_price_default: 45, selling_price_max: 56, is_active: true },
  { category: 'vlonders', item_name: 'Verstelbare stelvoeten', item_type: 'materiaal', unit: 'stuk', cost_price: 6, selling_price_min: 8, selling_price_default: 10, selling_price_max: 14, is_active: true },

  // ===== GAZON =====
  // Arbeid
  { category: 'gazon', item_name: 'Gazon aanleggen (graszoden)', item_type: 'arbeid', unit: 'm²', selling_price_min: 6, selling_price_default: 8, selling_price_max: 11, is_active: true },
  { category: 'gazon', item_name: 'Gazon aanleggen (inzaaien)', item_type: 'arbeid', unit: 'm²', selling_price_min: 3, selling_price_default: 4, selling_price_max: 6, is_active: true },
  { category: 'gazon', item_name: 'Oud gazon verwijderen', item_type: 'arbeid', unit: 'm²', selling_price_min: 5, selling_price_default: 6, selling_price_max: 9, is_active: true },
  { category: 'gazon', item_name: 'Gazon verticuteren', item_type: 'arbeid', unit: 'm²', selling_price_min: 2, selling_price_default: 3, selling_price_max: 5, is_active: true },
  { category: 'gazon', item_name: 'Gazon bemesten en inzaaien', item_type: 'arbeid', unit: 'm²', selling_price_min: 1.20, selling_price_default: 1.50, selling_price_max: 2.00, is_active: true },
  // Materialen
  { category: 'gazon', item_name: 'Graszoden', item_type: 'materiaal', unit: 'm²', cost_price: 3.00, selling_price_min: 4.50, selling_price_default: 5.50, selling_price_max: 7.00, is_active: true },
  { category: 'gazon', item_name: 'Graszaad (sportgazon)', item_type: 'materiaal', unit: 'kg', cost_price: 12, selling_price_min: 18, selling_price_default: 22, selling_price_max: 28, is_active: true },
  { category: 'gazon', item_name: 'Graszaad (schaduwgazon)', item_type: 'materiaal', unit: 'kg', cost_price: 15, selling_price_min: 22, selling_price_default: 28, selling_price_max: 35, is_active: true },
  { category: 'gazon', item_name: 'Gazonmest (korrel)', item_type: 'materiaal', unit: 'kg', cost_price: 3.50, selling_price_min: 5.50, selling_price_default: 7.00, selling_price_max: 9.00, is_active: true },

  // ===== BEPLANTING =====
  // Arbeid
  { category: 'beplanting', item_name: 'Haag planten', item_type: 'arbeid', unit: 'm¹', selling_price_min: 4, selling_price_default: 5, selling_price_max: 8, is_active: true },
  { category: 'beplanting', item_name: 'Heester planten', item_type: 'arbeid', unit: 'stuk', selling_price_min: 9, selling_price_default: 12, selling_price_max: 16, is_active: true },
  { category: 'beplanting', item_name: 'Vaste planten planten', item_type: 'arbeid', unit: 'stuk', selling_price_min: 2.50, selling_price_default: 3.00, selling_price_max: 4.50, is_active: true },
  { category: 'beplanting', item_name: 'Boom planten (klein tot 2m)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 32, selling_price_default: 40, selling_price_max: 55, is_active: true },
  { category: 'beplanting', item_name: 'Boom planten (groot 2m+)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 60, selling_price_default: 75, selling_price_max: 100, is_active: true },
  { category: 'beplanting', item_name: 'Beplanting borders aanleggen', item_type: 'arbeid', unit: 'm²', selling_price_min: 12, selling_price_default: 15, selling_price_max: 22, is_active: true },
  { category: 'beplanting', item_name: 'Plantgat graven (groot)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 28, selling_price_default: 35, selling_price_max: 48, is_active: true },
  // Materialen
  { category: 'beplanting', item_name: 'Haagplant Liguster 60-80cm', item_type: 'materiaal', unit: 'stuk', cost_price: 3.00, selling_price_min: 5.00, selling_price_default: 6.50, selling_price_max: 8.50, is_active: true },
  { category: 'beplanting', item_name: 'Haagplant Buxus 20-25cm', item_type: 'materiaal', unit: 'stuk', cost_price: 8.00, selling_price_min: 12, selling_price_default: 15, selling_price_max: 19, is_active: true },
  { category: 'beplanting', item_name: 'Haagplant Taxus 40-50cm', item_type: 'materiaal', unit: 'stuk', cost_price: 15, selling_price_min: 20, selling_price_default: 26, selling_price_max: 32, is_active: true },
  { category: 'beplanting', item_name: 'Haagplant Conifeer 80-100cm', item_type: 'materiaal', unit: 'stuk', cost_price: 18, selling_price_min: 24, selling_price_default: 30, selling_price_max: 38, is_active: true },
  { category: 'beplanting', item_name: 'Vaste plant (klein)', item_type: 'materiaal', unit: 'stuk', cost_price: 5.00, selling_price_min: 8.00, selling_price_default: 10, selling_price_max: 13, is_active: true },
  { category: 'beplanting', item_name: 'Vaste plant (midden)', item_type: 'materiaal', unit: 'stuk', cost_price: 8.00, selling_price_min: 12, selling_price_default: 16, selling_price_max: 20, is_active: true },
  { category: 'beplanting', item_name: 'Vaste plant (groot)', item_type: 'materiaal', unit: 'stuk', cost_price: 15, selling_price_min: 22, selling_price_default: 28, selling_price_max: 35, is_active: true },
  { category: 'beplanting', item_name: 'Heester (klein)', item_type: 'materiaal', unit: 'stuk', cost_price: 18, selling_price_min: 26, selling_price_default: 32, selling_price_max: 42, is_active: true },
  { category: 'beplanting', item_name: 'Heester (groot)', item_type: 'materiaal', unit: 'stuk', cost_price: 35, selling_price_min: 48, selling_price_default: 60, selling_price_max: 75, is_active: true },
  { category: 'beplanting', item_name: 'Siergras', item_type: 'materiaal', unit: 'stuk', cost_price: 12, selling_price_min: 16, selling_price_default: 22, selling_price_max: 28, is_active: true },
  { category: 'beplanting', item_name: 'Laanboom 6-8cm stam', item_type: 'materiaal', unit: 'stuk', cost_price: 150, selling_price_min: 195, selling_price_default: 245, selling_price_max: 305, is_active: true },
  { category: 'beplanting', item_name: 'Laanboom 8-10cm stam', item_type: 'materiaal', unit: 'stuk', cost_price: 250, selling_price_min: 325, selling_price_default: 405, selling_price_max: 500, is_active: true },
  { category: 'beplanting', item_name: 'Fruitboom (halfstam)', item_type: 'materiaal', unit: 'stuk', cost_price: 75, selling_price_min: 98, selling_price_default: 122, selling_price_max: 155, is_active: true },
  { category: 'beplanting', item_name: 'Leiboom', item_type: 'materiaal', unit: 'stuk', cost_price: 175, selling_price_min: 225, selling_price_default: 282, selling_price_max: 352, is_active: true },
  { category: 'beplanting', item_name: 'Leivijgenboom 2-2.5m', item_type: 'materiaal', unit: 'stuk', cost_price: 450, selling_price_min: 578, selling_price_default: 722, selling_price_max: 898, is_active: true },

  // ===== OVERKAPPINGEN =====
  // Arbeid
  { category: 'overkappingen', item_name: 'Pergola plaatsen (klein tot 9m²)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 280, selling_price_default: 350, selling_price_max: 450, is_active: true },
  { category: 'overkappingen', item_name: 'Pergola plaatsen (middelgroot 9-16m²)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 440, selling_price_default: 550, selling_price_max: 720, is_active: true },
  { category: 'overkappingen', item_name: 'Pergola plaatsen (groot 16m²+)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 640, selling_price_default: 800, selling_price_max: 1050, is_active: true },
  { category: 'overkappingen', item_name: 'Terrasoverkapping monteren (prefab)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 520, selling_price_default: 650, selling_price_max: 850, is_active: true },
  { category: 'overkappingen', item_name: 'Terrasoverkapping monteren (maatwerk)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 960, selling_price_default: 1200, selling_price_max: 1560, is_active: true },
  { category: 'overkappingen', item_name: 'Veranda plaatsen (standaard)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 640, selling_price_default: 800, selling_price_max: 1050, is_active: true },
  { category: 'overkappingen', item_name: 'Veranda plaatsen (luxe met afwerking)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 1200, selling_price_default: 1500, selling_price_max: 1950, is_active: true },
  { category: 'overkappingen', item_name: 'Carport monteren (enkelvoudig)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 520, selling_price_default: 650, selling_price_max: 850, is_active: true },
  { category: 'overkappingen', item_name: 'Carport monteren (dubbel)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 800, selling_price_default: 1000, selling_price_max: 1300, is_active: true },
  // Materialen
  { category: 'overkappingen', item_name: 'Pergola hout (circa 9m²)', item_type: 'materiaal', unit: 'stuk', cost_price: 450, selling_price_min: 578, selling_price_default: 722, selling_price_max: 898, is_active: true },
  { category: 'overkappingen', item_name: 'Pergola hout (circa 16m²)', item_type: 'materiaal', unit: 'stuk', cost_price: 750, selling_price_min: 960, selling_price_default: 1200, selling_price_max: 1490, is_active: true },
  { category: 'overkappingen', item_name: 'Terrasoverkapping prefab aluminium (15m²)', item_type: 'materiaal', unit: 'stuk', cost_price: 1800, selling_price_min: 2300, selling_price_default: 2900, selling_price_max: 3600, is_active: true },
  { category: 'overkappingen', item_name: 'Veranda aluminium (15m²)', item_type: 'materiaal', unit: 'stuk', cost_price: 3200, selling_price_min: 4100, selling_price_default: 5100, selling_price_max: 6300, is_active: true },

  // ===== WATERWERKEN =====
  // Arbeid
  { category: 'waterwerken', item_name: 'Vijver aanleggen (klein tot 5m²)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 360, selling_price_default: 450, selling_price_max: 590, is_active: true },
  { category: 'waterwerken', item_name: 'Vijver aanleggen (groot 5m²+)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 680, selling_price_default: 850, selling_price_max: 1100, is_active: true },
  { category: 'waterwerken', item_name: 'Beregening aanleggen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 10, selling_price_default: 12, selling_price_max: 16, is_active: true },
  { category: 'waterwerken', item_name: 'Druppelirrigatie aanleggen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 8, selling_price_default: 10, selling_price_max: 14, is_active: true },
  { category: 'waterwerken', item_name: 'Drainage systeem aanleggen (compleet)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 680, selling_price_default: 850, selling_price_max: 1100, is_active: true },
  // Materialen
  { category: 'waterwerken', item_name: 'Vijverfolie EPDM', item_type: 'materiaal', unit: 'm²', cost_price: 8, selling_price_min: 11, selling_price_default: 14, selling_price_max: 18, is_active: true },
  { category: 'waterwerken', item_name: 'Vijverpomp (klein tot 3000L/u)', item_type: 'materiaal', unit: 'stuk', cost_price: 85, selling_price_min: 110, selling_price_default: 138, selling_price_max: 172, is_active: true },
  { category: 'waterwerken', item_name: 'Vijverpomp (groot 3000L/u+)', item_type: 'materiaal', unit: 'stuk', cost_price: 220, selling_price_min: 282, selling_price_default: 352, selling_price_max: 438, is_active: true },
  { category: 'waterwerken', item_name: 'Beregeningssysteem (6 sproeiers)', item_type: 'materiaal', unit: 'stuk', cost_price: 180, selling_price_min: 230, selling_price_default: 288, selling_price_max: 358, is_active: true },
  { category: 'waterwerken', item_name: 'Druppelirrigatie set', item_type: 'materiaal', unit: 'stuk', cost_price: 95, selling_price_min: 122, selling_price_default: 152, selling_price_max: 190, is_active: true },

  // ===== VERLICHTING =====
  // Arbeid
  { category: 'verlichting', item_name: 'Grondspot plaatsen', item_type: 'arbeid', unit: 'stuk', selling_price_min: 36, selling_price_default: 45, selling_price_max: 58, is_active: true },
  { category: 'verlichting', item_name: 'Tuinlamp op paal plaatsen', item_type: 'arbeid', unit: 'stuk', selling_price_min: 28, selling_price_default: 35, selling_price_max: 45, is_active: true },
  { category: 'verlichting', item_name: 'Lichtlijn aanleggen (in grond)', item_type: 'arbeid', unit: 'm¹', selling_price_min: 22, selling_price_default: 28, selling_price_max: 36, is_active: true },
  { category: 'verlichting', item_name: 'Electriciteitsleiding aanleggen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 18, selling_price_default: 22, selling_price_max: 30, is_active: true },
  { category: 'verlichting', item_name: 'Sfeerverlichting monteren', item_type: 'arbeid', unit: 'm¹', selling_price_min: 8, selling_price_default: 10, selling_price_max: 14, is_active: true },
  // Materialen
  { category: 'verlichting', item_name: 'LED grondspot (12V)', item_type: 'materiaal', unit: 'stuk', cost_price: 35, selling_price_min: 45, selling_price_default: 58, selling_price_max: 72, is_active: true },
  { category: 'verlichting', item_name: 'LED grondspot (premium)', item_type: 'materiaal', unit: 'stuk', cost_price: 65, selling_price_min: 82, selling_price_default: 105, selling_price_max: 130, is_active: true },
  { category: 'verlichting', item_name: 'Tuinlamp op paal LED', item_type: 'materiaal', unit: 'stuk', cost_price: 55, selling_price_min: 70, selling_price_default: 88, selling_price_max: 110, is_active: true },
  { category: 'verlichting', item_name: 'LED sfeerverlichting kabel (per m)', item_type: 'materiaal', unit: 'm¹', cost_price: 12, selling_price_min: 16, selling_price_default: 20, selling_price_max: 26, is_active: true },
  { category: 'verlichting', item_name: 'Transformator 12V (buiten)', item_type: 'materiaal', unit: 'stuk', cost_price: 85, selling_price_min: 108, selling_price_default: 135, selling_price_max: 168, is_active: true },

  // ===== OVERIG =====
  // Arbeid (onderhoud, maatwerk)
  { category: 'overig', item_name: 'Tuinhuis plaatsen (klein tot 4m²)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 240, selling_price_default: 300, selling_price_max: 390, is_active: true },
  { category: 'overig', item_name: 'Tuinhuis plaatsen (middelgroot 4-9m²)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 440, selling_price_default: 550, selling_price_max: 720, is_active: true },
  { category: 'overig', item_name: 'Tuinhuis plaatsen (groot 9-15m²)', item_type: 'arbeid', unit: 'stuk', selling_price_min: 720, selling_price_default: 900, selling_price_max: 1180, is_active: true },
  { category: 'overig', item_name: 'Fundering tuinhuis (betonplaten)', item_type: 'arbeid', unit: 'm²', selling_price_min: 28, selling_price_default: 35, selling_price_max: 45, is_active: true },
  { category: 'overig', item_name: 'Fundering tuinhuis (gestort beton)', item_type: 'arbeid', unit: 'm²', selling_price_min: 44, selling_price_default: 55, selling_price_max: 72, is_active: true },
  { category: 'overig', item_name: 'Algemeen tuinonderhoud', item_type: 'arbeid', unit: 'uur', selling_price_min: 38, selling_price_default: 45, selling_price_max: 58, is_active: true },
  { category: 'overig', item_name: 'Snoeiwerk', item_type: 'arbeid', unit: 'uur', selling_price_min: 38, selling_price_default: 45, selling_price_max: 58, is_active: true },
  { category: 'overig', item_name: 'Haag knippen', item_type: 'arbeid', unit: 'm¹', selling_price_min: 5, selling_price_default: 7, selling_price_max: 10, is_active: true },
  { category: 'overig', item_name: 'Onkruid verwijderen', item_type: 'arbeid', unit: 'm²', selling_price_min: 3, selling_price_default: 4, selling_price_max: 6, is_active: true },
  // Materialen (vaste kosten / staartkosten)
  { category: 'overig', item_name: 'Voorrijkosten', item_type: 'materiaal', unit: 'stuk', selling_price_min: 38, selling_price_default: 45, selling_price_max: 58, is_active: true },
  { category: 'overig', item_name: 'Containerkosten 6m³', item_type: 'materiaal', unit: 'stuk', cost_price: 280, selling_price_min: 340, selling_price_default: 395, selling_price_max: 490, is_active: true },
  { category: 'overig', item_name: 'Containerkosten 10m³', item_type: 'materiaal', unit: 'stuk', cost_price: 380, selling_price_min: 445, selling_price_default: 520, selling_price_max: 645, is_active: true },
  { category: 'overig', item_name: 'Kraanwerk (per dag)', item_type: 'materiaal', unit: 'dag', cost_price: 380, selling_price_min: 440, selling_price_default: 520, selling_price_max: 650, is_active: true },
  { category: 'overig', item_name: 'Stortkosten grond', item_type: 'materiaal', unit: 'm³', cost_price: 25, selling_price_min: 32, selling_price_default: 40, selling_price_max: 50, is_active: true },
  { category: 'overig', item_name: 'Stortkosten groen', item_type: 'materiaal', unit: 'm³', cost_price: 35, selling_price_min: 44, selling_price_default: 55, selling_price_max: 68, is_active: true },
  { category: 'overig', item_name: 'Rubber speeltegels', item_type: 'materiaal', unit: 'm²', cost_price: 55, selling_price_min: 72, selling_price_default: 90, selling_price_max: 112, is_active: true },
  { category: 'overig', item_name: 'Plantenbak cortenstaal (medium)', item_type: 'materiaal', unit: 'stuk', cost_price: 265, selling_price_min: 338, selling_price_default: 422, selling_price_max: 525, is_active: true },
  { category: 'overig', item_name: 'Plantenbak cortenstaal (groot)', item_type: 'materiaal', unit: 'stuk', cost_price: 425, selling_price_min: 542, selling_price_default: 678, selling_price_max: 845, is_active: true },
];

export const demoActivities = [
  {
    id: 'demo-activity-001',
    lead_id: 'demo-lead-013',
    activity_type: 'quote_sent',
    title: 'Offerte verstuurd',
    description: 'Offerte OFF-2024-045 verstuurd per email',
    created_at: daysAgo(2)
  },
  {
    id: 'demo-activity-002',
    lead_id: 'demo-lead-022',
    activity_type: 'quote_accepted',
    title: 'Offerte geaccepteerd',
    description: 'Klant heeft offerte OFF-2024-036 digitaal ondertekend',
    created_at: daysAgo(14)
  },
  {
    id: 'demo-activity-003',
    lead_id: 'demo-lead-009',
    activity_type: 'site_visit',
    title: 'Afspraak ter plaatse gepland',
    description: 'Donderdag 14:00 - Bekijken tuin',
    created_at: daysAgo(1)
  },
  {
    id: 'demo-activity-004',
    lead_id: 'demo-lead-004',
    activity_type: 'call',
    title: 'Telefonisch contact',
    description: 'Gebeld met klant over kleur klinkers',
    created_at: daysAgo(2)
  },
  {
    id: 'demo-activity-005',
    lead_id: 'demo-lead-010',
    activity_type: 'site_visit',
    title: 'Afspraak gepland',
    description: 'Vrijdag 10:00 - Volledige tuinrenovatie bespreken',
    created_at: daysAgo(3)
  }
];

export const demoAppointments = [
  {
    id: 'demo-appointment-001',
    lead_id: 'demo-lead-009',
    appointment_type: 'site_visit',
    title: 'Huisbezoek Peter de Groot',
    description: 'Bekijken verzakte tuin',
    location: 'Fluwelensingel 100, 2806 CH Gouda',
    scheduled_at: daysFromNow(2),
    duration_minutes: 45,
    status: 'scheduled',
    created_at: daysAgo(1)
  },
  {
    id: 'demo-appointment-002',
    lead_id: 'demo-lead-010',
    appointment_type: 'site_visit',
    title: 'Huisbezoek Ellen Meijer',
    description: 'Grote tuinrenovatie bespreken',
    location: 'Breevaarthoek 22, 2804 RG Gouda',
    scheduled_at: daysFromNow(3),
    duration_minutes: 60,
    status: 'scheduled',
    created_at: daysAgo(2)
  },
  {
    id: 'demo-appointment-003',
    lead_id: 'demo-lead-022',
    quote_id: 'demo-quote-013',
    appointment_type: 'project_start',
    title: 'Start project Familie Bakker',
    description: 'Starten met tuinaanleg nieuwbouwwoning',
    location: 'Bloemendaalseweg 22, 2803 PK Gouda',
    scheduled_at: daysFromNow(14),
    duration_minutes: 480,
    status: 'scheduled',
    created_at: daysAgo(5)
  }
];

export const demoProjects = [
  {
    id: 'demo-project-001',
    quote_id: 'demo-quote-013',
    lead_id: 'demo-lead-022',
    project_number: 'PRJ-2024-008',
    planned_start_date: daysFromNow(14).split('T')[0],
    planned_end_date: daysFromNow(21).split('T')[0],
    status: 'scheduled',
    quoted_amount: 12559.80,
    photos: [],
    created_at: daysAgo(14)
  },
  {
    id: 'demo-project-002',
    quote_id: 'demo-quote-014',
    lead_id: 'demo-lead-023',
    project_number: 'PRJ-2024-007',
    planned_start_date: daysAgo(10).split('T')[0],
    planned_end_date: daysAgo(8).split('T')[0],
    actual_start_date: daysAgo(10).split('T')[0],
    actual_end_date: daysAgo(8).split('T')[0],
    status: 'completed',
    quoted_amount: 3164.15,
    photos: [],
    created_at: daysAgo(28)
  },
  {
    id: 'demo-project-003',
    quote_id: 'demo-quote-015',
    lead_id: 'demo-lead-024',
    project_number: 'PRJ-2024-006',
    planned_start_date: daysAgo(5).split('T')[0],
    planned_end_date: daysAgo(3).split('T')[0],
    actual_start_date: daysAgo(5).split('T')[0],
    status: 'in_progress',
    quoted_amount: 3961.54,
    photos: [],
    created_at: daysAgo(20)
  }
];

export const demoCompanySettings = {
  company_name: 'Van der Berg Hoveniers',
  company_address: 'Goudseweg 145, 2802 AB Gouda',
  company_phone: '0182 - 512 340',
  company_email: 'info@vandenberghoveniers.nl',
  company_website: 'www.vandenberghoveniers.nl',
  company_kvk: '28145678',
  company_btw: 'NL814567823B01',
  company_iban: 'NL89 RABO 0312 4567 89',
  primary_color: '#16a34a',
  accent_color: '#14532d',
  intro_text: 'Hartelijk dank voor uw interesse in onze diensten. Met meer dan 20 jaar vakmanschap bieden wij u graag onderstaande offerte aan voor de werkzaamheden in uw tuin.',
  outro_text: 'Wij hopen u hiermee een passende aanbieding te hebben gedaan en verheugen ons op een mooie samenwerking. Bij vragen kunt u altijd contact met ons opnemen via telefoon of email.',
  terms_text: 'Op al onze offertes en werkzaamheden zijn onze algemene voorwaarden van toepassing. Op verzoek sturen wij u deze toe.',
  disclaimer_text: 'Door akkoord te gaan met deze offerte gaat u akkoord met de omschreven werkzaamheden en de bijbehorende kosten. Meerwerk wordt altijd vooraf gecommuniceerd en schriftelijk vastgelegd.',
  payment_terms: 'Betaling dient te geschieden binnen 14 dagen na factuurdatum.',
  deposit_percentage: 30,
  deposit_text: 'Bij opdracht wordt een aanbetaling van 30% gevraagd.',
  cover_signature_name: 'H. van der Berg',
  footer_guarantee_text: '3 jaar garantie op alle aanlegwerkzaamheden',
  footer_contact_text: 'Tel: 0182 - 512 340\nEmail: info@vandenberghoveniers.nl\nWeb: www.vandenberghoveniers.nl',
  footer_payment_text: 'IBAN: NL89 RABO 0312 4567 89\nt.n.v. Van der Berg Hoveniers\nBetaling binnen 14 dagen na factuurdatum',
  footer_company_text: 'Van der Berg Hoveniers\nGoudseweg 145, 2802 AB Gouda\nKvK: 28145678 | BTW: NL814567823B01',
  payment_schedule: [
    { termijn: 1, omschrijving: 'Aanbetaling bij opdracht', percentage: 30 },
    { termijn: 2, omschrijving: 'Bij start werkzaamheden', percentage: 40 },
    { termijn: 3, omschrijving: 'Na oplevering', percentage: 30 }
  ],
  conditions_uitgangspunten: `De werklocatie is opgeruimd en vrij toegankelijk bij aanvang van de werkzaamheden.
Werkzaamheden buiten deze overeenkomst worden alleen na schriftelijke opdracht en tegen meerprijs uitgevoerd.
Prijswijzigingen door overheidsingrepen (BTW, heffingen) worden doorberekend.
Water en elektra dienen door opdrachtgever beschikbaar gesteld te worden.
Op deze overeenkomst zijn onze algemene voorwaarden van toepassing (op verzoek beschikbaar).
Maatvoering is indicatief en gebaseerd op informatie verstrekt door opdrachtgever.`,
  conditions_uitgesloten: `Alle werkzaamheden en leveringen niet expliciet vermeld in deze offerte.
Sloop-, afbraak- en afvoerkosten tenzij apart vermeld.
Vergunningen en legeskosten.
Onvoorziene grond- of funderingsproblemen.
Werkzaamheden buiten dagelijkse werktijden (07:00 - 17:00 uur).`,
  default_validity_days: 30,
  show_section_werkomschrijving: true,
  show_section_specificatie: true,
  show_section_condities: true,
  show_section_termijnschema: true,
  labor_pricing_mode: 'unit_price' as const,
  default_hourly_rate: 45
};
