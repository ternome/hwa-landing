# Refactor Plan: v8 → modular + perf

Tracking document for the v8 refactor. Removed after squash-merge.

## 1. Goals & non-goals

### Goals
- **Maintainability:** один источник истины для HTML/CSS/JS, логичная декомпозиция, явные манифесты порядка загрузки, единый стиль
- **Performance:** Lighthouse Performance >= 95 на desktop и >= 90 на mobile; LCP < 1.5s on 4G; ноль render-blocking ресурсов; меньше 100KB первоначального HTML за вычетом видео-постера
- **Backward-compat URLs:** `/v8.html`, `/v8.{lang}.html`, `/index.html` остаются рабочими. `/v3.html` и т.п. → 301 на `/archive/v3.html`

### Non-goals
- Не менять визуал (один-в-один с текущим v8 во всех 12 локалях)
- Не добавлять фреймворки (React/Vue/Svelte) — overkill для одностраничного лендинга
- Не менять схему OG/Schema.org/Apple Smart App Banner
- Не трогать игровой product backend (login form остаётся фейком с magic `123123`)
- Не менять content локалей (только структурное)
- Не локализовать push-notification stream (сейчас это смешанный mock — оставляем как есть)

## 2. Branch + rollback

| | |
|---|---|
| **Branch** | `refactor/v8-modular-perf` |
| **Base** | `main` после merge этого плана |
| **Backup tag** | `pre-refactor` на текущей `main` перед стартом — мгновенный rollback `git reset --hard pre-refactor` |
| **Merge стратегия** | Squash merge всех 5 фаз → один commit `refactor: modularize v8 + perf pass`. История фаз сохраняется в branch |
| **Production safety** | `main` не трогаем до Phase 5. Vercel preview deploys на `refactor/*` branch автоматически — тестируем там |

## 3. Целевая архитектура

### До (сейчас)
```
/
├── v8.template.html          ~1900 lines (HTML + CSS + JS inline)
├── build.py
├── locales/{12 json}
├── v8.html + v8.{lang}.html  (12 generated)
├── index.html
├── v1.html … v8.1.html       (8 archive variants in root)
├── *-source.html, *-standalone.html
├── tweaks-panel.jsx
├── vercel.json               (22 hand-written rewrite rules)
└── assets/
```

### После
```
/
├── src/
│   ├── v8.template.html      ← только структура + <!-- INJECT_CSS --> + <!-- INJECT_JS -->
│   ├── styles/
│   │   ├── _tokens.css       ← CSS variables (colors, sizes)
│   │   ├── _reset.css        ← html/body/box-sizing
│   │   ├── _typography.css   ← @font-face + display:swap, text utility
│   │   ├── _nav.css          ← .nav, .eyebrow, .wtp__preview, .btn-enter, .players
│   │   ├── _hero.css         ← .hero, .hero__video, .hero__title, .cta-row, .btn-play, .offer
│   │   ├── _meta-strip.css   ← .meta-strip + breakpoints
│   │   ├── _sound-toggle.css ← .sound-toggle
│   │   ├── _pushes.css       ← .pushes, .push, .reaction-pill, animations
│   │   ├── _modal-login.css  ← .modal, .stage, .modal__input, two-stage flow
│   │   ├── _modal-trailer.css← .trailer-modal, iframe wrapper
│   │   └── _responsive.css   ← @media (max-width: 1023px), @media (hover: none)
│   ├── scripts/
│   │   ├── _video.js         ← hero video init + dissolve-in on `playing`
│   │   ├── _sound.js         ← sound toggle (reads dataset.labelUnmute/labelMute)
│   │   ├── _modal-login.js   ← email → code stages, magic `123123` → redirect
│   │   ├── _modal-trailer.js ← open/close trailer, escape key, focus trap
│   │   ├── _pushes.js        ← spawn loop, sticker reactions, dock toggle, data array
│   │   ├── _online-counter.js← players-online pulse + fluctuating number
│   │   └── _eyebrow.js       ← eyebrow pill click opens trailer modal
│   └── manifests/
│       ├── styles.json       ← порядок склейки CSS-модулей
│       └── scripts.json      ← порядок склейки JS-модулей
├── locales/
│   ├── _schema.json          ← список 36 ключей + правила валидации (новый)
│   └── {12 *.json}           ← без изменений
├── build.py                  ← расширенный: split injection + минификация + locale validation + sitemap
├── vercel.json               ← генерируется из shared list of locales (DRY)
├── archive/                  ← всё что НЕ v8
│   ├── index.html            ← мини-хаб только для архива
│   ├── v1.html … v7.html
│   ├── v8.1.html
│   ├── v1-source.html, v1-standalone.html, v6-source.html
│   ├── tweaks-panel.jsx
│   └── assets/               ← портреты героев v5, scene-art, лоттишники
├── v8.html, v8.{lang}.html   ← GENERATED, .gitignored в Phase 3
├── index.html                ← обновлён под новую структуру
├── sitemap.xml               ← GENERATED build.py
├── robots.txt                ← новый
├── CLAUDE.md, README.md      ← обновлены
└── PLAN.md (этот файл)       ← удалить после merge
```

