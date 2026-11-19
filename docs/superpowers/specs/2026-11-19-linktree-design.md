# Linktree: online business card (design)

## Intent

People reach this page by tapping the NFC chip or scanning the QR code on Hikaru Ogasawara's business card at events. They are business people with a few seconds to spare. In one glance they must see who he is, how to reach him, and where to see more. The page should stay with them ("that guy was great"). It is a business card, not a portfolio: one screen, concise, no clutter.

Approved visual reference: `.superpowers/brainstorm/1610-1795110247/content/final-v7.html` (the phone mockup). Build to look like it, at real phone sizes.

## Goals

- One screen on a typical phone (360×640 up to 430×932), no scroll needed for the main content.
- Name, role, focus areas and all contact paths visible at once.
- Three languages, PT / EN / JA, with a switch.
- Feels native on a phone (see Mobile rules).
- Motion that makes it memorable without slowing anyone down.

## Non-goals

- No WhatsApp, Instagram, phone number, "call" or "save contact" button (user removed them).
- No analytics, cookies, forms or back end.
- Not a copy of the portfolio. It borrows the look; it does not reuse the portfolio's room, OS or games.

## Anti-goals (failure even if it works)

- Looks like a generic Linktree template.
- An entrance animation the visitor has to wait through before tapping.
- Text overflows or Japanese breaks mid-word on a small phone.

## Content (top to bottom)

1. **Language switch**, top right: `PT · EN · JA` segmented control. Default is the browser language (`ja*` → JA, `en*` → EN, else PT). The choice is remembered in `localStorage` (wrapped in try/catch). Updates `<html lang>`.
2. **Photo**: `assets/hikaru-cutout.png` (transparent, 688×1024) in a 116px circle (may grow to ~128px on taller phones), whole bust visible, bottom 18% fading out. Background radial `#1d2a20 → #131B15`. Four gold corner brackets around it (HUD). Small jade "available" dot at bottom right.
3. **Name**: `HIKARU` / `OGASAWARA` on two lines, centered, never broken inside a word. Font: Anybody, weight 900, condensed (font-stretch ~56%), sized so OGASAWARA fills about the content width.
4. **Role**: "Estudante de Eng. de Computação" / "Ibmec SP · 21 anos" (muted color).
5. **Info panel** (dark panel, hairline border), gold labels:
   - Foco: Infra · Segurança · Dados
   - Fala: PT · EN · 日本語
   - Base: São Paulo, BR
6. **▶ Play**: the one gold, full-width button. See "Open decision".
7. **2×2 grid** of ghost buttons, each with a small square color marker:
   - E-mail → `mailto:hogasawara2311@outlook.com`
   - LinkedIn → https://www.linkedin.com/in/hikaru-ogasawara
   - GitHub → https://github.com/Hikaru-0gasawara
   - Currículo → résumé PDF in the current language (gold marker, see "Decided by the user")
8. **Footer**: "● aberto a projetos" (jade) left, "SP · BR" right, sitting above the pixel ground strip.

Background: faint pixel stars (two radial-gradient dot layers, ~18% opacity), and an 8px checkered pixel ground strip at the bottom (`#131B15` / `#0D130F`).

External links open in a new tab with `rel="noopener"`.

All visible strings exist in PT, EN and JA. The builder writes the EN and JA copy; the JA copy follows the portfolio's existing translations where the same phrase exists (`Portifolio/src/translations*.tsv`).

## Look (tokens from the portfolio's DESIGN.md)

| Token | Value | Use |
|---|---|---|
| ground | `#0A0F0B` | page |
| panel | `#0D130F` | info panel, ground strip |
| panel-raised | `#131B15` | photo bg, ground strip |
| paper | `#E8E4D4` | main text |
| muted | `#A3AD9F` | role |
| dim | `#7F8A7C` | footer |
| gold | `#D8B24A` | the one accent: Play, HUD brackets, labels, active language |
| jade | `#62B37F` | available dot, footer status |
| sky | `#7FB2DA` | link markers |
| hairline | `rgba(232,228,212,.11)` / `.2` | borders |

