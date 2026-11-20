# Deck of cards, portfolio card, critters everywhere (design)

Extends `2026-11-20-tcg-card-design.md` and `2026-11-19-linktree-design.md` (read both; their tokens, mobile rules, accessibility rules and card mode behaviour still apply unless this doc changes them).

## Intent

The card page becomes a small deck. Card 1 is Hikaru; card 2 is his portfolio project; more project cards will follow later. In card mode (TCG) you leaf through the deck by scrolling, like flipping through cards on a table. Outside card mode the same cards are a plain scrolling page. The pixel critters walk in both modes, plus two Minecraft mobs.

## Changes, by area

### 1. Hikaru's card (both modes)

Same design and order as today, with these changes:
- **Links:** only E-mail, LinkedIn, GitHub and Currículo (the existing 2×2 grid). The gold ▶ Play button is removed from this card (it moves to the portfolio card).
- **New "Sobre" block** after the info panel: a 2–3 line briefing, from the portfolio README's About me (owner approved):
  - pt: "Curioso desde criança, aprendo fazendo: monto, testo, meço e refaço até entender o porquê. Vice-presidente da Ycare, ONG que leva cestas básicas a uma comunidade todo mês."
  - en: "Curious since childhood, I learn by doing: build, test, measure and rebuild until I understand the why. Vice president of Ycare, a volunteer group that brings food baskets to a community every month."
  - ja: "子どもの頃から好奇心旺盛で、作って試して測り、理由が分かるまで作り直して学びます。毎月地域に食料を届けるボランティア団体Ycareの副代表。"
- **New soft-skills row**: small square chips (hairline border, mono 10px, muted text): pt "Calma sob pressão · Iniciativa · Trabalho em equipe · Liderança · Prazos"; en "Calm under pressure · Initiative · Teamwork · Leadership · Deadlines"; ja "冷静さ · 主体性 · チームワーク · リーダーシップ · 期限厳守". A small gold label above the block ("Sobre" / "About" / "自己紹介").
- The name may be made smaller (even much smaller) so the card still fits one phone screen in plain mode and the 460×642 face in card mode, in PT, EN and JA. It must stay clearly legible and remain the largest text on the card.

### 2. Portfolio card (new, both modes)