### Performance-критичные решения архитектуры

1. **Single-file production output.** build.py inline-ит ВСЁ (CSS + JS) обратно в HTML. На выходе один файл per locale — нулевой network round-trip для первого paint. Это критично для landing: для лендинга 1 HTML > N файлов даже с HTTP/2.
2. **CSS modules в source, monolith в output.** Удобство в dev, скорость в prod.
3. **Минификация — stdlib regex.** Без `terser`/`html-minifier`. Простые, проверенные паттерны: comments, collapse whitespace, remove last `;`. Минификация снижает payload ~30-40%, brotli добивает остаток.
4. **Pre-connect / preload в head.** Hero video poster + keyart preloaded. Google Fonts через preconnect.
5. **`font-display: swap`** — текст рендерится сразу системным fallback, при загрузке Anton — swap.
6. **Cache headers через vercel.json:** `assets/*` → `Cache-Control: public, max-age=31536000, immutable`. HTML → `no-cache` (чтобы фиксы доходили мгновенно).
7. **Hero video — стратегия:** оставляем 78MB но добавляем `preload="metadata"`, `poster` уже есть. В Phase 4 — отдельный mini-loop вариант (5s, <=8MB H.265) для mobile, через `<source media>`.

## 4. Фазы

### Phase 0 — baseline & branch (~15 min) — DONE
1. Создать тег `pre-refactor` на текущей `main`
2. Создать ветку `refactor/v8-modular-perf`
3. **Baseline screenshots:** 12 локалей × 4 viewports (375, 768, 1280, 1920) = 48 скриншотов → `/tmp/baseline/`. Для визуальной регрессии в конце.
4. **Lighthouse baseline:** запустить через Chrome headless на `/v8.html` desktop + mobile, сохранить JSON в `/tmp/baseline/`
5. PLAN.md уже в репо
6. Commit: `chore: branch baseline + plan`

**Checkpoint:** ветка готова, baseline зафиксирован. Можно отменить = удалить ветку.

### Phase 1 — archive cleanup (~45 min) — DONE (commit df299f4)
Самая безопасная фаза: только перемещение файлов, никакой логики.

1. `mkdir archive archive/assets`
2. `git mv v1.html v2.html v3.html v4.html v5.html v6.html v7.html v8.1.html archive/`
3. `git mv v1-source.html v1-standalone.html v6-source.html archive/`
4. `git mv tweaks-panel.jsx archive/`
5. Identify v5-specific assets (hero portraits, scene art, DotLottiePlayer) → `git mv` в `archive/assets/`
6. Создать `archive/index.html` — мини-хаб только для архивных вариантов
7. Обновить root `index.html`: удалить «Archive» секцию, добавить ссылку на `/archive/`
8. **Backward compat в vercel.json:**
   ```json
   { "source": "/v1.html", "destination": "/archive/v1.html", "permanent": true }
   ```
   (8 правил — v1…v7 + v8.1, + sources/standalones)
