import type { ComponentType, ReactNode } from 'react';
import { RoleCheck as RoleCheckComponent } from '@sun/ssr/react';

/**
 * React-typed view of the Preact role gate.
 */
const RoleCheck = RoleCheckComponent as ComponentType<{
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

export default RoleCheck;
