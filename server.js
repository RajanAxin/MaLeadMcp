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

  /* 2️⃣ TOOLS LIST */
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'example_tool',
            description: 'Use ONLY for testing or demo purposes',
            inputSchema: {
              type: 'object',
              properties: {
                note: { type: 'string', description: 'Any test message' }
              },
              required: ['note']
            }
          },
          {
            name: 'local_move',
            description:
              'Use ONLY when the user is moving within the SAME city or local area',
            inputSchema: {
              type: 'object',
              properties: {
                from_area: { type: 'string', description: 'Current locality' },
                to_area: { type: 'string', description: 'New locality' },
                move_date: { type: 'string', description: 'Preferred move date' }
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
                from_city: { type: 'string', description: 'Source city' },
                to_city: { type: 'string', description: 'Destination city' },
                move_date: { type: 'string', description: 'Preferred move date' }
              },
              required: ['from_city', 'to_city']
            }
          },
          {
            name: 'moving_container',
            description:
              'Use ONLY when the user asks for container-based or partial-load moving',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string', description: 'City of service' },
                container_type: {
                  type: 'string',
                  description: 'Small, medium, or shared container'
                }
              },
              required: ['city']
            }
          },
          {
            name: 'truck_rental',
            description:
              'Use ONLY when the user wants to RENT a truck WITHOUT movers or packing',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string', description: 'City for truck rental' },
                truck_size: {
                  type: 'string',
                  description: 'Mini, medium, or large truck'
                }
              },
              required: ['city']
            }
          },
          {
            name: 'last_minute_move',
            description:
              'Use ONLY when the user mentions URGENT or SAME-DAY / NEXT-DAY moving',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string', description: 'City of move' },
                urgency: {
                  type: 'string',
                  description: 'Immediate, today, or tomorrow'
                }
              },
              required: ['city']
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

