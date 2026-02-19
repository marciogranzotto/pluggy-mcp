import { vi, describe, it, expect, afterEach } from 'vitest';
import { getPluggyAccessToken } from '../../auth.js';

afterEach(() => { vi.unstubAllGlobals(); });

describe('getPluggyAccessToken', () => {
  it('POSTs credentials to /auth and returns the apiKey', async () => {
    process.env.PLUGGY_CLIENT_ID = 'test-id';
    process.env.PLUGGY_CLIENT_SECRET = 'test-secret';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ apiKey: 'my-api-key' }),
    }));

    const token = await getPluggyAccessToken();

    expect(token).toBe('my-api-key');
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/auth',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' }),
      })
    );
  });
});
