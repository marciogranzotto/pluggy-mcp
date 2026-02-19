# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript to dist/ (also runs on npm install via prepare)
npm run watch            # Watch mode for development (hot-reload on save)
npm test                 # Run all tests
npm run test:unit        # Unit tests only (no credentials needed)
npm run test:integration # Integration smoke test (requires real credentials)
npm run test:watch       # Vitest watch mode
```

## Architecture

This is an MCP (Model Context Protocol) server that exposes Pluggy financial API endpoints as tools for AI assistants.

- **`src/index.ts`** — entry point: wiring only, registers tools with the MCP server and starts the transport
- **`src/tools.ts`** — all 9 tool handler functions (exported, directly testable)
- **`src/auth.ts`** — exports `getPluggyAccessToken()`, called on every tool invocation
- **Transport**: `StdioServerTransport` — communicates over stdin/stdout, must be launched as a subprocess by an MCP client (e.g. Cursor)
- **Compiled output**: `dist/index.js` — this is what the MCP client runs

### Adding a new tool

1. Add an exported handler function to `src/tools.ts` — call `getPluggyAccessToken()`, fetch from `https://api.pluggy.ai/...` with the `X-API-KEY` header, return `{ content: [{ type: "text", text: JSON.stringify(json, null, 2) }] }`
2. Register it in `src/index.ts` with `server.tool(name, zodSchema, handler)`
3. Add a unit test in `src/tests/unit/`

### Current tools

| Tool | Endpoint | Key params |
|---|---|---|
| `listConnectors` | `GET /connectors` | — |
| `getAccounts` | `GET /accounts` | `itemId` |
| `getItem` | `GET /items/:itemId` | `itemId` |
| `getTransactions` | `GET /transactions` | `accountId`, `from`, `to`, `page`, `pageSize` |
| `getInvestments` | `GET /investments` | `itemId` |
| `getLoans` | `GET /loans` | `itemId` |
| `getCreditCardBills` | `GET /bills` | `accountId` |
| `getIdentity` | `GET /identity` | `itemId` |
| `createPixPayment` | `POST /payments/requests` | `pixKeyType`, `pixKey`, `amount`, `description` |

## Testing

Tests live in `src/tests/`. Unit tests mock `fetch` and `getPluggyAccessToken` via `vi.mock`/`vi.stubGlobal` — no credentials needed. The integration smoke test hits the real Pluggy sandbox and is skipped automatically when credentials are absent.

```bash
npm run test:unit        # always works, no credentials needed
direnv exec . npm run test:integration  # if using direnv
```

The integration test has two suites:
- **auth smoke** — requires `PLUGGY_CLIENT_ID` + `PLUGGY_CLIENT_SECRET`; tests `listConnectors`
- **data flow** — also requires `PLUGGY_ITEM_ID`; chains `getItem` → `getAccounts` → `getTransactions`

## Environment

```bash
PLUGGY_CLIENT_ID=...      # required
PLUGGY_CLIENT_SECRET=...  # required
PLUGGY_ITEM_ID=...        # optional, only needed for integration tests
```

Supports `.env` (via `dotenv`) or direnv (`.envrc`).
