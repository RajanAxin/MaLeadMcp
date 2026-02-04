const express = require('express');
const fetch = require('node-fetch'); // v2


const app = express();

/* MUST be first */
app.use(express.json({ limit: '1mb' }));

/* Health check */
app.get('/mcp', (req, res) => {
  res.json({ status: 'ok', protocol: 'mcp' });
});

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
          name: 'MySQL Query MCP Server',
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
            name: 'generate_mysql_query',
            description:
              'Send data to my API and return the response',
              "strict": false,
            inputSchema: {
              type: 'object',
              properties: {
                user_input: {
                  type: 'string',
                  description:
                    'The message or data to send'
                }
              },
              required: ['user_input']
            }
          }
        ]
      }
    });
  }

  /* 3️⃣ TOOLS CALL */
  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    if (name !== 'generate_mysql_query') {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Unknown tool' }
      });
    }

    try {
      console.log('args,', args);
      // 🔁 Call your external API here
      const apiResponse = await fetch(
        'https://stage.linkup.software/tools/call-external-api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_input: args.user_question
          })
        }
      );

      const apiResult = await apiResponse.json();

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: apiResult.result || JSON.stringify(apiResult, null, 2)
            }
          ]
        }
      });
    } catch (err) {
      console.error('❌ External API error:', err);

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: 'Failed to generate MySQL query via external API.'
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

app.listen(4000, () => {
  console.log('✅ MCP server running on port 4000');
});
