import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase/client';

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface Section {
  id: string;
  title: string;
  subtotal: number;
  line_items: {
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }[];
}

interface OverheadItem {
  name: string;
  overhead_type: 'fixed' | 'percentage';
  value: number;
  calculated_amount: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const { customMessage } = await request.json();

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Fetch quote with lead info
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        leads (
          name,
          email,
          phone,
          address,
          city
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    if (!quote.leads?.email) {
      return NextResponse.json({ error: 'Klant heeft geen emailadres' }, { status: 400 });
    }

    // Fetch sections
    const { data: sections } = await supabase
      .from('quote_sections')
      .select(`
        id,
        title,
        subtotal,
        quote_line_items (
          description,
          quantity,
          unit,
          unit_price,
          total_price
        )
      `)
      .eq('quote_id', quoteId)
      .order('display_order');

    // Fetch overhead
    const { data: overhead } = await supabase
      .from('quote_overhead')
      .select('name, overhead_type, value, calculated_amount')
      .eq('quote_id', quoteId)
      .order('display_order');

    // Generate accept link
    const acceptUrl = quote.accept_token
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://klinkersenco.nl'}/offerte/${quote.accept_token}`
      : null;

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    // Map sections to expected format
    const mappedSections: Section[] = (sections || []).map((s: {
      id: string;
      title: string;
      subtotal: number;
      quote_line_items: {
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        total_price: number;
      }[];
    }) => ({
      id: s.id,
      title: s.title,
      subtotal: s.subtotal,
      line_items: s.quote_line_items || []
    }));

    // Generate HTML email
    const emailHtml = generateQuoteEmailHtml({
      quote,
      sections: mappedSections,
      overhead: overhead as OverheadItem[] || [],
      customMessage,
      acceptUrl,
      formatCurrency,
      formatDate
    });

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      // In development without API key, just mark as sent
      console.log('Resend API key not configured, simulating send...');
      console.log('Would send to:', quote.leads.email);

      await supabase
        .from('quotes')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', quoteId);

      return NextResponse.json({
        success: true,
        message: 'Email gesimuleerd (geen API key)',
        to: quote.leads.email
      });
    }

    // Send email
    const resendClient = getResend();
    if (!resendClient) {
      return NextResponse.json({ error: 'Email service niet geconfigureerd' }, { status: 500 });
    }

    const { data: emailData, error: emailError } = await resendClient.emails.send({
      from: 'Klinkers & Co <offerte@klinkersenco.nl>',
      to: quote.leads.email,
      subject: `Offerte ${quote.quote_number} - Klinkers & Co`,
      html: emailHtml,
      replyTo: 'info@klinkersenco.nl'
    });

    if (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json({ error: 'Email verzenden mislukt: ' + emailError.message }, { status: 500 });
    }

    // Update quote status to sent
    await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    // Log activity
    await supabase
      .from('activity_log')
      .insert({
        lead_id: quote.lead_id,
        activity_type: 'quote_sent',
        description: `Offerte ${quote.quote_number} verstuurd naar ${quote.leads.email}`,
        metadata: { quote_id: quoteId, email_id: emailData?.id }
      });

