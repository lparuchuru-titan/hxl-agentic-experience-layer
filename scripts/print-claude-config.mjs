#!/usr/bin/env node
/**
 * Prints a Claude Desktop mcpServers block using this machine's
 * absolute Node and server paths. No secrets. Copy into
 * claude_desktop_config.json (merge with any servers you already have).
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = path.join(root, "mcp", "server.mjs");

function resolveNode() {
  try {
    return execSync("node -p \"process.execPath\"", { encoding: "utf8" }).trim();
  } catch {
    return "node";
  }
}

const config = {
  mcpServers: {
    "hxl-case-next-action": {
      command: resolveNode(),
      args: [server]
    }
  }
};

process.stdout.write(JSON.stringify(config, null, 2) + "\n");
