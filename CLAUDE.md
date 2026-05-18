# CLAUDE.md — agent working notes

If you're an AI agent (Claude / Cursor / etc.) about to edit this repo, read
this first. It captures the non-obvious conventions and traps that we hit
while building v8.

## 1. Project shape in one breath

Static HTML landing for Hero Wars: Alliance. **Eight design variants** at the
repo root (`v1.html` … `v8.html` + `v8.1.html` + a few `-source` / `-standalone`
bundles). `index.html` is the versions selector. Shared assets live in
`assets/`; v8-specific assets (modal logo, emerald, stickers, real-photo
avatars) live in `assets/v8/`. **`v8.html` is the production candidate** —
1900+ lines of monolithic HTML+CSS+JS. All work since the v8 commit
goes there unless the user explicitly says otherwise.

There is **no build step**. Open the file, change it, reload. That's it.

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

## 4. v8.html anatomy (sections you'll edit most)

CSS sections inside `<style>`:

* Top nav (`.nav`, `.btn-enter`, `.players`) — **includes the eyebrow pill**
  (`.eyebrow`) which lives in the nav between logo and `nav__right`
* Eyebrow pill + hover thumbnail (`.eyebrow`, `.wtp__preview`) — thumbnail
  appears **below** the pill (`top: calc(100% + 14px)`), slides down on hover
* Hero (`.hero`, `.hero__video`, `.hero__overlay`, `.hero__content`)
* Title (`.hero__title` — Anton sans, `text-transform: none`, source has Title Case)
* CTA row (`.cta-row` flex), `.btn-play` (pulse + shine), `.offer` (passive promo)
* Play-meta caption (`.play-meta`)
* Sound toggle (`.sound-toggle`)
* Bottom meta strip (`.meta-strip`)
* Login modal (`.modal`, two `.stage`s: email and code)
* Trailer modal (`.trailer-modal`)
* Push notifications (`.pushes`, `.push`, `.reaction-pill`)
* `@media (max-width: 1023px)` — single mobile/tablet breakpoint
* `@media (hover: none)` — touch overrides

HTML order in `<body>`:

1. `<header class="nav">` (fixed) — logo · eyebrow pill · nav__right (players + sign-in)
2. `<section class="hero">` containing video, overlay, content, meta-strip
3. `<div class="pushes">`
4. `<div class="trailer-modal">`
5. `<div class="modal" id="loginModal">`
6. `<script>` — video init, sound toggle, login modal flow, trailer modal flow,
   push spawn loop, live online counter

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

* `assets/hero-bg.mp4` — hero video, 78 MB (`<video poster="keyart.webp">`)
* `assets/keyart.webp` — 1920×1172 (CSS bg fallback, video poster, OG source)
* `assets/keyart.jpg` — same image as JPEG (legacy fallback)
* `assets/og-image.jpg` — final social card with text overlay (regenerated
  via Python script — see §9)
* `assets/favicon.webp` — pulled from cdn.hero-wars-alliance.com, used for
  rel=icon and apple-touch-icon
* `assets/v8/logo.png` — HW Alliance wordmark (used inside login modal art)
* `assets/v8/emerald.png` — 76×76 emerald icon
* `assets/v8/avatars/{solenne,aurelia}.jpg` — real-photo avatars for the
  "girl" push slots
* `assets/v8/stickers/*.png` — 10 stickers (hello, happy, congratulation,
  love, support, ok, chabba, coffee, sad, shoked) for push reactions
* `assets/button-feedback.mp3` — PLAY NOW click sound (60% volume)
* `assets/reaction-{like,love}.png` — push-notification reaction icons

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
* **Push dock: default = top-left.** `.pushes` sits at `left: 24px` by default;
  click toggles `is-left` class which moves the stream to `right: 24px`. The
  class name `is-left` is misleading (legacy) — it now means "switched to right".
* **Don't run `python3 -m http.server`** for preview — macOS sandbox denies
  the iCloud cwd. `npx serve` only.
* **Don't bake `width=1280` into the viewport tag.** It used to scale-zoom
  mobile to 1280 logical width — looks tiny.

## 12. Commit message style

Long-form, multi-paragraph, written like a small changelog entry. See
`git log` for examples. The user wrote some by hand; most are by us.
First line is one sentence; the body explains what changed in each section
and why. We avoid one-liners for non-trivial changes.

## 13. When the user shares an image / screenshot

The screenshot is the source of truth for the bug they're seeing. Don't
substitute your own preview screenshot — render it, but compare with what the
user actually shipped. Telegram-preview, social-card, and viewport screenshots
are common.
