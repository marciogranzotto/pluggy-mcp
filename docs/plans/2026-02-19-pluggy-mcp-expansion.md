# Pluggy MCP Server Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the MCP server from 2 tools to a full personal finance assistant with item management, all Open Finance data products, and PIX payment initiation.

**Architecture:** Single file (`src/index.ts`) — add each tool following the same pattern: call `getPluggyAccessToken()`, fetch from `https://api.pluggy.ai/...` with `X-API-KEY` header, return `JSON.stringify(json, null, 2)`. No tests exist; verify each task with `npm run build` (TypeScript compile = correctness gate).

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, `zod`, Node.js native `fetch`

---

### Task 1: Fix error handling on existing tools

The current `getAccounts` swallows the error entirely; `listConnectors` leaks debug `console.error` calls. Update both to return the HTTP status and Pluggy error message.

**Files:**
- Modify: `src/index.ts:54-63` (getAccounts catch block)
- Modify: `src/index.ts:75-77` (listConnectors debug log)
- Modify: `src/index.ts:94-104` (listConnectors catch block)

**Step 1: Update getAccounts error handling**

Replace the catch block and also surface HTTP errors (not just thrown exceptions). In `src/index.ts`, replace the entire `getAccounts` handler body with:

```typescript
async ({ itemId }) => {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) {
      return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err}` }] };
  }
},
```

Also remove the unused `fullPrompt` parameter from the schema — it's not used in the handler and adds noise. Update the schema to just `{ itemId: z.string().describe("The Pluggy item ID to fetch accounts for") }`.

**Step 2: Update listConnectors error handling**

Replace the entire `listConnectors` handler body with:

```typescript
async () => {
  try {
    const accessToken = await getPluggyAccessToken();
    const response = await fetch('https://api.pluggy.ai/connectors', {
      headers: { 'X-API-KEY': accessToken },
    });
    const json = await response.json();
    if (!response.ok) {
      return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err}` }] };
  }
},
```

Also remove the unused `fullPrompt` parameter from its schema — update to `{}` (empty schema, no required params).

**Step 3: Build to verify**

```bash
npm run build
```
Expected: exits 0, no TypeScript errors, `dist/index.js` updated.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "fix: improve error handling and remove unused fullPrompt params"
```

---

### Task 2: Add `listItems`

Lists all Items (bank connections) so the AI can discover what connections exist and get their IDs without the user having to look them up manually.

**Pluggy endpoint:** `GET https://api.pluggy.ai/items`
Returns: `{ results: Item[], total: number }` where each Item has `id`, `status`, `connector.name`, `lastUpdatedAt`.

**Files:**
- Modify: `src/index.ts` — add tool before the transport lines

**Step 1: Add the tool**

Insert before `const transport = new StdioServerTransport();`:

```typescript
server.tool(
  "listItems",
  {},
  async () => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch('https://api.pluggy.ai/items', {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build**

```bash
npm run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add listItems tool"
```

---

### Task 3: Add `getItem`

Fetches a single Item by ID — useful for checking sync status and when data was last updated.

**Pluggy endpoint:** `GET https://api.pluggy.ai/items/:itemId`
Returns: Item object with `id`, `status`, `connector`, `lastUpdatedAt`, `error`.

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `listItems` tool, before `const transport`:

```typescript
server.tool(
  "getItem",
  {
    itemId: z.string().describe("The Pluggy item ID"),
  },
  async ({ itemId }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build**

```bash
npm run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add getItem tool"
```

---

### Task 4: Add `getTransactions`

Fetches transactions for a given account. Supports date range filtering and pagination — important for large transaction histories.

**Pluggy endpoint:** `GET https://api.pluggy.ai/transactions?accountId=<id>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&page=<n>&pageSize=<n>`
- `from` / `to`: ISO date strings (e.g. `2024-01-01`)
- `page`: 1-based page number (default: 1)
- `pageSize`: results per page (default: 20, max: 500)
- Returns: `{ results: Transaction[], total: number, totalPages: number, page: number }`

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `getItem` tool, before `const transport`:

```typescript
server.tool(
  "getTransactions",
  {
    accountId: z.string().describe("The Pluggy account ID to fetch transactions for"),
    from: z.string().optional().describe("Start date filter in YYYY-MM-DD format (e.g. 2024-01-01)"),
    to: z.string().optional().describe("End date filter in YYYY-MM-DD format (e.g. 2024-12-31)"),
    page: z.number().optional().describe("Page number, 1-based (default: 1)"),
    pageSize: z.number().optional().describe("Results per page, max 500 (default: 20)"),
  },
  async ({ accountId, from, to, page, pageSize }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const params = new URLSearchParams({ accountId });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (page) params.set('page', String(page));
      if (pageSize) params.set('pageSize', String(pageSize));
      const response = await fetch(`https://api.pluggy.ai/transactions?${params}`, {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build**

```bash
npm run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add getTransactions tool with date filters and pagination"
```

---

### Task 5: Add `getInvestments`

Fetches investment portfolios and holdings for an item.

**Pluggy endpoint:** `GET https://api.pluggy.ai/investments?itemId=<id>`
Returns: `{ results: Investment[], total: number }` — each Investment has `type`, `name`, `balance`, `quantity`, `value`, `date`.

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `getTransactions` tool, before `const transport`:

```typescript
server.tool(
  "getInvestments",
  {
    itemId: z.string().describe("The Pluggy item ID to fetch investments for"),
  },
  async ({ itemId }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch(`https://api.pluggy.ai/investments?itemId=${itemId}`, {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build + Commit**

```bash
npm run build
git add src/index.ts
git commit -m "feat: add getInvestments tool"
```

---

### Task 6: Add `getLoans`

Fetches loan details for an item, including outstanding balance and payment schedule.

**Pluggy endpoint:** `GET https://api.pluggy.ai/loans?itemId=<id>`
Returns: `{ results: Loan[], total: number }`.

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `getInvestments` tool, before `const transport`:

```typescript
server.tool(
  "getLoans",
  {
    itemId: z.string().describe("The Pluggy item ID to fetch loans for"),
  },
  async ({ itemId }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch(`https://api.pluggy.ai/loans?itemId=${itemId}`, {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build + Commit**

```bash
npm run build
git add src/index.ts
git commit -m "feat: add getLoans tool"
```

---

### Task 7: Add `getCreditCardBills`

Fetches credit card bills for a credit card account.

**Pluggy endpoint:** `GET https://api.pluggy.ai/bills?accountId=<id>`
Returns: `{ results: Bill[], total: number }` — each Bill has `date`, `totalAmount`, `totalCumulativeAmount`, `minPaymentAmount`, `paymentDate`, `isPaymentMade`.

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `getLoans` tool, before `const transport`:

```typescript
server.tool(
  "getCreditCardBills",
  {
    accountId: z.string().describe("The Pluggy account ID for the credit card account"),
  },
  async ({ accountId }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch(`https://api.pluggy.ai/bills?accountId=${accountId}`, {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build + Commit**

```bash
npm run build
git add src/index.ts
git commit -m "feat: add getCreditCardBills tool"
```

---

### Task 8: Add `getIdentity`

Fetches user identity/personal data associated with an item (name, CPF, email, address, phone).

**Pluggy endpoint:** `GET https://api.pluggy.ai/identity?itemId=<id>`
Returns: Identity object with `fullName`, `document`, `documentType`, `birthDate`, `phoneNumbers`, `emails`, `addresses`.

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `getCreditCardBills` tool, before `const transport`:

```typescript
server.tool(
  "getIdentity",
  {
    itemId: z.string().describe("The Pluggy item ID to fetch identity data for"),
  },
  async ({ itemId }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch(`https://api.pluggy.ai/identity?itemId=${itemId}`, {
        headers: { 'X-API-KEY': accessToken },
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build + Commit**

```bash
npm run build
git add src/index.ts
git commit -m "feat: add getIdentity tool"
```

---

### Task 9: Add `createPixPayment`

Creates a PIX payment request. This is the first write operation — it initiates a payment but does **not** execute it; the user still authorizes via the Connect Widget.

**Pluggy endpoint:** `POST https://api.pluggy.ai/payments/requests`
Request body:
```json
{
  "type": "PIX",
  "pixAlias": { "type": "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP", "value": "<key>" },
  "amount": 100.00,
  "description": "Optional description",
  "callbackUrls": { "error": "...", "success": "..." }   // optional
}
```
Returns: Payment request object with `id`, `status`, `pixAlias`, `amount`.

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the tool**

Insert after `getIdentity` tool, before `const transport`:

```typescript
server.tool(
  "createPixPayment",
  {
    pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]).describe("The type of the PIX key"),
    pixKey: z.string().describe("The PIX key value (CPF, CNPJ, email, phone, or random EVP key)"),
    amount: z.number().describe("Payment amount in BRL (e.g. 150.00)"),
    description: z.string().optional().describe("Optional payment description visible to recipient"),
  },
  async ({ pixKeyType, pixKey, amount, description }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const body: Record<string, unknown> = {
        type: "PIX",
        pixAlias: { type: pixKeyType, value: pixKey },
        amount,
      };
      if (description) body.description = description;
      const response = await fetch('https://api.pluggy.ai/payments/requests', {
        method: 'POST',
        headers: {
          'X-API-KEY': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) {
        return { content: [{ type: "text", text: `Error ${response.status}: ${json?.message ?? JSON.stringify(json)}` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  },
);
```

**Step 2: Build**

```bash
npm run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add createPixPayment tool"
```

---

### Task 10: Final build and summary commit

**Step 1: Full clean build**

```bash
npm run build
```
Expected: exits 0, `dist/index.js` contains all 10 tools.

**Step 2: Update CLAUDE.md tool list**

In `CLAUDE.md`, under the Architecture section, update the tool list to document all current tools:

```markdown
### Current tools

| Tool | Endpoint | Key params |
|---|---|---|
| `listConnectors` | `GET /connectors` | — |
| `getAccounts` | `GET /accounts` | `itemId` |
| `listItems` | `GET /items` | — |
| `getItem` | `GET /items/:itemId` | `itemId` |
| `getTransactions` | `GET /transactions` | `accountId`, `from`, `to`, `page`, `pageSize` |
| `getInvestments` | `GET /investments` | `itemId` |
| `getLoans` | `GET /loans` | `itemId` |
| `getCreditCardBills` | `GET /bills` | `accountId` |
| `getIdentity` | `GET /identity` | `itemId` |
| `createPixPayment` | `POST /payments/requests` | `pixKeyType`, `pixKey`, `amount`, `description` |
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with full tool list"
```
