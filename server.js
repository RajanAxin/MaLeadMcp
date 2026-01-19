import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const port = 2000;

// Create MCP server
const mcp = new McpServer({
  name: "leaddial-mcp",
  version: "1.0.0",
});

// Add your tools
mcp.tool(
  "sendInventoryLink",
  {
    lead_id: {
      type: "string",
      description: "Lead ID to send inventory link"
    }
  },
  async ({ lead_id }) => {
    console.log(`📦 Sending inventory link for lead: ${lead_id}`);
    return {
      content: [{
        type: "text",
        text: `✅ Inventory link sent to lead ${lead_id}`
      }]
    };
  }
);

mcp.tool(
  "addLeadNote",
  {
    lead_id: { type: "number" },
    note_type: { type: "string" },
    channel: { type: "string" },
    content: { type: "string" }
  },
  async ({ lead_id, note_type, channel, content }) => {
    console.log(`📝 Adding note for lead ${lead_id}:`, content);
    return {
      content: [{
        type: "text",
        text: `✅ Note added: "${content}"`
      }]
    };
  }
);

// Ping tool
mcp.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong from LeadDial MCP" }],
}));

// Create HTTP server
const server = createServer();

server.on("request", async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === "/mcp" && req.method === "GET") {
    console.log("📡 New SSE connection");
    
    // Set SSE headers FIRST
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*"
    });
    
    // Send initial event
    res.write("event: connected\n");
    res.write(`data: ${JSON.stringify({ message: "MCP SSE Connected" })}\n\n`);
    
    // Flush the headers
    res.flushHeaders?.();
    
    try {
      // Create transport - NOTE: Different parameter order
      const transport = new SSEServerTransport(req, res, "/mcp");
      
      // Connect MCP server to this transport
      await mcp.connect(transport);
      
      console.log("✅ MCP connected to SSE transport");
      
      // Handle client disconnect
      req.on("close", () => {
        console.log("Client disconnected");
        transport.close();
      });
      
    } catch (error) {
      console.error("❌ MCP connection error:", error);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
    
  } else if (req.url === "/" || req.url === "") {
    // Welcome page
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "LeadDial MCP Server",
      version: "1.0.0",
      endpoint: "GET /mcp (SSE)",
      tools: ["sendInventoryLink", "addLeadNote", "ping"],
      status: "running"
    }));
    
  } else if (req.url === "/health") {
    // Health check
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString() 
    }));
    
  } else {
    // Not found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      error: "Not Found",
      available: ["GET /", "GET /health", "GET /mcp"]
    }));
  }
});

// Start server
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 MCP SSE Server running on port ${port}`);
  console.log(`📡 SSE endpoint: http://localhost:${port}/mcp`);
  console.log(`🏠 Info: http://localhost:${port}/`);
  console.log(`\nTo test:`);
  console.log(`curl -N http://localhost:${port}/mcp`);
});

// Error handling
server.on("error", (error) => {
  console.error("Server error:", error);
});

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  server.close();
  process.exit(0);
});
