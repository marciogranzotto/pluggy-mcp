import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleGetTransactions', () => {
  it('fetches /transactions with required accountId', async () => {
    const { handleGetTransactions } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [], total: 0 }),
    }));

    await handleGetTransactions({ accountId: 'acc-123' });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('accountId=acc-123');
    expect(url).not.toContain('from=');
    expect(url).not.toContain('to=');
    expect(url).not.toContain('page=');
    expect(url).not.toContain('pageSize=');
  });

  it('includes optional params in URL when provided', async () => {
    const { handleGetTransactions } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [] }),
    }));

    await handleGetTransactions({
      accountId: 'acc-123',
      from: '2024-01-01',
      to: '2024-12-31',
      page: 2,
      pageSize: 50,
    });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('from=2024-01-01');
    expect(url).toContain('to=2024-12-31');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=50');
  });

  it('returns error text on non-ok response', async () => {
    const { handleGetTransactions } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, json: async () => ({ message: 'Bad request' }),
    }));

    const result = await handleGetTransactions({ accountId: 'bad' });
    expect(result.content[0].text).toContain('Error 400');
  });
});
