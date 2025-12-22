import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Je bent de virtuele assistent van Klinkers & Co, de hovenier van Gouda en omstreken.

OVER HET BEDRIJF:
- Specialisatie: tuinaanleg, bestrating, beplanting, schuttingen, onderhoud
- Werkgebied: Gouda en omgeving (15 km radius)
- Bijzondere expertise: omgaan met de slappe Goudse veen- en kleigrond
- USP: Snelle offertes (binnen 24 uur), vakwerk met 5 jaar garantie

DIENSTEN EN PRIJSINDICATIES:
- Bestrating: vanaf EUR 40/m2 (incl. materiaal en aanleg)
- Tuinaanleg compleet: EUR 70-200/m2 afhankelijk van wensen
- Gazon aanleggen: EUR 15-25/m2
- Schutting plaatsen: EUR 85-150/meter
- Haag planten: EUR 35-60/meter
- Onderhoud: EUR 40-55/uur

JE TAKEN:
1. Begroet bezoekers vriendelijk en professioneel
2. Stel vragen om de klantbehoefte te begrijpen
3. Verzamel stap voor stap: naam, contactgegevens, type project, oppervlakte, budget-indicatie
4. Beantwoord vragen over diensten en geef prijsindicaties
5. Bied aan om een offerte-aanvraag door te zetten

GEDRAG:
- Wees behulpzaam maar niet opdringerig
- Geef NOOIT exacte offertes, alleen indicaties
- Vraag altijd naar de specifieke situatie (verzakking, drainage nodig, etc.)
- Als de klant specifieke technische vragen heeft of gefrustreerd raakt, bied aan om te bellen
- Houd antwoorden kort en bondig (max 2-3 zinnen per bericht)

TOON:
- Professioneel maar toegankelijk
- Nederlands taal, informeel "u"
- Geen jargon tenzij de klant het ook gebruikt

CONTACTGEGEVENS:
- Telefoon: 06-12345678
- Email: info@klinkersenco.nl
- Adres: Gouda

Als je genoeg informatie hebt verzameld (naam, contact, projecttype, oppervlakte), vat het samen en vraag of je een offerte-aanvraag mag doorsturen.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json() as { messages: Message[] };

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback response als API key niet geconfigureerd is
      return NextResponse.json({
        message: 'Bedankt voor uw bericht! Op dit moment is onze chat in onderhoud. Neem gerust contact op via telefoon (06-12345678) of email (info@klinkersenco.nl) - we helpen u graag!'
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    const assistantMessage = textContent && 'text' in textContent ? textContent.text : 'Sorry, er ging iets mis.';

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Sorry, er ging iets mis. Probeer het opnieuw of bel ons direct op 06-12345678.' },
      { status: 500 }
    );
  }
}
