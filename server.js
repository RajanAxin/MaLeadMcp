import express from 'express';

const app = express();

app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/mcp', (req, res) => {
  const body = req.body ?? {};
  const { method, id } = body;

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'example_tool',
            description: 'An example tool',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string' }
              },
              required: ['text']
            }
          }
        ]
      }
    });
  }

  // MCP expects JSON-RPC error, NOT HTTP error
  return res.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code: -32601,
      message: 'Method not found'
    }
  });
});


app.listen(2000, () => {
  console.log('MCP server running on http://localhost:2000');
});
