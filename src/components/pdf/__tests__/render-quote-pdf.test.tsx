// @vitest-environment node
/**
 * Rendert het offerte-PDF-document naar een echt PDF-bestand.
 *
 * Standaard draait dit als smoke-test (render slaagt, bestand niet leeg).
 * Zet RENDER_QUOTE_JSON=/pad/naar/data.json om een echte offerte te
 * renderen naar RENDER_QUOTE_OUT (of een tempbestand) voor visuele
 * inspectie — data.json bevat { quote, sections, overhead, settings }.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as ReactPDF from '@react-pdf/renderer';
import { buildQuoteDocument } from '../quote-pdf-document';

const dataPath = process.env.RENDER_QUOTE_JSON;

describe('buildQuoteDocument', () => {
  it('rendert een offerte naar PDF zonder fouten', async () => {
    const input = dataPath
      ? JSON.parse(readFileSync(dataPath, 'utf8'))
      : {
          quote: {
            id: 'q-1',
            quote_number: 'KC-TEST-1',
            created_at: '2026-07-20T12:00:00Z',
            valid_until: '2026-08-19',
            project_description: 'Testproject',
            project_address: 'Teststraat 1, Gouda',
            line_items: [],
            subtotal: 121,
            btw_percentage: 21,
            btw_amount: 25.41,
            total: 146.41,
            leads: { name: 'Testklant', phone: null, email: null, address: null, city: 'Gouda' }
          },
          sections: [
            {
              id: 's-1',
              title: 'Testsectie',
              display_order: 1,
              subtotal: 100,
              line_items: [
                {
                  id: 'i-1',
                  description: 'Testregel',
                  quantity: 1,
                  unit: 'stuks',
                  unit_price: 100,
                  total_price: 100,
                  line_type: 'arbeid'
                }
              ]
            }
          ],
          overhead: [
            { id: 'o-1', name: 'Container', overhead_type: 'fixed', value: 21, calculated_amount: 21 }
          ],
          settings: null
        };

    ReactPDF.Font.registerHyphenationCallback((word) => [word]);
    const doc = buildQuoteDocument(ReactPDF, input);
    const buffer = await ReactPDF.renderToBuffer(doc);

    expect(buffer.length).toBeGreaterThan(1000);

    // Aantal fysieke pagina's in de PDF (elk pagina-object heeft /Type /Page)
    const pageCount = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    console.log(`PDF heeft ${pageCount} pagina's`);

    if (!dataPath) {
      // Fixture: settings=null → geen werkomschrijving, condities of
      // termijnschema. Verwacht: voorblad + specificatie, exact 2 pagina's.
      // Meer pagina's = een (blanco) overloop-pagina — regressie van de
      // react-pdf quirk met absolute elementen op een volle pagina.
      expect(pageCount).toBe(2);
    }

    const outPath = process.env.RENDER_QUOTE_OUT || join(tmpdir(), 'render-quote-test.pdf');
    if (dataPath) {
      const { writeFileSync } = await import('fs');
      writeFileSync(outPath, buffer);
      console.log(`PDF geschreven naar ${outPath} (${buffer.length} bytes)`);
    }
  }, 30000);
});
