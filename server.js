import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

// Tool
mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

createServer((req, res) => {
  // Only /mcp
  if (req.url !== "/mcp") {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  // ✅ Allow GET (scanner probe)
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MCP server is running");
    return;
  }

  // ✅ Allow POST (actual MCP calls)
  if (req.method === "POST") {
    const transport = new StreamableHTTPServerTransport({ req, res });

    transport.handleRequest(mcp).catch((err) => {
      console.error("MCP HTTP error:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });
    return;
  }

  // ❌ Everything else
  res.writeHead(405);
  res.end("Method Not Allowed");
}).listen(2000, "0.0.0.0", () => {
  console.log("🚀 MCP HTTP server running on http://localhost:2000/mcp");
});
