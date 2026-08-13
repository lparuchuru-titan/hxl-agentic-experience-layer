# Headless Experience Layer — Case Next Action

Public demo of Salesforce [Headless Experience Layer (HXL)](https://www.salesforce.com/headless/agentic-experience-layer/): define a UI once as Mosaic JSON, then render it natively in Slack, ChatGPT, Claude, Agentforce, or any MCP host.

This repo is the companion to the post **[I built a case card once. Then I watched it show up in Claude.](docs/blog/20260813-headless-experience-layer.html)** — including the HXL → Claude Desktop deploy steps.

## Case Next Action

![Case Next Action card](docs/media/case-next-action.png)

<video src="docs/media/case-next-action-demo.mp4" poster="docs/media/case-next-action.png" controls muted loop playsinline width="720"></video>

[Download the demo (MP4)](docs/media/case-next-action-demo.mp4) · animated preview:

![Demo: Mosaic JSON becoming the Case Next Action widget](docs/media/case-next-action-demo.gif)

## In Claude chat

The same widget rendered inside Claude Desktop after `get_case_next_action`. Account name and company branding in the sidebar are blurred.

![Case Next Action in Claude chat](docs/media/claude-chat-case-next-action.png)

<video src="docs/media/claude-chat-demo.mp4" poster="docs/media/claude-chat-case-next-action.png" controls muted loop playsinline width="720"></video>

[Download the Claude chat demo (MP4)](docs/media/claude-chat-demo.mp4)

## What is in here

| Path | What it is |
|---|---|
| `mosaics/case-next-action.json` | Playground Mosaic — paste this into [Explore the Playground](https://axl-playground-tdx-f802f74fb389.herokuapp.com/) |
| `mosaics/hello-world.json` | Minimal `tile/text` widget from the playground Hello World tutorial |
| `force-app/main/default/uiWidgets/caseNextAction/` | Salesforce WidgetBundle (`lightning__agentforceWidget` + schema + meta) |
| `preview/index.html` | Local semantic preview (intent, not pixels) |
| `preview/demo.html` | Timed walkthrough used for the README recording |
| `docs/blog/` | Public blog post |
| `mcp/` | MCP app so Claude can call `get_case_next_action` and render the card |

The playground itself is built the same way the tutorials teach: **each tutorial is a widget**. Expand the code view on any lesson to see the Mosaic tree.

## Try it

1. Open the [HXL Playground](https://axl-playground-tdx-f802f74fb389.herokuapp.com/).
2. Paste `mosaics/case-next-action.json` into the editor.
3. Switch surfaces (Slack / ChatGPT / Claude / Agentforce) and watch the same JSON re-render natively.

Local preview (file:// may block `fetch`; use a tiny static server):

```bash
python3 -m http.server 8766
# then open http://127.0.0.1:8766/preview/
```

Validate the WidgetBundle:

```bash
python3 scripts/validate-widget.py
```

Claude Code reviewed the Mosaic and WidgetBundle (13 August 2026): all six authoring checks passed (envelope, bindings, semantic variants, one primary button, boolean `meta.if`, usefulness as a next-action card). Buttons are still presentational — hosts must wire the primary action.

## Claude demo

Full click-path is in the [blog’s deploy section](docs/blog/20260813-headless-experience-layer.html#deploy). Enable the server here:

**Settings → Desktop app → Developer → Local MCP servers**

![Enable hxl-case-next-action in Claude Desktop Developer settings](docs/media/claude-enable-mcp-developer.png)

**What git recorded**

| File | What it shows |
|---|---|
| `docs/media/claude-enable-mcp-developer.png` | Settings → Developer → Local MCP servers, `hxl-case-next-action` **running** (paths covered) |
| `docs/media/claude-enable-mcp-extensions.png` | Settings → Extensions, the sibling page |
| `docs/media/case-next-action.png` + `case-next-action-demo.mp4` | Mosaic / semantic preview of the card |
| `docs/media/claude-chat-case-next-action.png` + `claude-chat-demo.mp4` | The card **in Claude Desktop chat** (account name and company mark blurred) |

**Claude Desktop:** add `mcp/server.mjs` as a stdio server in `claude_desktop_config.json`, quit with ⌘Q, confirm it is **running** on the Developer page, new chat, then:

```
Show me the Case Next Action card
```

## Two JSON shapes, one idea

The playground speaks **Mosaic** (`type: mosaic`, `definition: tile/mosaic`, `{!$case.field}`).

A Salesforce org speaks a **WidgetBundle** (`type: lightning__agentforceWidget`, root `tile/widget`, `{!$attrs.field}` plus `schema.json`).

Same primitives (`tile/card`, `tile/badge`, `tile/button`, `meta.if`). Different envelope so the org can type-check attributes and register the bundle.

## Not in this repo

- No org deploy. Deploy WidgetBundles only when you intend to.
- No company CRM data. Sample payload is fictional (`Northwind Traders` / `00001234`).
- No pixel styling. HXL widgets express **semantic variants** (`primary`, `warning`, `elevated`) so each host applies its own look.

## License

MIT. Product names belong to Salesforce, Inc. This is an independent sample, not an official Salesforce repository.
