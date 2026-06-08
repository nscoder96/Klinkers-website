import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image, media_type } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Geen afbeelding ontvangen' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI niet geconfigureerd' }, { status: 500 });
    }

    // Validate media type
    const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const actualMediaType = media_type || 'image/jpeg';

    if (!validMediaTypes.includes(actualMediaType)) {
      return NextResponse.json({
        error: 'Ongeldig bestandstype. Toegestaan: JPG, PNG, GIF, WebP'
      }, { status: 400 });
    }

    // Remove data URL prefix if present
    let base64Data = image;
    if (image.includes(',')) {
      base64Data = image.split(',')[1];
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: actualMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Lees alle tekst in deze afbeelding. Dit zijn waarschijnlijk schouwnotities van een hovenier - handgeschreven of getypte notities over tuinwerkzaamheden.

INSTRUCTIES:
1. Geef de tekst exact terug zoals geschreven
2. Behoud de structuur (regels, opsommingen, etc.)
3. Interpreteer handschrift zo nauwkeurig mogelijk
4. Als je getallen ziet (afmetingen, hoeveelheden), noteer deze precies
5. Bij onleesbare tekst, markeer met [onleesbaar]
6. Geef ALLEEN de geëxtraheerde tekst terug, geen extra uitleg

TEKST:`
            }
          ],
        }
      ],
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Geen tekst geëxtraheerd' }, { status: 500 });
    }

    return NextResponse.json({
      text: textContent.text.trim(),
      confidence: 0.9, // Claude doesn't provide confidence scores, so we use a default
    });

  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het lezen van de afbeelding' }, { status: 500 });
  }
}
