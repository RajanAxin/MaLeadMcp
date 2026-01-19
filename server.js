import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HTTPServerTransport } from "@modelcontextprotocol/sdk/server/http.js";

const port = 2000;

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

createServer((req, res) => {
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

  const transport = new HTTPServerTransport({ req, res });

  transport
    .handleRequest(mcp)
    .catch((err) => {
      console.error("❌ MCP ERROR:", err.stack || err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });
}).listen(port, "0.0.0.0", () => {
  console.log("🚀 MCP HTTP server running at http://localhost:2000/mcp");
});