9. **Verify:** preview / → v8.html OK ; /archive/v3.html → загружается OK ; /v3.html → 301 OK
10. Commit: `chore: move v1-v7 + sources to archive/`

**Checkpoint:** root чище в ~10 раз, прод не сломан, старые URL редиректятся.

### Phase 2 — source split (~2 hours, основная работа) — DONE (commit 9945981)
1. `mkdir -p src/styles src/scripts src/manifests`
2. **CSS split:** скопировать `v8.template.html`, разрезать `<style>` по логическим границам:
   - найти разделы по существующим комментариям и class-namespace
   - создать 11 модулей (см. структуру выше)
   - в начало каждого модуля — comment-header с описанием
   - порядок: `_tokens → _reset → _typography → _nav → _hero → _meta-strip → _sound-toggle → _pushes → _modal-login → _modal-trailer → _responsive`
   - **manifest:** `src/manifests/styles.json` — массив имён в этом порядке
3. **JS split:** аналогично, 7 модулей, IIFE-обёртки чтобы избежать глобалок:
   ```js
   // _modal-login.js
   (function () {
     // ... код модалки ...
   })();
   ```
   - manifest: `src/manifests/scripts.json` — порядок (важно: video → sound → modals → pushes → online → eyebrow)
4. **Template:** `src/v8.template.html` теперь — голый HTML, в `<head>` `<!-- INJECT_CSS -->`, перед `</body>` `<!-- INJECT_JS -->`
5. **Обновить build.py:**
   ```python
   def build():
       template = read("src/v8.template.html")
       css_manifest = json.load(open("src/manifests/styles.json"))
       css = "\n".join(read(f"src/styles/{m}") for m in css_manifest)
       js_manifest = json.load(open("src/manifests/scripts.json"))
       js = "\n".join(read(f"src/scripts/{m}") for m in js_manifest)
       template = template.replace("<!-- INJECT_CSS -->", f"<style>\n{css}\n</style>")
       template = template.replace("<!-- INJECT_JS -->", f"<script>\n{js}\n</script>")
       # ... затем locale replacement как раньше ...
   ```
6. **Locale validation in build.py:**
   - читать `locales/_schema.json` (список 36 ключей)
   - для каждого `locales/*.json` проверить: все ключи присутствуют, нет лишних
   - **fail build** если нет — лучше сломать локально чем выкатить с пропуском
7. **Verify:** перегенерить все 12 файлов, прогнать через preview, визуально сравнить с baseline скриншотами Phase 0
8. Commit: `refactor: split v8.template.html into src/styles + src/scripts modules`

**Checkpoint:** ВСЕ 12 локалей рендерятся pixel-perfect к baseline. Если хоть один pixel-diff — назад.

### Phase 3 — build pipeline + minification (~1 hour) — DONE
1. **Расширить build.py минификаторами (stdlib-only):**
   ```python
   def minify_css(css):
       css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)   # block comments
       css = re.sub(r"\s+", " ", css)                          # collapse whitespace
       css = re.sub(r"\s*([{}:;,])\s*", r"\1", css)            # around punctuation
       css = re.sub(r";}", "}", css)                           # trailing ; before }
       return css.strip()

   def minify_js(js):
       # консервативно: удалить //-комменты в конце строк, /* */ блоки,
       # пустые строки, leading/trailing whitespace per line
       # БЕЗ переноса строк — мы не парсим AST, не рискуем со сжатием
       lines = []
       in_block = False
       for line in js.split("\n"):
           # ... аккуратно ...
       return "\n".join(lines)

   def minify_html(html):
       html = re.sub(r"<!--(?!\[if).*?-->", "", html, flags=re.DOTALL)  # сохраняем условные комменты
       html = re.sub(r">\s+<", "><", html)                              # tag-to-tag
       return html
   ```
