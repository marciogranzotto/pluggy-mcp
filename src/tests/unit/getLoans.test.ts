import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetLoans', () => {
  it('fetches /loans with itemId and auth header', async () => {
    const { handleGetLoans } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [] }),
    }));

    await handleGetLoans({ itemId: 'item-123' });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/loans?itemId=item-123',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetLoans } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ message: 'Not found' }),
    }));

    const result = await handleGetLoans({ itemId: 'bad' });
    expect(result.content[0].text).toContain('Error 404');
  });
});
