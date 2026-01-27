import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

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

/* Helper: fetch & clean website content */
async function fetchWebsiteText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; MCPBot/1.0; +https://www.vanlinesmove.com)'
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, footer, header, noscript').remove();

  let text = '';

  $('h1, h2, h3, p, li').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 25) {
      text += t + '\n';
    }
  });

  return text.trim();
}


app.post('/mcp', async (req, res) => {
  console.log('⬇️ MCP REQUEST:', JSON.stringify(req.body, null, 2));

  const body = req.body ?? {};
  const method = body.method;
  const id = body.id ?? null;
  const params = body.params ?? {};

  /* 1️⃣ INITIALIZE */
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

  /* 2️⃣ TOOLS LIST */
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'local_move',
            description: 'Moving within the same city',
            inputSchema: {
              type: 'object',
              properties: {},
            }
          },
          {
            name: 'long_move',
            description: 'Moving between different cities or states',
            inputSchema: {
              type: 'object',
              properties: {},
            }
          },
          {
            name: 'truck_rental',
            description: 'Truck rental without movers',
            inputSchema: {
              type: 'object',
              properties: {},
            }
          },
          {
            name: 'last_minute_move',
            description: 'Urgent or same-day moving',
           inputSchema: {
              type: 'object',
              properties: {},
            }
          }
        ]
      }
    });
  }

  /* 3️⃣ TOOLS CALL – WEBSITE ONLY */
  if (method === 'tools/call') {
    const toolName = params.name;
    let url = 'https://www.vanlinesmove.com/moving-services';

    switch (toolName) {
      case 'local_move':
        url += '/local-movers';
        break;
      case 'long_move':
        url += '/long-distance-movers';
        break;
      case 'truck_rental':
        url += '/truck-rental';
        break;
      case 'last_minute_move':
        url += '/last-minute-movers';
        break;
    }

    try {
      const websiteText = await fetchWebsiteText(url);

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `SOURCE URL:\n${url}\n\nWEBSITE CONTENT:\n${websiteText}`
            }
          ]
        }
      });
    } catch (err) {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text:
                'Sorry, the information could not be fetched from the website.'
            }
          ]
        }
      });
    }
  }

  /* 4️⃣ MCP NOTIFICATIONS */
  if (method?.startsWith('notifications/')) {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {}
    });
  }

  /* 5️⃣ FALLBACK */
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
