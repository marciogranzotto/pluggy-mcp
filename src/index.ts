#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import 'dotenv/config'

const server = new McpServer({
  name: "Pluggy API",
  version: "1.0.0",
});

async function getPluggyAccessToken() {
  const authResponse = await fetch('https://api.pluggy.ai/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET
    })
  });

  const authJson = await authResponse.json();
  const { apiKey } = authJson;
  return apiKey;
}

server.tool(
  "getAccounts",
  {
    itemId: z.string().describe("The Pluggy item ID to fetch accounts for"),
  },
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
);

server.tool(
  "listConnectors",
  {},
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
);

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

const transport = new StdioServerTransport();
await server.connect(transport);