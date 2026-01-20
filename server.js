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

  /* ---------- GET (DO NOT STREAM) ---------- */
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("MCP endpoint alive. Use POST for MCP calls.");
    return;
  }

  /* ---------- POST (MCP ONLY) ---------- */
  if (req.method === "POST") {
    try {
      const transport = new StreamableHTTPServerTransport({ req, res });
      
      // Connect and handle the session
      await mcp.connect(transport);
      
      // Wait for the transport to close naturally
      await new Promise((resolve, reject) => {
        transport.onclose = () => {
          console.log("✅ MCP session closed");
          resolve();
        };
        
        transport.onerror = (error) => {
          console.error("❌ Transport error:", error);
          reject(error);
        };
        
        // Extended timeout for MCP operations (30 seconds)
        setTimeout(() => {
          reject(new Error("MCP session timeout"));
        }, 30000);
      });
      
    } catch (err) {
      console.error("❌ MCP ERROR:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal MCP Error" }));
      }
    }
    return;
  }

  /* ---------- EVERYTHING ELSE ---------- */
  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method Not Allowed");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 MCP server running at http://0.0.0.0:${PORT}/mcp`);
});