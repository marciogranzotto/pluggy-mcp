import { describe, it, expect } from 'vitest';
import { handleListConnectors, handleGetItem, handleGetAccounts, handleGetTransactions } from '../../tools.js';

const hasCredentials = !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);
const hasItemId = !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET && process.env.PLUGGY_ITEM_ID);

describe.skipIf(!hasCredentials)('auth smoke test', () => {
  it('listConnectors returns a results array', async () => {
    const result = await handleListConnectors({});
    expect(result.content[0].text).not.toMatch(/^Error/);
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('results');
    expect(Array.isArray(json.results)).toBe(true);
  });
});

describe.skipIf(!hasItemId)('data flow smoke test (requires PLUGGY_ITEM_ID)', () => {
  const itemId = process.env.PLUGGY_ITEM_ID!;

  it('getItem returns item status', async () => {
    const result = await handleGetItem({ itemId });
    expect(result.content[0].text).not.toMatch(/^Error/);
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('id', itemId);
    expect(json).toHaveProperty('status');
  });

  it('getAccounts returns accounts for the item', async () => {
    const result = await handleGetAccounts({ itemId });
    expect(result.content[0].text).not.toMatch(/^Error/);
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('results');
    expect(Array.isArray(json.results)).toBe(true);
  });

  it('getTransactions returns transactions for the first account', async () => {
    const accountsResult = await handleGetAccounts({ itemId });
    const accounts = JSON.parse(accountsResult.content[0].text);
    if (accounts.results.length === 0) {
      console.log('No accounts found for item — skipping transactions check');
      return;
    }

    const accountId = accounts.results[0].id;
    const result = await handleGetTransactions({ accountId, pageSize: 5 });
    expect(result.content[0].text).not.toMatch(/^Error/);
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('results');
    expect(Array.isArray(json.results)).toBe(true);
  });
});
