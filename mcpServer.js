#!/usr/bin/env node

import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { discoverTools } from "./lib/tools.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const SERVER_NAME = "generated-mcp-server";

async function transformTools(tools) {
  return tools
    .map((tool) => {
      const definitionFunction = tool.definition?.function;
      if (!definitionFunction) return;
      return {
        name: definitionFunction.name,
        description: definitionFunction.description,
        inputSchema: definitionFunction.parameters,
      };
    })
    .filter(Boolean);
}

async function setupServerHandlers(server, tools) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: await transformTools(tools),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = tools.find((t) => t.definition.function.name === toolName);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
    const args = request.params.arguments || {};
    const finalArgs = { ...args };

    const hasAppKeyParam =
      tool.definition?.function?.parameters?.properties?.app_key !== undefined;
    if (hasAppKeyParam && !finalArgs.app_key && process.env.TFL_API_KEY) {
      finalArgs.app_key = process.env.TFL_API_KEY;
    }

    const requiredParameters =
      tool.definition?.function?.parameters?.required || [];
    for (const requiredParameter of requiredParameters) {
      if (!(requiredParameter in finalArgs)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Missing required parameter: ${requiredParameter}`
        );
      }
    }
    try {
      const result = await tool.function(finalArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("[Error] Failed to fetch data:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `API error: ${error.message}`
      );
    }
  });
}

async function setupStreamableHttp(tools) {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    try {
      const server = new Server(
        {
          name: SERVER_NAME,
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      server.onerror = (error) => console.error("[Error]", error);
      await setupServerHandlers(server, tools);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on("close", async () => {
        await transport.close();
        await server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(
      `[Streamable HTTP Server] running at http://127.0.0.1:${port}/mcp`
    );
  });
}

async function setupSSE(tools) {
  const app = express();
  const transports = {};
  const servers = {};

  app.get("/sse", async (_req, res) => {
    const server = new Server(
      {
        name: SERVER_NAME,
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    server.onerror = (error) => console.error("[Error]", error);
    await setupServerHandlers(server, tools);

    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    servers[transport.sessionId] = server;

    res.on("close", async () => {
      delete transports[transport.sessionId];
      await server.close();
      delete servers[transport.sessionId];
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    const server = servers[sessionId];

    if (transport && server) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport/server found for sessionId");
    }
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`[SSE Server] is running:`);
    console.log(`  SSE stream:    http://127.0.0.1:${port}/sse`);
    console.log(`  Message input: http://127.0.0.1:${port}/messages`);
  });
}

async function setupStdio(tools) {
  // stdio mode: single server instance
  const server = new Server(
    {
      name: SERVER_NAME,
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  server.onerror = (error) => console.error("[Error]", error);
  await setupServerHandlers(server, tools);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function showHelp() {
  console.log(`
TfL (Transport for London) MCP Server
=====================================

A Model Context Protocol server providing real-time Transport for London data.

USAGE:
  london-transport-mcp [OPTIONS]

OPTIONS:
  --help              Show this help message
  --version           Show version information
  --streamable-http   Run as HTTP server with streamable transport
  --sse              Run as Server-Sent Events server
  (no flags)         Run in stdio mode (default for MCP)

EXAMPLES:
  london-transport-mcp                    # Run in stdio mode (MCP default)
  london-transport-mcp --streamable-http  # Run as HTTP server
  london-transport-mcp --sse              # Run as SSE server
  london-transport-mcp --help             # Show this help

ENVIRONMENT VARIABLES:
  TFL_API_KEY        Your Transport for London API key (required)
  PORT               Port for HTTP/SSE servers (default: 3001)

TOOLS AVAILABLE:
  - get_line_status: Get current status of TfL lines
  - get_line_status_detail: Get detailed status with disruption info
  - plan_journey: Plan journeys between London locations

For more information, visit:
https://github.com/anoopt/london-tfl-journey-status-mcp-server
`);
}

function showVersion() {
  // Read version from package.json if available
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
    );
    console.log(`london-transport-mcp v${packageJson.version}`);
  } catch (error) {
    console.log('london-transport-mcp v1.0.0');
  }
}

async function run() {
  const args = process.argv.slice(2);
  
  // Handle help and version flags first
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    process.exit(0);
  }

  const isStreamableHttp = args.includes("--streamable-http");
  const isSSE = args.includes("--sse");
  
  // Check for unknown flags
  const knownFlags = ["--streamable-http", "--sse"];
  const unknownFlags = args.filter(arg => arg.startsWith("--") && !knownFlags.includes(arg));
  if (unknownFlags.length > 0) {
    console.error(`Error: Unknown flag(s): ${unknownFlags.join(", ")}`);
    console.error("Use --help to see available options");
    process.exit(1);
  }

  if (isStreamableHttp && isSSE) {
    console.error("Error: Cannot specify both --streamable-http and --sse");
    process.exit(1);
  }

  const tools = await discoverTools();

  if (isStreamableHttp) {
    await setupStreamableHttp(tools);
  } else if (isSSE) {
    await setupSSE(tools);
  } else {
    await setupStdio(tools);
  }
}

run().catch(console.error);
