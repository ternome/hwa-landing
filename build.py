#!/usr/bin/env python3
"""
v8 i18n + module build for hwa-landing.

Pipeline:
  1. Read src/v8.template.html
  2. Concatenate CSS modules (src/styles/*) in manifest order, inject into template
  3. Concatenate JS modules (src/scripts/*)  in manifest order, inject into template
  4. Validate every locales/{lang}.json against locales/_schema.json
  5. For each locale, apply {{key}} → value substitution, write v8.html (EN) or v8.{lang}.html

Usage:
    python3 build.py

Output files are written to the repo root. Build aborts on schema violation,
unresolved placeholder, or missing INJECT marker.
"""
import json
import re
import sys
from pathlib import Path

BASE         = Path(__file__).parent
TEMPLATE     = BASE / "src" / "v8.template.html"
STYLES_DIR   = BASE / "src" / "styles"
SCRIPTS_DIR  = BASE / "src" / "scripts"
MANIFESTS    = BASE / "src" / "manifests"
LOCALES      = BASE / "locales"
SCHEMA       = LOCALES / "_schema.json"

INJECT_CSS_MARKER = "<!-- INJECT_CSS -->"
INJECT_JS_MARKER  = "<!-- INJECT_JS -->"


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def read(path):
    if not path.exists():
        die(f"missing file: {path}")
    return path.read_text(encoding="utf-8")


def concat(directory, manifest_path):
    """Read JSON manifest [filenames] and concat the files in order."""
    manifest = json.loads(read(manifest_path))
    parts = []
    for name in manifest:
        f = directory / name
        if not f.exists():
            die(f"manifest references missing file: {f}")
        parts.append(read(f))
    return "\n".join(parts)


def validate_locale(lang, data, required_keys):
    """Fail-fast if a locale is missing keys or has extras."""
    actual = set(data.keys())
    required = set(required_keys)
    missing = required - actual
    extra = actual - required
    if missing or extra:
        msg = [f"locale '{lang}' schema mismatch:"]
        if missing:
            msg.append(f"  missing keys: {sorted(missing)}")
        if extra:
            msg.append(f"  extra keys:   {sorted(extra)}")
        die("\n".join(msg))


def build():
    # ── 1. Template ────────────────────────────────────────────────
    template = read(TEMPLATE)
    if INJECT_CSS_MARKER not in template:
        die(f"template missing marker: {INJECT_CSS_MARKER}")
    if INJECT_JS_MARKER not in template:
        die(f"template missing marker: {INJECT_JS_MARKER}")

    # ── 2. Concatenate CSS modules ─────────────────────────────────
    css_bundle = concat(STYLES_DIR, MANIFESTS / "styles.json")

    # ── 3. Concatenate JS modules ──────────────────────────────────
    js_bundle = concat(SCRIPTS_DIR, MANIFESTS / "scripts.json")

    # ── 4. Inject into template (CSS + JS markers) ─────────────────
    base = template.replace(INJECT_CSS_MARKER, css_bundle, 1)
    base = base.replace(INJECT_JS_MARKER, js_bundle, 1)

    # ── 5. Validate locales against schema ─────────────────────────
    schema = json.loads(read(SCHEMA))
    required_keys = schema["required_keys"]

    locale_files = sorted(LOCALES.glob("*.json"))
    locale_files = [f for f in locale_files if not f.stem.startswith("_")]
    if not locale_files:
        die(f"no locale files in {LOCALES}")

    # ── 6. Per-locale generation ───────────────────────────────────
    generated = []
    for lf in locale_files:
        lang = lf.stem
        data = json.loads(read(lf))
        validate_locale(lang, data, required_keys)

        result = base
        for key, value in data.items():
            result = result.replace(f"{{{{{key}}}}}", value)

        # Unresolved-placeholder guard
        remaining = re.findall(r"\{\{[^}]+\}\}", result)
        if remaining:
            unique = sorted(set(remaining))
            die(f"[{lang}] unresolved placeholders: {unique}")

        out = BASE / ("v8.html" if lang == "en" else f"v8.{lang}.html")
        out.write_text(result, encoding="utf-8")
        size_kb = out.stat().st_size // 1024
        generated.append(out.name)
        print(f"  {out.name:<22}  {size_kb} KB")

    print(f"\n{len(generated)} file(s) generated from src/v8.template.html")
    print(f"  CSS bundle: {len(css_bundle.splitlines())} lines from {len(json.loads(read(MANIFESTS/'styles.json')))} modules")
    print(f"  JS  bundle: {len(js_bundle.splitlines())} lines from {len(json.loads(read(MANIFESTS/'scripts.json')))} modules")
    return generated


if __name__ == "__main__":
    print(f"Building from src/v8.template.html …")
    build()
