import { isPieceReadOnly } from '~/utils/piece-access';

describe('isPieceReadOnly', () => {
  test('system pieces are always read-only', () => {
    expect(isPieceReadOnly({ isSystem: true, createdBy: 'me' }, 'me')).toBe(true);
  });

  test('pieces owned by the caller are editable', () => {
    expect(isPieceReadOnly({ isSystem: false, createdBy: 'me' }, 'me')).toBe(false);
  });

  test("other accounts' pieces are read-only", () => {
    expect(isPieceReadOnly({ isSystem: false, createdBy: 'them' }, 'me')).toBe(true);
  });

  test('unowned pieces are read-only', () => {
    expect(isPieceReadOnly({ isSystem: false, createdBy: null }, 'me')).toBe(true);
  });

  test('pieces are read-only without a signed-in account', () => {
    expect(isPieceReadOnly({ isSystem: false, createdBy: 'me' }, null)).toBe(true);
  });
});
