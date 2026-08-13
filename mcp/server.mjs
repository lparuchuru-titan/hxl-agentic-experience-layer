#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://widgets/case-next-action.html";
const MIME = "text/html;profile=mcp-app";
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

const widgetHtml = readFileSync(
  path.join(__dirname, "widgets", "case-next-action.html"),
  "utf8"
);

function createServer() {
  const server = new McpServer({
    name: "hxl-case-next-action",
    version: "1.0.0"
  });

  server.registerResource(
    "case-next-action-widget",
    WIDGET_URI,
    {
      title: "Case Next Action",
      description: "HXL Case Next Action card",
      mimeType: MIME
    },
    async () => ({
      contents: [{ uri: WIDGET_URI, mimeType: MIME, text: widgetHtml }]
    })
  );

  server.registerTool(
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
      _meta: { ui: { resourceUri: WIDGET_URI } }
    },
    async ({ caseNumber }) => {
      const payload = {
        ...SAMPLE,
        caseNumber: caseNumber?.trim() || SAMPLE.caseNumber
      };
      const summary = [
        `Case ${payload.caseNumber} — ${payload.subject}`,
        `Customer: ${payload.customerName} · Priority: ${payload.priority} · Owner: ${payload.ownerName}`,
        payload.slaAtRisk
          ? `SLA at risk: ${payload.slaHoursLeft} hours remaining`
          : `SLA: ${payload.slaHoursLeft} hours remaining`,
        `Recommended next action: ${payload.recommendedAction}`
      ].join("\n");
      return {
        content: [
          { type: "text", text: JSON.stringify(payload) },
          { type: "text", text: summary }
        ],
        _meta: { ui: { resourceUri: WIDGET_URI } }
      };
    }
  );

  return server;
}

async function startStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttp() {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ ok: true, widget: WIDGET_URI }));
  app.get("/widget-preview", (_req, res) => {
    res.type("html").send(widgetHtml);
  });
  app.post("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
  const port = Number(process.env.PORT || 8787);
  app.listen(port, "127.0.0.1", () => {
    console.error(`HXL Case Next Action MCP on http://127.0.0.1:${port}/mcp`);
    console.error(`Widget preview: http://127.0.0.1:${port}/widget-preview`);
  });
}

if (process.argv.includes("--http")) {
  await startHttp();
} else {
  await startStdio();
}
