import nodemailer from 'nodemailer';

export type DeliveryChannel = 'email' | 'whatsapp' | 'webhook';

export interface DeliveryChannelStatus {
  email: {
    configured: boolean;
    providers: ('resend' | 'smtp')[];
    fromAddress: string | null;
  };
  whatsapp: {
    configured: boolean;
    provider: 'meta_cloud_api' | null;
  };
  webhook: {
    configured: boolean;
  };
}

export interface DispatchMessageInput {
  channel: DeliveryChannel;
  recipient: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchMessageResult {
  success: boolean;
  channel: DeliveryChannel;
  provider: string;
  messageId?: string;
  error?: string;
}

export function getDeliveryChannelStatus(): DeliveryChannelStatus {
  const emailProviders: ('resend' | 'smtp')[] = [];
  if (process.env.RESEND_API_KEY?.trim()) {
    emailProviders.push('resend');
  }
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    emailProviders.push('smtp');
  }

  const fromAddress =
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    null;

  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );

  const webhookConfigured = Boolean(process.env.OUTBOUND_WEBHOOK_URL?.trim());

  return {
    email: {
      configured: emailProviders.length > 0,
      providers: emailProviders,
      fromAddress,
    },
    whatsapp: {
      configured: whatsappConfigured,
      provider: whatsappConfigured ? 'meta_cloud_api' : null,
    },
    webhook: {
      configured: webhookConfigured,
    },
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

async function sendViaResend(
  recipient: string,
  subject: string,
  content: string
): Promise<DispatchMessageResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    'OmniVectis <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text: content,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      channel: 'email',
      provider: 'resend',
      error: data?.message || data?.error || `Erreur Resend HTTP ${res.status}`,
    };
  }

  return {
    success: true,
    channel: 'email',
    provider: 'resend',
    messageId: data?.id || undefined,
  };
}

async function sendViaSmtp(
  recipient: string,
  subject: string,
  content: string
): Promise<DispatchMessageResult> {
  const host = process.env.SMTP_HOST?.trim() || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim() || '';
  const pass = process.env.SMTP_PASS?.trim() || '';
  const from = process.env.SMTP_FROM?.trim() || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
  });

  const info = await transporter.sendMail({
    from,
    to: recipient,
    subject,
    text: content,
  });

  return {
    success: true,
    channel: 'email',
    provider: 'smtp',
    messageId: info.messageId,
  };
}

async function sendViaWhatsAppCloudApi(
  recipient: string,
  content: string
): Promise<DispatchMessageResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '';
  const digits = normalizePhoneDigits(recipient);

  if (digits.length < 7) {
    return {
      success: false,
      channel: 'whatsapp',
      provider: 'meta_cloud_api',
      error: 'Numéro WhatsApp invalide (incluez l’indicatif pays, ex. 22790123456).',
    };
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: digits,
        type: 'text',
        text: {
          preview_url: false,
          body: content,
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      channel: 'whatsapp',
      provider: 'meta_cloud_api',
      error: data?.error?.message || `Erreur WhatsApp Cloud API HTTP ${res.status}`,
    };
  }

  return {
    success: true,
    channel: 'whatsapp',
    provider: 'meta_cloud_api',
    messageId: data?.messages?.[0]?.id,
  };
}

async function sendViaWebhook(
  recipient: string,
  subject: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<DispatchMessageResult> {
  const webhookUrl = process.env.OUTBOUND_WEBHOOK_URL?.trim() || '';
  const webhookSecret = process.env.OUTBOUND_WEBHOOK_SECRET?.trim() || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (webhookSecret) {
    headers['X-Webhook-Secret'] = webhookSecret;
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recipient,
      subject,
      content,
      sentAt: new Date().toISOString(),
      ...metadata,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      success: false,
      channel: 'webhook',
      provider: 'outbound_webhook',
      error: `Erreur webhook HTTP ${res.status}${text ? ` : ${text.slice(0, 140)}` : ''}`,
    };
  }

  return {
    success: true,
    channel: 'webhook',
    provider: 'outbound_webhook',
    messageId: `wh-${Date.now()}`,
  };
}

export async function dispatchValidatedMessage(
  input: DispatchMessageInput
): Promise<DispatchMessageResult> {
  const status = getDeliveryChannelStatus();
  const recipient = (input.recipient || '').trim();
  const subject = (input.subject || 'Suite à notre échange').trim();
  const content = (input.content || '').trim();

  if (!content) {
    return {
      success: false,
      channel: input.channel,
      provider: 'validation',
      error: 'Le contenu du message est vide.',
    };
  }

  if (input.channel === 'email') {
    if (!isValidEmail(recipient)) {
      return {
        success: false,
        channel: 'email',
        provider: 'validation',
        error: 'Adresse e-mail du destinataire manquante ou invalide.',
      };
    }

    if (!status.email.configured) {
      return {
        success: false,
        channel: 'email',
        provider: 'unconfigured',
        error:
          'Aucun service d’envoi e-mail configuré. Définissez RESEND_API_KEY ou SMTP_HOST / SMTP_USER / SMTP_PASS dans les secrets du serveur.',
      };
    }

    try {
      if (status.email.providers.includes('smtp')) {
        return await sendViaSmtp(recipient, subject, content);
      }
      return await sendViaResend(recipient, subject, content);
    } catch (err: any) {
      return {
        success: false,
        channel: 'email',
        provider: status.email.providers[0] || 'email',
        error: err?.message || 'Échec de l’envoi e-mail.',
      };
    }
  }

  if (input.channel === 'whatsapp') {
    if (!recipient) {
      return {
        success: false,
        channel: 'whatsapp',
        provider: 'validation',
        error: 'Numéro WhatsApp du destinataire requis.',
      };
    }
    if (!status.whatsapp.configured) {
      return {
        success: false,
        channel: 'whatsapp',
        provider: 'unconfigured',
        error:
          'WhatsApp Cloud API non configuré. Définissez WHATSAPP_ACCESS_TOKEN et WHATSAPP_PHONE_NUMBER_ID dans les secrets du serveur (ou utilisez le canal Webhook).',
      };
    }

    try {
      return await sendViaWhatsAppCloudApi(recipient, content);
    } catch (err: any) {
      return {
        success: false,
        channel: 'whatsapp',
        provider: 'meta_cloud_api',
        error: err?.message || 'Échec de l’envoi WhatsApp.',
      };
    }
  }

  if (input.channel === 'webhook') {
    if (!status.webhook.configured) {
      return {
        success: false,
        channel: 'webhook',
        provider: 'unconfigured',
        error:
          'Aucun webhook sortant configuré. Définissez OUTBOUND_WEBHOOK_URL dans les secrets du serveur.',
      };
    }
    try {
      return await sendViaWebhook(recipient, subject, content, input.metadata);
    } catch (err: any) {
      return {
        success: false,
        channel: 'webhook',
        provider: 'outbound_webhook',
        error: err?.message || 'Échec de l’appel webhook.',
      };
    }
  }

  return {
    success: false,
    channel: input.channel,
    provider: 'unknown',
    error: 'Canal d’envoi non pris en charge.',
  };
}
