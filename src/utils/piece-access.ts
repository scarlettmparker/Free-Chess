import type { MedusaPieceDefinitionDto } from '~/utils/piece-types';

/**
 * Whether a piece is read-only for the signed-in account.
 *
 * @param piece Piece definition.
 * @param currentUserId Signed-in account id, or null when unknown.
 * @returns True when the piece cannot be edited or deleted.
 */
export function isPieceReadOnly(
  piece: Pick<MedusaPieceDefinitionDto, 'isSystem' | 'createdBy'>,
  currentUserId: string | null | undefined,
): boolean {
  if (piece.isSystem) return true;
  if (!piece.createdBy || !currentUserId) return true;
  return piece.createdBy !== currentUserId;
}
