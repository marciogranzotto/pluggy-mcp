import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetIdentity', () => {
  it('fetches /identity with itemId and auth header', async () => {
    const { handleGetIdentity } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ fullName: 'Jo\u00e3o Silva' }),
    }));

    await handleGetIdentity({ itemId: 'item-123' });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/identity?itemId=item-123',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetIdentity } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ message: 'Not found' }),
    }));

    const result = await handleGetIdentity({ itemId: 'bad' });
    expect(result.content[0].text).toContain('Error 404');
  });
});
