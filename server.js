import { WebSocketServer } from "ws";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/ws.js";

const port = 2000;

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

const wss = new WebSocketServer({ port });

wss.on("connection", (ws) => {
  const transport = new WebSocketServerTransport(ws);
  mcp.connect(transport);
});

console.log(`🚀 MCP WebSocket running on ws://localhost:${port}`);
