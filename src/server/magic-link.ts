/**
 * @fileoverview Magic-link plugin configuration and email construction.
 * @module server/magic-link
 */

import { magicLink } from 'better-auth/plugins';
import type { MailMessage } from './mailer.ts';
import { sendMail } from './mailer.ts';

/**
 * Delivers one magic-link message.
 */
export type SendMagicLink = (message: MailMessage) => Promise<void>;

/**
 * Link lifetime in minutes.
 */
const linkMinutes = 15;

/**
 * Builds the app-owned verify URL carried by the email.
 *
 * @param token Verification token.
 * @param redirect Page to open after sign-in.
 * @returns Absolute verify URL.
 */
export function appMagicLinkUrl(token: string, redirect: string) {
  const baseURL =
    process.env.BETTER_AUTH_URL || `http://localhost:${process.env.SERVER_PORT || 5179}`;
  const url = new URL('/__magic-link/verify', baseURL);
  url.searchParams.set('token', token);
  url.searchParams.set('redirect', redirect);
  return url.toString();
}

/**
 * Builds the email sent for a sign-in link.
 *
 * @param email Recipient address.
 * @param url Verify URL.
 * @returns Message ready for the transport.
 */
export function magicLinkMessage(email: string, url: string): MailMessage {
  return {
    to: email,
    subject: 'Sign in to Free Chess',
    text: [
      "Here's your sign-in link for Free Chess.",
      '',
      url,
      '',
      `It works once and expires in ${linkMinutes} minutes. If you didn't ask for it, ignore this email.`,
    ].join('\n'),
    html: [
      "<p>Here's your sign-in link for Free Chess.</p>",
      `<p><a href="${url}">Sign in</a></p>`,
      `<p>It works once and expires in ${linkMinutes} minutes. If you didn't ask for it, ignore this email.</p>`,
    ].join(''),
  };
}

/**
 * Creates the magic-link plugin.
 *
 * @param send Email sender. Defaults to SMTP.
 * @returns Configured better-auth plugin.
 */
export function createMagicLink(send: SendMagicLink = sendMail) {
  return magicLink({
    expiresIn: linkMinutes * 60,
    disableSignUp: true,
    storeToken: 'hashed',
    async sendMagicLink({ email, token, metadata }) {
      const redirect = typeof metadata?.redirect === 'string' ? metadata.redirect : '/';
      await send(magicLinkMessage(email, appMagicLinkUrl(token, redirect)));
    },
  });
}
