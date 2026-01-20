import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://developer.leaddial.co/mcp")
);

const client = new Client(
  { name: "test-client", version: "1.0.0" },
   transport
);

await client.connect();

const tools = await client.listTools();
console.log(tools);

await client.close();
