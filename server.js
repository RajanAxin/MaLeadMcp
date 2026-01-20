import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

createServer((req, res) => {
  // MUST be exactly /mcp
  if (req.url !== "/mcp") {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  const transport = new StreamableHTTPServerTransport({ req, res });

  transport.handleRequest(mcp).catch((err) => {
    console.error("MCP HTTP error:", err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });
}).listen(2000, "0.0.0.0", () => {
  console.log("🚀 MCP HTTP server listening on http://localhost:2000/mcp");
});
