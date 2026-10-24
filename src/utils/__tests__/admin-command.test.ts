import { runAdminCommand } from '../admin-command';

/**
 * Builds a fetch stub returning one JSON response.
 *
 * @param status HTTP status.
 * @param body JSON body.
 * @returns Fetch stub.
 */
function jsonFetch(status: number, body: unknown) {
  return vi.fn(async () => Response.json(body, { status })) as unknown as typeof fetch;
}

describe('runAdminCommand', () => {
  test('posts to the command path with the bearer token', async () => {
    const fetchImpl = jsonFetch(200, { ok: true, message: 'ok', sessions: [] });

    const result = await runAdminCommand('list', {
      baseUrl: 'http://admin.test/',
      token: 'secret',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://admin.test/list',
      expect.objectContaining({
        method: 'POST',
        headers: { authorization: 'Bearer secret' },
      }),
    );
    expect(result).toMatchObject({ ok: true, message: 'ok', sessions: [] });
  });

  test('returns soft failures from the worker', async () => {
    const fetchImpl = jsonFetch(400, { ok: false, message: 'No colours to clear' });

    const result = await runAdminCommand('clear', { fetchImpl });

    expect(result).toMatchObject({ ok: false, message: 'No colours to clear' });
  });

  test('maps rejected credentials to an unavailable API error', async () => {
    const fetchImpl = jsonFetch(401, { error: 'Unauthorized' });

    await expect(runAdminCommand('reset', { fetchImpl })).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  test('maps server errors to an unavailable API error', async () => {
    const fetchImpl = jsonFetch(500, { error: 'boom' });

    await expect(runAdminCommand('reset', { fetchImpl })).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  test('maps network failures to an unavailable API error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    await expect(runAdminCommand('reset', { fetchImpl })).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  test('rejects unexpected payloads', async () => {
    const fetchImpl = jsonFetch(200, { ok: 'yes' });

    await expect(runAdminCommand('reset', { fetchImpl })).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});
