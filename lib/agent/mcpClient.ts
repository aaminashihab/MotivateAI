import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Keep clients in memory to avoid rapid spawn/kill cycles
const mcpClients: Record<string, Client> = {};
const mcpTransports: Record<string, StdioClientTransport> = {};

export async function getMcpClients(): Promise<Record<string, Client>> {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  // 1. GitHub MCP Server
  if (!mcpClients['github']) {
    try {
      mcpTransports['github'] = new StdioClientTransport({
        command,
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          ...process.env,
          GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
        }
      });

      const ghClient = new Client({ name: "motivate-ai-github", version: "1.0.0" }, { capabilities: {} });
      console.log("Connecting to GitHub MCP server...");
      await ghClient.connect(mcpTransports['github']);
      mcpClients['github'] = ghClient;
      console.log("Connected to GitHub MCP server!");
    } catch (e) {
      console.error("Failed to connect to GitHub MCP:", e);
    }
  }

  // 2. MongoDB MCP Server
  if (!mcpClients['mongodb']) {
    try {
      mcpTransports['mongodb'] = new StdioClientTransport({
        command,
        args: ["-y", "@mongodb-js/mongodb-mcp-server"],
        env: {
          ...process.env,
          MONGODB_URI: process.env.MONGODB_URI || '',
        }
      });

      const mongoClient = new Client({ name: "motivate-ai-mongodb", version: "1.0.0" }, { capabilities: {} });
      console.log("Connecting to MongoDB MCP server...");
      await mongoClient.connect(mcpTransports['mongodb']);
      mcpClients['mongodb'] = mongoClient;
      console.log("Connected to MongoDB MCP server!");
    } catch (e) {
      console.error("Failed to connect to MongoDB MCP:", e);
    }
  }

  return mcpClients;
}
