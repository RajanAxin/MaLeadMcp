import express from 'express';
import fetch from 'node-fetch';

const app = express();

/* MUST be first */
app.use(express.json({ limit: '1mb' }));

/* Health check */
app.get('/mcp', (req, res) => {
  res.json({ status: 'ok', protocol: 'mcp' });
});

/* Fetch website content */
async function fetchWebsiteText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MCP-Bot/1.0' }
  });
  const html = await res.text();

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

app.post('/mcp', async (req, res) => {
  const { method, id, params } = req.body;

  /* 1️⃣ INITIALIZE */
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { list: true, call: true } },
        serverInfo: { name: 'MaLead MCP Server', version: '1.0.0' }
      }
    });
  }

  /* 2️⃣ TOOLS LIST (SIMPLE) */
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          { name: 'local_move', description: 'Local house shifting service' },
          { name: 'long_move', description: 'Intercity house shifting service' },
          { name: 'truck_rental', description: 'Truck or tempo rental service' },
          { name: 'moving_container', description: 'Container based moving' },
          { name: 'last_minute_move', description: 'Urgent or last minute move' }
        ]
      }
    });
  }

  /* 3️⃣ TOOLS CALL (MESSAGE-BASED ONLY) */
  if (method === 'tools/call') {
    const tool = params?.name;

    let url = 'https://www.vanlinesmove.com/moving-services';

    if (tool === 'local_move') url += '/local-move';
    if (tool === 'long_move') url += '/long-distance-move';
    if (tool === 'truck_rental') url += '/truck-rental';
    if (tool === 'moving_container') url += '/container-moving';
    if (tool === 'last_minute_move') url += '/last-minute-move';

    const content = await fetchWebsiteText(url);

    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: `SOURCE: ${url}\n\n${content}`
          }
        ]
      }
    });
  }

  /* 4️⃣ NOTIFICATIONS */
  if (method?.startsWith('notifications/')) {
    return res.json({ jsonrpc: '2.0', id, result: {} });
  }

  /* FALLBACK */
  return res.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: 'Method not found' }
  });
});

app.listen(2000, () =>
  console.log('✅ MCP server running on port 2000')
);
