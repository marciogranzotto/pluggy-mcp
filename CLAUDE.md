# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/ (also runs on npm install via prepare)
npm run watch        # Watch mode for development (hot-reload on save)
npm test                 # Run all tests
npm run test:unit        # Unit tests only (no credentials needed)
npm run test:integration # Integration smoke test (requires .env with real credentials)
npm run test:watch       # Watch mode
```

## Testing

Tests live in `src/tests/`. Unit tests mock `fetch` and `getPluggyAccessToken` via `vi.mock`/`vi.stubGlobal` — no credentials needed. The integration smoke test hits the real Pluggy sandbox and is skipped automatically when `PLUGGY_CLIENT_ID`/`PLUGGY_CLIENT_SECRET` are absent.

Handler logic lives in `src/tools.ts` (importable, testable). `src/index.ts` is wiring-only (registers tools with the MCP server). `src/auth.ts` exports `getPluggyAccessToken()`.

## Architecture

This is a **single-file MCP (Model Context Protocol) server** that exposes Pluggy financial API endpoints as tools for AI assistants.

- **Entry point**: `src/index.ts` — all tools are defined here
- **Transport**: `StdioServerTransport` — the server communicates over stdin/stdout, so it must be launched as a subprocess by an MCP client (e.g., Cursor)
- **Auth pattern**: `getPluggyAccessToken()` fetches a fresh API key on every tool call using `PLUGGY_CLIENT_ID` and `PLUGGY_CLIENT_SECRET` env vars
- **Compiled output**: `dist/index.js` — this is what the MCP client runs

### Adding a new tool

Call `server.tool(name, schema, handler)` in `src/index.ts`. The schema uses `zod`. Each handler should call `getPluggyAccessToken()` to get a fresh access token, then call `https://api.pluggy.ai/...` with the `X-API-KEY` header.

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

## Environment

Requires a `.env` file (loaded via `dotenv`) or environment variables:
- `PLUGGY_CLIENT_ID`
- `PLUGGY_CLIENT_SECRET`
