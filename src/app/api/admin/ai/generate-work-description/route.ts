import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { projectDescription, sections } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'AI niet geconfigureerd',
        description: ''
      }, { status: 500 });
    }

    // Fallback if no content provided
    if (!projectDescription && !sections) {
      return NextResponse.json({
        error: 'Geen projectgegevens beschikbaar',
        description: ''
      }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: `Je bent een professionele tekstschrijver voor Klinkers & Co, een hoveniersbedrijf.
Je schrijft werkomschrijvingen voor offertes: professioneel, duidelijk en klantgericht.

STIJL:
- Schrijf in de "wij" vorm
- Wees concreet maar niet te technisch
- Benoem de voordelen voor de klant
- Maximaal 3-4 alinea's
- Geen opsommingen, vloeiende tekst
- Eindig met een positieve noot

STRUCTUUR:
1. Korte inleiding over het project
2. Beschrijving van de hoofdwerkzaamheden
3. Eventuele speciale aandachtspunten
4. Afsluitende zin over resultaat/voordelen

VOORBEELD:
"Voor uw achtertuin realiseren wij een volledig nieuw terras met sfeervolle bestrating.
De bestaande verharding wordt vakkundig verwijderd en afgevoerd, waarna we een degelijke
fundering aanbrengen voor jarenlang plezier.

Het nieuwe terras wordt aangelegd met antracietkleurige betontegels in een modern
formaat. Rondom plaatsen we strakke opsluitbanden voor een verzorgde uitstraling.
De bestrating wordt waterpas gelegd en zorgvuldig gevoegd.

Met dit nieuwe terras krijgt u een onderhoudsarme buitenruimte waar u jarenlang
van kunt genieten."

Geef ALLEEN de werkomschrijving terug, geen extra tekst of uitleg.`,
      messages: [
        {
          role: 'user',
          content: `Schrijf een werkomschrijving voor deze offerte:

PROJECT: ${projectDescription || 'Niet gespecificeerd'}

WERKZAAMHEDEN:
${sections || 'Geen details beschikbaar'}

Genereer een professionele werkomschrijving in 3-4 alinea's.`
        }
      ]
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Geen beschrijving ontvangen' }, { status: 500 });
    }

    return NextResponse.json({
      description: textContent.text.trim()
    });

  } catch (error) {
    console.error('Generate work description API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
