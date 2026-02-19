#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import 'dotenv/config';
import {
  handleGetAccounts,
  handleListConnectors,
  handleListItems,
  handleGetItem,
  handleGetTransactions,
  handleGetInvestments,
  handleGetLoans,
  handleGetCreditCardBills,
  handleGetIdentity,
  handleCreatePixPayment,
} from './tools.js';

const server = new McpServer({ name: "Pluggy API", version: "1.0.0" });

server.tool("getAccounts",
  { itemId: z.string().describe("The Pluggy item ID to fetch accounts for") },
  handleGetAccounts);

server.tool("listConnectors", {}, handleListConnectors);

server.tool("listItems", {}, handleListItems);

server.tool("getItem",
  { itemId: z.string().describe("The Pluggy item ID") },
  handleGetItem);

server.tool("getTransactions", {
  accountId: z.string().describe("The Pluggy account ID to fetch transactions for"),
  from: z.string().optional().describe("Start date filter in YYYY-MM-DD format (e.g. 2024-01-01)"),
  to: z.string().optional().describe("End date filter in YYYY-MM-DD format (e.g. 2024-12-31)"),
  page: z.number().optional().describe("Page number, 1-based (default: 1)"),
  pageSize: z.number().optional().describe("Results per page, max 500 (default: 20)"),
}, handleGetTransactions);

server.tool("getInvestments",
  { itemId: z.string().describe("The Pluggy item ID to fetch investments for") },
  handleGetInvestments);

server.tool("getLoans",
  { itemId: z.string().describe("The Pluggy item ID to fetch loans for") },
  handleGetLoans);

server.tool("getCreditCardBills",
  { accountId: z.string().describe("The Pluggy account ID for the credit card account") },
  handleGetCreditCardBills);

server.tool("getIdentity",
  { itemId: z.string().describe("The Pluggy item ID to fetch identity data for") },
  handleGetIdentity);

server.tool("createPixPayment", {
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]).describe("The type of the PIX key"),
  pixKey: z.string().describe("The PIX key value (CPF, CNPJ, email, phone, or random EVP key)"),
  amount: z.number().describe("Payment amount in BRL (e.g. 150.00)"),
  description: z.string().optional().describe("Optional payment description visible to recipient"),
}, handleCreatePixPayment);

const transport = new StdioServerTransport();
await server.connect(transport);
