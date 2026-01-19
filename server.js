// server.js
import express from "express";

const app = express();

app.use(express.json());

// CORS + OPTIONS (CRITICAL)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-mcp-version");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Root endpoint - REQUIRED for MCP scan
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "LeadDial MCP Server is running",
    protocol: "mcp",
    version: "1.0"
  });
});

// MCP Protocol endpoint - MUST return proper capabilities
app.get("/mcp", (req, res) => {
  res.json({
    protocolVersion: "2024-11-05",
    serverInfo: {
      name: "LeadDial MCP Server",
      version: "1.0.0"
    },
    capabilities: {
      roots: {
        listChanged: false
      },
      tools: {
        listChanged: false
      },
      resources: {
        listChanged: false,
        subscribe: false
      },
      prompts: {
        listChanged: false
      },
      logging: false
    }
  });
});

// POST /mcp endpoint - REQUIRED for initialization
app.post("/mcp", (req, res) => {
  res.json({
    protocolVersion: "2024-11-05",
    serverInfo: {
      name: "LeadDial MCP Server",
      version: "1.0.0"
    },
    capabilities: {
      roots: {
        listChanged: false
      },
      tools: {
        listChanged: false
      },
      resources: {
        listChanged: false,
        subscribe: false
      },
      prompts: {
        listChanged: false
      },
      logging: false
    }
  });
});

// GET /mcp/tools endpoint - CRITICAL for tool scan
app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "health_check",
        description: "Performs a health check on the MCP server",
        inputSchema: {
          type: "object",
          properties: {
            // Empty for health check
          },
          required: []
        }
      },
      {
        name: "get_server_info",
        description: "Get server information and status",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "test_connection",
        description: "Test the connection to the MCP server",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  });
});

// SSE endpoint - OPTIONAL but recommended
app.get("/mcp/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // Send initial event
  res.write("event: connected\n");
  res.write("data: SSE connection established\n\n");
  
  // Keep connection alive
  const interval = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);
  
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

// POST /mcp/tools/call endpoint - REQUIRED for tool execution
app.post("/mcp/tools/call", (req, res) => {
  const { name, arguments: args = {} } = req.body;
  
  console.log(`Tool call received: ${name}`, args);
  
  switch (name) {
    case "health_check":
      return res.json({
        content: [
          {
            type: "text",
            text: "✅ MCP server is healthy and running. All systems operational."
          }
        ],
        isError: false
      });
      
    case "get_server_info":
      return res.json({
        content: [
          {
            type: "text",
            text: `Server Information:\n- Name: LeadDial MCP Server\n- Version: 1.0.0\n- Status: Online\n- Protocol: MCP v2024-11-05\n- Uptime: ${process.uptime().toFixed(0)} seconds`
          }
        ],
        isError: false
      });
      
    case "test_connection":
      return res.json({
        content: [
          {
            type: "text",
            text: "✅ Connection test successful! MCP server is reachable and responding correctly."
          }
        ],
        isError: false
      });
      
    default:
      return res.status(404).json({
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool '${name}' not found`
        }
      });
  }
});

// Additional MCP endpoints for full compliance
app.get("/mcp/resources", (req, res) => {
  res.json({
    resources: []
  });
});

app.get("/mcp/prompts", (req, res) => {
  res.json({
    prompts: []
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("MCP Server Error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`✅ LeadDial MCP Server running on port ${PORT}`);
  console.log(`✅ Server URL: http://localhost:${PORT}`);
  console.log(`✅ MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`✅ Tools endpoint: http://localhost:${PORT}/mcp/tools`);
});