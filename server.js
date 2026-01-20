import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from
  "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = 2000;
console.log("StreamableHTTPServerTransport =", StreamableHTTPServerTransport);
/* -----------------------------------
   MCP Server
----------------------------------- */
const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

/* Required tool */
mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

/* -----------------------------------
   HTTP Server
----------------------------------- */
createServer(async (req, res) => {
  console.log("➡️", req.method, req.url);

  // ❌ Only allow /mcp or /mcp/
  if (req.url !== "/mcp" && req.url !== "/mcp/") {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  // ✅ GET probe / health check
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MCP OK");
    return;
  }

  // ✅ POST = MCP
  if (req.method === "POST") {
    try {
      const transport = new StreamableHTTPServerTransport({ req, res });
      await mcp.connect(transport); // ✅ CORRECT
      return;
    } catch (err) {
      console.error("❌ MCP ERROR:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
      return;
    }
  }

  // ❌ Everything else
  res.writeHead(405);
  res.end("Method Not Allowed");

}).listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 MCP HTTP server running on http://localhost:${PORT}/mcp`);
});
