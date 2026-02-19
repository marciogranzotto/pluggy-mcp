import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetCreditCardBills', () => {
  it('fetches /bills with accountId and auth header', async () => {
    const { handleGetCreditCardBills } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [] }),
    }));

    await handleGetCreditCardBills({ accountId: 'acc-999' });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/bills?accountId=acc-999',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetCreditCardBills } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({ message: 'Account not found' }),
    }));

    const result = await handleGetCreditCardBills({ accountId: 'bad' });
    expect(result.content[0].text).toContain('Error 404');
  });
});
