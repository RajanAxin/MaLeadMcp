const express = require("express");
const fetch = require("node-fetch"); // v2

const app = express();

/* MUST be first */
app.use(express.json({ limit: "1mb" }));

/* Health check */
app.get("/mcp", (req, res) => {
  res.json({ status: "ok", protocol: "mcp" });
});

app.post("/mcp", async (req, res) => {
  console.log("⬇️ MCP REQUEST:", JSON.stringify(req.body, null, 2));

  const { method, id = null, params = {} } = req.body || {};

  /* 1️⃣ INITIALIZE */
  if (method === "initialize") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: { list: true, call: true }
        },
        serverInfo: {
          name: "LinkUp Reporting MCP Server",
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
            name: "call_external_api",
            description:
              "Execute reporting logic by sending input to an external API and returning its response",
            strict: false,
            inputSchema: {
              type: "object",
              properties: {
                user_input: {
                  type: "string",
                  description: "SQL or reporting instruction to send"
                }
              },
              required: ["user_input"],
              additionalProperties: false
            }
          }
        ]
      }
    });
  }

  /* 3️⃣ TOOLS CALL */
  if (method === "tools/call") {
    const { name, arguments: args } = params;

    if (name !== "call_external_api") {
      return res.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: "Unknown tool" }
      });
    }

    try {
      console.log("🧠 TOOL ARGS:", args);
      const USERNAME = "snapit";
      const PASSWORD = "mysnapit22";
    
      const token = btoa(`${USERNAME}:${PASSWORD}`);
      /* 🔥 IMPORTANT: argument name MUST match inputSchema */
      const apiResponse = await fetch(
        "https://stage.linkup.software/api/tools/call-external-api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${token}`
          },
          body: JSON.stringify({
            user_input: args.user_input // ✅ FIXED
          })
        }
      );

      const apiResult = await apiResponse.json();

      console.log("✅ EXTERNAL API RESPONSE:", apiResult);

      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          result: apiResult?.result ?? null,
          error: apiResult?.error ?? null
        }
      });
    } catch (err) {
      console.error("❌ TOOL EXECUTION ERROR:", err);

      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: "Failed to execute external reporting API"
            }
          ]
        }
      });
    }
  }

  /* Notifications (required by MCP spec) */
  if (method && method.startsWith("notifications/")) {
    return res.json({ jsonrpc: "2.0", id, result: {} });
  }

  /* Fallback */
  return res.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method "${method}" not found` }
  });
});

/* Start server */
app.listen(4000, () => {
  console.log("✅ MCP server running on port 4000");
});
