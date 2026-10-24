/**
 * @fileoverview Gmail SMTP transport for transactional email.
 * @module server/mailer
 */

import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Message handed to the transport.
 */
export type MailMessage = {
  /**
   * Recipient address.
   */
  to: string;
  /**
   * Subject line.
   */
  subject: string;
  /**
   * Plain-text body.
   */
  text: string;
  /**
   * HTML body.
   */
  html: string;
};

/**
 * Resolved SMTP settings.
 */
export type MailConfig = {
  /**
   * SMTP host.
   */
  host: string;
  /**
   * SMTP port.
   */
  port: number;
  /**
   * Whether the port expects implicit TLS.
   */
  secure: boolean;
  /**
   * SMTP username.
   */
  user: string;
  /**
   * SMTP password.
   */
  password: string;
  /**
   * From header.
   */
  from: string;
};

let transporter: Transporter | null = null;

/**
 * Reads SMTP settings from the environment.
 *
 * @returns Resolved mail configuration.
 */
export function mailConfig(): MailConfig {
  const user = process.env.SMTP_USER?.trim() || '';
  const port = Number(process.env.SMTP_PORT || '587');

  return {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure: port === 465,
    user,
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM?.trim() || user,
  };
}

/**
 * Checks whether credentials are present.
 *
 * @returns True when the transport can authenticate.
 */
export function isMailerConfigured() {
  const { user, password } = mailConfig();
  return Boolean(user && password);
}

/**
 * Creates the shared SMTP transport on first use.
 *
 * @returns Configured transport.
 */
function getTransporter() {
  if (transporter) return transporter;

  const { host, port, secure, user, password } = mailConfig();
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  return transporter;
}

/**
 * Sends one email, or logs it when mail is not configured in development.
 *
 * @param message Message to deliver.
 */
export async function sendMail(message: MailMessage) {
  if (!isMailerConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured');
    }

    console.info(`[mail] ${message.subject} -> ${message.to}\n${message.text}`);
    return;
  }

  const { from } = mailConfig();
  await getTransporter().sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
