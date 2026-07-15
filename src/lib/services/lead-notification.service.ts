import { Resend } from 'resend';

/**
 * Notificatiemail naar Niek bij elke nieuwe aanvraag via het websiteformulier.
 * Niet-blokkerend patroon (zoals B1/B3 elders): deze functie throwt nooit —
 * een mislukte notificatie mag het opslaan van de lead niet breken. De
 * uitkomst is wél zichtbaar voor de aanroeper (en dus in de serverlogs).
 */

export interface LeadNotificationInput {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  city?: string | null;
  project_type?: string | null;
  description: string;
  estimated_m2?: number | null;
  budget_range?: string | null;
  urgency?: string | null;
}

export interface LeadNotificationResult {
  sent: boolean;
  emailId?: string;
  reason?: string;
}

const NOTIFY_TO = 'info@klinkersenco.nl';
const NOTIFY_FROM = 'Klinkers & Co Website <aanvraag@klinkersenco.nl>';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function detailRow(label: string, value: string | null | undefined): string {
  if (!value) return '';
  return `
    <tr>
      <td style="padding: 6px 12px 6px 0; color: #64748b; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${escapeHtml(value)}</td>
    </tr>`;
}

function buildNotificationHtml(lead: LeadNotificationInput, leadUrl: string): string {
  const rows = [
    detailRow('Naam', lead.name),
    detailRow('Telefoon', lead.phone),
    detailRow('E-mail', lead.email),
    detailRow('Adres', [lead.address, lead.postcode, lead.city].filter(Boolean).join(', ')),
    detailRow('Type project', lead.project_type),
    detailRow('Geschat m²', lead.estimated_m2 != null ? String(lead.estimated_m2) : null),
    detailRow('Budget', lead.budget_range),
    detailRow('Urgentie', lead.urgency),
  ].join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e293b; color: white; padding: 24px 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">Nieuwe aanvraag via de website</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <table style="border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            ${rows}
          </table>
          <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; border-radius: 4px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #92400e;">Omschrijving</h3>
            <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${escapeHtml(lead.description)}</p>
          </div>
          <div style="text-align: center;">
            <a href="${leadUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Bekijk lead in admin
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>`;
}

export async function sendLeadNotification(
  lead: LeadNotificationInput
): Promise<LeadNotificationResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      sent: false,
      reason: 'RESEND_API_KEY niet geconfigureerd — notificatie overgeslagen',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://klinkersenco.nl';
  const leadUrl = `${baseUrl}/admin/leads/${lead.id}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      replyTo: lead.email || undefined,
      subject: `Nieuwe aanvraag: ${lead.name}${lead.city ? ` (${lead.city})` : ''}`,
      html: buildNotificationHtml(lead, leadUrl),
    });

    if (error) {
      return { sent: false, reason: `Resend-fout: ${error.message}` };
    }
    return { sent: true, emailId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: `Notificatie versturen mislukt: ${message}` };
  }
}
