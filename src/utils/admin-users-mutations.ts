import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import {
  RegisterAccountDocument,
  SetAccountRolesDocument,
  SetAccountPasswordDocument,
  DeleteAccountDocument,
  SuspendAccountDocument,
  UnsuspendAccountDocument,
  type RegisterAccountMutation,
  type SetAccountRolesMutation,
  type SetAccountPasswordMutation,
  type DeleteAccountMutation,
  type SuspendAccountMutation,
  type UnsuspendAccountMutation,
} from '~/generated/graphql';


/**
 * Body for creating a user.
 */
type CreateUserBody = {
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

type SetRoleBody = {
  userId: string;
  role: string;
};

type SetPasswordBody = {
  userId: string;
  password: string;
};

type BanBody = {
  userId: string;
  reason?: string;
  expiresInDays?: number;
};

type UserIdBody = {
  userId: string;
};

function assertPassword(password: string) {
  if (password.length < 12) throw new MutationError('Password must be at least 12 characters', 400);
}

defineMutation({
  path: 'user/create',
  async handler(body: CreateUserBody) {
    assertPassword(body.password);
    const reg = await executeDocument<RegisterAccountMutation>(RegisterAccountDocument, {
      input: { username: body.email.trim().toLowerCase(), password: body.password, firstName: body.name.trim(), lastName: '', email: body.email.trim().toLowerCase() },
    });
    if (!reg.success || !reg.data?.gaiaMutations.register) throw new MutationError(reg.error ?? 'Failed to create user');
    const accountId = reg.data.gaiaMutations.register.accountId;
    await executeDocument<SetAccountRolesMutation>(SetAccountRolesDocument, { accountId, roleNames: [body.role] });
    return { id: accountId };
  },
});

defineMutation({
  path: 'user/set-role',
  async handler(body: SetRoleBody) {
    const result = await executeDocument<SetAccountRolesMutation>(SetAccountRolesDocument, {
      accountId: body.userId,
      roleNames: [body.role],
    });
    if (!result.success) throw new MutationError(result.error ?? 'Failed to set role');
    return { ok: true };
  },
});

defineMutation({
  path: 'user/set-password',
  async handler(body: SetPasswordBody) {
    assertPassword(body.password);
    const result = await executeDocument<SetAccountPasswordMutation>(SetAccountPasswordDocument, {
      accountId: body.userId,
      newPassword: body.password,
    });
    if (!result.success) throw new MutationError(result.error ?? 'Failed to set password');
    return { status: true };
  },
});

defineMutation({
  path: 'user/ban',
  async handler(body: BanBody) {
    const result = await executeDocument<SuspendAccountMutation>(SuspendAccountDocument, { id: body.userId });
    if (!result.success) throw new MutationError(result.error ?? 'Failed to ban user');
    return { ok: true };
  },
});

defineMutation({
  path: 'user/unban',
  async handler(body: UserIdBody) {
    const result = await executeDocument<UnsuspendAccountMutation>(UnsuspendAccountDocument, { id: body.userId });
    if (!result.success) throw new MutationError(result.error ?? 'Failed to unban user');
    return { ok: true };
  },
});

defineMutation({
  path: 'user/delete',
  async handler(body: UserIdBody) {
    const result = await executeDocument<DeleteAccountMutation>(DeleteAccountDocument, { id: body.userId });
    if (!result.success) throw new MutationError(result.error ?? 'Failed to delete user');
    return { ok: true };
  },
});