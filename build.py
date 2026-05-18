#!/usr/bin/env python3
"""
i18n build script for hwa-landing.
Reads v8.template.html + locales/*.json → generates v8.html (en) and v8.{lang}.html.

Usage:
    python3 build.py

Output files are written to the repo root.
"""
import json
import re
import sys
from pathlib import Path

BASE     = Path(__file__).parent
TEMPLATE = BASE / "v8.template.html"
LOCALES  = BASE / "locales"

def build():
    if not TEMPLATE.exists():
        print(f"ERROR: template not found at {TEMPLATE}", file=sys.stderr)
        sys.exit(1)

    source = TEMPLATE.read_text(encoding="utf-8")
    locale_files = sorted(LOCALES.glob("*.json"))

    if not locale_files:
        print(f"ERROR: no locale JSON files in {LOCALES}", file=sys.stderr)
        sys.exit(1)

    generated = []
    for lf in locale_files:
        lang_code = lf.stem          # e.g. "en", "ru", "zh-hans"
        data      = json.loads(lf.read_text(encoding="utf-8"))
        result    = source

        for key, value in data.items():
            result = result.replace(f"{{{{{key}}}}}", value)

        # Warn about any remaining unresolved placeholders
        remaining = re.findall(r"\{\{[^}]+\}\}", result)
        if remaining:
            unique = sorted(set(remaining))
            print(f"  WARNING [{lang_code}]: unresolved keys: {unique}")

        # English is the default → v8.html; others → v8.{lang}.html
        if lang_code == "en":
            out_path = BASE / "v8.html"
        else:
            out_path = BASE / f"v8.{lang_code}.html"

        out_path.write_text(result, encoding="utf-8")
        size_kb = out_path.stat().st_size // 1024
        generated.append(out_path.name)
        print(f"  ✓  {out_path.name:<22}  ({size_kb} KB)")

    print(f"\n{len(generated)} file(s) generated from {TEMPLATE.name}")
    return generated

if __name__ == "__main__":
    print(f"Building from {TEMPLATE.name} …")
    build()
