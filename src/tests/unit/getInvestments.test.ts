import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetInvestments', () => {
  it('fetches /investments with itemId and auth header', async () => {
    const { handleGetInvestments } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [] }),
    }));

    await handleGetInvestments({ itemId: 'item-123' });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/investments?itemId=item-123',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetInvestments } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 422, json: async () => ({ message: 'Invalid item' }),
    }));

    const result = await handleGetInvestments({ itemId: 'bad' });
    expect(result.content[0].text).toContain('Error 422');
  });
});
