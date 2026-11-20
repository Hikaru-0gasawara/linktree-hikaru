# TCG card mode (design)

Extends `2026-11-19-linktree-design.md` (read it first; its tokens, mobile rules and accessibility rules still apply).

## Intent

On a computer, the business card should feel like a trading card on the table: centred, 3D, something you pick up and turn. It still works 100% as a linktree: every link, the language switch and the résumé work on the card's face. On a phone the plain linktree stays the default, and a switch turns the card mode on to try it.

## Goals

- **Card mode ("TCG")**: the existing linktree content becomes the face of one card with TCG proportions (63:88), centred on screen, with the stars and the pixel ground around it.
- **Free rotation**: dragging the card turns it in any direction (horizontal, vertical, diagonal), like a ball: 360° on every axis. The back face shows when it is turned around.
- **Back art**: a forest in the look of the vintage-paperback "book cover" cards of MTG's Hobbit set (flat mid-century painting, aged paper, worn print), with no text at all (`site/img/card-back.webp`), in a thin frame. Sources in `design/card-back/`.
- **Fixed in place**: the card never moves on screen; it only turns around its own centre.
- **Ground critters (card mode only)**: small original pixel-art walkers on the pixel ground at the bottom of the screen: cats, dogs, pigs, chickens, a horse, plus easter eggs Pikachu, Bulbasaur, Charmander, Squirtle, Minecraft's Steve and Toph (Avatar). Behind the card, never interactive, standing still under reduced motion.
- **Language switch** stays available in card mode, outside the card, at the screen's top-right.
- **Switch**: an on/off button, always visible in both modes. Default **on** where the device has a fine pointer that hovers (computer), **off** otherwise (phone). The visitor's choice is remembered.

## Non-goals (this round)

- The deck of several cards (scroll passes cards sideways, fan, "enter" a card). There is only one card today. The card's markup and code must not assume there will only ever be one card, but nothing for the deck is built now.
- Project cards.
- Changing the plain linktree layout. With the switch off, the page must look and behave exactly as it does today.

## Anti-goals

- A link that can't be tapped because the card thinks it is a drag, or a drag that opens a link.
- Text in the card blurry or overflowing at any supported size.
- The card mode loading on phones where it is off (the back art must not download while off).
- A flash of the wrong mode on load.

## Behaviour

**Mode and switch**
- `<html>` gets class `tcg` when the mode is on. The class is set by the inline head script before first paint (same place as `no-enter`), using: the stored choice (`localStorage` key `tcg`, values `'1'`/`'0'`) if present, else `matchMedia('(hover: hover) and (pointer: fine)').matches`. All storage access in try/catch.
- The switch is a `<button class="tcg-toggle" aria-pressed>` fixed at the top-left of the viewport (clear of the language switch at top-right), 44px tap target, square chrome, mono 10px text `TCG` with a small card icon; `aria-pressed` follows the mode; localized `aria-label` (`pt` "Modo carta", `en` "Card mode", `ja` "カードモード"). Pressing it flips the mode instantly (no animation needed between modes) and stores the choice.

**The card (mode on)**
- Design size 460×642 CSS px (63:88). It is scaled as a whole to fit the viewport: `scale = min((innerWidth − 32) / 460, (innerHeight − 160) / 642, 1.25)`, recomputed on resize; applied through a CSS custom property. The face content is laid out at design size, so nothing inside depends on the viewport (the name's `font-size` must not use `vw`/`svh` in this mode).
- Everything that is in `main.card` today is the front face, in the same order and the same design (photo, name, role, panel, Play, E-mail, LinkedIn, GitHub, Résumé, footer), except the language switch, which moves to the screen's top-right. It must fit inside 460×642 without scrolling or overflow, in PT, EN and JA.
- Frame: front background `--panel` with its own faint stars and the 8px pixel ground strip at the bottom inside the card; 1px `--gold` border; corners cut in pixel steps (clip-path, 2 steps of 4px), no rounded corners (square-corner rule).
- Back: the forest art covers the back face inside an inner 1px `--gold` frame inset 10px on a `--ground` margin; same pixel-step corners. `alt=""` (decorative), explicit `width`/`height`, `loading="lazy"` and `display:none` outside the mode so it is not fetched while off.
- Page does not scroll in this mode (`overflow: hidden` on html/body); `touch-action: none` on the card so touch drags rotate instead of scrolling.

**Rotation**
- Orientation is a unit quaternion. A pointer drag of (dx, dy) px rotates the card about the screen axis perpendicular to the drag, `0.5°` per px, composed on the left of the current orientation (trackball: always turns the way the finger moves, whatever the current orientation). Applied as one `transform: rotate3d(...)` on the card, with `perspective: 1200px` on its parent.
- A drag starts after the pointer moves 6px from where it went down. Once a drag started, the `click` that ends it is swallowed (capture phase), so no link opens. Below 6px it is a normal tap/click.
- On release, the card keeps spinning with the release velocity and slows down (friction 0.94 per 16.7ms frame, stops under 0.02°/frame). A new pointerdown stops it.
- **Flip button** at the top-left beside the switch (`.tcg-flip`, label pt "Virar", en "Flip", ja "裏返す", 44px, ghost style): animates over 500ms (`--ease`) from the current orientation to the face that is *not* currently facing the viewer, upright (identity, or 180° about Y). Keyboard: when the card wrapper has focus (`tabindex="0"`, `aria-label` = localized card name, e.g. "Cartão de Hikaru Ogasawara"), arrow keys rotate 15° per press about the matching axis, `Enter`/`Space` on the wrapper itself do nothing special (links inside keep their own keys).
- Light: a subtle sheen layer on the front face, a soft diagonal white gradient (max opacity .08) whose position follows the card's orientation, so turning it reads as a glossy card. `pointer-events: none`.
- The first entrance plays as today (once per session). In card mode the whole card also fades and scales .96→1 in 550ms with the existing ease.

**Reduced motion** (`prefers-reduced-motion: reduce`): no inertia (stops on release), flip jumps instantly, no entrance scale (opacity only). Dragging still rotates (it is direct manipulation).

## Constraints

- Still static, no dependencies, no build. New module `site/tcg.js` (pure functions, unit-tested with `node --test`) plus wiring in `site/app.js` or a small `site/tcg-dom.js`.
- Colours only from the existing tokens. Gold stays reserved for: Play, HUD brackets, labels, active language, résumé marker, focus ring, **the card's border and frame** (new, a "clickable/collectible" accent), and the active TCG switch.
- Page weight in plain mode unchanged (the art is not loaded); in card mode under ~450 KB total.
- Tests keep passing; new tests cover the pure logic and the new markup.

## Calls I made (check them)

- Picked forest art variant A (`design/card-back/forest-a.png`); variant B is beside it. Swap by re-exporting to `site/img/card-back.webp` (crop centred to 63:88).
- Choice is remembered across visits (not only this session).
- Card scales up to 1.25× on big screens, never more, to keep text crisp.
- 0.5°/px drag, 6px drag threshold, friction 0.94: starting values, tune by feel in the browser check.
- The Pokémon, Steve and Toph sprites are fan-made easter eggs of third-party characters (requested by the owner), drawn here, not copied; the characters belong to their owners, so remove them if that ever matters.