Same frame, fonts, tokens and back art as Hikaru's card. Content, top to bottom:
- Art window: a screenshot of the live portfolio's first screen (`site/img/portfolio.webp`, ~2× display size, captured from https://hikaru-portfolio.okaru01.workers.dev/), square corners, hairline border, where Hikaru's photo is on his card (it is not a circle).
- Title `PORTFÓLIO` (en `PORTFOLIO`, ja `ポートフォリオ` in the system Japanese font) in the name style, smaller than Hikaru's name, plus a type line in muted text like a TCG type line: pt "Projeto — Web interativo", en "Project — Interactive web", ja "プロジェクト — インタラクティブWeb".
- Short description (2–3 lines): an explorable pixel-art room with projects, a lab, a skill tree, minigames, résumés and a fast lane for recruiters, in PT/EN/JA. Write it from the portfolio README (`C:/Users/Okaru/Documents/Trash/repos/Portifolio/README.md`).
- Info panel (same component as Hikaru's): "Stack" (from the README / repo: vanilla HTML/CSS/JS, no framework), "Destaques" (TV 3D, boot, passagens secretas / 3D TV, boot, secret passages / 3Dテレビ・起動画面・隠し通路), "Status" (no ar / live / 公開中).
- Links: the gold ▶ Play (opens https://hikaru-portfolio.okaru01.workers.dev/) and a ghost "Código" / "Code" / "コード" button (https://github.com/Hikaru-0gasawara/Portifolio).
- Footer like Hikaru's card, with the status "● no ar" (jade) and "2026" on the right.

### 3. Plain mode (TCG off)

- The cards are sections of a normal scrolling page: Hikaru's card, then the portfolio card below it. Each section is at least one screen tall (`100svh`) and its content is vertically centred. On a computer this centres Hikaru's card on the screen instead of hugging the top (owner request). On a phone Hikaru's card still fits one screen.
- The language switch stays at the top of Hikaru's card as today.
- Critters walk at the bottom (see 5); content keeps clear of the ground and critter lane (bottom padding).

### 4. Card mode (TCG on): the deck

**Layout (browse).** One card is current, centred and largest. The cards already passed sit to the **left**, partly visible, tilted (`rotateZ(-6deg)`), slightly smaller (`scale .86`) and darker, the most recent on top. The cards still to come sit to the **right** as a pile, **face down** (backs showing), each deeper card offset a few px right/down and slightly smaller, so it reads as "a pile of cards". The first card has nothing on its left; the last has no pile.

**Leafing (scroll-driven).** Scrolling is the only clock: deck progress `p` (0 … n−1) comes from the scroll position; card poses are pure functions of `p` and are written as `transform`/`opacity` only. Native scrolling with `scroll-snap` (mandatory, one stop per card) gives momentum, trackpad and keyboard for free. Between stops the current card travels left onto the passed stack along a slight arc and tilt, and the top card of the pile rises to the centre while turning face up (rotateY 180° → 0°) in step with the scroll. A card that leaves the centre returns smoothly to its upright orientation in step with the scroll, so every card arrives face up and straight.
- Desktop (fine pointer): the mouse wheel / trackpad scroll vertically and drive the deck; ←/→ and PageUp/PageDown also page; drag still rotates the current card in every direction as today.
- Touch: swiping **horizontally** leafs the deck "like turning the pages of a book". Tapping the current card (anywhere except a link or button) enters **focus mode**: the card grows to the full fit size (current `fitScale`), the other cards fade away, paging is locked, and dragging rotates it freely in every direction (today's behaviour). A close control (✕, top-right of the stage, 44px) or tapping outside the card leaves focus mode. Links on the card work in both states.
- Only the current card is interactive (its links focusable, drag/rotate). The others are `inert`.

**Controls.** Top-left, next to TCG and Virar: a new **Resetar** button ("Resetar" / "Reset" / "リセット") that animates the current card back to its initial upright front orientation (500 ms, `--ease`; instant under reduced motion). Virar and Resetar act on the current card.

**Reduced motion.** No arc, tilt or flip animation between cards: at each snap stop the deck simply shows the new arrangement with a short opacity fade; poses still follow scroll but without rotation.

### 5. Critters

- They also walk in plain mode (fixed at the bottom, on the pixel ground), not only in card mode.
- New cast members: **Creeper** and **Zombie** (Minecraft), original pixel art, 18–22 px tall like Steve.
- They walk more often: fewer and shorter stops (stop chance about a third of today's, stops 0.5–1.5 s), random direction changes now and then, so the lane always feels alive.
- Reduced motion: still standing (unchanged rule).

## Non-goals

- More project cards beyond the portfolio (later). Nothing in code may assume exactly two cards.
- A different back per card: all cards share `img/card-back.webp`.

## Anti-goals

- A scroll that fights the user (scroll-jacking with custom wheel physics, fixed durations on wheel). Native scroll + snap only.
- Text on the current card moving while someone reads it at a snap stop.
- On a phone in card mode, a swipe meant to leaf that rotates the card instead (rotation needs focus mode on touch).

## Calls I made (check them)

- Soft-skill wording shortened to fit chips (e.g. "Prazos" for "respeito a prazos").
- Portfolio art is a screenshot of the live site's first screen.
- In plain mode both cards look like today's page (no 3D, no frame), one section each.
- The pile shows card backs; passed cards stay face up.

## Revision 2 (owner feedback after the first deploy)

Supersedes the matching parts of section 4 and adds plain-mode motion.

**One face for the whole deck.** Every card in the deck (passed, current, pile) faces the same side. The pile lies face up under the current card. **Virar** in browse turns *all* cards over together (and back); **Resetar** in browse turns them all to the front. Only a focused card can show a different side.

**Browse is a carousel, not a toy.** Outside focus mode no card can be dragged or rotated, on any device; links and buttons on the current card stay fully usable. Leafing is a complete, orchestrated motion: the current card slides left onto the passed stack (arc, tilt, darkening) while the card beneath swings out to the right from under it and comes to the centre; the rest of the pile shifts up one place, so the next card starts to show. The pile is visibly a pile: each card offset right/down and turned a degree or two more than the one above. The motion follows the native scroll through a critically damped spring (ω ≈ 11/s, ~0.5 s to settle), so even a quick snap plays the whole leaf, and a new scroll redirects it mid-flight. Reduced motion: no spring, no tilt or swing; positions follow scroll with the existing short fade.

**Focus mode on every device.** Clicking or tapping the current card (not a link or button), or Enter/Space on its focused wrapper, enters focus: the card grows to the fit size, the others fade, paging locks, and the card can be dragged/arrow-keyed freely; **Virar**/**Resetar** then act on it alone. ✕, a click beside the card or Escape leave focus; the card turns back to the deck's face (500 ms, `--ease`).

**Plain mode motion (scroll-driven, CSS only, where `animation-timeline: view()` is supported).** Found with the `find-animation-opportunities` gate:
- Portfolio section: each block (art, title, type line, description, panel, links, footer) rises into place as it enters the viewport (`translateY(24px) scale(.98)`, opacity 0 → settled over `entry 0%–entry 100%`), which staggers them naturally by position. Purpose: preventing a jarring change (the section otherwise sits pre-animated below the fold). Frequency: once or twice per visit.
- Hikaru's section, as it scrolls out: settles back (`scale(.95)`, opacity .4 over the `exit` range), so the next card reads as laid on top. Purpose: spatial consistency with the deck.
- Reduced motion: opacity only for the portfolio blocks, nothing for the settle.
- Rejected: parallax on the stars (decoration that competes with text), motion on the critter lane (already ambient), animating the language switch beyond its crossfade (tens of uses), any motion on link press beyond the existing scale(.97).
