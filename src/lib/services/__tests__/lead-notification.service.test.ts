/**
 * Lead-notificatie — bij elke nieuwe aanvraag via het websiteformulier gaat
 * er een mail naar info@klinkersenco.nl. Eisen:
 * - zonder RESEND_API_KEY wordt er niets verstuurd (sent: false + reden),
 * - met key wordt Resend aangeroepen met de juiste ontvanger, reply-to en inhoud,
 * - een Resend-fout of exception breekt de aanroeper nooit (nooit throwen),
 * - klantinvoer wordt HTML-escaped (formulier is publiek).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendLeadNotification } from '../lead-notification.service';

const baseLead = {
  id: 'lead-123',
  name: 'Jan Jansen',
  email: 'jan@example.com',
  phone: '0612345678',
  address: 'Dorpsstraat 1',
  city: 'Gouda',
  description: 'Oprit van 40 m² herstraten',
};

describe('sendLeadNotification', () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('slaat verzenden over zonder RESEND_API_KEY', async () => {
    vi.stubEnv('RESEND_API_KEY', '');

    const result = await sendLeadNotification(baseLead);

    expect(result.sent).toBe(false);
    expect(result.reason).toContain('RESEND_API_KEY');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('stuurt de notificatie naar info@klinkersenco.nl met reply-to van de klant', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const result = await sendLeadNotification(baseLead);

    expect(result).toEqual({ sent: true, emailId: 'email-1' });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('info@klinkersenco.nl');
    expect(args.replyTo).toBe('jan@example.com');
    expect(args.subject).toContain('Jan Jansen');
    expect(args.html).toContain('Oprit van 40 m² herstraten');
    expect(args.html).toContain('0612345678');
    expect(args.html).toContain('/admin/leads/lead-123');
  });

  it('laat reply-to weg als de klant geen e-mailadres opgaf', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    sendMock.mockResolvedValue({ data: { id: 'email-2' }, error: null });

    await sendLeadNotification({ ...baseLead, email: undefined });

    expect(sendMock.mock.calls[0][0].replyTo).toBeUndefined();
  });

  it('escapet HTML in klantinvoer', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    sendMock.mockResolvedValue({ data: { id: 'email-3' }, error: null });

    await sendLeadNotification({
      ...baseLead,
      description: '<script>alert(1)</script>',
    });

    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('geeft sent: false terug bij een Resend-fout, zonder te throwen', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });

    const result = await sendLeadNotification(baseLead);

    expect(result.sent).toBe(false);
    expect(result.reason).toContain('domain not verified');
  });

  it('vangt exceptions van Resend af, zonder te throwen', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    sendMock.mockRejectedValue(new Error('netwerk kapot'));

    const result = await sendLeadNotification(baseLead);

    expect(result.sent).toBe(false);
    expect(result.reason).toContain('netwerk kapot');
  });
});
