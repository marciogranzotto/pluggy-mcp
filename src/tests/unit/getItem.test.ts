import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetItem', () => {
  it('fetches /items/:itemId with auth header', async () => {
    const { handleGetItem } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ id: 'item-xyz', status: 'UPDATED' }),
    }));

    await handleGetItem({ itemId: 'item-xyz' });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/items/item-xyz',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetItem } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ message: 'Item not found' }),
    }));

    const result = await handleGetItem({ itemId: 'bad' });
    expect(result.content[0].text).toContain('Error 404');
    expect(result.content[0].text).toContain('Item not found');
  });
});
