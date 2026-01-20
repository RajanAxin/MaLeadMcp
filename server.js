import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = 2000;

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

createServer(async (req, res) => {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // MCP only lives at /mcp
  if (url.pathname !== "/mcp" && url.pathname !== "/mcp/") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  // Allow browser / curl GET
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MCP endpoint up. Use POST to /mcp.");
    return;
  }

  // MCP transport handles POST only
  if (req.method === "POST") {
    try {
      const transport = new StreamableHTTPServerTransport({ req, res });
      await mcp.connect(transport);
      return;
    } catch (err) {
      console.error("❌ MCP ERROR:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
      return;
    }
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method Not Allowed");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 MCP server running on http://0.0.0.0:${PORT}/mcp`);
});
