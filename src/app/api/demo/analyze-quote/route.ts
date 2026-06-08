import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalysisResult {
  werkzaamheden: {
    type: 'sloopwerk' | 'bestrating' | 'schutting' | 'grondwerk' | 'beplanting' | 'overig';
    beschrijving: string;
    variabelen: Record<string, number | string | boolean>;
  }[];
  ontbrekende_info: {
    vraag: string;
    type: 'boolean' | 'number' | 'select';
    variabele: string;
    opties?: string[];
    default?: string | number | boolean;
  }[];
  samenvatting: string;
}

const SYSTEM_PROMPT = `Je bent een assistent voor een hoveniersbedrijf dat gespecialiseerd is in tuinaanleg.
Je analyseert schouw-notities van een hovenier en extraheert alle relevante informatie voor een offerte.

Je moet herkennen:
- SLOOPWERK: oude tegels/bestrating verwijderen, schutting afbreken, bomen/struiken verwijderen
- BESTRATING: nieuwe tegels, klinkers, waaltjes leggen (let op afmetingen zoals "8x6m" = 48m²)
- SCHUTTING: nieuwe schutting plaatsen (let op meters en of er een poort in moet)
- GRONDWERK: afgraven, ophogen, egaliseren
- BEPLANTING: gazon, planten, bomen, haag

Bereken afmetingen: "8x6m" = 48m², "12 meter schutting" = 12m

Geef antwoord ALLEEN in valid JSON format zonder markdown formatting.`;

const USER_PROMPT_TEMPLATE = `Analyseer deze schouw-notities en extract alle informatie voor een offerte:

"""
{NOTES}
"""

Geef antwoord in dit JSON format:
{
  "werkzaamheden": [
    {
      "type": "sloopwerk|bestrating|schutting|grondwerk|beplanting|overig",
      "beschrijving": "korte beschrijving",
      "variabelen": {
        "tegels_m2": 48,
        "schutting_verwijderen_m": 12,
        "bomen_verwijderen": 1
      }
    }
  ],
  "ontbrekende_info": [
    {
      "vraag": "Moet de boomstronk ook gefreesd worden?",
      "type": "boolean",
      "variabele": "stronk_frezen",
      "default": true
    },
    {
      "vraag": "Welke hoogte schutting?",
      "type": "select",
      "variabele": "hoogte_cm",
      "opties": ["180", "200", "210"],
      "default": "180"
    }
  ],
  "samenvatting": "Korte samenvatting van wat er gedaan moet worden"
}

Belangrijke variabelen per type:
- sloopwerk: tegels_m2, schutting_verwijderen_m, bomen_verwijderen, puin_afvoeren
- bestrating: oppervlakte_m2, materiaal_type, opsluitbanden_m, grond_afvoeren
- schutting: lengte_m, hoogte_cm, aantal_poorten, type_schutting
- grondwerk: oppervlakte_m2, diepte_cm, ophogen, afvoeren`;

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    if (!notes || notes.trim().length < 10) {
      return NextResponse.json(
        { error: 'Voer minimaal wat notities in' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: USER_PROMPT_TEMPLATE.replace('{NOTES}', notes),
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON from response
    let analysis: AnalysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response was:', responseText);
      return NextResponse.json(
        { error: 'Kon de analyse niet verwerken' },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing quote:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het analyseren' },
      { status: 500 }
    );
  }
}
