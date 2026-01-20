import http from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport }
  from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const mcp = new McpServer({
  name: "leaddial-mcp-server",
  version: "1.0.0",
});

/* Tool */
mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

const server = http.createServer(async (req, res) => {
  // 🚨 DO NOT restrict to GET
  if (!req.url?.startsWith("/mcp")) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const transport = new StreamableHTTPServerTransport({
      req,
      res,
    });

    await mcp.connect(transport);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end();
    }
  }
});

server.listen(2000, () => {
  console.log("MCP HTTP server running");
});
