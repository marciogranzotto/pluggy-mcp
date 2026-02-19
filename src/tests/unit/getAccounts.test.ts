import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetAccounts', () => {
  it('fetches /accounts with itemId and auth header', async () => {
    const { handleGetAccounts } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [] }),
    }));

    await handleGetAccounts({ itemId: 'item-abc' });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/accounts?itemId=item-abc',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetAccounts } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ message: 'Not found' }),
    }));

    const result = await handleGetAccounts({ itemId: 'bad' });
    expect(result.content[0].text).toContain('Error 404');
    expect(result.content[0].text).toContain('Not found');
  });
});
