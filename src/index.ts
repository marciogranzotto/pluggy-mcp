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
    fullPrompt: z.string().describe("The complete user query about Pluggy API"),
    itemId: z.string().describe("The Pluggy item ID to fetch accounts for"),
  },
  async ({ fullPrompt, itemId }) => {
    try {
      const accessToken = await getPluggyAccessToken();
      const response = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
        headers: {
          'X-API-KEY': accessToken,
        }
      })

      const json = await response.json()
      return {
        content: [
          {
            type: "text",
            text: `Succesfully listed all accounts: ${JSON.stringify(json, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching data ...`,
          },
        ],
      };
    }
  },
);

server.tool(
  "listConnectors",
  {
    fullPrompt: z.string().describe("The complete user query about Pluggy API connectors"),
  },
  async ({ fullPrompt }) => {
    try {
        const accessToken = await getPluggyAccessToken();
        if (!accessToken) {
          console.error('DEBUG: No access token received!');
        }
        const response = await fetch('https://api.pluggy.ai/connectors', {
        headers: {
                'X-API-KEY': accessToken,
            }
        });

      const json = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `Succesfully listed all connectors: ${JSON.stringify(json, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      console.error('DEBUG: Error in listConnectors:', err);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching connectors data ... ${err}`,
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);