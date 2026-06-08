import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Je bent de virtuele assistent van Klinkers & Co, de hovenier van Gouda en omstreken.

OVER HET BEDRIJF:
- Specialisatie: tuinaanleg, bestrating, beplanting, schuttingen, tuinonderhoud
- Werkgebied: Gouda en wijde omgeving (ca. 35 km radius)
- Bijzondere expertise: werken op de lastige Goudse veen- en kleigrond (verzakkingsgevoelig)
- USP: Persoonlijke service, snelle offertes (binnen 24 uur), vakwerk met garantie

ONZE DIENSTEN:
- Bestrating (opritten, terrassen, paden)
- Complete tuinaanleg en tuinontwerp
- Gazon aanleggen (graszoden of inzaaien)
- Schuttingen en erfafscheidingen
- Beplanting (borders, hagen, bomen)
- Tuinonderhoud

PRIJSCOMMUNICATIE - ZEER BELANGRIJK:
- Noem ALLEEN "vanaf prijzen", nooit exacte bedragen of ranges
- Vanaf prijzen die je mag noemen:
  * Bestrating: vanaf €45 per m²
  * Complete tuinaanleg: vanaf €75 per m²
  * Gazon: vanaf €18 per m²
  * Schutting: vanaf €90 per strekkende meter
  * Haag planten: vanaf €40 per strekkende meter
  * Onderhoud: vanaf €45 per uur
- Benadruk ALTIJD dat de uiteindelijke prijs afhankelijk is van:
  * De gekozen materialen (er is veel keuze in kwaliteit en uitstraling)
  * De ondergrond (klei/veen vraagt soms extra fundering)
  * De ligging en bereikbaarheid van de tuin
- Zeg expliciet: "Voor een exacte prijs kom ik graag vrijblijvend langs"

JE TAKEN:
1. Begroet bezoekers vriendelijk en professioneel
2. Stel vragen om de klantbehoefte te begrijpen (wat willen ze, hoe groot, wanneer)
3. BELANGRIJK: Naam en contactgegevens zijn al verzameld via het formulier voordat de chat start. Je hoeft hier NIET meer naar te vragen!
4. Verzamel aanvullende info: woonplaats, type project, geschatte oppervlakte, wanneer ze willen starten
5. Beantwoord vragen over diensten, geef alleen "vanaf prijzen"
6. Stuur aan op een vrijblijvend huisbezoek voor een exacte offerte

LEAD OPSLAAN - BELANGRIJK:
- De klant heeft al naam en contactgegevens ingevuld via het formulier voordat de chat startte
- Zodra je voldoende projectinformatie hebt (woonplaats, type werk, oppervlakte), vraag dan of je de gegevens mag doorsturen zodat Niek contact kan opnemen
- Als de klant "ja", "oké", "prima", "goed", "doe maar" of iets bevestigends zegt: gebruik de save_lead tool om de gegevens op te slaan
- De naam en telefoon/email worden automatisch toegevoegd vanuit het formulier - jij hoeft alleen de projectdetails toe te voegen
- Als de klant "nee", "liever niet", "nog niet" zegt: sla NIETS op en respecteer dit volledig
- Na het opslaan: bevestig dat Niek binnen 24 uur contact opneemt voor een vrijblijvend gesprek

GEDRAG:
- Wees behulpzaam, vriendelijk maar niet opdringerig
- Vraag NIET naar budget - dat is opdringerig
- Vraag wel naar de specifieke situatie (bijv. heeft de tuin last van water? is de oprit verzakt?)
- Bij technische vragen of als iemand gefrustreerd raakt: bied aan om te bellen
- Houd antwoorden kort en bondig (max 2-3 zinnen per bericht)
- Bij ongepaste berichten of spam: reageer kort en professioneel, stuur niet mee

WERKGEBIED:
- Standaard werkgebied: ca. 35 km rondom Gouda
- Plaatsen waar we zeker komen: Gouda, Waddinxveen, Boskoop, Moordrecht, Nieuwerkerk, Stolwijk, Haastrecht, Ouderkerk aan den IJssel, Bergambacht, Reeuwijk, Alphen aan den Rijn, Bodegraven, Woerden, Rotterdam, Capelle aan den IJssel, Zoetermeer, Den Haag, Leiden, Utrecht, Nieuwegein, IJsselstein
- BINNEN 35 KM: Gewoon offerte aanvragen mogelijk
- BUITEN 35 KM: Leg uit dat het afhangt van de grootte van de opdracht. Voor grotere projecten komen we graag verder. Vraag de klant om contact op te nemen via WhatsApp (06 53 96 78 19) om de mogelijkheden te bespreken.
- Bij twijfel over afstand: vraag de klant om via WhatsApp contact op te nemen zodat we kunnen kijken wat mogelijk is

