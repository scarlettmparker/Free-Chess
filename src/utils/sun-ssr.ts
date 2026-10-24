import type { ComponentType, ReactNode } from 'react';
import { CsrfField as CsrfFieldComponent, RoleCheck as RoleCheckComponent } from '@sun/ssr/react';

/**
 * React-typed view of the Preact CSRF field.
 */
export const CsrfField = CsrfFieldComponent as unknown as ComponentType;

/**
 * React-typed view of the Preact role gate.
 */
export const RoleCheck = RoleCheckComponent as unknown as ComponentType<{
  /**
   * Roles the user must hold.
   */
  roles: string[];
  /**
   * Whether every role or any role is enough.
   */
  match?: 'all' | 'any';
  /**
   * Content rendered when the check passes.
   */
  children?: ReactNode;
}>;
