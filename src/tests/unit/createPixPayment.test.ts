import { vi, describe, it, expect, afterEach } from 'vitest';

vi.mock('../../auth.js', () => ({
  getPluggyAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

afterEach(() => { vi.unstubAllGlobals(); });

describe('handleCreatePixPayment', () => {
  it('POSTs to /payments/requests with correct body and headers', async () => {
    const { handleCreatePixPayment } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ id: 'payment-1', status: 'CREATED' }),
    }));

    await handleCreatePixPayment({
      pixKeyType: 'EMAIL',
      pixKey: 'user@example.com',
      amount: 100.50,
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.pluggy.ai/payments/requests',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-KEY': 'test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          type: 'PIX',
          pixAlias: { type: 'EMAIL', value: 'user@example.com' },
          amount: 100.50,
        }),
      })
    );
  });

  it('includes description in body when provided', async () => {
    const { handleCreatePixPayment } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ id: 'payment-2' }),
    }));

    await handleCreatePixPayment({
      pixKeyType: 'CPF',
      pixKey: '123.456.789-00',
      amount: 50,
      description: 'Aluguel',
    });

    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.description).toBe('Aluguel');
  });

  it('omits description from body when not provided', async () => {
    const { handleCreatePixPayment } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ id: 'payment-3' }),
    }));

    await handleCreatePixPayment({ pixKeyType: 'EVP', pixKey: 'random-key', amount: 10 });

    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body).not.toHaveProperty('description');
  });

  it('returns error text on non-ok response', async () => {
    const { handleCreatePixPayment } = await import('../../tools.js');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 422, json: async () => ({ message: 'Invalid PIX key' }),
    }));

    const result = await handleCreatePixPayment({ pixKeyType: 'CPF', pixKey: 'bad', amount: 10 });
    expect(result.content[0].text).toContain('Error 422');
    expect(result.content[0].text).toContain('Invalid PIX key');
  });
});
