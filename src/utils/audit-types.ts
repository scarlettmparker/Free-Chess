/**
 * @fileoverview Shared audit log types.
 * @module utils/audit-types
 */

/**
 * Whether an audited action completed.
 */
export type AuditOutcome = 'success' | 'failure';

/**
 * One recorded admin or auth event.
 */
export type AuditEvent = {
  /**
   * Row id.
   */
  id: number;
  /**
   * Unix timestamp in milliseconds.
   */
  createdAt: number;
  /**
   * Actor user id, when known.
   */
  actorId: string | null;
  /**
   * Actor email, when known.
   */
  actorEmail: string | null;
  /**
   * Dotted action name.
   */
  action: string;
  /**
   * Affected resource, when known.
   */
  target: string | null;
  /**
   * Whether the action completed.
   */
  outcome: AuditOutcome;
  /**
   * Error text or extra context.
   */
  detail: string | null;
  /**
   * Caller IP address, when known.
   */
  ip: string | null;
};
