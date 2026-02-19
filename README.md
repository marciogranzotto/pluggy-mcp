# Pluggy MCP

An MCP (Model Context Protocol) server that exposes [Pluggy](https://pluggy.ai) Open Finance API endpoints as tools for AI assistants.

## Available Tools

| Tool | Description |
|---|---|
| `listConnectors` | List all available financial institution connectors |
| `getAccounts` | Get bank accounts for an item |
| `getItem` | Get sync status of a connection |
| `getTransactions` | Get transactions for an account (supports date filters and pagination) |
| `getInvestments` | Get investment portfolio for an item |
| `getLoans` | Get loan details for an item |
| `getCreditCardBills` | Get credit card bills for an account |
| `getIdentity` | Get identity/personal data for an item |
| `createPixPayment` | Create a PIX payment request |

> **Note:** Items (bank connections) are created externally via the [Pluggy Connect Widget](https://docs.pluggy.ai/docs/connect-widget). This server reads data from existing items — it does not create connections.

## Setup

```bash
npm install
```

Create a `.env` file (or use direnv with `.envrc`):

```bash
PLUGGY_CLIENT_ID=your_client_id
PLUGGY_CLIENT_SECRET=your_client_secret
```

Get your credentials from the [Pluggy dashboard](https://dashboard.pluggy.ai).

## Usage with Cursor

Go to `Preferences > MCP Servers` and add:

```json
{
  "servers": {
    "pluggy-mcp": {
      "command": "node",
      "args": ["{project_root}/dist/index.js"],
      "env": {
        "PLUGGY_CLIENT_ID": "{your_pluggy_client_id}",
        "PLUGGY_CLIENT_SECRET": "{your_pluggy_client_secret}"
      }
    }
  }
}
```

## Development

```bash
npm run watch   # hot-reload on save
npm test        # run all tests
```

To add a new tool, export a handler from `src/tools.ts` and register it in `src/index.ts`. See CLAUDE.md for details.

## Releasing

This MCP server is not yet published to the MCP server registry.
