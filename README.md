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

| File | Concept |
|---|---|
| [`v8.1.html`](v8.1.html) | Cinematic left-align variant (v6-style topbar + siderail) |
| [`v7.html`](v7.html) | Dark fantasy + video hero — Cinzel headlines, gold-gradient, starter pack |
| [`v6.html`](v6.html) | Snap scroll + forest news bg |
| [`v5.html`](v5.html) | Real artwork + Discover CTA — hero/scene images, events grid |
| [`v4.html`](v4.html) | ARC Raiders (screenshot) — «forge. siege.» slogan, neon-green stickers |
| [`v3.html`](v3.html) | ARC Raiders (first pass) — industrial condensed type, numbered slabs |
| [`v2.html`](v2.html) | Fortnite Discover — catalog detail page, community channels, step-cards |
| [`v1.html`](v1.html) | Cinematic hero — Netflix-style cards, YouTube video bg, Anton + magenta + gold |

[`index.html`](index.html) is the versions hub (accessible at `/index.html` on Vercel).

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
* **Fake push notifications** (top-left by default, hidden on mobile): scheduled
  stream with real-photo girl avatars, sticker reactions, click-to-toggle to
  top-right
* **Modals**: 2-stage email → code login (magic code `123123` redirects to
  the real app); YouTube trailer iframe modal
* **Mobile (≤1023px)**: vertical stack, no push stream, no hover-thumbnail,
  modals fit narrow viewports
* **OG / SEO**: full meta-tag suite, Schema.org `VideoGame` JSON-LD, Apple
  Smart App Banner (app-id 1158967485), custom `og-image.jpg` with overlay

## Quick start

```bash
# Serve locally (preview all pages)
npx serve -l 5173 .
# → open http://localhost:5173/index.html

# Regenerate all 12 locale HTML files after editing template or locales
python3 build.py
```

No runtime dependencies. No package.json. Python stdlib only for the build.
The `.claude/launch.json` is wired for the Claude Code preview panel — same
`npx serve` command, port 5173.

## File structure

```
/
├── index.html               # versions hub (accessible at /index.html)
├── v8.template.html         # i18n master template — EDIT THIS, not v8.html
├── build.py                 # i18n build script (stdlib only)
├── vercel.json              # Accept-Language rewrites for / and /v8.html
├── locales/
│   ├── en.json              # 36 keys → v8.html
│   ├── ru.json              # → v8.ru.html
│   ├── de.json              # → v8.de.html
│   ├── fr.json fr es pt it pl ja ko zh-hans zh-hant …
│   └── …                   # 12 locales total
├── v8.html                  # GENERATED — EN default
├── v8.ru.html               # GENERATED — Russian
├── v8.{lang}.html           # GENERATED — one per locale
├── v8.1.html                # cinematic variant (not i18n)
├── v1.html … v7.html        # archive design variants
├── v1-source.html           # raw bundle sources (pre-inline)
├── v1-standalone.html       # offline build with fonts inlined
├── v6-source.html
└── assets/
    ├── hero-bg.mp4          # hero video (~78 MB, used by v7/v8)
    ├── keyart.{webp,jpg,png} # static keyart (poster, OG image source)
    ├── og-image.jpg         # social-card preview (1920×1172 with text overlay)
    ├── favicon.webp         # browser favicon (HW Alliance wordmark)
    ├── logo.png             # full HW Alliance wordmark
    ├── button-feedback.mp3  # PLAY NOW click sound
    ├── reaction-{like,love}.png  # push-notification reaction icons
    ├── award.{svg,png}      # "The Best Mobile RPG" laurel badge
    ├── hero-{brute,electra,luna,scribe}.png  # hero portraits (v5)
    ├── scene-{arena,disco,forest,stormwall}.png  # scene art (v5)
    └── v8/
        ├── emerald.png
        ├── logo.png
        ├── stickers/        # 10 PNG stickers for push reactions
        └── avatars/         # real-photo avatars (Solenne, Aurelia)
```

## i18n — adding or updating a locale

1. Edit `locales/{lang}.json` (all 36 keys required) — or create a new one
2. Run `python3 build.py` → zero warnings expected
3. Stage `locales/{lang}.json` + all generated `v8*.html` + `v8.template.html`
   if it changed
4. If new locale: add a card in `index.html` Production section + Accept-Language
   rewrites in `vercel.json`
5. Commit + push

## Tech stack

* **HTML / CSS / JS** — vanilla, no framework, no transpiler, no bundler
* **Python 3 (stdlib)** — `build.py` for i18n generation, no third-party deps
* **Google Fonts** — Anton (display), Inter (body), Roboto/Cinzel/etc. per version
* **Vercel** — static hosting + Accept-Language header rewrites (`vercel.json`)
* No npm dependencies. `npx serve` (one-off, no install) for local preview.

## Production checklist (already done in v8)

- [x] OG meta (FB/LinkedIn/Discord/Slack)
- [x] Twitter Card
- [x] Schema.org JSON-LD (`VideoGame` entity)
- [x] Canonical URL
- [x] Apple Smart App Banner (app-id 1158967485)
- [x] Favicons (icon, apple-touch-icon, mask-icon)
- [x] Theme color + color-scheme dark
- [x] Robots meta (max-image-preview large)
- [x] Mobile / tablet adaptation (≤1023px)
- [x] Touch-only fallback (hover thumbnails disabled)
- [x] Video poster + CSS background fallback
- [x] Preload `keyart.webp` with fetchpriority high
- [ ] Proper favicon set (32×32, 180×180, 192/512 PNG) — currently a single webp wordmark
- [ ] sitemap.xml + robots.txt
- [ ] Real backend for login form (currently magic code `123123` redirects to app)

## Credits

Game artwork, name, and brand belong to **Nexters Global LTD**. Stickers,
keyart, video, logo, official favicon are sourced from
[hero-wars-alliance.com](https://hero-wars-alliance.com) and
[App Store id1158967485](https://apps.apple.com/us/app/hero-wars-alliance-adventure/id1158967485).

Landing concept code: this repo. AGENTS see [CLAUDE.md](CLAUDE.md) for working
conventions.
