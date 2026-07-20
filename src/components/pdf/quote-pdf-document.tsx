import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import { computeScheduleAmounts } from '@/lib/payment-schedule';

// Primitieven uit @react-pdf/renderer worden aangeleverd door de aanroeper
// (de download-knop laadt de module dynamisch; scripts/tests importeren
// hem direct). Zo blijft dit bestand een pure document-builder.
export interface PdfPrimitives {
  Document: typeof import('@react-pdf/renderer').Document;
  Page: typeof import('@react-pdf/renderer').Page;
  Text: typeof import('@react-pdf/renderer').Text;
  View: typeof import('@react-pdf/renderer').View;
  StyleSheet: typeof import('@react-pdf/renderer').StyleSheet;
  Image: typeof import('@react-pdf/renderer').Image;
}


export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  total_price?: number;
  line_type?: 'arbeid' | 'materiaal';
}

export interface Section {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  subtotal: number;
  line_items: LineItem[];
}

export interface OverheadItem {
  id: string;
  name: string;
  overhead_type: 'fixed' | 'percentage';
  value: number;
  calculated_amount: number;
}

export interface Lead {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
}

export interface PaymentScheduleItem {
  termijn: number;
  omschrijving: string;
  percentage: number;
}

export interface QuoteData {
  quote_number: string;
  project_description: string | null;
  project_address: string | null;
  valid_until: string | null;
  line_items: LineItem[];
  subtotal: number;
  btw_percentage: number;
  btw_amount: number;
  total: number;
  customer_notes: string | null;
  created_at: string;
  leads: Lead | null;
  // Deddo-style fields
  version?: number;
  work_description?: string | null;
  work_description_image_url?: string | null;
  show_section_werkomschrijving?: boolean;
  show_section_specificatie?: boolean;
  show_section_condities?: boolean;
  show_section_termijnschema?: boolean;
  override_conditions_uitgangspunten?: string | null;
  override_conditions_uitgesloten?: string | null;
  override_payment_schedule?: PaymentScheduleItem[] | null;
  spec_show_quantities?: boolean | null;
  spec_show_unit_price?: boolean | null;
  spec_show_btw_column?: boolean | null;
  spec_show_line_totals?: boolean | null;
  spec_show_group_subtotals?: boolean | null;
  spec_show_type_column?: boolean | null;
}

export interface QuoteSettings {
  company_name: string;
  company_logo_url?: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_address: string | null;
  company_website: string | null;
  company_kvk: string | null;
  company_btw: string | null;
  company_iban: string | null;
  payment_terms: string | null;
  payment_methods: string | null;
  deposit_percentage: number;
  deposit_text: string | null;
  intro_text: string | null;
  outro_text: string | null;
  terms_text: string | null;
  disclaimer_text: string | null;
  // Footer visibility
  show_footer_contact: boolean;
  show_footer_payment: boolean;
  show_footer_company: boolean;
  show_footer_guarantee: boolean;
  // Footer titles
  footer_contact_title: string | null;
  footer_payment_title: string | null;
  footer_company_title: string | null;
  footer_guarantee_title: string | null;
  // Footer content
  footer_contact_text: string | null;
  footer_payment_text: string | null;
  footer_company_text: string | null;
  footer_guarantee_text: string | null;
  // Styling
  primary_color: string;
  accent_color: string;
  // Deddo-style section visibility
  show_section_werkomschrijving?: boolean;
  show_section_specificatie?: boolean;
  show_section_condities?: boolean;
  show_section_termijnschema?: boolean;
  // Specification column options
  spec_show_quantities?: boolean;
  spec_show_unit_price?: boolean;
  spec_show_btw_column?: boolean;
  spec_show_line_totals?: boolean;
  spec_show_group_subtotals?: boolean;
  spec_show_type_column?: boolean;
  // Conditions
  conditions_uitgangspunten?: string | null;
  conditions_uitgesloten?: string | null;
  // Payment schedule
  payment_schedule?: PaymentScheduleItem[];
  // Cover page
  cover_betreft_prefix?: string | null;
  cover_signature_name?: string | null;
}


