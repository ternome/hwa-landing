# CLAUDE.md — agent working notes

If you're an AI agent (Claude / Cursor / etc.) about to edit this repo, read
this first. It captures the non-obvious conventions and traps that we hit
while building v8.

## 1. Project shape in one breath

Static HTML landing for Hero Wars: Alliance. **Only v8 is production.** All
older design experiments (v1-v7 + v8.1 + source/standalone bundles) live in
`archive/` and are reachable at `/archive/vN.html`. Vercel issues 301
redirects from `/vN.html` to `/archive/vN.html` for backward-compat.

The active codebase is **modular** (refactored in branch
`refactor/v8-modular-perf` from tag `pre-refactor`):

```
src/
  v8.template.html          structure only (with <!-- INJECT_CSS --> + <!-- INJECT_JS -->)
  styles/                   10 CSS modules (_tokens, _reset, _nav, _hero, …)
  scripts/                  6 JS modules (_video, _sound, _modal-trailer, …)
  manifests/{styles,scripts}.json   explicit concatenation order — NOT alphabetical
locales/
  _schema.json              36 required keys; build aborts on locale schema mismatch
  {12 *.json}               one per supported language
assets/                     v8-production-only assets (hero-bg.mp4, keyart.webp, v8/*, …)
archive/                    legacy v1-v8.1 + sources, with own assets/ subfolder
build.py                    read src/ template → inject CSS+JS → validate locales → write v8.{lang}.html
vercel.json                 11 legacy-URL 301 redirects + 22 Accept-Language rewrites
```

**Build:** `python3 build.py [--no-minify]` — reads `src/v8.template.html`
+ every `locales/*.json` (skipping `_schema.json` and other `_*.json`),
concatenates modules per manifest, **minifies CSS+JS+HTML** (stdlib regex,
skipped with `--no-minify` for dev), injects at the two markers, substitutes
`{{key}}` placeholders, writes `v8.html` (EN default) and `v8.{lang}.html`
per locale. Also emits `sitemap.xml` (12 URLs + hreflang alternates +
x-default) and `robots.txt` (Allow / Disallow /archive/ + Sitemap ref).

**Generated files are `.gitignore`d.** `v8.html`, `v8.*.html`, `sitemap.xml`
(Phase 4) are output of `build.py` — source of truth is `src/` + `locales/`.
Vercel runs `python3 build.py` on every deploy via `vercel.json`
`buildCommand`, so production always serves freshly generated minified files.
Locally — regenerate via `python3 build.py [--no-minify]` after any
`src/` or `locales/` edit.

**Do not edit generated files.** They're ignored by git, so accidental
edits won't be staged, but they also won't survive the next `build.py` run.

Vercel routes `/` and `/v8.html` to the correct locale via Accept-Language
header rewrites declared in `vercel.json`. The design-handoff index remains
accessible at `/index.html`. Archive index is at `/archive/index.html`.

## 2. Critical environment gotcha — git is isolated, repo lives in iCloud

The repo path contains spaces: `~/Library/Mobile Documents/com~apple~CloudDocs/
Code/hwa-landing/`. The parent `~/` is also a git repo (covers the whole home
folder). Plain `git status` from inside our folder would walk the home repo
and try to track everything in `~/Library/`, `~/Downloads/`, etc.

**Always quote paths and pass explicit `--git-dir` / `--work-tree` flags:**

```bash
cd "/Users/terno/Library/Mobile Documents/com~apple~CloudDocs/Code/hwa-landing"
git --git-dir=.git --work-tree=. status --short
git --git-dir=.git --work-tree=. add v8.html
git --git-dir=.git --work-tree=. commit -m "..."
git --git-dir=.git --work-tree=. push origin main
```

Skip the flags and you'll stage Library/Downloads/.zsh_history into the diff.

The remote is `git@github.com:ternome/hwa-landing.git`. Single branch: `main`.

## 3. Live preview — `.claude/launch.json` + `npx serve`

