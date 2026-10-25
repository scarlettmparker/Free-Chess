/**
 * @fileoverview User and session shapes shared by the admin UI.
 * @module utils/admin-user-types
 */

/**
 * Values collected by the create-user form.
 */
export type CreateUserValues = {
  /**
   * Email address used for sign-in.
   */
  email: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Initial password.
   */
  password: string;
  /**
   * Role assigned to the account.
   */
  role: string;
};

/**
 * Values collected by the edit-user form.
 */
export type EditUserValues = {
  /**
   * Display name.
   */
  name: string;
  /**
   * Email address used for sign-in.
   */
  email: string;
};

/**
 * Account shown in the admin list and detail panel.
 */
export type AdminUser = {
  /**
   * Account id.
   */
  id: string;
  /**
   * Email address used for sign-in.
   */
  email: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Comma-separated role field.
   */
  role: string;
  /**
   * Whether the account is banned.
   */
  banned: boolean;
  /**
   * Reason recorded for the ban.
   */
  banReason: string | null;
  /**
   * When the ban expires, if it does.
   */
  banExpires: string | null;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Last update timestamp.
   */
  updatedAt: string;
};

/**
 * Active session for an account.
 */
export type AdminUserSession = {
  /**
   * Session id.
   */
  id: string;
  /**
   * Session token used to revoke the session.
   */
  token: string;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Last update timestamp.
   */
  updatedAt: string;
  /**
   * Expiry timestamp.
   */
  expiresAt: string;
  /**
   * Client IP address, if recorded.
   */
  ipAddress: string | null;
  /**
   * Client user agent, if recorded.
   */
  userAgent: string | null;
};

/**
 * One page of accounts.
 */
export type AdminUserPage = {
  /**
   * Accounts on this page.
   */
  users: AdminUser[];
  /**
   * Total number of matching accounts.
   */
  total: number;
  /**
   * Zero-based page index.
   */
  page: number;
  /**
   * Accounts requested per page.
   */
  pageSize: number;
  /**
   * Total number of pages.
   */
  totalPages: number;
};

/**
 * Raw user record.
 */
type UserRecord = {
  /**
   * Account id.
   */
  id: string;
  /**
   * Email address.
   */
  email: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Comma-separated role field.
   */
  role?: string | null;
  /**
   * Ban flag.
   */
  banned?: boolean | null;
  /**
   * Ban reason.
   */
  banReason?: string | null;
  /**
   * Ban expiry.
   */
  banExpires?: Date | string | null;
  /**
   * Creation timestamp.
   */
  createdAt: Date | string;
  /**
   * Last update timestamp.
   */
  updatedAt: Date | string;
};

/**
 * Raw session record.
 */
type SessionRecord = {
  /**
   * Session id.
   */
  id: string;
  /**
   * Session token.
   */
  token: string;
  /**
   * Creation timestamp.
   */
  createdAt: Date | string;
  /**
   * Last update timestamp.
   */
  updatedAt: Date | string;
  /**
   * Expiry timestamp.
   */
  expiresAt: Date | string;
  /**
   * Client IP address.
   */
  ipAddress?: string | null;
  /**
   * Client user agent.
   */
  userAgent?: string | null;
};

/**
 * Converts a timestamp to ISO text.
 *
 * @param value Date, string, or null.
 * @returns ISO text, or null.
 */
function isoDate(value: Date | string | null | undefined) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * Converts a account record.
 *
 * @param user Raw user record.
 * @returns User shape used by the admin UI.
 */
export function toAdminUser(user: UserRecord): AdminUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
    banned: Boolean(user.banned),
    banReason: user.banReason ?? null,
    banExpires: isoDate(user.banExpires),
    createdAt: isoDate(user.createdAt) ?? "",
    updatedAt: isoDate(user.updatedAt) ?? "",
  };
}

/**
 * Converts a session record.
 *
 * @param session Raw session record.
 * @returns Session shape used by the admin UI.
 */
export function toAdminUserSession(session: SessionRecord): AdminUserSession {
  return {
    id: session.id,
    token: session.token,
    createdAt: isoDate(session.createdAt) ?? "",
    updatedAt: isoDate(session.updatedAt) ?? "",
    expiresAt: isoDate(session.expiresAt) ?? "",
    ipAddress: session.ipAddress ?? null,
    userAgent: session.userAgent ?? null,
  };
}

/**
 * Builds an empty page of accounts.
 *
 * @param page Zero-based page index.
 * @param pageSize Accounts requested per page.
 * @returns Empty page.
 */
export function emptyUserPage(page = 0, pageSize = 10): AdminUserPage {
  return {
    users: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
  };
}