export function buildQuoteDocument(
  mod: PdfPrimitives,
  {
    quote,
    sections = [],
    overhead = [],
    settings
  }: {
    quote: QuoteData;
    sections?: Section[];
    overhead?: OverheadItem[];
    settings?: QuoteSettings | null;
  }
): ReactElement<DocumentProps> {
  const { Document, Page, Text, View, StyleSheet, Image } = mod;

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Get effective section visibility
const showWerkomschrijving = quote.show_section_werkomschrijving ?? settings?.show_section_werkomschrijving ?? true;
const showSpecificatie = quote.show_section_specificatie ?? settings?.show_section_specificatie ?? true;
const showCondities = quote.show_section_condities ?? settings?.show_section_condities ?? true;
const showTermijnschema = quote.show_section_termijnschema ?? settings?.show_section_termijnschema ?? true;

// Get effective spec settings
const specShowQuantities = quote.spec_show_quantities ?? settings?.spec_show_quantities ?? true;
const specShowUnitPrice = quote.spec_show_unit_price ?? settings?.spec_show_unit_price ?? true;
const specShowLineTotals = quote.spec_show_line_totals ?? settings?.spec_show_line_totals ?? true;
const specShowGroupSubtotals = quote.spec_show_group_subtotals ?? settings?.spec_show_group_subtotals ?? true;
const specShowTypeColumn = quote.spec_show_type_column ?? settings?.spec_show_type_column ?? true;

// Get effective conditions
const conditionsUitgangspunten = quote.override_conditions_uitgangspunten || settings?.conditions_uitgangspunten || '';
const conditionsUitgesloten = quote.override_conditions_uitgesloten || settings?.conditions_uitgesloten || '';

// Get effective payment schedule
const paymentSchedule = quote.override_payment_schedule || settings?.payment_schedule || [];

const primaryColor = settings?.primary_color || '#ea580c';
const accentColor = settings?.accent_color || '#1e293b';

// A4 dimensions: 595.28 x 841.89 points
// Standard margins like Word/Google Docs: ~2.5cm = 71 points
const PAGE_MARGIN_TOP = 50;
const PAGE_MARGIN_BOTTOM = 80; // Extra space for footer
const PAGE_MARGIN_HORIZONTAL = 50;
const FOOTER_HEIGHT = 60;

const styles = StyleSheet.create({
  // Page styles - A4 with proper margins
  page: {
    paddingTop: PAGE_MARGIN_TOP,
    paddingBottom: PAGE_MARGIN_BOTTOM,
    paddingHorizontal: PAGE_MARGIN_HORIZONTAL,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Content wrapper to prevent footer overlap
  pageContent: {
    flex: 1,
    minHeight: 0,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: primaryColor,
    paddingBottom: 8,
  },
  // Logo
  logo: {
    maxHeight: 70,
    maxWidth: 200,
  },
  // Quote details row (small, below the contact boxes)
  quoteDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
    marginBottom: 15,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quoteDetailLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  quoteDetailValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: accentColor,
  },
  // Customer section
  customerSection: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 15,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
  },
  customerBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: primaryColor,
  },
  boxLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: accentColor,
  },
  boxText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  // Betreft section
  betreftSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  betreftLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  betreftText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: accentColor,
  },
  betreftTextNormal: {
    fontSize: 10,
    color: accentColor,
    lineHeight: 1.4,
  },
  // Intro/Outro text
  introText: {
    marginBottom: 20,
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  // Totals box on cover
  totalsBox: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#475569',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: accentColor,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: accentColor,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
  },
  // Signature
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: accentColor,
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: accentColor,
    marginTop: 4,
  },
  // Work description page
  workDescriptionText: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.6,
  },
  workDescriptionImage: {
    marginTop: 20,
    maxHeight: 300,
    objectFit: 'contain',
  },
  // Specification table
  sectionContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: accentColor,
    padding: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  table: {
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 18,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 8,
    color: '#1e293b',
  },
  colType: {
    width: '8%',
  },
  typeBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    textAlign: 'center',
  },
  typeBadgeArbeid: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  typeBadgeMateriaal: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  colDescription: {
    width: specShowTypeColumn
      ? (specShowQuantities && specShowUnitPrice && specShowLineTotals ? '37%' : specShowLineTotals ? '62%' : '92%')
      : (specShowQuantities && specShowUnitPrice && specShowLineTotals ? '45%' : specShowLineTotals ? '70%' : '100%'),
  },
  colQuantity: {
    width: '12%',
    textAlign: 'center',
  },
  colUnit: {
    width: '10%',
    textAlign: 'center',
  },
  colPrice: {
    width: '16%',
    textAlign: 'right',
  },
  colTotal: {
    width: '17%',
    textAlign: 'right',
  },
  // Legend styles
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    gap: 15,
  },
  legendTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 7,
    color: '#64748b',
  },
  // Arbeid/Materiaal subtotals
  typeSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  typeSubtotalLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  typeSubtotalValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  sectionSubtotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  sectionSubtotalLabel: {
    fontSize: 8,
    color: '#64748b',
    marginRight: 8,
  },
  sectionSubtotalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: accentColor,
  },
  // Overhead section
  overheadSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  overheadTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  overheadRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  overheadName: {
    width: '70%',
    fontSize: 8,
    color: '#1e293b',
  },
  overheadValue: {
    width: '30%',
    textAlign: 'right',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
  },
  // Spec totals
  specTotalsSection: {
    marginTop: 12,
    marginLeft: 'auto',
    width: '50%',
  },
  specGrandTotalRow: {
    backgroundColor: accentColor,
    borderRadius: 3,
    marginTop: 4,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specGrandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  specGrandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: primaryColor,
  },
  // Conditions page
  conditionsSection: {
    marginBottom: 20,
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  conditionItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  conditionNumber: {
    fontSize: 8,
    fontWeight: 'bold',
    color: primaryColor,
    width: 18,
  },
  conditionText: {
    fontSize: 8,
    color: '#1e293b',
    flex: 1,
    lineHeight: 1.4,
  },
  // Payment schedule table
  scheduleTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    backgroundColor: accentColor,
    padding: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  scheduleHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scheduleRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scheduleCell: {
    fontSize: 8,
    color: '#1e293b',
  },
  scheduleFooter: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  scheduleFooterCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: accentColor,
  },
  colTermijn: { width: '15%' },
  colOmschrijving: { width: '45%' },
  colPercentage: { width: '15%', textAlign: 'right' },
  colBedrag: { width: '25%', textAlign: 'right' },
  // Footer - positioned at bottom with proper spacing
  footer: {
    position: 'absolute',
    bottom: 20,
    left: PAGE_MARGIN_HORIZONTAL,
    right: PAGE_MARGIN_HORIZONTAL,
    height: FOOTER_HEIGHT,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginBottom: 6,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerSection: {
    width: '24%',
  },
  footerTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 2,
  },
  footerText: {
    fontSize: 6,
    color: '#64748b',
    lineHeight: 1.3,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 8,
    right: PAGE_MARGIN_HORIZONTAL,
    fontSize: 8,
    color: '#94a3b8',
  },
});