Already wired for the Claude Code preview panel. Start with the
`preview_start` tool using name `hwa-landing`:

```jsonc
{
  "name": "hwa-landing",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["--yes", "serve", "-l", "5173", "."],
  "port": 5173
}
```

Python's `http.server` does not work here — macOS sandbox denies the iCloud
cwd. Use `npx serve` only.

Navigation in preview: `location.href = '/v8.html'`. Vercel-style trailing-
`.html` URLs are accepted both ways.

## 4. v8 anatomy — module map

**CSS modules** (`src/styles/`, concat order in `src/manifests/styles.json`):

1. `_tokens.css`        — design tokens (`:root` CSS variables)
2. `_reset.css`         — universal reset + base elements
3. `_nav.css`           — top nav (`.nav`, `.btn-enter`, `.players`) **plus the
   eyebrow pill `.eyebrow` and hover thumbnail `.wtp__preview`** (eyebrow lives
   in the nav semantically, its CSS got hoisted earlier in the cascade)
4. `_hero.css`          — `.hero` structure (`.hero__video`, `.hero__overlay`,
   `.hero__content`) + content (`.hero__title`, `.cta-row`, `.btn-play`,
   `.offer`, `.play-meta`).
   Key rules to know:
   - `.hero__title`: `font-family: 'Anton', 'Roboto', sans-serif` (Roboto covers
     Cyrillic glyphs missing from Anton); `text-transform: capitalize`;
     `font-size: clamp(72px, 8.5vw, 114px)`
   - `.btn-play`: `width: auto; min-width: 367px; padding: 0 48px` — expands to
     fit long locale labels (e.g. "JETZT SPIELEN" = 487px); `white-space: nowrap`
     on `.btn-play__label` prevents wrapping. Mobile override (`width: 100%`) in
     `_responsive.css` is unaffected.
