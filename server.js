import express from "express";

const app = express();

app.use(express.json());

// CORS + OPTIONS (CRITICAL)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get('/mcp/', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: '1.0',
    server: {
      name: 'LeadDial MCP Server'
    },
    capabilities: {
      tools: {
        health_check: {
          description: 'Health check tool'
        }
      }
    }
  });
});

app.post('/mcp/', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: '1.0',
    server: {
      name: 'LeadDial MCP Server'
    },
    capabilities: {
      tools: {
        health_check: {
          description: 'Health check tool'
        }
      }
    }
  });
});

app.get("/mcp/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.status(200).end();
});

app.post("/mcp/sse", (req, res) => {
  res.status(200).json({ status: "sse not used" });
});


app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "health_check",
        description: "Health check tool",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  });
});

app.post("/mcp/tools/call", (req, res) => {
  const { name } = req.body;

  if (name === "health_check") {
    return res.json({
      content: [{ type: "text", text: "MCP server is healthy" }]
    });
  }

  res.status(400).json({ error: "Unknown tool" });
});

app.listen(2000, () => {
  console.log("MCP server running on port 2000");
});

