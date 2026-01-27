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
  const userText = args?.text ?? '';

  // helper: common response format
  const respond = (data) => res.json({
    jsonrpc: '2.0',
    id,
    result: {
      source: 'website',
      tool: name,
      query: userText,
      data
    }
  });

  if (name === 'example_tool') {
    return respond({
      message: 'Example tool executed',
      note: userText
    });
  }

  if (name === 'local_move') {
    return respond({
      title: 'Local Moving Services',
      description:
        'Local moving services include house shifting within the same city, packing, loading, transportation, unloading, and unpacking.',
      nextSteps: [
        'Confirm from & to locality',
        'Select moving date',
        'Choose house size',
        'Decide packing requirements'
      ]
    });
  }

  if (name === 'long_move') {
    return respond({
      title: 'Long Distance Moving',
      description:
        'Long distance moving services cover intercity or interstate relocation with secure packing and insured transport.',
      nextSteps: [
        'Confirm source & destination city',
        'Check transit time',
        'Understand insurance coverage'
      ]
    });
  }

  if (name === 'moving_container') {
    return respond({
      title: 'Moving Container Services',
      description:
        'Container moving is suitable for partial loads or flexible timelines with cost-effective shared containers.',
      idealFor: [
        'Small households',
        'Flexible delivery timelines',
        'Budget-friendly moves'
      ]
    });
  }

  if (name === 'truck_rental') {
    return respond({
      title: 'Truck Rental',
      description:
        'Truck rental services allow customers to rent vehicles with or without drivers for self-managed moves.',
      options: [
        'Mini truck',
        'Medium truck',
        'Large container truck'
      ]
    });
  }

  if (name === 'last_minute_move') {
    return respond({
      title: 'Last Minute Moving',
      description:
        'Last-minute moving services are designed for urgent relocations with quick packing and dispatch.',
      tips: [
        'Keep essentials ready',
        'Confirm availability immediately',
        'Opt for professional packing'
      ]
    });
  }

  // if tool name does not match
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
