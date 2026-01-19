import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const port = 2000;

const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

// Tool
mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong" }],
}));

createServer(async (req, res) => {
  try {
    // Only MCP endpoint
    if (req.url !== "/mcp") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    // MCP requires POST
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end("Method Not Allowed");
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      req,
      res,
    });

    // Connect MCP for this request
    await mcp.connect(transport);

  } catch (err) {
    console.error("MCP Server Error:", err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`🚀 MCP Streamable HTTP running at http://localhost:${port}/mcp`);
});
