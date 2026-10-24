/**
 * @fileoverview Direct user provisioning helpers.
 * @module server/users
 */

import type { createAuth } from './auth.ts';
import { defaultRole, roles } from './permissions.ts';

/**
 * Auth instance returned by `createAuth`.
 */
type Auth = ReturnType<typeof createAuth>;

/**
 * Fields accepted when provisioning a user directly.
 */
export type CreateUserInput = {
  /**
   * Email address used for sign-in.
   */
  email: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Initial password. Omit for a user who signs in another way.
   */
  password?: string;
  /**
   * Role assigned to the user.
   */
  role?: string;
};

/**
 * Creates a user without going through a public sign-up route.
 *
 * @param auth Auth instance to write to.
 * @param input Fields for the new user.
 * @returns The created user record.
 */
export async function createUser(auth: Auth, input: CreateUserInput) {
  const email = input.email.trim().toLowerCase();
  const role = input.role || defaultRole;
  if (!(role in roles)) {
    throw new Error(`Unknown role: ${role}`);
  }
  if (input.password && input.password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }

  const context = await auth.$context;
  const existing = await context.internalAdapter.findUserByEmail(email, {
    includeAccounts: false,
  });
  if (existing) {
    throw new Error(`User already exists: ${email}`);
  }

  const user = await context.internalAdapter.createUser(
    {
      email,
      name: input.name,
      emailVerified: true,
      role,
      banned: false,
    },
    { method: 'admin' },
  );

  if (input.password) {
    await context.internalAdapter.linkAccount({
      providerId: 'credential',
      accountId: user.id,
      password: await context.password.hash(input.password),
      userId: user.id,
    });
  }

  return user;
}
