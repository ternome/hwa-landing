# Hero Wars: Alliance — Landing Pages

Static HTML landing-page workbench for **Hero Wars: Alliance** by Nexters Global.
Multiple design directions live side-by-side; the index page lets you click
between them.

**Live deploy:** [hwa-landing.vercel.app](https://hwa-landing.vercel.app/) —
auto-routed to the right language via Accept-Language header.

## Versions

### Production — v8 (12 locales)

`v8.html` is the current production candidate. It is **generated** from
`v8.template.html` + `locales/*.json` by running `python3 build.py`.

| File | Language |
|---|---|
| [`v8.html`](v8.html) | English (default) |
| [`v8.ru.html`](v8.ru.html) | Русский |
| [`v8.de.html`](v8.de.html) | Deutsch |
| [`v8.fr.html`](v8.fr.html) | Français |
| [`v8.es.html`](v8.es.html) | Español |
| [`v8.pt.html`](v8.pt.html) | Português |
| [`v8.it.html`](v8.it.html) | Italiano |
| [`v8.pl.html`](v8.pl.html) | Polski |
| [`v8.ja.html`](v8.ja.html) | 日本語 |
| [`v8.ko.html`](v8.ko.html) | 한국어 |
| [`v8.zh-hans.html`](v8.zh-hans.html) | 简体中文 |
| [`v8.zh-hant.html`](v8.zh-hant.html) | 繁體中文 |

Vercel routes `/` and `/v8.html` to the right locale via Accept-Language
header rewrites (`vercel.json`). Users can also link directly to any locale file.

### Archive — design experiments

All previous design directions live in [`archive/`](archive/). They are
preserved for design-history reference and reachable at `/archive/vN.html`
(or via the [archive index](archive/index.html)). Vercel issues 301 redirects
from legacy URLs like `/v3.html` → `/archive/v3.html` to keep old links alive.

| File | Concept |
|---|---|
| [`archive/v8.1.html`](archive/v8.1.html) | Cinematic left-align variant (v6-style topbar + siderail) |
| [`archive/v7.html`](archive/v7.html) | Dark fantasy + video hero — Cinzel headlines, gold-gradient |
| [`archive/v6.html`](archive/v6.html) | Snap scroll + forest news bg |
| [`archive/v5.html`](archive/v5.html) | Real artwork + Discover CTA — hero/scene images, events grid |
| [`archive/v4.html`](archive/v4.html) | ARC Raiders (screenshot) — «forge. siege.» slogan, neon-green stickers |
| [`archive/v3.html`](archive/v3.html) | ARC Raiders (first pass) — industrial condensed type, numbered slabs |
| [`archive/v2.html`](archive/v2.html) | Fortnite Discover — catalog detail page, community channels |
| [`archive/v1.html`](archive/v1.html) | Cinematic hero — Netflix-style cards, YouTube video bg, Anton |

Plus `v1-source.html`, `v1-standalone.html`, `v6-source.html`, `tweaks-panel.jsx`
all moved to `archive/`. [`index.html`](index.html) is the production hub
(production-only after the refactor).

## v8 — what's inside

* **Hero**: full-viewport video (`assets/hero-bg.mp4`) with `keyart.webp` as poster
  + CSS-bg fallback + dissolve-in once `playing` event fires
* **Top nav**: HW logo · «NEW · Season 32 · Watch trailer» pill (opens YouTube
  modal, hover shows thumbnail below pill) · live "players online" counter
  (pulsing dot, fluctuating number) · "Already playing? **Sign in**" pill
  (opens login modal)
* **Hero content (left-flush)**: `LEVEL UP YOUR HERO` (Anton) → green `PLAY NOW`
  button (pulse + shine animation, click sound) → 1000 emeralds welcome-bonus
  offer → Free · No credit card · Plays in browser meta
* **Bottom meta strip**: AVAILABLE ON [Web/iOS/Android] · ★★★★★ 4.8 · 204M+
  Players · THE BEST MOBILE RPG 2025
* **Fake push notifications** (top-right, fixed position, hidden on mobile):
  scheduled stream with real-photo girl avatars, sticker reactions
* **Modals**: 2-stage email → code login (magic code `123123` redirects to
  the real app); inline validation errors with reserved space (no layout jump);
  YouTube trailer iframe modal
* **Mobile (≤1023px)**: vertical stack, no push stream, no hover-thumbnail,
  modals fit narrow viewports
* **OG / SEO**: full meta-tag suite, Schema.org `VideoGame` JSON-LD, Apple
  Smart App Banner (app-id 1158967485), custom `og-image.jpg` with overlay

## Quick start

```bash
# Regenerate all 12 locale HTML files (minified, production output)
python3 build.py

# Dev build — readable, no minification (use this while iterating on src/)
python3 build.py --no-minify

# Serve locally (preview all pages)
npx serve -l 5173 .
# → open http://localhost:5173/index.html
```

`v8.html` + `v8.*.html` are `.gitignore`d (output of `build.py`). The source
of truth lives in `src/` + `locales/`. Vercel runs `python3 build.py` on
every deploy via `vercel.json` `buildCommand`, so the generated files are
fresh in prod. Locally you regenerate them yourself.

No runtime dependencies. No package.json. Python stdlib only for the build.
The `.claude/launch.json` is wired for the Claude Code preview panel — same
`npx serve` command, port 5173.

## File structure

```
/
├── index.html               # production-only hub (accessible at /index.html)
├── build.py                 # i18n + module build script (stdlib only)
├── vercel.json              # 301 redirects + Accept-Language rewrites
│
├── src/                     # SOURCE — EDIT THESE, generated files are output
│   ├── v8.template.html     # structure only (INJECT_CSS + INJECT_JS markers)
│   ├── styles/              # 10 CSS modules — see CLAUDE.md §4 for map
│   ├── scripts/             # 6 JS modules
│   └── manifests/
│       ├── styles.json      # CSS concatenation order (NOT alphabetical)
│       └── scripts.json     # JS concatenation order
│
├── locales/
│   ├── _schema.json         # 36 required keys; build aborts on mismatch
│   ├── en.json              # → v8.html (EN default)
│   ├── ru.json              # → v8.ru.html
│   └── …                    # 12 locales total
│
├── v8.html                  # GENERATED — EN default
├── v8.{lang}.html           # GENERATED — one per locale (11 more)
│
├── assets/                  # v8 production-only assets
│   ├── hero-bg.mp4          # hero video (~78 MB)
│   ├── keyart.webp          # poster + CSS bg fallback
│   ├── og-image.jpg         # social-card preview
│   ├── favicon.webp
│   ├── button-feedback.mp3  # PLAY NOW click sound
│   ├── reaction-{like,love}.png
│   └── v8/
│       ├── emerald.png, logo.png
│       ├── stickers/         # 10 PNG stickers for push reactions
│       └── avatars/          # real-photo avatars (Solenne, Aurelia)
│
└── archive/                 # everything NOT v8
    ├── index.html           # archive hub (noindex robots)
    ├── v1.html … v7.html    # design experiments
    ├── v8.1.html            # cinematic variant
    ├── v1-source.html, v1-standalone.html, v6-source.html
    ├── tweaks-panel.jsx
    └── assets/              # legacy-only assets (hero portraits, scenes,
                             # keyart.{jpg,png}, logo.png, award.{svg,png},
                             # lottie, news-forest.png)
```

## i18n — adding or updating a locale

1. Edit `locales/{lang}.json` (all 39 keys required, validated against
   `locales/_schema.json`) — or create a new one for a new language
2. Run `python3 build.py` → zero warnings, zero unresolved placeholders,
   schema-OK expected (build fails fast otherwise)
3. Stage source + generated files together:
   ```bash
   git --git-dir=.git --work-tree=. add src/ locales/ v8*.html
   ```
4. If new locale: add a card in `index.html` Production section + Accept-Language
   rewrites for `/` and `/v8.html` in `vercel.json`
5. Commit + push

## Tech stack

* **HTML / CSS / JS** — vanilla, no framework, no transpiler, no bundler
* **Python 3 (stdlib)** — `build.py` for i18n generation + stdlib regex
  minification (HTML / CSS / JS), no third-party deps
* **Google Fonts** — Anton (display), Inter (body), Roboto (PLAY NOW button)
* **Vercel** — static hosting, `buildCommand: python3 build.py` runs on every
  deploy, Accept-Language header rewrites + 301 redirects (`vercel.json`)
* No npm dependencies. `npx serve` (one-off, no install) for local preview.

### Performance characteristics (after Phase 3 minification)

| Locale | Unminified | Minified | Ratio |
|---|---|---|---|
| EN  | 71 KB | 59 KB | 83% |
| RU  | 72 KB | 60 KB | 83% |
| All | 69-72 KB | 58-60 KB | ~83% |

CSS bundle: 34.6 KB → 26.1 KB (75%). JS bundle: 23.5 KB → 21.7 KB (92%,
conservative — only block comments + blank lines stripped to keep `//` URLs
intact). Brotli compression on top (handled by Vercel) typically cuts another
~70% off the wire payload.

## Production checklist (already done in v8)

- [x] OG meta (FB/LinkedIn/Discord/Slack)
- [x] Twitter Card
- [x] Schema.org JSON-LD (`VideoGame` entity)
- [x] Canonical URL
- [x] Apple Smart App Banner (app-id 1158967485)
- [x] Favicons (icon, apple-touch-icon, mask-icon — single webp wordmark)
- [x] Theme color + color-scheme dark
- [x] Robots meta (max-image-preview large)
- [x] Mobile / tablet adaptation (≤1023px)
- [x] Touch-only fallback (hover thumbnails disabled)
- [x] Video poster + CSS background fallback
- [x] Preload `keyart.webp` + `emerald.png`; preload `hero-bg.mp4` desktop-only
- [x] DNS-prefetch + preconnect (Google Fonts, YouTube)
- [x] `font-display: swap` (via Google Fonts URL)
- [x] Image `width` + `height` + `decoding="async"` on inline `<img>` (zero-CLS)
- [x] `loading="lazy"` on push avatars, stickers, reaction icons, trailer thumbnail
- [x] Cache-Control headers via `vercel.json`: `/assets/*` immutable 1y;
      `/v8*.html` must-revalidate; `/archive/*` 1h + `X-Robots-Tag: noindex`
- [x] sitemap.xml + robots.txt (GENERATED by build.py)
- [x] Stdlib HTML/CSS/JS minification (CSS −25%, total payload −15% before brotli)
- [ ] PNG favicon set (32×32, 180×180 apple-touch, 192/512) — requires
      ImageMagick locally; current webp wordmark works on all modern browsers
- [ ] Lite hero video for mobile — requires ffmpeg; current pipeline preloads
      78MB only on `(min-width: 1024px)`, mobile gets it on-demand via `<video>`
- [ ] Real backend for login form (currently magic code `123123` redirects to app)

## Credits

Game artwork, name, and brand belong to **Nexters Global LTD**. Stickers,
keyart, video, logo, official favicon are sourced from
[hero-wars-alliance.com](https://hero-wars-alliance.com) and
[App Store id1158967485](https://apps.apple.com/us/app/hero-wars-alliance-adventure/id1158967485).

Landing concept code: this repo. AGENTS see [CLAUDE.md](CLAUDE.md) for working
conventions.
