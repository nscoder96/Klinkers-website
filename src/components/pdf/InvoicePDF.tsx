'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1e293b',
    paddingBottom: 20,
  },
  companyInfo: {
    width: '50%',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  companyTagline: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 10,
  },
  companyDetails: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  invoiceInfo: {
    width: '40%',
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  dueDateWarning: {
    fontSize: 9,
    color: '#ea580c',
    marginBottom: 3,
  },
  customerInfo: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerDetails: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
  },
  projectDescription: {
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
  },
  projectLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 4,
  },
  projectText: {
    fontSize: 9,
    color: '#1e293b',
    lineHeight: 1.5,
  },
  // Section grouping
  sectionGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#1e293b',
    padding: 7,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#1e293b',
  },
  typeBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  typeBadgeArbeid: {
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  typeBadgeMaterial: {
    color: '#15803d',
    backgroundColor: '#dcfce7',
  },
  colType: { width: '8%' },
  colDescription: { width: '37%' },
  colQuantity: { width: '10%', textAlign: 'right' },
  colUnit: { width: '8%', textAlign: 'center' },
  colPrice: { width: '16%', textAlign: 'right' },
  colTotal: { width: '21%', textAlign: 'right' },
  sectionSubtotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sectionSubtotalLabel: {
    fontSize: 9,
    color: '#64748b',
    marginRight: 10,
  },
  sectionSubtotalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // Totals
  totalsSection: {
    marginTop: 16,
    marginLeft: 'auto',
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#475569',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotalRow: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    marginTop: 5,
    paddingVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  // Payment block
  paymentBlock: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 6,
  },
  paymentText: {
    fontSize: 9,
    color: '#166534',
    lineHeight: 1.6,
  },
  // Notes
  notes: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#475569',
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginBottom: 10,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerSection: {
    width: '30%',
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 7,
    color: '#64748b',
    lineHeight: 1.4,
  },
});

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  line_type: 'arbeid' | 'materiaal';
  vat_rate?: number;
}

interface Section {
  id: string;
  title: string;
  display_order: number;
  line_items: LineItem[];
}

interface Lead {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
}

interface QuoteInfo {
  quote_number: string;
  project_description: string | null;
  project_address: string | null;
  leads: Lead;
}

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  sections: Section[];
  notes: string | null;
  quotes: QuoteInfo | null;
}

export interface CompanySettings {
  company_name: string;
  company_phone: string | null;
  company_email: string | null;
  company_address: string | null;
  company_iban: string | null;
  payment_terms: string | null;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount || 0);

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

interface InvoicePDFProps {
  invoice: InvoiceData;
  settings?: CompanySettings | null;
}

