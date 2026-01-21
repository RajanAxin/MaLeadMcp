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

app.post('/mcp', (req, res) => {
  const body = req.body ?? {};
  const { method, id, params } = body;

  /* 1️⃣ INITIALIZE (MANDATORY) */
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: params?.protocolVersion ?? '2024-11-05',
        capabilities: {
          tools: {
            list: true,
            call: false
          }
        },
        serverInfo: {
          name: 'MaLead MCP Server',
          version: '1.0.0'
        }
      }
    });
  }

  /* 2️⃣ TOOLS LIST */
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

  /* 3️⃣ FALLBACK (NEVER 4xx) */
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
  console.log('✅ MCP server running on port 2000');
});
