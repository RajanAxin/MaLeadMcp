import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

const transport = new StdioServerTransport();
mcp.connect(transport);