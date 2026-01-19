import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";

const app = express();
const port = 2000;

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

await mcp.connect(
  new HttpServerTransport({
    app,
    path: "/mcp",
  })
);

app.listen(port, () => {
  console.log("🚀 MCP HTTP Server running on port", port);
});
