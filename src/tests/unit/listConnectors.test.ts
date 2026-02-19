import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleListConnectors', () => {
  it('fetches /connectors with auth header', async () => {
    const { handleListConnectors } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [] }),
    }));

    await handleListConnectors({});

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/connectors',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleListConnectors } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }),
    }));

    const result = await handleListConnectors({});
    expect(result.content[0].text).toContain('Error 401');
  });
});