5. `_sound-toggle.css`  — `.sound-toggle`
6. `_meta-strip.css`    — bottom `.meta-strip`
7. `_modal-login.css`   — `.modal` (two `.stage`s — email + code) + `.modal__pitch` +
   `.modal__field-error` (inline validation error, `min-height: 20px` reserves space
   above button so form doesn't jump on error; color `#E85D4A`)
8. `_modal-trailer.css` — `.trailer-modal` (YouTube iframe wrapper)
9. `_pushes.css`        — `.pushes`, `.push`, `.reaction-pill`
10. `_responsive.css`   — `@media (max-width: 1023px)` + `@media (hover: none)`

**JS modules** (`src/scripts/`, concat order in `src/manifests/scripts.json`):

1. `_video.js`          — declares global `const video`; autoplay + cross-fade
2. `_sound.js`          — sound toggle; reads `dataset.labelUnmute/labelMute`;
   **depends on `video`** from `_video.js`
3. `_modal-trailer.js`  — trailer modal (eyebrow `[data-open-trailer]` opens it)
4. `_modal-login.js`    — login modal email→code flow, magic `123123` redirects;
   **depends on `video`** (for click sound check). Inline validation: empty
   email → `dataset.errorEmpty`, bad format → `dataset.errorInvalid`, wrong
   OTP → `dataset.errorCode` (all read from `<p>` `data-*` attrs, locale-driven)
5. `_pushes.js`         — fake push notification stream (IIFE-wrapped, isolated)
6. `_online-counter.js` — players-online counter (pulse + fluctuating number)

Cross-module dependencies are satisfied by manifest order. **Do not reorder
the manifest** without checking which modules reference whose globals.

HTML order in `src/v8.template.html` body:

1. `<header class="nav">` (fixed) — logo · eyebrow pill · nav__right (players + sign-in)
2. `<section class="hero">` containing video, overlay, content, sound-toggle, meta-strip
3. `<div class="pushes">`
4. `<div class="trailer-modal">`
5. `<div class="modal" id="loginModal">` (two `.stage`s)
6. `<script>` — INJECT_JS marker that build.py replaces with concatenated bundle

## 5. Working conventions

* **Verify in browser before pushing.** After every code change use
  `preview_eval` + `preview_screenshot`. Many bugs only surface in the rendered
  DOM (e.g. CSS specificity, animation timing, autoplay gated, mobile layout).
* **Touch one thing at a time.** Commit messages should explain WHAT and WHY,
  not just WHAT. See git log for the tone — multi-paragraph rationale is fine.
* **No mass refactors.** v8.html grew organically; respect existing class
  names (`.btn-play`, `.btn-enter`, `.offer__badge`, `.push__name`, …).
* **Plan before scope changes.** When the user asks for a large feature
  (modal, mobile adaptation, push reactions), write the plan first, get the
  short confirmation ("давай" / "ok" / "да"), then code. The user has said
  «сначала план, потом реализация» more than once.
* **Don't fabricate copy.** All sample names / messages / numbers are in the
  push-stream JS array — extend it instead of inventing parallel data.
* **Update README.md and CLAUDE.md after every significant change.** This is
  a standing rule: any session that changes architecture, adds new files, or
  establishes new conventions must close with a docs commit. No exception.

## 6. Mobile / responsive

Single breakpoint at `max-width: 1023px`. Above that → desktop layout;
below → vertical column stack. Sub-rules:

* `.cta-row` becomes `flex-direction: column`, `.btn-play` full-width, offer
  card stacks below
* `.pushes { display: none }` on mobile
* `.eyebrow { display: none }` on mobile — nav too tight; pill hidden at ≤1023px
* `.wtp__preview` (trailer thumbnail tooltip) hidden via `@media (hover: none)`
* `.meta-strip` wraps to two rows, `AVAILABLE ON` label hidden, pipe-sep hidden
* Modals shrink padding 40 → 18, input heights 78 → 56
* Nav: hide players counter, hide "Already playing?" prefix, keep "Sign in"

Test viewports we've validated: **375×812, 414×896, 768×1024, 1023×700,
1024×768, 1280×720, 1440×900, 1920×1080, 2560×1440**.

## 7. Magic test data

* **Login code `123123`** → redirects to `https://hero-wars-alliance.com/`
  (the real app). Any other 6-digit code does nothing.
* `@WebpageBot` on Telegram refreshes the OG-preview cache if the user reports
  "no image in Telegram".

## 8. Assets cheatsheet

**Production (v8) — `assets/`:**

* `assets/hero-bg.mp4` — hero video, 78 MB (`<video poster="keyart.webp">`)
  Preloaded only on `(min-width: 1024px)`; mobile gets it on demand.
* `assets/keyart.webp` — 1920×1172 (CSS bg fallback, video poster). Preloaded
  with `fetchpriority="high"` on every page load.
* `assets/og-image.jpg` — final social card with text overlay (regenerated
  via Python script — see §9)
* `assets/favicon.webp` — pulled from cdn.hero-wars-alliance.com, used for
  rel=icon and apple-touch-icon
* `assets/v8/logo.png` — HW Alliance wordmark (nav logo + login modal art)
* `assets/v8/emerald.png` — emerald icon (rendered at 48×48 in `.offer`)
* `assets/v8/avatars/{solenne,aurelia}.jpg` — real-photo avatars for the
  "girl" push slots (loaded lazily by `_pushes.js`)
* `assets/v8/stickers/*.png` — 10 stickers (hello, happy, congratulation,
  love, support, ok, chabba, coffee, sad, shoked) for push reactions
* `assets/button-feedback.mp3` — PLAY NOW click sound (60% volume)
* `assets/reaction-{like,love}.png` — push-notification reaction icons

**Archive — `archive/assets/`** (legacy, only loaded by v1-v8.1 pages):

* `archive/assets/keyart.{jpg,png}` — JPEG/PNG variants of keyart (v8 uses
  `assets/keyart.webp` directly)
* `archive/assets/logo.png` — legacy wordmark (v1/v5/v6); v8 uses `assets/v8/logo.png`
* `archive/assets/award.{svg,png}` — "Best Mobile RPG" laurel badge (orphan)
* `archive/assets/DotLottiePlayer.wasm`, `dotlottie-player.js`, `oval-anim.json` — lottie player
* `archive/assets/hero-{brute,electra,luna,scribe}.png` — hero portraits (v5, v6)
* `archive/assets/scene-{arena,disco,forest,stormwall}.png` — scene art (v5, v6)
* `archive/assets/news-forest.png` — News-section background (v6)

## 9. Regenerating `og-image.jpg`

The social-card image is **generated, not hand-painted**. Pillow script lives
in `/tmp/gen_og.py` (kept out of the repo). Anton + Inter TTFs are pulled
from `github.com/google/fonts` and saved to `/tmp/`. To rebuild:

```bash
pip3 install --user Pillow
# Then run the script we keep in /tmp/gen_og.py
python3 /tmp/gen_og.py
```

If `/tmp/gen_og.py` is gone, restore it from commit `b4e011e` or `35eb5f0`
(both touch the script-generated `assets/og-image.jpg`). The script:
takes `assets/keyart.webp`, overlays `assets/v8/logo.png` top-left,
draws `LEVEL UP YOUR HERO` in Anton 170px with blurred drop-shadow,
draws green PLAY NOW pill using `anchor="mm"` for perfect centering.

## 10. Production prep (already done in v8)

* OG / Twitter Card / Schema.org / canonical / favicon set / Apple Smart App
  Banner — see §7 of README.md for the full check-list
* `<meta name="viewport" content="width=device-width, initial-scale=1,
  viewport-fit=cover">`
* `body { min-width }` is REMOVED on purpose — was the source of the first
  mobile bug
* OG URLs point to `https://hwa-landing.vercel.app/v8.html` (the real deploy),
  not the production `hero-wars-alliance.com` (Nexters' actual domain)

## 11. Anti-traps

* **Never hard-code `min-width: 1280px` on `body`.** It used to be there, it
  broke every mobile parser (Telegram preview included). Stay fluid below
  1024, gated layout above.
* **Don't `git add .`** from inside this folder — the parent home-repo will
  pull in giant trees. Always stage explicit paths.
* **Don't reference an asset until it's committed.** `og-image.jpg`,
  `keyart.jpg`, `favicon.webp` were each broken once because they were
  generated locally but not pushed.
* **Push notifications are NOT for production data.** They're a fake stream
  — extending the array is fine, but don't claim they're real.
* **Push dock: fixed top-right.** `.pushes` sits at `right: 24px` — slides in
  from the right. No click-to-move behavior; `is-left` class removed entirely.
* **`.btn-play` is auto-width, not fixed.** `width: auto; min-width: 367px`.
  Do not revert to `width: 367px` — it breaks long locale labels (DE, PL).
  If you add a locale with an exceptionally long CTA, verify the button doesn't
  overflow the hero container (`.cta-row` is `inline-flex`, so it grows left).
* **Never edit `v8.html` or `v8.*.html` directly.** They are generated by
  `build.py`. Any direct edit will be silently overwritten the next time
  someone runs the build. Edit the relevant module in `src/styles/` or
  `src/scripts/` or the relevant `locales/{lang}.json` (copy), then run
  `python3 build.py` and stage ALL generated files alongside the source change.
* **`modal_code_subtitle` in locale JSONs contains `<strong id="sentEmail">`.** 
  The JS does `getElementById('sentEmail')` to fill the email address. If you
  remove or rename that id the code-entry stage breaks silently.
* **`vercel.json` is JSON, not JSONC.** No `//` comments. Validate with
  `python3 -c "import json; json.load(open('vercel.json'))"` before committing.
* **Manifest order matters.** `src/manifests/styles.json` determines CSS
  cascade; `scripts.json` determines JS execution order (and so which globals
  are in scope when a module runs). NOT alphabetical. Reordering without
  verifying cascade + cross-module dependencies = silent breakage.
* **Locale schema is enforced.** `locales/_schema.json` lists 39 required keys.
  `build.py` fails fast on any locale missing/extra keys. To add a new key —
  update `_schema.json` AND every locale JSON in one pass, then rebuild.
* **Generated files live at repo root, not under `src/`.** That is intentional
  — Vercel serves them at `/v8.html`, `/v8.ru.html`, etc. `src/` is source-only.
* **Generated files are `.gitignore`d.** Don't try to `git add v8.html`; it's
  silently ignored. If a generated file is missing locally, run `python3 build.py`.
* **JS minifier is intentionally conservative.** Strips block comments + blank
  lines only — keeps `//` because it can appear inside strings (`'https://…'`).
  If you need more aggressive JS compression, write a proper tokenizer; do not
  loosen the regex. We rely on Brotli (Vercel default) for the remaining 70% off.
* **HTML minifier preserves whitespace between inline tags.** Collapsing
  `>\s+<` would silently break inline text spacing in things like
  `<span>foo</span> <span>bar</span>`. The current pipeline uses flex `gap`
  for layout — but be aware.
* **`<link rel="preload" as="video">` is gated on `(min-width: 1024px)`.**
  Preloading 78MB hero-bg.mp4 on mobile burns the user's data plan. Desktop
  only. If we ever ship a lite mobile video, add a second preload with
  `media="(max-width: 1023px)"`.
* **Cache-Control: `assets/*` is `immutable 1y`.** If you swap the hero
  video, OG image, or any asset, RENAME the file (or add a query param) —
  browsers + Vercel CDN won't re-fetch the URL for a year otherwise.
  HTML files have `must-revalidate, max-age=0`, so updates to v8.*.html
  roll out within seconds.
* **`sitemap.xml` + `robots.txt` are GENERATED by build.py.** Don't hand-edit.
  To change the site base URL (e.g. moving away from `hwa-landing.vercel.app`),
  edit `SITE_BASE` in build.py and the canonical/OG URLs in `src/v8.template.html`.
* **`archive/` is frozen.** Never edit files in `archive/` — they're preserved
  for history. If you need to update an archive page for some reason, it's a
  new branch + explicit user approval.
* **Don't run `python3 -m http.server`** for preview — macOS sandbox denies
  the iCloud cwd. `npx serve` only.
* **Don't bake `width=1280` into the viewport tag.** It used to scale-zoom
  mobile to 1280 logical width — looks tiny.

## 12. Commit message style

Long-form, multi-paragraph, written like a small changelog entry. See
`git log` for examples. The user wrote some by hand; most are by us.
First line is one sentence; the body explains what changed in each section
and why. We avoid one-liners for non-trivial changes.

## 12.5 Rollback safety net

A tag `pre-refactor` exists on origin pointing to the last commit before the
modular/perf refactor landed on main. To roll back the **entire refactor**:

```bash
cd "/Users/terno/Library/Mobile Documents/com~apple~CloudDocs/Code/hwa-landing"
git --git-dir=.git --work-tree=. reset --hard pre-refactor
git --git-dir=.git --work-tree=. push --force-with-lease origin main
```

To roll back a **single phase** while keeping the others (refactor landed via
fast-forward, so each phase commit is on main):

```bash
git --git-dir=.git --work-tree=. revert <phase-commit-sha>
git --git-dir=.git --work-tree=. push origin main
```

Phase commits on main (refactor/v8-modular-perf history, oldest first):
- `df299f4` Phase 1 — archive cleanup
- `9945981` Phase 2 — src/ source split
- `f623756` docs catch-up (Phase 1+2)
- `fbc7a31` Phase 3 — minify + Vercel buildCommand + gitignore
- `4d34da0` Phase 4 — preload + cache + sitemap + lazy-loading

Branch `refactor/v8-modular-perf` is preserved on origin for ~2 weeks
post-merge as another reference. The `pre-refactor` tag is permanent.

## 13. When the user shares an image / screenshot

The screenshot is the source of truth for the bug they're seeing. Don't
substitute your own preview screenshot — render it, but compare with what the
user actually shipped. Telegram-preview, social-card, and viewport screenshots
are common.

## 14. i18n system — how it works

**Source of truth: `src/v8.template.html` + `src/styles/` + `src/scripts/` + `locales/*.json`**

```
src/
  v8.template.html              structure with INJECT_CSS + INJECT_JS markers
  styles/_*.css                 10 CSS modules
  scripts/_*.js                 6 JS modules
  manifests/styles.json         concat order for styles
  manifests/scripts.json        concat order for scripts
locales/
  _schema.json                  36 required-keys list; build aborts on mismatch
  en.json                       EN → v8.html
  ru.json + 10 more             {lang} → v8.{lang}.html
build.py                        stdlib-only; runs the full pipeline
vercel.json                     redirects (legacy /vN.html) + Accept-Language rewrites
```

**Placeholder syntax:** `{{KEY}}` in template OR CSS OR JS (yes, you can use
placeholders inside CSS/JS modules too — they're concatenated INTO the template
before locale substitution), key names in JSON.

**39 locale keys per file:** `lang`, `og_locale`, `page_title`,
`meta_description`, `og_title`, `og_description`, `twitter_img_alt`,
`nav_pill_aria`, `nav_pill_tag`, `nav_pill_text`, `preview_label`,
`players_label`, `signin_hint`, `signin_action`, `hero_title`, `cta_play`,
`offer_badge`, `offer_title`, `offer_sub`, `meta_free`, `meta_no_card`,
`meta_browser`, `strip_available`, `strip_players`, `strip_award`,
`sound_unmute`, `sound_mute`, `modal_welcome`, `modal_pitch`,
`modal_email_ph`, `modal_get_code`, `modal_error_email_empty`,
`modal_error_email_invalid`, `modal_error_code_invalid`,
`modal_terms`, `modal_back`,
`modal_code_subtitle`, `modal_resend_label`, `modal_resend_init`.

The canonical list lives in `locales/_schema.json` — `build.py` reads it and
enforces every locale conforms. Out-of-band keys = build error.

**JS localization without runtime loading:** `data-*` attributes carry the
localized strings into JS — e.g. `data-label-unmute="{{sound_unmute}}"` and
`data-resend-label="{{modal_resend_label}}"`. JS reads them via
`element.dataset.*`. Never hardcode EN strings in script blocks.

**Rebuild workflow:**
```bash
# 1. Edit src/{template,styles/*,scripts/*} or locales/*.json
# 2. Regenerate (production = minified, dev = readable):
python3 build.py                # production
python3 build.py --no-minify    # dev — readable view-source
# 3. Stage SOURCE only (v8.*.html are .gitignored):
git --git-dir=.git --work-tree=. add src/ locales/
# (Vercel will run build.py on deploy and regenerate the gitignored files.)
```

**Adding a new locale:**
1. Create `locales/{code}.json` with all 39 keys (copy from `en.json`, translate)
2. Run `python3 build.py` (schema validation will catch missing keys)
3. Add a card to root `index.html` Production section
4. Add Accept-Language rewrites for `/` and `/v8.html` in `vercel.json`
5. Commit everything

**Vercel routing (`vercel.json`):**
- 11 permanent (301) redirects: `/vN.html` → `/archive/vN.html` (legacy ads/links)
- 22 rewrites: `/` and `/v8.html` with Accept-Language headers
- zh-Hant rule (`zh-TW|HK|MO|Hant`) placed BEFORE generic `zh` catch
- Unlisted languages (including EN) fall through to `v8.html`
- `/index.html` = design handoff, always accessible explicitly
