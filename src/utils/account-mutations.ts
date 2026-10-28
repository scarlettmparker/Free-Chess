import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument, getCookieValue } from '@sun/api';
import { DeactivateAccountDocument, type DeactivateAccountMutation } from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';

/**
 * Deactivates the signed-in account.
 */
defineMutation({
  path: 'gaia/deactivateAccount',
  async handler(_body, context) {
    const token = getCookieValue(context.cookie, AUTH_COOKIE);
    if (!token) throw new MutationError('Forbidden', 403);

    const result = await executeDocument<DeactivateAccountMutation>(
      DeactivateAccountDocument,
      {},
      token,
    );
    const data = result.data?.gaiaMutations.deactivateAccount;
    if (!data) {
      throw new MutationError(result.error ?? 'Failed to deactivate account', result.statusCode);
    }
    return data;
  },
});
