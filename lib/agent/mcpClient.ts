import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Keep a singleton client in memory if possible to avoid rapid spawn/kill cycles,
// though in serverless environments this may recreate.
let mcpClientInstance: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

export async function getMcpClient() {
  if (mcpClientInstance) {
    return mcpClientInstance;
  }

  // Use npx to dynamically run the GitHub MCP Server
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  mcpTransport = new StdioClientTransport({
    command,
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      ...process.env,
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
    }
  });

  mcpClientInstance = new Client(
    {
      name: "motivate-ai-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  console.log("Connecting to GitHub MCP server via stdio...");
  await mcpClientInstance.connect(mcpTransport);
  console.log("Connected to GitHub MCP server!");

  return mcpClientInstance;
}
