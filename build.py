#!/usr/bin/env python3
"""
v8 i18n + module build for hwa-landing.

Pipeline:
  1. Read src/v8.template.html
  2. Concatenate CSS modules (src/styles/*) in manifest order
  3. Concatenate JS modules (src/scripts/*) in manifest order
  4. Minify CSS + JS + HTML (skipped with --no-minify)
  5. Inject CSS + JS into template at the two markers
  6. Validate every locales/{lang}.json against locales/_schema.json
  7. Per-locale: {{key}} → value substitution; write v8.html (EN) or v8.{lang}.html

Usage:
    python3 build.py                  # production build, minified
    python3 build.py --no-minify      # dev build, readable output

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
    manifest = json.loads(read(manifest_path))
    parts = []
    for name in manifest:
        f = directory / name
        if not f.exists():
            die(f"manifest references missing file: {f}")
        parts.append(read(f))
    return "\n".join(parts)


# ── Minifiers ──────────────────────────────────────────────────────
def minify_css(css):
    """Aggressive but safe CSS minifier (stdlib regex, no AST)."""
    # Block comments
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    # Collapse all whitespace runs to a single space
    css = re.sub(r"\s+", " ", css)
    # Remove space around: { } : ; , >
    css = re.sub(r"\s*([{}:;,>])\s*", r"\1", css)
    # Trailing ; before } → drop
    css = re.sub(r";}", "}", css)
    return css.strip()


def minify_js(js):
    """Conservative JS minifier — strips comments + blank lines + leading whitespace
    per line. Keeps line breaks (no risky semicolon-insertion changes). Does NOT
    touch // end-of-line comments because // may appear in URL strings ('http://...').
    """
    out = []
    in_block = False
    for line in js.split("\n"):
        # Inside a multi-line block comment from a previous line
        if in_block:
            i = line.find("*/")
            if i < 0:
                continue
            line = line[i + 2:]
            in_block = False
        # Single-line /* ... */
        line = re.sub(r"/\*.*?\*/", "", line)
        # Open block comment with no close on this line
        i = line.find("/*")
        if i >= 0:
            line = line[:i]
            in_block = True
        stripped = line.rstrip()
        # Skip blank/whitespace-only lines
        if not stripped.strip():
            continue
        out.append(stripped.lstrip())
    return "\n".join(out)


def minify_html(html):
    """Light HTML minifier — strip non-conditional comments + collapse blank lines.
    Does NOT collapse whitespace between tags (preserves inline text spacing)."""
    # Strip HTML comments except IE conditionals (<!--[if ...]-->) and any
    # leftover INJECT markers (shouldn't be any post-injection, but defensive)
    html = re.sub(r"<!--(?!\[if|\s*INJECT)[\s\S]*?-->", "", html)
    # Collapse runs of blank lines to a single blank line
    html = re.sub(r"\n\s*\n+", "\n", html)
    return html


# ── Validation ─────────────────────────────────────────────────────
def validate_locale(lang, data, required_keys):
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


# ── Build ──────────────────────────────────────────────────────────
def build(minify=True):
    template = read(TEMPLATE)
    if INJECT_CSS_MARKER not in template:
        die(f"template missing marker: {INJECT_CSS_MARKER}")
    if INJECT_JS_MARKER not in template:
        die(f"template missing marker: {INJECT_JS_MARKER}")

    css_bundle = concat(STYLES_DIR, MANIFESTS / "styles.json")
    js_bundle  = concat(SCRIPTS_DIR, MANIFESTS / "scripts.json")

    pre_css_size = len(css_bundle)
    pre_js_size  = len(js_bundle)

    if minify:
        css_bundle = minify_css(css_bundle)
        js_bundle  = minify_js(js_bundle)
        print(f"  CSS  {pre_css_size:>6} → {len(css_bundle):>6} bytes  ({(len(css_bundle)/pre_css_size)*100:.0f}%)")
        print(f"  JS   {pre_js_size:>6} → {len(js_bundle):>6} bytes  ({(len(js_bundle)/pre_js_size)*100:.0f}%)")

    base = template.replace(INJECT_CSS_MARKER, css_bundle, 1)
    base = base.replace(INJECT_JS_MARKER, js_bundle, 1)
    if minify:
        base = minify_html(base)

    schema = json.loads(read(SCHEMA))
    required_keys = schema["required_keys"]

    locale_files = sorted(LOCALES.glob("*.json"))
    locale_files = [f for f in locale_files if not f.stem.startswith("_")]
    if not locale_files:
        die(f"no locale files in {LOCALES}")

    generated = []
    for lf in locale_files:
        lang = lf.stem
        data = json.loads(read(lf))
        validate_locale(lang, data, required_keys)

        result = base
        for key, value in data.items():
            result = result.replace(f"{{{{{key}}}}}", value)

        remaining = re.findall(r"\{\{[^}]+\}\}", result)
        if remaining:
            die(f"[{lang}] unresolved placeholders: {sorted(set(remaining))}")

        out = BASE / ("v8.html" if lang == "en" else f"v8.{lang}.html")
        out.write_text(result, encoding="utf-8")
        size_kb = out.stat().st_size // 1024
        generated.append(out.name)
        print(f"  {out.name:<22}  {size_kb} KB")

    print(f"\n{len(generated)} file(s) generated{' (minified)' if minify else ' (NOT minified)'}")
    return generated


if __name__ == "__main__":
    minify = "--no-minify" not in sys.argv
    mode = "minified" if minify else "no-minify (dev)"
    print(f"Building from src/v8.template.html [{mode}] …")
    build(minify=minify)
