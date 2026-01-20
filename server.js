import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = 2000;

/* -----------------------------
   MCP Server
----------------------------- */
const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

/* -----------------------------
   HTTP Server
----------------------------- */
createServer(async (req, res) => {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );

  console.log("➡️", req.method, url.pathname);

  /* ---------- HEALTH ---------- */
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  /* ---------- ROUTE GUARD ---------- */
  if (url.pathname !== "/mcp" && url.pathname !== "/mcp/") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  /* ---------- GET (NO STREAMING) ---------- */
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MCP endpoint alive. Use POST for MCP calls.");
    return;
  }

  /* ---------- POST (MCP ONLY) ---------- */
  if (req.method === "POST") {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error("❌ MCP TIMEOUT");
        res.writeHead(504, { "Content-Type": "text/plain" });
        res.end("MCP timeout");
      }
    }, 4000);

    try {
      const transport = new StreamableHTTPServerTransport({ req, res });
      await mcp.connect(transport);
    } catch (err) {
      console.error("❌ MCP ERROR:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal MCP Error");
      }
    } finally {
      clearTimeout(timeout);
    }
    return;
  }

  /* ---------- EVERYTHING ELSE ---------- */
  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method Not Allowed");

}).listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 MCP server running at http://0.0.0.0:${PORT}/mcp`);
});
