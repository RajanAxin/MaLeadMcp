import http from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from
  "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = 2000;

/* -------------------------------------------------
   1. Create MCP server
------------------------------------------------- */
const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

/* -------------------------------------------------
   2. REQUIRED: at least one tool
------------------------------------------------- */
mcp.tool("ping", {}, async () => {
  return {
    content: [
      { type: "text", text: "pong" }
    ]
  };
});

/* -------------------------------------------------
   3. HTTP server
------------------------------------------------- */
const server = http.createServer(async (req, res) => {
  console.log("➡️ Request:", req.method, req.url);

  /* ---------------------------------------------
     Browser / health check
  --------------------------------------------- */
  if (req.method === "GET" && (req.url === "/mcp" || req.url === "/mcp/")) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MCP OK");
    return;
  }

  /* ---------------------------------------------
     MCP endpoint
  --------------------------------------------- */
  if (req.method === "POST" && req.url === "/mcp") {
    try {
      const transport = new StreamableHTTPServerTransport({ req, res });
      await mcp.connect(transport);
      return;
    } catch (err) {
      console.error("❌ MCP ERROR:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("MCP ERROR");
      return;
    }
  }

  /* ---------------------------------------------
     Everything else
  --------------------------------------------- */
  res.writeHead(404);
  res.end("Not Found");
});

/* -------------------------------------------------
   4. Start server
------------------------------------------------- */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP server running on port ${PORT}`);
});