    return NextResponse.json({
      success: true,
      message: 'Email verstuurd',
      emailId: emailData?.id
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

function generateQuoteEmailHtml({
  quote,
  sections,
  overhead,
  customMessage,
  acceptUrl,
  formatCurrency,
  formatDate
}: {
  quote: {
    quote_number: string;
    project_description: string | null;
    project_address: string | null;
    valid_until: string | null;
    subtotal: number;
    btw_percentage: number;
    btw_amount: number;
    total: number;
    customer_notes: string | null;
    leads: { name: string; email: string };
  };
  sections: Section[];
  overhead: OverheadItem[];
  customMessage?: string;
  acceptUrl: string | null;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}) {
  const sectionsHtml = sections.map(section => `
    <div style="margin-bottom: 20px;">
      <h3 style="background: #f1f5f9; padding: 10px; margin: 0; font-size: 14px; color: #1e293b; border-radius: 4px 4px 0 0;">
        ${section.title}
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #1e293b; color: white;">
            <th style="padding: 8px; text-align: left;">Omschrijving</th>
            <th style="padding: 8px; text-align: center; width: 60px;">Aantal</th>
            <th style="padding: 8px; text-align: center; width: 50px;">Eenheid</th>
            <th style="padding: 8px; text-align: right; width: 80px;">Prijs</th>
            <th style="padding: 8px; text-align: right; width: 90px;">Totaal</th>
          </tr>
        </thead>
        <tbody>
          ${section.line_items.map((item, i) => `
            <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">${item.description}</td>
              <td style="padding: 8px; text-align: center;">${item.quantity}</td>
              <td style="padding: 8px; text-align: center;">${item.unit}</td>
              <td style="padding: 8px; text-align: right;">${formatCurrency(item.unit_price)}</td>
              <td style="padding: 8px; text-align: right;">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="background: #f1f5f9; padding: 8px; text-align: right; border-radius: 0 0 4px 4px;">
        <span style="color: #64748b; font-size: 12px;">Subtotaal ${section.title}:</span>
        <strong style="margin-left: 10px;">${formatCurrency(section.subtotal)}</strong>
      </div>
    </div>
  `).join('');

  const overheadHtml = overhead.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h3 style="background: #fef3c7; padding: 10px; margin: 0; font-size: 14px; color: #92400e; border-radius: 4px 4px 0 0;">
        Staartkosten
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tbody>
          ${overhead.map(item => `
            <tr style="background: #fffbeb; border-bottom: 1px solid #fde68a;">
              <td style="padding: 8px;">${item.name} ${item.overhead_type === 'percentage' ? `(${item.value}%)` : ''}</td>
              <td style="padding: 8px; text-align: right; width: 90px; font-weight: bold; color: #92400e;">
                ${formatCurrency(item.calculated_amount)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offerte ${quote.quote_number}</title>
    </head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: #1e293b; color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0 0 5px 0; font-size: 28px;">Klinkers & Co</h1>
          <p style="margin: 0; color: #ea580c; font-style: italic;">De Hovenier van Gouda en omstreken</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Beste ${quote.leads.name},
          </p>

          ${customMessage ? `
            <p style="font-size: 14px; margin-bottom: 20px; color: #374151;">
              ${customMessage.replace(/\n/g, '<br>')}
            </p>
          ` : `
            <p style="font-size: 14px; margin-bottom: 20px; color: #374151;">
              Hierbij ontvangt u onze offerte voor de besproken werkzaamheden.
              We hebben deze offerte met zorg samengesteld op basis van onze bespreking.
            </p>
          `}

          <!-- Quote Info -->
          <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 18px; color: #ea580c;">${quote.quote_number}</strong>
                ${quote.valid_until ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #92400e;">Geldig tot: ${formatDate(quote.valid_until)}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <strong style="font-size: 24px; color: #ea580c;">${formatCurrency(quote.total)}</strong>
                <p style="margin: 0; font-size: 12px; color: #92400e;">incl. BTW</p>
              </div>
            </div>
          </div>

          ${quote.project_description ? `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1e293b;">Projectomschrijving</h3>
              <p style="margin: 0; font-size: 13px; color: #475569;">${quote.project_description}</p>
            </div>
          ` : ''}

          <!-- Sections -->
          ${sectionsHtml}

          <!-- Overhead -->
          ${overheadHtml}

          <!-- Totals -->
          <div style="margin-left: auto; width: 250px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Subtotaal excl. BTW</span>
              <strong>${formatCurrency(quote.subtotal)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">BTW (${quote.btw_percentage}%)</span>
              <strong>${formatCurrency(quote.btw_amount)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: #1e293b; border-radius: 4px; margin-top: 5px;">
              <span style="color: white; font-weight: bold;">Totaal incl. BTW</span>
              <strong style="color: #ea580c; font-size: 18px;">${formatCurrency(quote.total)}</strong>
            </div>
          </div>

          ${quote.customer_notes ? `
            <div style="padding: 15px; background: #f1f5f9; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1e293b;">Opmerkingen</h3>
              <p style="margin: 0; font-size: 13px; color: #475569;">${quote.customer_notes}</p>
            </div>
          ` : ''}

          ${acceptUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Bekijk offerte online
              </a>
            </div>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <p style="font-size: 13px; color: #64748b;">
            Heeft u vragen over deze offerte? Neem gerust contact met ons op via
            <strong>06 53 96 78 19</strong> of <strong>info@klinkersenco.nl</strong>.
          </p>

          <p style="font-size: 13px; color: #374151; margin-top: 20px;">
            Met vriendelijke groet,<br>
            <strong>Klinkers & Co</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">
            <strong>Klinkers & Co</strong> | De Hovenier van Gouda en omstreken
          </p>
          <p style="margin: 0;">
            Tel: 06 53 96 78 19 | info@klinkersenco.nl
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
