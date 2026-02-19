# Pluggy MCP Testing Design

**Date:** 2026-02-19
**Goal:** Add unit and integration tests to the MCP server using Vitest.

## Approach

Extract handler logic into testable functions, then test them directly with a mocked `fetch` and mocked auth token. Add a minimal integration smoke test that hits the real Pluggy sandbox.

## Refactor: Extract Handlers

Split `src/index.ts` into three files:

- **`src/auth.ts`** — exports `getPluggyAccessToken()` (extracted from index.ts, unchanged logic)
- **`src/tools.ts`** — exports one named async function per tool: `handleGetAccounts`, `handleListConnectors`, `handleListItems`, `handleGetItem`, `handleGetTransactions`, `handleGetInvestments`, `handleGetLoans`, `handleGetCreditCardBills`, `handleGetIdentity`, `handleCreatePixPayment`
- **`src/index.ts`** — entry point only: imports handlers from tools.ts, registers them with `server.tool(...)`, starts transport

Each handler in `tools.ts` imports `getPluggyAccessToken` from `./auth.js` — this import can be mocked in tests.

## File Structure

```
src/
  auth.ts
  tools.ts
  index.ts
  tests/
    unit/
      getAccounts.test.ts
      listConnectors.test.ts
      listItems.test.ts
      getItem.test.ts
      getTransactions.test.ts
      getInvestments.test.ts
      getLoans.test.ts
      getCreditCardBills.test.ts
      getIdentity.test.ts
      createPixPayment.test.ts
    integration/
      smoke.test.ts
```

## Test Framework

**Vitest** — native ESM + TypeScript support, Jest-compatible API, clean `vi.fn()` mocking.

New dev dependencies: `vitest`

New npm scripts:
- `npm test` — run all tests
- `npm run test:unit` — unit tests only
- `npm run test:integration` — integration tests only (requires real env vars)

## Unit Test Pattern (per tool)

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handleGetAccounts } from '../../tools.js';

vi.mock('../../auth.js', () => ({ getPluggyAccessToken: vi.fn().mockResolvedValue('test-token') }));

describe('handleGetAccounts', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches the correct URL with auth header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await handleGetAccounts({ itemId: 'item-123' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pluggy.ai/accounts?itemId=item-123',
      expect.objectContaining({ headers: { 'X-API-KEY': 'test-token' } })
    );
  });

  it('returns error text when API responds with non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Item not found' }),
    }));

    const result = await handleGetAccounts({ itemId: 'bad-id' });
    expect(result.content[0].text).toContain('Error 404');
    expect(result.content[0].text).toContain('Item not found');
  });
});
```

## Tool-Specific Test Cases

| Tool | Extra cases |
|---|---|
| `getTransactions` | Optional params `from`/`to`/`page`/`pageSize` appear in URL only when provided |
| `createPixPayment` | Method is `POST`, body has correct `pixAlias` shape, `Content-Type` header present; `description` omitted when not provided |
| All read tools | Happy path URL + error path |

## Integration Smoke Test

```typescript
import { describe, it, expect } from 'vitest';
import { handleListItems } from '../../tools.js';

const hasCredentials = !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);

describe.skipIf(!hasCredentials)('Pluggy API smoke test', () => {
  it('listItems returns a results array', async () => {
    const result = await handleListItems({});
    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty('results');
    expect(Array.isArray(json.results)).toBe(true);
  });
});
```

## tsconfig Changes

Add `src/tests` to TypeScript include and set `rootDir` to `src` (already correct). Vitest handles transpilation — no separate tsconfig needed.
