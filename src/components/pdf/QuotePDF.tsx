'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts (using built-in Helvetica)
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
  quoteInfo: {
    width: '40%',
    textAlign: 'right',
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quoteDate: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
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
    padding: 15,
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
  },
  projectText: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.6,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#1e293b',
  },
  colDescription: {
    width: '45%',
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
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  validity: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  validityText: {
    fontSize: 9,
    color: '#92400e',
    textAlign: 'center',
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
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
  },
});

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface Lead {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
}

interface QuoteData {
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
  leads: Lead;
}

interface QuotePDFProps {
  quote: QuoteData;
}

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

export default function QuotePDF({ quote }: QuotePDFProps) {
  const lead = quote.leads;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Klinkers & Co</Text>
            <Text style={styles.companyTagline}>De Hovenier van Gouda en omstreken</Text>
            <Text style={styles.companyDetails}>
              Tel: 06 53 96 78 19{'\n'}
              Email: info@klinkersenco.nl{'\n'}
              Gouda
            </Text>
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteTitle}>OFFERTE</Text>
            <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
            <Text style={styles.quoteDate}>Datum: {formatDate(quote.created_at)}</Text>
            {quote.valid_until && (
              <Text style={styles.quoteDate}>Geldig tot: {formatDate(quote.valid_until)}</Text>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{lead.name}</Text>
          <Text style={styles.customerDetails}>
            {quote.project_address || lead.address || lead.city}
            {lead.phone && `\nTel: ${lead.phone}`}
            {lead.email && `\nEmail: ${lead.email}`}
          </Text>
        </View>

        {/* Project Description */}
        {quote.project_description && (
          <View style={styles.projectDescription}>
            <Text style={styles.notesTitle}>Projectomschrijving</Text>
            <Text style={styles.projectText}>{quote.project_description}</Text>
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Omschrijving</Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Aantal</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Eenheid</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prijs</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Totaal</Text>
          </View>

          {quote.line_items.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW ({quote.btw_percentage}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.btw_amount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {/* Customer Notes */}
        {quote.customer_notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Opmerkingen</Text>
            <Text style={styles.notesText}>{quote.customer_notes}</Text>
          </View>
        )}

        {/* Validity Notice */}
        {quote.valid_until && (
          <View style={styles.validity}>
            <Text style={styles.validityText}>
              Deze offerte is geldig tot {formatDate(quote.valid_until)}.
              Na deze datum kunnen prijzen afwijken.
            </Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Datum en handtekening klant:</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Voor akkoord, Klinkers & Co:</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.footerContent}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Contact</Text>
              <Text style={styles.footerText}>
                Tel: 06 53 96 78 19{'\n'}
                info@klinkersenco.nl
              </Text>
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Betaling</Text>
              <Text style={styles.footerText}>
                50% bij akkoord{'\n'}
                50% na oplevering
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