2. **Conditional minification:** `python3 build.py --no-minify` для dev-итераций (быстрее, читаемее output)
3. **Vercel buildCommand:** в `vercel.json` добавить `"buildCommand": "python3 build.py"`. На каждый deploy Vercel запустит build → всегда свежий output. Локальный workflow остаётся прежним.
4. **Gitignore generated files:** добавить `v8.html`, `v8.*.html`, `sitemap.xml` в `.gitignore`. Источник истины = `src/` + `locales/`. Меньше шумных diff.
5. **Verify size:** до/после минификации, до/после brotli (через `curl -H 'Accept-Encoding: br' --compressed -o /dev/null -w '%{size_download}'`)
6. Commit: `feat: minify HTML/CSS/JS in build.py + Vercel buildCommand`

**Checkpoint:** размер `v8.html` сократился на >=30%; визуально идентично; функционально идентично; preview всё ещё работает (Vercel запустит build при деплое).

### Phase 4 — performance polish (~1.5 hours)
1. **Critical asset hints в template:**
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="dns-prefetch" href="https://www.youtube.com">
   <link rel="preload" href="/assets/keyart.webp" as="image" fetchpriority="high">
   <link rel="preload" href="/assets/hero-bg.mp4" as="video" type="video/mp4">
   ```
2. **Font-display: swap** — переключиться с `<link>` Google Fonts на inline `@font-face` в `_typography.css` с локальными WOFF2 fallback (если файлы fonts'ов оптимизировать — `/assets/fonts/Anton.woff2`)
3. **Image sizing:** добавить `width`/`height` ко всем `<img>` для нулевого CLS
4. **Lazy loading:** `loading="lazy"` на push stickers, push avatars (видны только после интеракции)
5. **Cache headers в vercel.json:**
   ```json
   "headers": [
     { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
     { "source": "/(.*)\\.html", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] }
   ]
   ```
6. **`vercel.json` DRY refactor:** генерировать rewrites из `locales/_schema.json` через build.py → `vercel.generated.json` (или прямо `vercel.json`). 22 правила превращаются в один цикл.
7. **Sitemap.xml + robots.txt** (закрывает TODO из README):
   - sitemap.xml — все 12 локалей через `<xhtml:link rel="alternate" hreflang="…">`
   - robots.txt — allow all, sitemap reference
8. **Favicon set** (TODO из README): `favicon-32.png`, `favicon-180.png` (apple-touch), `favicon-192.png`, `favicon-512.png`. Уже есть webp, добавить PNG-варианты через ImageMagick локально (один раз)
9. **Lighthouse re-run:** сравнить с baseline из Phase 0. Целевые метрики: Perf >=95 desktop, >=90 mobile.
10. Commit: `perf: preload hints, cache headers, sitemap, robots, favicon set`

**Checkpoint:** Lighthouse Perf target достигнут на desktop и mobile. Всё функционально работает.

### Phase 5 — docs + merge (~30 min)
1. Обновить `CLAUDE.md`:
   - §1 — новая структура (src/, archive/, build pipeline)
   - §4 — переписать «v8.html anatomy» под новые CSS/JS модули
   - §11 — обновить anti-traps (не редактировать generated, не редактировать `src/` в обход manifest order)
   - §14 — расширить i18n секцию (locale schema validation)
2. Обновить `README.md`:
   - Versions table — production list остаётся, archive — отдельный раздел с пометкой `/archive/`
   - File structure — новая
   - Quick start — `python3 build.py [--no-minify]`
   - Performance section с Lighthouse-таблицей before/after
3. Удалить `PLAN.md`
4. Final preview через все 12 локалей × 4 viewports
5. Squash-merge в `main`, push
6. Удалить branch `refactor/v8-modular-perf` (история сохраняется в squash-коммите)
7. Tag: `v9` или `v8-refactored`

**Checkpoint:** main = новый источник истины, baseline tag `pre-refactor` доступен для rollback.

## 5. Verification (на каждом checkpoint'е)

| Тип | Как | Когда |
|---|---|---|
| **Visual regression** | `mcp__Claude_Preview__preview_screenshot` для каждой локали × 4 viewports, diff с baseline | Phase 2, Phase 4 |
| **Functional smoke** | Click PLAY, eyebrow → trailer, sound toggle, sign-in → email → code 123123 → redirect | Phase 2, Phase 3, Phase 4 |
| **Build validity** | `python3 build.py` finishes with 0 warnings + 0 unresolved placeholders + locale schema OK | Каждый коммит |
| **JSON validity** | `python3 -c "import json; json.load(open('vercel.json'))"` | После каждого edit |
| **Lighthouse** | Chrome headless, desktop + mobile, JSON output | Phase 0 (baseline), Phase 4 (target check) |
| **Backward URLs** | `curl -I` для `/v3.html`, `/v8.html`, `/v8.ru.html` — все возвращают 200/301 правильно | Phase 1, Phase 5 |

## 6. Risks & mitigations

| Риск | Вероятность | Импакт | Митигация |
|---|---|---|---|
| Минификация ломает JS (regex слишком жадная) | Средняя | Высокий | Conservative regex, `--no-minify` flag для dev, manual diff после первой минификации |
| CSS-cascade рушится из-за order в manifest | Низкая | Высокий | Explicit manifest, не алфавит. После split — pixel-diff vs baseline |
| Hero video preload убивает mobile traffic budget | Средняя | Средний | `preload="metadata"`, не `preload="auto"`. Mobile-specific `<source>` с lighter version |
| Vercel buildCommand упадёт из-за Python deps | Низкая | Средний | Stdlib-only, Vercel runtime включает Python 3.9+ из коробки |
| Archive URLs ломают существующие inbound links | Средняя | Средний | 301 redirects из `/vN.html` → `/archive/vN.html` в vercel.json |
| LCP регрессия из-за `font-display: swap` (FOUT) | Низкая | Низкий | Anton fallback — system-ui sans, визуально близко. Если FOUT заметен — `optional` вместо `swap` |
| Squash-merge теряет историю фаз | Низкая | Низкий | Branch не удаляем сразу; первые 2 недели держим как reference |

## 7. Открытые вопросы (можно решить по ходу)

1. **Push notifications data** — оставить inline в `_pushes.js` (mock + JS логика вместе) или вынести в `src/data/pushes.json`? **Дефолт:** inline (это не локализованный контент, а тестовая data в коде).
2. **public/ vs assets/** — переименовать `assets/` → `public/` под Vercel-convention? **Дефолт:** оставить `assets/` — у URL-ов в коде глубокий хвост, риск ради косметики.
3. **`v9` tag после merge?** Или оставить просто номер коммита? **Дефолт:** tag `v8-refactored`, не v9 (визуал не менялся — формально это всё ещё v8).
4. **Hero video mini-loop для mobile** — выпиливаем 78MB или делаем lite-версию в Phase 4? **Дефолт:** делаем lite-версию (~8MB H.265), serve через `<source media="(max-width: 768px)">`.

## TLDR

Создаём branch `refactor/v8-modular-perf` с tag-fallback `pre-refactor`. **Phase 1:** v1-v7 + sources + v8.1 → `archive/`, 301-редиректы. **Phase 2:** `v8.template.html` режется на `src/styles/{11 modules}.css` + `src/scripts/{7 modules}.js` + `src/manifests/{order}.json`; build.py inline-ит обратно. **Phase 3:** stdlib-минификация HTML/CSS/JS, Vercel buildCommand, `v8.*.html` в `.gitignore`. **Phase 4:** preload hints, font-display: swap, cache headers, sitemap.xml, robots.txt, favicon set, lite hero video для mobile. **Phase 5:** docs + squash merge. Каждая фаза — отдельный verifiable checkpoint, rollback через `git reset --hard pre-refactor`.

**Ожидаемый прирост:**
- Maintainability — split на 18 модулей с явными manifest'ами, валидация локалей, единый build flow
- Performance — payload `-30-40%` (минификация), zero render-blocking, preload hints, cache-immutable assets, Lighthouse Perf 95+/90+
