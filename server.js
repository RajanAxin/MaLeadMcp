import express from 'express';

const app = express();

/* MUST be first */
app.use(express.json({ limit: '1mb' }));

/* Health / capability probe */
app.get('/mcp', (req, res) => {
  res.status(200).json({
    status: 'ok',
    protocol: 'mcp'
  });
});

/* MCP endpoint */
app.post('/mcp', (req, res) => {
  const body = req.body ?? {};
  const { method, id } = body;

  // Tool discovery (MOST IMPORTANT)
  if (method === 'tools/list') {
    return res
      .status(200)
      .type('application/json')
      .json({
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

  // Required MCP fallback
  return res
    .status(200)
    .type('application/json')
    .json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    });
});

app.listen(2000, () => {
  console.log('✅ MCP server running on port 2000');
});
