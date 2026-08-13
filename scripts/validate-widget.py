#!/usr/bin/env python3
"""Validate the Case Next Action WidgetBundle against HXL authoring rules."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WIDGET_DIR = ROOT / "force-app" / "main" / "default" / "uiWidgets" / "caseNextAction"
BODY = WIDGET_DIR / "caseNextAction.json"
SCHEMA = WIDGET_DIR / "schema.json"
META = WIDGET_DIR / "caseNextAction.uiwidget-meta.xml"
MOSAIC = ROOT / "mosaics" / "case-next-action.json"

NS = {"sf": "http://soap.sforce.com/2006/04/metadata"}
ATTR_RE = re.compile(r"\{\!\$attrs\.([A-Za-z0-9_]+)\}")


def check(name: str, ok: bool, reason: str = "") -> None:
    status = "pass" if ok else f"fail ({reason})"
    print(f"- {name}: {status}")
    if not ok:
        raise SystemExit(1)


def walk_has_type(node) -> bool:
    if isinstance(node, dict):
        if "type" in node and "definition" in node and node.get("definition") != "lightning__agentforceWidget":
            # envelope type is allowed only at root; nested UEM nodes must not have type
            if node.get("definition", "").startswith("tile/"):
                return True
        for v in node.values():
            if walk_has_type(v):
                return True
    elif isinstance(node, list):
        return any(walk_has_type(v) for v in node)
    return False


def uem_nodes_have_type(widget_body: dict) -> bool:
    def walk(n):
        if isinstance(n, dict):
            if "definition" in n and "type" in n:
                return True
            return any(walk(v) for v in n.values())
        if isinstance(n, list):
            return any(walk(v) for v in n)
        return False

    return walk(widget_body)


def main() -> None:
    check("files-present", BODY.exists() and SCHEMA.exists() and META.exists())

    schema = json.loads(SCHEMA.read_text())
    check("schema-parses", True)
    attrs = schema.get("properties", {}).get("attributes", {})
    check(
        "schema-root-keys",
        isinstance(schema.get("title"), str)
        and schema.get("type") == "object"
        and isinstance(attrs, dict)
        and attrs.get("lightning:type") == "lightning__objectType"
        and isinstance(attrs.get("properties"), dict)
        and "unevaluatedProperties" not in schema,
    )
    leaves = attrs.get("properties", {})
    missing_types = [k for k, v in leaves.items() if not isinstance(v, dict) or "lightning:type" not in v]
    check("schema-leaf-types", not missing_types, ",".join(missing_types))

    body = json.loads(BODY.read_text())
    check(
        "body-envelope",
        body.get("type") == "lightning__agentforceWidget"
        and isinstance(body.get("contentBody"), dict)
        and isinstance(body["contentBody"].get("widgetBody"), dict)
        and body["contentBody"]["widgetBody"].get("definition") == "tile/widget",
    )
    widget_body = body["contentBody"]["widgetBody"]
    check("body-no-uem-type", not uem_nodes_have_type(widget_body), "UEM node has type")

    bindings = set(ATTR_RE.findall(BODY.read_text()))
    unresolved = sorted(b for b in bindings if b not in leaves)
    check("bindings-resolve", not unresolved, ",".join(unresolved))

    tree = ET.parse(META)
    root = tree.getroot()
    tag = root.tag.split("}", 1)[-1]
    check("metaxml-wellformed", True)

    def text(name: str) -> str:
        el = root.find(f"sf:{name}", NS)
        if el is None:
            el = root.find(name)
        return (el.text or "").strip() if el is not None else ""

    check(
        "metaxml-elements",
        tag == "UiWidgetBundle"
        and bool(text("masterLabel"))
        and bool(text("description"))
        and text("widgetType") == "JSON",
    )

    mosaic = json.loads(MOSAIC.read_text())
    check(
        "playground-mosaic",
        mosaic.get("type") == "mosaic"
        and mosaic.get("definition") == "tile/mosaic"
        and isinstance(mosaic.get("dataProviders"), list)
        and mosaic.get("children"),
    )
    print("All checks passed.")


if __name__ == "__main__":
    main()
