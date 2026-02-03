const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

/* MUST be first */
app.use(express.json({ limit: '1mb' }));

/* 🔗 MySQL connection */
const db = mysql.createPool({
  host: 'mysql',
  user: 'admin',
  password: 'v5knfNxAXe',
  database: 'stage_pmsnapit',
  connectionLimit: 10
});

/* Health check */
app.get('/mcp', (req, res) => {
  res.json({ status: 'ok', protocol: 'mcp' });
});

/* 🧠 SIMPLE SQL GENERATOR */
function generateMysqlQuery(schema, question) {
  const q = question.toLowerCase();

  // Example: "how many leads created today"
  if (q.indexOf('how many') !== -1 && q.indexOf('lead') !== -1) {
    return `
      SELECT COUNT(*) AS total_leads
      FROM lead
      WHERE DATE(created_at) = CURDATE()
    `;
  }

  // fallback
  throw new Error('Unable to generate SQL for this question');
}

app.post('/mcp', async (req, res) => {
  console.log('⬇️ MCP REQUEST:', JSON.stringify(req.body, null, 2));

  const body = req.body || {};
  const method = body.method;
  const id = body.id || null;
  const params = body.params || {};

  /* INITIALIZE */
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { list: true, call: true } },
        serverInfo: { name: 'MySQL MCP Server', version: '1.0.0' }
      }
    });
  }

  /* TOOLS LIST */
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id: id,
      result: {
        tools: [
          {
            name: 'generate_mysql_query',
            description: 'Generate and execute a MySQL query',
            inputSchema: {
              type: 'object',
              required: ['database_schema', 'user_question'],
              properties: {
                database_schema: { type: 'string' },
                user_question: { type: 'string' }
              }
            }
          }
        ]
      }
    });
  }

  /* TOOLS CALL */
  if (method === 'tools/call') {
    try {
      const name = params.name;
      const args = params.arguments || {};

      if (name !== 'generate_mysql_query') {
        throw new Error('Unknown tool');
      }

      /* 🧠 Generate SQL locally */
      const sqlQuery = generateMysqlQuery(
        args.database_schema,
        args.user_question
      );

      /* 🔒 Safety */
      if (!/^select/i.test(sqlQuery.trim())) {
        throw new Error('Only SELECT queries allowed');
      }

      /* ▶️ Execute SQL */
      const result = await db.query(sqlQuery);
      const rows = result[0];

      return res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [
            {
              type: 'json',
              data: {
                sql: sqlQuery,
                result: rows
              }
            }
          ]
        }
      });
    } catch (err) {
      console.error('❌ Error:', err.message);

      return res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [
            { type: 'text', text: err.message }
          ]
        }
      });
    }
  }

  return res.json({
    jsonrpc: '2.0',
    id: id,
    error: { code: -32601, message: 'Method not found' }
  });
});

app.listen(4000, () => {
  console.log('✅ MCP server running on port 4000');
});
