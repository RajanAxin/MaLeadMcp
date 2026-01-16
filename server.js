import express from "express";

const app = express();

app.use(express.json());

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


app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "health_check",
        description: "Health check tool",
        input_schema: {
          type: "object",
          properties: {}
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

