import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js"; // CHANGED: Use core Server class
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

/* ----------------------------------
   Create MCP Server (Using Core Class)
---------------------------------- */
// We use 'Server' directly here instead of 'McpServer' for maximum compatibility
const server = new Server(
  {
    name: "advanced-http-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/* ----------------------------------
   Tool Definition
---------------------------------- */

// 1. Handle "List Tools" requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ping",
        description: "Responds with a pong message",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to bounce back",
            },
          },
          required: ["message"],
        },
      },
    ],
  };
});

// 2. Handle "Call Tool" requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "ping") {
    const message = args?.message || "no message";
    
    return {
      content: [
        {
          type: "text",
          text: `pong: ${message}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

/* ----------------------------------
   HTTP Server Setup
---------------------------------- */
const httpServer = http.createServer(async (req, res) => {
  // Enable CORS for testing
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (!req.url?.startsWith("/mcp")) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  try {
    // Create the transport for THIS specific request
    // Note: The path string helps the transport verify routing
    const transport = new StreamableHTTPServerTransport("/mcp", req, res);

    // Connect the MCP server logic to the HTTP transport
    await server.connect(transport);
    
    // Important: Do not call res.end() here. The transport handles the response.
  } catch (err) {
    console.error("MCP Error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
});

const PORT = 2000;
httpServer.listen(PORT, () => {
  console.log(`✅ MCP Server running on http://localhost:${PORT}/mcp`);
});