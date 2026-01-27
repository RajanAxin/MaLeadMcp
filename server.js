const express = require('express');
const fetch = require('node-fetch'); // v2
const cheerio = require('cheerio');

const app = express();

/* MUST be first */
app.use(express.json({ limit: '1mb' }));

/* Health probe */
app.get('/mcp', (req, res) => {
  res.json({ status: 'ok', protocol: 'mcp' });
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

  $('script, style, nav, footer, header, noscript').remove();

  let text = '';
  $('h1, h2, h3, p, li').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 25) text += t + '\n';
  });

  return text.trim();
}


async function fetchLatestWebsiteText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; MCPBot/1.0; +https://www.vanlinesmove.com)'
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, footer, header, noscript, svg, iframe').remove();

  const contentSelectors = `
    h1, h2, h3, h4, h5, h6,
    p, li,
    article, section, main,
    div, span,
    strong, em, b, i,
    figcaption, blockquote
  `;

  let seen = new Set();
  let text = '';

  $(contentSelectors).each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();

    if (t.length > 30 && t.length < 1000 && !seen.has(t)) {
      seen.add(t);
      text += t + '\n';
    }
  });

  return text.trim();
}

app.post('/mcp', async (req, res) => {
  console.log('⬇️ MCP REQUEST:', JSON.stringify(req.body, null, 2));

  const { method, id = null, params = {} } = req.body || {};

  /* 1️⃣ INITIALIZE */
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { list: true, call: true }
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
            description: 'Information about local moving services',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'long_move',
            description: 'Information about long distance moving services',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'truck_rental',
            description: 'Information about truck rental services',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'last_minute_move',
            description: 'Information about last minute moving services',
            inputSchema: { type: 'object', properties: {} }
          }
        ]
      }
    });
  }

  /* 3️⃣ TOOLS CALL */
  if (method === 'tools/call') {
    const toolName = params.name;
    let url = 'https://www.vanlinesmove.com/moving-services';

    if (toolName === 'local_move') url += '/local-movers';
    if (toolName === 'long_move') url += '/long-distance-movers';
    if (toolName === 'truck_rental') url += '/truck-rental';
    if (toolName === 'last_minute_move') url += '/last-minute-movers';

    try {
      const text = await fetchWebsiteText(url);

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `SOURCE URL:\n${url}\n\nPAGE CONTENT:\n${text}`
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
              text: 'Unable to fetch content from the website.'
            }
          ]
        }
      });
    }
  }

  /* Notifications */
  if (method && method.startsWith('notifications/')) {
    return res.json({ jsonrpc: '2.0', id, result: {} });
  }

  /* Fallback */
  return res.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method "${method}" not found` }
  });
});

app.listen(2000, () => {
  console.log('✅ MCP server running on port 2000');
});
