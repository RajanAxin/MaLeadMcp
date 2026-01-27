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
  console.log('⬇️ MCP REQUEST:', JSON.stringify(req.body, null, 2));

  const body = req.body ?? {};
  const method = body.method;
  const id = body.id ?? null;
  const params = body.params ?? {};

  /* 1️⃣ INITIALIZE (MANDATORY) */
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            list: true,
            call: true
          }
        },
        serverInfo: {
          name: 'MaLead MCP Server',
          version: '1.0.0'
        }
      }
    });
  }

  /* 2️⃣ TOOLS LIST (MANDATORY) */
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'local_move',
            description:
              'Use ONLY when the user is moving within the SAME city or local area',
            inputSchema: {
              type: 'object',
              properties: {
                from_area: { type: 'string' },
                to_area: { type: 'string' },
                move_date: { type: 'string' }
              },
              required: ['from_area', 'to_area']
            }
          },
          {
            name: 'long_move',
            description:
              'Use ONLY when the user is moving between DIFFERENT cities or states',
            inputSchema: {
              type: 'object',
              properties: {
                from_city: { type: 'string' },
                to_city: { type: 'string' },
                move_date: { type: 'string' }
              },
              required: ['from_city', 'to_city']
            }
          },
          {
            name: 'truck_rental',
            description:
              'Use ONLY when the user wants to RENT a truck without movers',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                truck_size: { type: 'string' }
              },
              required: ['city']
            }
          },
          {
            name: 'moving_container',
            description:
              'Use ONLY for container-based or partial-load moving',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                container_type: { type: 'string' }
              },
              required: ['city']
            }
          },
          {
            name: 'last_minute_move',
            description:
              'Use ONLY for urgent or same-day / next-day moving',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                urgency: { type: 'string' }
              },
              required: ['city']
            }
          }
        ]
      }
    });
  }

  /* 3️⃣ TOOLS CALL (MANDATORY) */
  if (method === 'tools/call') {
    const toolName = params.name;
    const args = params.arguments ?? {};

    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tool: toolName,
        source: 'website',
        received_arguments: args,
        message: `Tool "${toolName}" executed successfully`
      }
    });
  }

  /* 4️⃣ MCP NOTIFICATIONS (MANDATORY) */
  if (method?.startsWith('notifications/')) {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {}
    });
  }

  /* 5️⃣ SAFE FALLBACK */
  console.error('❌ MCP METHOD NOT HANDLED:', method);

  return res.json({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method "${method}" not found`
    }
  });
});

app.listen(2000, () => {
  console.log('✅ MCP server running on port 2000');
});