export default function InvoicePDF({ invoice, settings }: InvoicePDFProps) {
  const lead = invoice.quotes?.leads;
  const quote = invoice.quotes;

  const companyName = settings?.company_name || 'Klinkers & Co';
  const companyPhone = settings?.company_phone || '06 53 96 78 19';
  const companyEmail = settings?.company_email || 'info@klinkersenco.nl';
  const companyAddress = settings?.company_address || 'Gouda';
  const companyIban = settings?.company_iban || '';

  // Recalculate from sections for consistency
  const allItems = invoice.sections.flatMap(s => s.line_items);
  const subtotal = allItems.reduce((sum, i) => sum + Math.round(i.quantity * i.unit_price * 100) / 100, 0);
  const vatAmount = allItems.reduce((sum, i) => {
    const vat = i.vat_rate || 21;
    return sum + (Math.round(i.quantity * i.unit_price * 100) / 100) * (vat / 100);
  }, 0);
  const total = subtotal + vatAmount;

  const laborTotal = allItems
    .filter(i => i.line_type === 'arbeid')
    .reduce((sum, i) => sum + Math.round(i.quantity * i.unit_price * 100) / 100, 0);
  const materialTotal = allItems
    .filter(i => i.line_type === 'materiaal')
    .reduce((sum, i) => sum + Math.round(i.quantity * i.unit_price * 100) / 100, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyTagline}>De Hovenier van Gouda en omstreken</Text>
            <Text style={styles.companyDetails}>
              Tel: {companyPhone}{'\n'}
              Email: {companyEmail}{'\n'}
              {companyAddress}
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>FACTUUR</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>Factuurdatum: {formatDate(invoice.invoice_date)}</Text>
            <Text style={styles.dueDateWarning}>Vervaldatum: {formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        {lead && (
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{lead.name}</Text>
            <Text style={styles.customerDetails}>
              {quote?.project_address || lead.address || ''}{lead.city ? `\n${lead.city}` : ''}
              {lead.phone ? `\nTel: ${lead.phone}` : ''}
              {lead.email ? `\nEmail: ${lead.email}` : ''}
            </Text>
          </View>
        )}

        {/* Project Description */}
        {quote?.project_description && (
          <View style={styles.projectDescription}>
            <Text style={styles.projectLabel}>BETREFT</Text>
            <Text style={styles.projectText}>{quote.project_description}</Text>
          </View>
        )}

        {/* Sections */}
        {invoice.sections.map(section => {
          const sectionTotal = section.line_items.reduce(
            (sum, i) => sum + Math.round(i.quantity * i.unit_price * 100) / 100,
            0
          );
          return (
            <View key={section.id} style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {/* Column headers */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
                <Text style={[styles.tableHeaderCell, styles.colDescription]}>Omschrijving</Text>
                <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Aantal</Text>
                <Text style={[styles.tableHeaderCell, styles.colUnit]}>Eenh.</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Eenheidsprijs</Text>
                <Text style={[styles.tableHeaderCell, styles.colTotal]}>Totaal</Text>
              </View>
              {section.line_items.map((item, index) => {
                const itemTotal = Math.round(item.quantity * item.unit_price * 100) / 100;
                return (
                  <View
                    key={item.id}
                    style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                  >
                    <View style={styles.colType}>
                      <Text style={[
                        styles.typeBadge,
                        item.line_type === 'arbeid' ? styles.typeBadgeArbeid : styles.typeBadgeMaterial,
                      ]}>
                        {item.line_type === 'arbeid' ? 'A' : 'M'}
                      </Text>
                    </View>
                    <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                    <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity}</Text>
                    <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
                    <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(itemTotal)}</Text>
                  </View>
                );
              })}
              {invoice.sections.length > 1 && (
                <View style={styles.sectionSubtotal}>
                  <Text style={styles.sectionSubtotalLabel}>Subtotaal {section.title}</Text>
                  <Text style={styles.sectionSubtotalValue}>{formatCurrency(sectionTotal)}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsSection}>
          {laborTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Arbeid</Text>
              <Text style={styles.totalValue}>{formatCurrency(laborTotal)}</Text>
            </View>
          )}
          {materialTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Materiaal</Text>
              <Text style={styles.totalValue}>{formatCurrency(materialTotal)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW (21%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(vatAmount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Payment instructions */}
        <View style={styles.paymentBlock}>
          <Text style={styles.paymentTitle}>Betalingsinstructies</Text>
          <Text style={styles.paymentText}>
            Gelieve het bedrag van {formatCurrency(total)} vóór {formatDate(invoice.due_date)} te voldoen.{'\n'}
            {companyIban ? `IBAN: ${companyIban}\n` : ''}
            Onder vermelding van factuurnummer {invoice.invoice_number}.
            {settings?.payment_terms ? `\n${settings.payment_terms}` : ''}
          </Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Opmerkingen</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.footerContent}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Contact</Text>
              <Text style={styles.footerText}>
                Tel: {companyPhone}{'\n'}
                {companyEmail}
              </Text>
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Betaling</Text>
              <Text style={styles.footerText}>
                {companyIban ? `IBAN: ${companyIban}\n` : ''}
                Vervaldatum: {formatDate(invoice.due_date)}
              </Text>
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Garantie</Text>
              <Text style={styles.footerText}>
                2 jaar garantie op{'\n'}
                uitgevoerde werkzaamheden
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
