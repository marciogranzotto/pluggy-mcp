# Pluggy MCP Server Expansion Design

**Date:** 2026-02-19
**Goal:** Expand the MCP server from 2 tools to a full personal finance assistant covering all Pluggy data products and payment initiation.

## Context

Current state: `src/index.ts` has `getAccounts` and `listConnectors`. Items (bank connections) are created externally via the Connect Widget; the MCP server only needs to read data and optionally discover items.

## Tools to Add

### Item Management
| Tool | Endpoint | Purpose |
|---|---|---|
| `listItems` | `GET /items` | List all items with status and connector name |
| `getItem` | `GET /items/:itemId` | Get a single item's sync status and last updated time |

### Open Finance Reads (per item)
| Tool | Endpoint | Key params |
|---|---|---|
| `getTransactions` | `GET /transactions?accountId=` | `accountId`, `from`, `to`, `page`, `pageSize` |
| `getInvestments` | `GET /investments?itemId=` | `itemId` |
| `getLoans` | `GET /loans?itemId=` | `itemId` |
| `getCreditCardBills` | `GET /bills?accountId=` | `accountId` |
| `getIdentity` | `GET /identity?itemId=` | `itemId` |

### Payments
| Tool | Endpoint | Key params |
|---|---|---|
| `createPixPayment` | `POST /payments/requests` | `pixKey`, `amount`, `description`, `itemId` |

## Architecture

- **Single file**: all tools stay in `src/index.ts`
- **Auth**: `getPluggyAccessToken()` called on every tool invocation (unchanged)
- **Pattern**: each tool fetches a token, calls the API, returns `JSON.stringify(json, null, 2)`
- **Pagination**: `getTransactions` exposes `page` + `pageSize` optional params

## Error Handling

Improved over existing pattern — return HTTP status and Pluggy error message so the AI can reason about failures:

```typescript
return { content: [{ type: "text", text: `Error: ${response.status} — ${json?.message ?? err}` }] }
```

## Out of Scope

- Webhook registration (managed externally)
- Connect Widget / connect token generation (frontend concern)
- Boleto creation, Smart Transfers, scheduled PIX (can be added later)
- Response caching