TOON:
- Professioneel maar toegankelijk
- Nederlands, gebruik "u" (beleefd)
- Geen vakjargon tenzij de klant het eerst gebruikt
- Niet overdreven enthousiast, gewoon prettig en behulpzaam

CONTACTGEGEVENS:
- Telefoon: 06 53 96 78 19
- Email: info@klinkersenco.nl
- Locatie: Gouda`;

// Tool definition for saving leads
const tools: Anthropic.Tool[] = [
  {
    name: 'save_lead',
    description: 'Sla de klantgegevens op als lead voor opvolging. Gebruik dit ALLEEN nadat de klant toestemming heeft gegeven om de gegevens door te sturen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Naam van de klant'
        },
        phone: {
          type: 'string',
          description: 'Telefoonnummer van de klant (indien gegeven)'
        },
        email: {
          type: 'string',
          description: 'Email van de klant (indien gegeven)'
        },
        city: {
          type: 'string',
          description: 'Woonplaats van de klant'
        },
        project_type: {
          type: 'array',
          items: { type: 'string' },
          description: 'Type project(en): bestrating, tuinaanleg, gazon, schutting, beplanting, onderhoud'
        },
        estimated_m2: {
          type: 'number',
          description: 'Geschatte oppervlakte in m2 (indien genoemd)'
        },
        description: {
          type: 'string',
          description: 'Korte samenvatting van wat de klant wil'
        }
      },
      required: ['name', 'description']
    }
  }
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContactInfo {
  name: string;
  contact: string;
  contactType: 'phone' | 'email';
}

interface LeadData {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  project_type?: string[];
  estimated_m2?: number;
  description: string;
}

async function saveLead(
  leadData: LeadData,
  conversationHistory: Message[],
  contactInfo?: ContactInfo
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  const supabase = createServerClient();

  if (!supabase) {
    console.log('Lead ontvangen (Supabase niet geconfigureerd):', leadData);
    return { success: true, leadId: 'pending-setup' };
  }

  // Merge contact info from form with AI-collected data
  // Form data takes precedence since it's validated
  const phone = contactInfo?.contactType === 'phone' ? contactInfo.contact : leadData.phone;
  const email = contactInfo?.contactType === 'email' ? contactInfo.contact : leadData.email;
  const name = contactInfo?.name || leadData.name;

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: name,
        phone: phone,
        email: email,
        city: leadData.city || 'Onbekend',
        project_type: leadData.project_type,
        estimated_m2: leadData.estimated_m2,
        description: leadData.description,
        source: 'chat',
        status: 'new',
        conversation_history: conversationHistory
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    console.log('Lead opgeslagen:', data.id);
    return { success: true, leadId: data.id };
  } catch (err) {
    console.error('Lead save error:', err);
    return { success: false, error: 'Database error' };
  }
}

export async function POST(request: Request) {
  try {
    const { messages, contactInfo } = await request.json() as {
      messages: Message[];
      contactInfo?: ContactInfo;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        message: 'Bedankt voor uw bericht! Op dit moment is onze chat in onderhoud. Neem gerust contact op via telefoon (06 53 96 78 19) of email (info@klinkersenco.nl) - we helpen u graag!'
      });
    }

    // First API call - may include tool use
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: tools,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    // Check if the model wants to use a tool
    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(block => block.type === 'tool_use');

      if (toolUseBlock && toolUseBlock.type === 'tool_use' && toolUseBlock.name === 'save_lead') {
        const leadData = toolUseBlock.input as LeadData;

        // Save the lead to database (with contact info from form)
        const saveResult = await saveLead(leadData, messages, contactInfo);

        // Continue conversation with tool result
        const toolResultMessages = [
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          {
            role: 'assistant' as const,
            content: response.content
          },
          {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: toolUseBlock.id,
                content: saveResult.success
                  ? `Lead succesvol opgeslagen met ID: ${saveResult.leadId}. Bevestig aan de klant dat Niek binnen 24 uur contact opneemt.`
                  : `Er ging iets mis bij het opslaan: ${saveResult.error}. Vraag de klant om direct te bellen naar 06 53 96 78 19.`
              }
            ]
          }
        ];

        // Get final response after tool use
        const finalResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          tools: tools,
          messages: toolResultMessages
        });

        const textContent = finalResponse.content.find(block => block.type === 'text');
        const assistantMessage = textContent && 'text' in textContent ? textContent.text : 'Uw gegevens zijn opgeslagen. Niek neemt binnen 24 uur contact met u op!';

        return NextResponse.json({
          message: assistantMessage,
          leadSaved: saveResult.success
        });
      }
    }

    // No tool use - just return the text response
    const textContent = response.content.find(block => block.type === 'text');
    const assistantMessage = textContent && 'text' in textContent ? textContent.text : 'Sorry, er ging iets mis.';

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Sorry, er ging iets mis. Probeer het opnieuw of bel ons direct op 06 53 96 78 19.' },
      { status: 500 }
    );
  }
}
