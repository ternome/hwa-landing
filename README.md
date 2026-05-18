# Hero Wars: Alliance — Landing Pages

Static HTML landing-page workbench for **Hero Wars: Alliance** by Nexters Global.
Eight design directions live side-by-side; the index page lets you click between
them.

**Live deploy:** [hwa-landing.vercel.app](https://hwa-landing.vercel.app/)

## Versions

| File | Concept |
|---|---|
| [`v1.html`](v1.html) | Cinematic hero — Netflix-style cards, YouTube video bg, Anton + magenta + gold |
| [`v2.html`](v2.html) | Fortnite Discover — catalog detail page, community channels, step-cards |
| [`v3.html`](v3.html) | ARC Raiders (first pass) — industrial condensed type, numbered feature slabs |
| [`v4.html`](v4.html) | ARC Raiders (screenshot) — «forge. siege.» slogan, neon-green stickers, world carousel |
| [`v5.html`](v5.html) | Real artwork + Discover CTA — hero/scene images, events grid |
| [`v6.html`](v6.html) | Snap scroll + forest news bg — discrete scroll-snap by section |
| [`v7.html`](v7.html) | Dark fantasy + video hero — Cinzel headlines, gold-gradient accent, starter pack |
| **[`v8.html`](v8.html)** | **Current production candidate** — Figma spec adapted, fully responsive, mobile-ready, with login & trailer modals, fake push stream, click-sound, OG card |
| [`v8.1.html`](v8.1.html) | Cinematic left-align variant of v8 (v6-style topbar + siderail) |

[`index.html`](index.html) is the versions hub.

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
# Serve locally
npx serve -l 5173 .
# → open http://localhost:5173
```

No build step. No package.json. Pure HTML / CSS / JS.

The `.claude/launch.json` is wired for the Claude Code preview panel — same
command, port 5173.

## File structure

```
/
├── index.html               # versions hub
├── v1.html … v8.html        # landing variants
├── v8.1.html                # cinematic variant of v8
├── v1-source.html           # raw bundle sources (pre-inline)
├── v1-standalone.html       # offline build with fonts inlined
├── v6-source.html
├── tweaks-panel.jsx         # legacy design-tweaks panel
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
    ├── DotLottiePlayer.wasm + .js  # lottie player (legacy)
    └── v8/
        ├── emerald.png
        ├── logo.png
        ├── stickers/        # 10 PNG stickers for push reactions
        └── avatars/         # real-photo avatars (Solenne, Aurelia)
```

## Tech stack

* **HTML / CSS / JS** — vanilla, no framework, no transpiler, no bundler
* **Google Fonts** — Anton (display), Inter (body), Roboto/Cinzel/etc. per version
* **Vercel** for static hosting
* No runtime dependencies. `npx serve` is the only thing involved.

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
