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
 
  if (method === 'tools/call') {
    const { name, arguments: args } = params;

  /* LONG MOVE */
    if (name === 'long_move') {
      const { from_city, to_city, move_date } = args;

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          service: 'long_move',
          source: 'website',
          from_city,
          to_city,
          move_date,
          message:
            'Long distance moving service information fetched from MaLead website'
        }
      });
    }

    /* LOCAL MOVE */
    if (name === 'local_move') {
      const { from_area, to_area, move_date } = args;

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          service: 'local_move',
          source: 'website',
          from_area,
          to_area,
          move_date
        }
      });
    }

    /* TRUCK RENTAL */
    if (name === 'truck_rental') {
      const { city, truck_size } = args;

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          service: 'truck_rental',
          city,
          truck_size
        }
      });
    }

    /* MOVING CONTAINER */
    if (name === 'moving_container') {
      const { city, container_type } = args;

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          service: 'moving_container',
          city,
          container_type
        }
      });
    }

    /* LAST MINUTE MOVE */
    if (name === 'last_minute_move') {
      const { city, urgency } = args;

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          service: 'last_minute_move',
          city,
          urgency
        }
      });
    }

    /* UNKNOWN TOOL */
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Tool "${name}" not implemented`
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

