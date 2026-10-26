import { isOriginAllowed, parseAllowedOrigins } from '~server/origin';

describe('origin allowlist', () => {
  test('uses the first non-empty value and normalises hosts', () => {
    expect(parseAllowedOrigins('https://a.test, b.test:5179', 'ignored.test')).toEqual([
      'a.test',
      'b.test:5179',
    ]);
    expect(parseAllowedOrigins(undefined, 'fallback.test')).toEqual(['fallback.test']);
    expect(parseAllowedOrigins('', undefined)).toEqual([]);
  });

  test('matches only listed hosts', () => {
    const allowed = ['a.test', 'b.test:5179'];

    expect(isOriginAllowed('https://a.test', allowed)).toBe(true);
    expect(isOriginAllowed('https://b.test:5179', allowed)).toBe(true);
    expect(isOriginAllowed('https://evil.test', allowed)).toBe(false);
    expect(isOriginAllowed(null, allowed)).toBe(false);
    expect(isOriginAllowed('not a url', allowed)).toBe(false);
  });

  test('accepts every origin when the allowlist is empty', () => {
    expect(isOriginAllowed('https://evil.test', [])).toBe(true);
    expect(isOriginAllowed(null, [])).toBe(true);
  });
});
