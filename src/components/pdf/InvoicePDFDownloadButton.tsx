'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { InvoiceData, CompanySettings } from './InvoicePDF';

interface InvoicePDFDownloadButtonProps {
  invoice: InvoiceData;
  settings?: CompanySettings | null;
}

export default function InvoicePDFDownloadButton({ invoice, settings }: InvoicePDFDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<{
    document: React.ReactElement;
    fileName: string;
    children: (props: { loading: boolean }) => React.ReactNode;
  }> | null>(null);
  const [InvoicePDF, setInvoicePDF] = useState<React.ComponentType<{ invoice: InvoiceData; settings?: CompanySettings | null }> | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Lazy load to avoid SSR issues with @react-pdf/renderer
    import('@react-pdf/renderer').then(({ PDFDownloadLink: PDL }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPDFDownloadLink(() => PDL as any);
    });
    import('./InvoicePDF').then(mod => {
      setInvoicePDF(() => mod.default);
    });
  }, []);

  if (!isClient || !PDFDownloadLink || !InvoicePDF) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        PDF laden...
      </Button>
    );
  }

  const fileName = `${invoice.invoice_number.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} settings={settings} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Genereren...' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