const lead = quote.leads || { name: 'Onbekend', phone: null, email: null, address: null, city: '' };
const hasSections = sections && sections.length > 0;
// Opgeslagen offertetotalen zijn INCLUSIEF overhead (staartkosten) — de
// overhead-routes en opslagflows schrijven subtotal/btw/total al met
// overhead erin. Hier nogmaals optellen zou de staartkosten dubbel tellen.
const effectiveSubtotal = Math.round(quote.subtotal * 100) / 100;
const effectiveBtw = Math.round(quote.btw_amount * 100) / 100;
const effectiveTotal = Math.round(quote.total * 100) / 100;

// Count which sections are visible
const hasWerkomschrijvingPage = showWerkomschrijving && quote.work_description;
const hasSpecificatiePage = showSpecificatie && (hasSections || quote.line_items?.length > 0);
const hasConditiesPage = showCondities && (conditionsUitgangspunten || conditionsUitgesloten);
const hasTermijnschemaPage = showTermijnschema && paymentSchedule.length > 0;

// Calculate total pages
const totalPages = 1 + // Cover always
  (hasWerkomschrijvingPage ? 1 : 0) +
  (hasSpecificatiePage ? 1 : 0) +
  (hasConditiesPage ? 1 : 0) +
  (hasTermijnschemaPage ? 1 : 0);

