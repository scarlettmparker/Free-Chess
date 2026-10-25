/**
 * @fileoverview Login page options.
 * @module utils/login-data
 */

import { defineLoader } from '@sun/ssr';

/**
 * Sign-in providers available on the login page.
 */
export type LoginOptions = {
  /**
   * Whether Google sign-in has credentials configured.
   */
  google: boolean;
};

defineLoader({
  pattern: 'loginOptions',
  async loader() {
    return { loginOptions: { google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) } };
  },
});