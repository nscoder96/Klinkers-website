'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import {
  buildQuoteDocument,
  PdfPrimitives,
  QuoteData,
  Section,
  OverheadItem,
  QuoteSettings
} from './quote-pdf-document';

interface PDFDownloadButtonProps {
  quote: QuoteData;
  sections?: Section[];
  overhead?: OverheadItem[];
  settings?: QuoteSettings | null;
}

export default function PDFDownloadButton({ quote, sections = [], overhead = [], settings }: PDFDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [PDFModule, setPDFModule] = useState<
    (PdfPrimitives & { pdf: typeof import('@react-pdf/renderer').pdf }) | null
  >(null);

  useEffect(() => {
    setIsClient(true);
    let loaded = false;

    const timeout = setTimeout(() => {
      if (!loaded) {
        setLoadError('PDF laden duurde te lang');
      }
    }, 10000);

    import('@react-pdf/renderer')
      .then((mod) => {
        loaded = true;
        clearTimeout(timeout);
        mod.Font.registerHyphenationCallback(word => [word]);
        setPDFModule({
          pdf: mod.pdf,
          Document: mod.Document,
          Page: mod.Page,
          Text: mod.Text,
          View: mod.View,
          StyleSheet: mod.StyleSheet,
          Image: mod.Image,
        });
      })
      .catch((err) => {
        loaded = true;
        clearTimeout(timeout);
        console.error('Failed to load PDF module:', err);
        setLoadError('PDF module kon niet worden geladen: ' + err.message);
      });

    return () => clearTimeout(timeout);
  }, []);

  const generatePDF = async () => {
    if (!PDFModule) return;

    setIsLoading(true);

    try {
      const MyDocument = buildQuoteDocument(PDFModule, { quote, sections, overhead, settings });

      const blob = await PDFModule.pdf(MyDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Offerte-${quote.quote_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Er ging iets mis bij het genereren van de PDF');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        PDF laden...
      </Button>
    );
  }

  if (loadError) {
    return (
      <Button variant="outline" disabled className="text-red-500">
        <Download className="w-4 h-4 mr-2" />
        PDF fout
      </Button>
    );
  }

  if (!PDFModule) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        PDF laden...
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={generatePDF}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Genereren...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </>
      )}
    </Button>
  );
}