// Calculate page numbers for each section
let pageNum = 1;
const coverPageNum = pageNum++;
const werkomschrijvingPageNum = hasWerkomschrijvingPage ? pageNum++ : 0;
const specificatiePageNum = hasSpecificatiePage ? pageNum++ : 0;
const conditiesPageNum = hasConditiesPage ? pageNum++ : 0;
const termijnschemaPageNum = hasTermijnschemaPage ? pageNum++ : 0;

// Footer component - only show if at least one footer section is enabled
const hasFooter = settings?.show_footer_contact !== false ||
                  settings?.show_footer_payment !== false ||
                  settings?.show_footer_company !== false ||
                  settings?.show_footer_guarantee !== false;

// `fixed` is essentieel: absoluut gepositioneerde elementen zonder `fixed`
// worden door react-pdf naar een nieuwe (lege) pagina geduwd zodra de
// paginainhoud precies vol staat — dat gaf een blanco pagina na het voorblad.
const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
  <>
    {hasFooter && (
      <View style={styles.footer} fixed>
        <View style={styles.footerDivider} />
        <View style={styles.footerContent}>
          {(settings?.show_footer_contact !== false) && (
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>{settings?.footer_contact_title || 'Contact'}</Text>
              <Text style={styles.footerText}>
                {settings?.footer_contact_text || `Tel: ${settings?.company_phone || ''}\n${settings?.company_email || ''}`}
              </Text>
            </View>
          )}
          {(settings?.show_footer_payment !== false) && (
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>{settings?.footer_payment_title || 'Betaling'}</Text>
              <Text style={styles.footerText}>
                {settings?.footer_payment_text || settings?.payment_terms || ''}
              </Text>
            </View>
          )}
          {(settings?.show_footer_company !== false) && (
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>{settings?.footer_company_title || 'Bedrijfsgegevens'}</Text>
              <Text style={styles.footerText}>
                {settings?.footer_company_text || `KvK: ${settings?.company_kvk || '-'}\nBTW: ${settings?.company_btw || '-'}`}
              </Text>
            </View>
          )}
          {(settings?.show_footer_guarantee !== false) && (
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>{settings?.footer_guarantee_title || 'Garantie'}</Text>
              <Text style={styles.footerText}>
                {settings?.footer_guarantee_text || ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    )}
    <Text style={styles.pageNumber} fixed>Pagina {pageNumber} van {totalPages}</Text>
  </>
);

const MyDocument = (
  <Document>
    {/* PAGE 1: VOORBLAD (Cover) - Always visible */}
    <Page size="A4" style={styles.page}>
      {/* Logo centered at top */}
      {settings?.company_logo_url && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image src={settings.company_logo_url} style={styles.logo} />
        </View>
      )}

      {/* Company & Customer info boxes side by side */}
      <View style={styles.customerSection}>
        <View style={styles.infoBox}>
          <Text style={styles.boxLabel}>Van</Text>
          <Text style={styles.boxTitle}>{settings?.company_name || 'Klinkers & Co'}</Text>
          <Text style={styles.boxText}>
            {`${settings?.company_address || ''}\nTel: ${settings?.company_phone || ''}\n${settings?.company_email || ''}`}
          </Text>
        </View>
        <View style={styles.customerBox}>
          <Text style={styles.boxLabel}>Aan</Text>
          <Text style={styles.boxTitle}>{lead.name}</Text>
          <Text style={styles.boxText}>
            {`${quote.project_address || lead.address || lead.city}${lead.phone ? `\nTel: ${lead.phone}` : ''}${lead.email ? `\n${lead.email}` : ''}`}
          </Text>
        </View>
      </View>

      {/* Quote details - small below the boxes */}
      <View style={styles.quoteDetailsRow}>
        <Text style={styles.quoteDetailLabel}>Offertenummer: <Text style={styles.quoteDetailValue}>{quote.quote_number}</Text></Text>
        <Text style={styles.quoteDetailLabel}>Versie: <Text style={styles.quoteDetailValue}>{quote.version || 1}</Text></Text>
        <Text style={styles.quoteDetailLabel}>Datum: <Text style={styles.quoteDetailValue}>{formatDate(quote.created_at)}</Text></Text>
        {quote.valid_until && (
          <Text style={styles.quoteDetailLabel}>Geldig tot: <Text style={styles.quoteDetailValue}>{formatDate(quote.valid_until)}</Text></Text>
        )}
      </View>

      {/* Betreft */}
      {quote.project_description && (
        <View style={styles.betreftSection}>
          <Text style={styles.betreftLabel}>{settings?.cover_betreft_prefix || 'Betreft:'}</Text>
          <Text style={styles.betreftTextNormal}>{quote.project_description}</Text>
        </View>
      )}

      {/* Intro text */}
      {settings?.intro_text && (
        <Text style={styles.introText}>{settings.intro_text}</Text>
      )}

      {/* Totals summary */}
      <View style={styles.totalsBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotaal excl. BTW</Text>
          <Text style={styles.totalValue}>{formatCurrency(effectiveSubtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>BTW ({quote.btw_percentage}%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(effectiveBtw)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>Totaal incl. BTW</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(effectiveTotal)}</Text>
        </View>
      </View>

      {/* Outro text */}
      {settings?.outro_text && (
        <Text style={styles.introText}>{settings.outro_text}</Text>
      )}

      {/* Signature */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Datum en handtekening klant:</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Voor akkoord,</Text>
          <Text style={styles.signatureName}>
            {settings?.cover_signature_name || settings?.company_name || 'Klinkers & Co'}
          </Text>
        </View>
      </View>

      <PageFooter pageNumber={coverPageNum} />
    </Page>

    {/* PAGE 2: WERKOMSCHRIJVING (if enabled and has content) */}
    {hasWerkomschrijvingPage && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>Werkomschrijving</Text>
        <Text style={styles.workDescriptionText}>{quote.work_description}</Text>
        {quote.work_description_image_url && (
          <Image src={quote.work_description_image_url} style={styles.workDescriptionImage} />
        )}
        <PageFooter pageNumber={werkomschrijvingPageNum} />
      </Page>
    )}

    {/* PAGE 3: SPECIFICATIE (if enabled) */}
    {hasSpecificatiePage && (
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.pageTitle}>Specificatie</Text>

        {/* Legend for A/M type */}
        {specShowTypeColumn && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Legenda:</Text>
            <View style={styles.legendItem}>
              <Text style={[styles.typeBadge, styles.typeBadgeArbeid]}>A</Text>
              <Text style={styles.legendText}>= Arbeid</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.typeBadge, styles.typeBadgeMateriaal]}>M</Text>
              <Text style={styles.legendText}>= Materiaal</Text>
            </View>
          </View>
        )}

        {/* Sections with items */}
        {hasSections ? (
          <>
            {sections.sort((a, b) => a.display_order - b.display_order).map((section) => (
              <View key={section.id} style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    {specShowTypeColumn && (
                      <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
                    )}
                    <Text style={[styles.tableHeaderCell, styles.colDescription]}>Omschrijving</Text>
                    {specShowQuantities && (
                      <>
                        <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Aantal</Text>
                        <Text style={[styles.tableHeaderCell, styles.colUnit]}>Eenheid</Text>
                      </>
                    )}
                    {specShowUnitPrice && (
                      <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prijs</Text>
                    )}
                    {specShowLineTotals && (
                      <Text style={[styles.tableHeaderCell, styles.colTotal]}>Totaal</Text>
                    )}
                  </View>
                  {section.line_items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                    >
                      {specShowTypeColumn && (
                        <View style={styles.colType}>
                          <Text style={[
                            styles.typeBadge,
                            item.line_type === 'materiaal' ? styles.typeBadgeMateriaal : styles.typeBadgeArbeid
                          ]}>
                            {item.line_type === 'materiaal' ? 'M' : 'A'}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                      {specShowQuantities && (
                        <>
                          <Text style={[styles.tableCell, styles.colQuantity]}>{String(item.quantity)}</Text>
                          <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                        </>
                      )}
                      {specShowUnitPrice && (
                        <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
                      )}
                      {specShowLineTotals && (
                        <Text style={[styles.tableCell, styles.colTotal]}>
                          {formatCurrency(item.total_price || item.total || item.quantity * item.unit_price)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
                {specShowGroupSubtotals && (
                  <View style={styles.sectionSubtotal}>
                    <Text style={styles.sectionSubtotalLabel}>Subtotaal {section.title}:</Text>
                    <Text style={styles.sectionSubtotalValue}>{formatCurrency(section.subtotal)}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {specShowTypeColumn && (
                <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
              )}
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>Omschrijving</Text>
              {specShowQuantities && (
                <>
                  <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Aantal</Text>
                  <Text style={[styles.tableHeaderCell, styles.colUnit]}>Eenheid</Text>
                </>
              )}
              {specShowUnitPrice && (
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prijs</Text>
              )}
              {specShowLineTotals && (
                <Text style={[styles.tableHeaderCell, styles.colTotal]}>Totaal</Text>
              )}
            </View>
            {quote.line_items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                {specShowTypeColumn && (
                  <View style={styles.colType}>
                    <Text style={[
                      styles.typeBadge,
                      item.line_type === 'materiaal' ? styles.typeBadgeMateriaal : styles.typeBadgeArbeid
                    ]}>
                      {item.line_type === 'materiaal' ? 'M' : 'A'}
                    </Text>
                  </View>
                )}
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                {specShowQuantities && (
                  <>
                    <Text style={[styles.tableCell, styles.colQuantity]}>{String(item.quantity)}</Text>
                    <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                  </>
                )}
                {specShowUnitPrice && (
                  <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
                )}
                {specShowLineTotals && (
                  <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.total)}</Text>
                )}
              </View>
            ))}
          </View>
        )}


        {/* Staartkosten (overhead) — zit in het subtotaal, dus tonen */}
        {overhead.length > 0 && (
          <View style={styles.overheadSection}>
            <Text style={styles.overheadTitle}>Bijkomende kosten</Text>
            {overhead.map((item) => (
              <View key={item.id} style={styles.overheadRow}>
                <Text style={styles.overheadName}>{item.name}</Text>
                <Text style={styles.overheadValue}>{formatCurrency(item.calculated_amount || 0)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.specTotalsSection}>
          {/* Arbeid/Materiaal subtotals when type column is shown */}
          {specShowTypeColumn && (() => {
            // Calculate arbeid and materiaal totals
            const allItems = hasSections
              ? sections.flatMap(s => s.line_items || [])
              : (quote.line_items || []);

            const arbeidTotal = allItems
              .filter(item => item.line_type !== 'materiaal')
              .reduce((sum, item) => sum + (item.total_price || item.total || item.quantity * item.unit_price), 0);

            const materiaalTotal = allItems
              .filter(item => item.line_type === 'materiaal')
              .reduce((sum, item) => sum + (item.total_price || item.total || item.quantity * item.unit_price), 0);

            return (
              <>
                <View style={styles.typeSubtotalRow}>
                  <View style={styles.legendItem}>
                    <Text style={[styles.typeBadge, styles.typeBadgeArbeid]}>A</Text>
                    <Text style={styles.typeSubtotalLabel}> Arbeid</Text>
                  </View>
                  <Text style={[styles.typeSubtotalValue, { color: '#1d4ed8' }]}>{formatCurrency(arbeidTotal)}</Text>
                </View>
                <View style={styles.typeSubtotalRow}>
                  <View style={styles.legendItem}>
                    <Text style={[styles.typeBadge, styles.typeBadgeMateriaal]}>M</Text>
                    <Text style={styles.typeSubtotalLabel}> Materiaal</Text>
                  </View>
                  <Text style={[styles.typeSubtotalValue, { color: '#15803d' }]}>{formatCurrency(materiaalTotal)}</Text>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', marginVertical: 4 }} />
              </>
            );
          })()}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal excl. BTW</Text>
            <Text style={styles.totalValue}>{formatCurrency(effectiveSubtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW ({quote.btw_percentage}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(effectiveBtw)}</Text>
          </View>
          <View style={styles.specGrandTotalRow}>
            <Text style={styles.specGrandTotalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.specGrandTotalValue}>{formatCurrency(effectiveTotal)}</Text>
          </View>
        </View>

        <PageFooter pageNumber={specificatiePageNum} />
      </Page>
    )}

    {/* PAGE 4: CONDITIES (if enabled) */}
    {hasConditiesPage && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>Condities</Text>

        {/* Uitgangspunten */}
        {conditionsUitgangspunten && (
          <View style={styles.conditionsSection}>
            <Text style={styles.conditionsTitle}>Uitgangspunten</Text>
            {conditionsUitgangspunten.split('\n').filter(Boolean).map((item, index) => (
              <View key={index} style={styles.conditionItem}>
                <Text style={styles.conditionNumber}>{index + 1}.</Text>
                <Text style={styles.conditionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Uitgesloten werkzaamheden */}
        {conditionsUitgesloten && (
          <View style={styles.conditionsSection}>
            <Text style={styles.conditionsTitle}>Uitgesloten werkzaamheden</Text>
            {conditionsUitgesloten.split('\n').filter(Boolean).map((item, index) => (
              <View key={index} style={styles.conditionItem}>
                <Text style={styles.conditionNumber}>{index + 1}.</Text>
                <Text style={styles.conditionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <PageFooter pageNumber={conditiesPageNum} />
      </Page>
    )}

    {/* PAGE 5: TERMIJNSCHEMA (if enabled) */}
    {hasTermijnschemaPage && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>Termijnschema</Text>

        <View style={styles.scheduleTable}>
          <View style={styles.scheduleHeader}>
            <Text style={[styles.scheduleHeaderCell, styles.colTermijn]}>Termijn</Text>
            <Text style={[styles.scheduleHeaderCell, styles.colOmschrijving]}>Omschrijving</Text>
            <Text style={[styles.scheduleHeaderCell, styles.colPercentage]}>%</Text>
            <Text style={[styles.scheduleHeaderCell, styles.colBedrag]}>Bedrag</Text>
          </View>
          {(() => {
            const scheduleAmounts = computeScheduleAmounts(
              quote.total,
              paymentSchedule.map((item) => item.percentage)
            );
            return paymentSchedule.map((item, index) => (
              <View key={index} style={styles.scheduleRow}>
                <Text style={[styles.scheduleCell, styles.colTermijn]}>{item.termijn}</Text>
                <Text style={[styles.scheduleCell, styles.colOmschrijving]}>{item.omschrijving}</Text>
                <Text style={[styles.scheduleCell, styles.colPercentage]}>{item.percentage}%</Text>
                <Text style={[styles.scheduleCell, styles.colBedrag]}>{formatCurrency(scheduleAmounts[index])}</Text>
              </View>
            ));
          })()}
          <View style={styles.scheduleFooter}>
            <Text style={[styles.scheduleFooterCell, styles.colTermijn]}></Text>
            <Text style={[styles.scheduleFooterCell, styles.colOmschrijving]}>Totaal</Text>
            <Text style={[styles.scheduleFooterCell, styles.colPercentage]}>
              {paymentSchedule.reduce((sum, item) => sum + item.percentage, 0)}%
            </Text>
            <Text style={[styles.scheduleFooterCell, styles.colBedrag]}>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        <PageFooter pageNumber={termijnschemaPageNum} />
      </Page>
    )}
  </Document>
);

  return MyDocument;
}
