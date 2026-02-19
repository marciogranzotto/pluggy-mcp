import { getPluggyAccessToken } from './auth.js';

type ToolResponse = { content: Array<{ type: 'text'; text: string }> };

function okResponse(json: unknown): ToolResponse {
  return { content: [{ type: 'text', text: JSON.stringify(json, null, 2) }] };
}

function errorResponse(status: number, message: string): ToolResponse {
  return { content: [{ type: 'text', text: `Error ${status}: ${message}` }] };
}

function caughtResponse(err: unknown): ToolResponse {
  return { content: [{ type: 'text', text: `Error: ${err}` }] };
}

export async function handleGetAccounts({ itemId }: { itemId: string }): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleListConnectors(_params: Record<string, never>): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch('https://api.pluggy.ai/connectors', {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleListItems(_params: Record<string, never>): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch('https://api.pluggy.ai/items', {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleGetItem({ itemId }: { itemId: string }): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleGetTransactions(params: {
  accountId: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const searchParams = new URLSearchParams({ accountId: params.accountId });
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const response = await fetch(`https://api.pluggy.ai/transactions?${searchParams}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleGetInvestments({ itemId }: { itemId: string }): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/investments?itemId=${itemId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleGetLoans({ itemId }: { itemId: string }): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/loans?itemId=${itemId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleGetCreditCardBills({ accountId }: { accountId: string }): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/bills?accountId=${accountId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleGetIdentity({ itemId }: { itemId: string }): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/identity?itemId=${itemId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}

export async function handleCreatePixPayment(params: {
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  pixKey: string;
  amount: number;
  description?: string;
}): Promise<ToolResponse> {
  try {
    const accessToken = await getPluggyAccessToken();
    const body: Record<string, unknown> = {
      type: 'PIX',
      pixAlias: { type: params.pixKeyType, value: params.pixKey },
      amount: params.amount,
    };
    if (params.description) body.description = params.description;
    const response = await fetch('https://api.pluggy.ai/payments/requests', {
      method: 'POST',
      headers: {
        'X-API-KEY': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) return errorResponse(response.status, json?.message ?? JSON.stringify(json));
    return okResponse(json);
  } catch (err) { return caughtResponse(err); }
}
