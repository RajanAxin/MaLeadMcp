import express from "express";
import fetch from "node-fetch"; // v2

const app = express();

/* MUST be first */
app.use(express.json({ limit: "1mb" }));

/* Health check */
app.get("/api-mcp", (req, res) => {
  res.json({ status: "ok", protocol: "mcp" });
});

app.post("/api-mcp", async (req, res) => {
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
              "Execute reporting SQL and return structured result data",
            strict: false,
            inputSchema: {
              type: "object",
              properties: {
                user_input: {
                  type: "string",
                  description: "SQL query to execute (SELECT only)"
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

      const authToken = Buffer.from(
        `${USERNAME}:${PASSWORD}`
      ).toString("base64");

      /* Call your existing backend API */
      const apiResponse = await fetch(
        "https://stage.linkup.software/api/tools/call-external-api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authToken}`
          },
          body: JSON.stringify({
            user_input: args.user_input
          })
        }
      );

      const apiResult = await apiResponse.json();

      /**
       * 🔥 IMPORTANT
       * Return STRUCTURED DATA — NOT TEXT
       */
      let rows = [];

      if (Array.isArray(apiResult?.result)) {
        rows = apiResult.result;
      } else if (typeof apiResult?.result === "object") {
        rows = [apiResult.result];
      }
      console.log("answer:", apiResult);
      console.log("final answer:", rows);
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          data: rows   // ✅ THIS IS THE KEY FIX
        }
      });

    } catch (err) {
      console.error("❌ TOOL EXECUTION ERROR:", err);

      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          data: [],
          error: "Failed to execute external reporting API"
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
