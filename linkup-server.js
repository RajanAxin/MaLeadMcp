const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json({ limit: "1mb" }));

/* =========================
   🔐 MYSQL (READ-ONLY)
   ========================= */

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_READONLY_USER,
//   password: process.env.DB_READONLY_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10
// });

const pool = mysql.createPool({
  host: 'stage-tweet-talk.cg0ahsyhitn1.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'v5knfNxAXe',
  database: 'stage_pmsnapit',
  waitForConnections: true,
  connectionLimit: 10
});

/* =========================
   🔐 SQL SAFETY CHECK
   ========================= */

function assertReadOnlySelect(sql) {
  const normalized = sql.trim().toLowerCase();

  if (!normalized.startsWith("select")) {
    throw new Error("Only SELECT queries are allowed");
  }

  const forbidden = [
    "insert ",
    "update ",
    "delete ",
    "drop ",
    "alter ",
    "truncate ",
    "create ",
    "merge ",
    "grant ",
    "revoke ",
    "execute ",
    "call ",
    ";"
  ];

  for (const word of forbidden) {
    if (normalized.includes(word)) {
      throw new Error(`Forbidden SQL keyword detected: ${word.trim()}`);
    }
  }
}

/* =========================
   🧪 HEALTH
   ========================= */

app.get("/mcp", (_, res) => {
  res.json({ status: "ok", protocol: "mcp" });
});

/* =========================
   🧠 MCP HANDLER
   ========================= */

app.post("/mcp", async (req, res) => {
  const { method, id = null, params = {} } = req.body;

  /* 1️⃣ INITIALIZE */
  if (method === "initialize") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { list: true, call: true } },
        serverInfo: {
          name: "Linkup MySQL MCP",
          version: "1.0.0"
        }
      }
    });
  }

  /* 2️⃣ TOOLS LIST */
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "generate_mysql_query",
            description:
              "Generate and execute a READ-ONLY MySQL SELECT query.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "SELECT-only MySQL query"
                },
                description: {
                  type: "string",
                  description: "Explanation of what the query does"
                }
              },
              required: ["query"],
              additionalProperties: false
            }
          }
        ]
      }
    });
  }

  /* 3️⃣ TOOL CALL */
  if (method === "tools/call") {
    const { name, arguments: args } = params;

    if (name !== "generate_mysql_query") {
      return res.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: "Unknown tool" }
      });
    }

    try {
      const sql = args.query;

      // 🔐 Validate SQL
      assertReadOnlySelect(sql);

      // 🟢 Execute query
      const [rows] = await pool.query(sql);

      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "json",
              json: {
                description: args.description || null,
                row_count: rows.length,
                rows
              }
            }
          ]
        }
      });
    } catch (err) {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Query failed or rejected: ${err.message}`
            }
          ]
        }
      });
    }
  }

  /* Notifications */
  if (method && method.startsWith("notifications/")) {
    return res.json({ jsonrpc: "2.0", id, result: {} });
  }

  return res.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" }
  });
});

/* =========================
   🚀 START
   ========================= */

app.listen(4000, () => {
  console.log("✅ MCP MySQL server running on port 4000");
});
