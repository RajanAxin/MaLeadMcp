import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  });

  const transport = new StreamableHTTPClientTransport(
    new URL("https://developer.leaddial.co/mcp")  // Changed to localhost for testing
  );

  console.log("🔌 Connecting to MCP server...");
  await client.connect(transport);
  console.log("✅ Connected");

  // List available tools
  const tools = await client.listTools();
  console.log("🛠 Tools:", tools);

  // Call the ping tool
  const result = await client.callTool({ name: "ping" });
  console.log("📞 Ping result:", result);

  await client.close();
}

main().catch(console.error);