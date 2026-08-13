#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://widgets/case-next-action.html";
const SAMPLE = {
  caseNumber: "00001234",
  subject: "Payment failed on renewal invoice",
  priority: "High",
  slaHoursLeft: 2.5,
  slaAtRisk: true,
  customerName: "Northwind Traders",
  recommendedAction:
    "Confirm the card on file, then send the retry link and stay on the case until the payment posts.",
  ownerName: "Alex Rivera"
};

const bundle = readFileSync(
  require.resolve("@modelcontextprotocol/ext-apps/app-with-deps"),
  "utf8"
).replace(/export\{([^}]+)\};?\s*$/, (_, body) =>
  "globalThis.ExtApps={" +
    body
      .split(",")
      .map((pair) => {
        const [local, exported] = pair.split(" as ").map((s) => s.trim());
        return `${exported ?? local}:${local}`;
      })
      .join(",") +
    "};"
);

const widgetHtml = readFileSync(
  path.join(__dirname, "widgets", "case-next-action.html"),
  "utf8"
).replace("/*__EXT_APPS_BUNDLE__*/", () => bundle);

function createServer() {
  const server = new McpServer(
    { name: "hxl-case-next-action", version: "1.0.0" },
    {
      capabilities: {
        tools: {},
        resources: {},
        extensions: {
          "io.modelcontextprotocol/ui": {
            mimeTypes: [RESOURCE_MIME_TYPE]
          }
        }
      }
    }
  );

  registerAppResource(
    server,
    "Case Next Action",
    WIDGET_URI,
    {
      title: "Case Next Action",
      description: "HXL Case Next Action card",
      mimeType: RESOURCE_MIME_TYPE
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: { ui: { prefersBorder: false } }
        }
      ]
    })
  );

  registerAppTool(
    server,
    "get_case_next_action",
    {
      title: "Case Next Action",
      description:
        "Open the interactive Case Next Action card widget for a service case. Shows priority, SLA risk, recommended next action, and owner. Use when the user asks to demo HXL, show a case card, or get the next action on a case.",
      inputSchema: {
        caseNumber: z
          .string()
          .optional()
          .describe("Optional case number. Defaults to the sample at-risk renewal case.")
      },
      annotations: { readOnlyHint: true, title: "Case Next Action" },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "ui/resourceUri": WIDGET_URI
      }
    },
    async ({ caseNumber }) => {
      const payload = {
        ...SAMPLE,
        caseNumber: caseNumber?.trim() || SAMPLE.caseNumber
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }]
      };
    }
  );

  return server;
}

const transport = new StdioServerTransport();
await createServer().connect(transport);