Color rule (user's): two close colors for ordinary elements (ground/panel greens + paper), one strong accent (gold) for what should be tapped first. Square corners on all chrome; only the photo and dots are round.

Fonts: Anybody (name), JetBrains Mono (body), DotGothic16 optional for JA labels. Self-hosted woff2, latin subsets copied from `Portifolio/assets/fonts` (see `Portifolio/src/fonts.css` for which file is which). JA text may fall back to the system Japanese font if DotGothic16 subsets are too heavy. No CDN.

## Motion

Choreography for the first load (once per visit; no replay on language switch):

| Element | Role | Starts | Duration | Motion |
|---|---|---|---|---|
| Name | Lead | 0ms | 550ms | fade + 12px rise |
| Photo circle | Lead (with name) | 0ms | 550ms | fade + scale .96 → 1 |
| HUD brackets | Decoration | 120ms | 350ms | slide 4px outward into place |
| Role + panel | Support | 110ms | 450ms | fade + 8px rise |
| Play + grid | Support | 180ms | 400ms | fade + 6px rise, together, no per-button stagger |
| Stars, ground, footer, language switch | Static/decoration | 0ms | 400ms | fade only |

Easing: `cubic-bezier(.2,.7,.2,1)` (portfolio's). Everything is tappable from the first frame it is visible. `animation-fill-mode: both`.

Other motion:

- Press feedback on every button: `:active` scale .97 + background step, 100ms ease-out.
- Hover styles only inside `@media (hover: hover) and (pointer: fine)`.
- Language switch: text crossfade ~150ms, no stagger, no layout jump.
- Available dot: a slow pulse ring, `steps()` timing so it reads as pixels; nothing else loops.
- `prefers-reduced-motion: reduce`: no movement, no pulse, opacity fades only, all together.

## Mobile rules (from the mobile-native skill)

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; never disable zoom.
- `theme-color` `#0A0F0B` (the page is dark only).
- `-webkit-tap-highlight-color: transparent`, `-webkit-text-size-adjust: 100%`.
- Layout height `min-height: 100svh`; content padded by `env(safe-area-inset-*)`.
- Buttons/links: `touch-action: manipulation`, `user-select: none`, `-webkit-touch-callout: none`. Body text stays selectable (the e-mail must be copyable somewhere — the mailto label or a long-press is fine).
- Tap targets at least 44px tall.

## Constraints

- Static site: `index.html`, one CSS file, one small JS file (i18n + language switch), fonts, the photo. No framework, no build step, no dependencies (my call: the page is tiny, and the portfolio is also plain static files).
- Photo: ship a resized WebP/PNG around 2× the displayed size (~260px wide), not the 688px original.
- Page weight goal: under ~300 KB total.
- Hosting: Cloudflare Workers static assets, like the portfolio (`wrangler.jsonc` with `assets.directory`). Deploying is the user's step.
- Meta: title "Hikaru Ogasawara", description, Open Graph image (the photo or a simple card) so a shared link previews well.
- Accessibility: real `<a>` links, visible focus ring (gold), alt text on the photo, `aria-pressed` on the language buttons, contrast AA.

## Decided by the user

- **▶ Play** opens the portfolio (https://hikaru-portfolio.okaru01.workers.dev/), which is itself a playable pixel-art room. The grid's 4th slot is **Currículo / Résumé / 履歴書**, opening `https://hikaru-portfolio.okaru01.workers.dev/resume/hikaru-{pt,en,ja}.pdf` for the current language (gold marker).
- **Age** is computed from the birth date in one `BIRTH_DATE` constant in the JS. Until the user supplies the date, the constant is empty and the page shows the static fallback `21`.

## Calls made after the builder check (mine, check them)

- Everything the page needs (fonts, photo, strings) is copied into this repo. Nothing reads the Portifolio repo at runtime or build time.
- Résumé PDFs are live at `https://hikaru-portfolio.okaru01.workers.dev/resume/hikaru-{pt,en,ja}.pdf` (the portfolio build copies `public/resume` into `dist/resume`).
- The mockup is indicative. When it conflicts with the tokens or rules in this doc, the doc wins.
- Workers name `hikaru-card`, so the expected URL is `https://hikaru-card.okaru01.workers.dev/`. og:url and og:image use that, in one constant that's easy to change.
- The e-mail address is not shown as text. The E-mail button is a mailto link; long-press copies it.

## Left to the builder

- Exact font sizes per breakpoint, as long as the name never wraps inside a word and the page fits one screen on 360×640.
- File layout inside the repo.
- How the name is sized (clamp(), or fitting via `font-stretch`).
- Tests: a small Node test that checks every i18n key exists in all three languages and every link is absolute/valid.
