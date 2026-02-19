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

const transport = new StdioServerTransport();
await server.connect(transport);