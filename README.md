# hikaru-card

Hikaru Ogasawara's business card and link page, built as a deck of cards: Hikaru's card, his project cards, then a set of
Magic: The Gathering–style cards. Static site in `site/` (HTML, CSS and plain ES modules), with no build step and no
runtime dependencies. Live at https://hikaru-card.vercel.app/.

## What's on the page

- **Two ways to browse**
  - **Plain mode** (the default on touch screens): the cards are stacked down the page, and each scroll, swipe or key press
    turns one card (`pager.js`). Card content rises into place as it scrolls in (`reveal.js`), and titles assemble letter by
    letter (`split.js`). From 1040 px wide, an index of every card sits beside the deck. It lights the current card and
    jumps to any card on click. Small pieces of the projects drift in the empty margins (`gutter.js`).
  - **TCG mode** (the default on mouse and trackpad devices; switch it with the **TCG** button): each card is a 3D object.
    Drag to turn it, **Flip** to see its back, **Reset** to straighten it. Scrolling leafs through the deck: the top card
    arcs away onto the passed pile and the next swings in from under it (`tcg.js`, `deck.js`, `tcg-dom.js`). Your choice is
    saved in `localStorage`.
- **Card groups**: three Magic cards that share one place in the deck, shown as a pack with a ×3 badge. Click it to open
  the three as a fan, like a hand of cards.
- **Three languages**: Português, English and 日本語, from the switch at the top. The choice is saved. Every text, label,
  image description and the résumé link follow it (`i18n.js`).
- **Critters**: original pixel-art animals walking along the ground in both modes (`critters.js`).
- **Accessibility**: real links and buttons, alt text in all three languages for every card image, and reduced-motion support
  (no tilts or swings).

## Deck order

`site/index.html` holds the cards in this order (`tests/page.test.mjs` enforces it):

1. **Hikaru's card**: contacts (e-mail, LinkedIn, GitHub, résumé), focus, languages and an About section.
2. **Project cards**: Portfolio, AquaSense, ECOS, Ferrovia, Procurando o Fábio and the IoT safe. A new project goes after
   the last one.
3. **Magic-format cards**, always last:
   1. Hikaru's original Magic business card (`mtg-hikaru`).
   2. The other Magic business cards: Archengineer, Wanted and Pulp (`mtg-card-*`), each with the "how to summon" back.
   3. Single Magic cards: Kōgen, Archengineer Prompter · Kōgen, Rogue Engineer · Kōgen, Grand Artificer (`mtg-archengineer`,
      `mtg-wanted`, `mtg-pulp`). They have no back art of their own, so they use the site's standard card back.
   4. Card groups: `grupo-1` (Kōgen, Keeper of the Root · Pedro and Júlia, Open Case · Claude, the Unbearable Mind) and
      `grupo-2` (Kōgen, Arcanist of the Root · Pedro and Júlia, Kindred Minds · Kōshin, the Root Disc). A new group goes
      after the last one.

### Adding a Magic card

1. Put the front (and back, if it has one) in `site/img/` as `.webp`, 920 px wide, with the phone number removed (see below).
2. Copy a slot of the same kind in `site/index.html`: a single card is a `.deck-slot` with `data-label`, `data-rail` and a
   `.card.face-front.mtg`; a group is a `.deck-slot[data-group]` with three `.fan-item`s.
3. Add the keys it names (`…Label`, `…Alt`, `…BackAlt`, `…Rail`) to **all three** languages in `site/i18n.js`.
4. Update the order list and the alt-text count in `tests/page.test.mjs`, then run `npm test`.

## The phone number stays off the site

No page, card image, alt text or résumé on the site shows the phone number. A test checks the HTML and every string. The
originals in the Data Vault keep it.

- **Résumés**: copy `CV_Hikaru_Ogasawara_{PT,EN,JP}.pdf` from the Data Vault
  (`!games/workdump/CVs_Hikaru_Ogasawara/CVs/`) into a temporary folder as `hikaru-{pt,en,ja}.pdf`, then run
  `python scripts/strip-phone.py <that-folder> site/resume` (needs `pymupdf`). Re-run it whenever the CV changes.
- **Magic cards**: `python scripts/build-mtg-cards.py "<Data-Vault>/!games/workdump/MEISHIs_Final/MTG-idea/Hikaru" site/img <preview-folder>`
  (needs `pymupdf`, `numpy` and `Pillow`). It renders the PDFs at 920 px wide and writes the webps. It also saves PNG copies to
  the preview folder so you can check them.
  - On the business card backs, it removes the phone text from the PDF and keeps the e-mail centred where the line was.
  - On the two "Wanted" fronts, the phone is part of the flat artwork. The script covers it with the parchment from just
    below and sets the e-mail flush right where the line ended. These positions are measured for those two artworks. If the
    art changes, check the assertion message and the preview PNGs.

## Project layout

```
site/                  everything that is served
  index.html           the deck markup; an inline script sets the mode before first paint
  styles.css           both modes, the motion, the card faces
  app.js               start-up: language, mode switch, labels, groups, wires the modules below
  i18n.js              STRINGS for pt / en / ja, language choice, age, résumé URL
  deck.js              pure deck math: card poses, spring, fan layout
  tcg.js / tcg-dom.js  3D card rotation (quaternions) and the TCG-mode deck in the page
  pager.js             plain mode: one card per gesture
  reveal.js / split.js plain-mode scroll motion and letter-by-letter titles
  gutter.js            plain mode on wide screens: the card index and the drifting margins
  critters.js          pixel-art walkers
  img/  fonts/  resume/
scripts/               strip-phone.py (résumés), build-mtg-cards.py (Magic cards)
tests/                 node:test suites, one per module, plus page.test.mjs for the markup
design/                source art: card backs, logo and icons
docs/                  design specs and implementation plans (docs/superpowers), agent notes (docs/agents)
vercel.json            Vercel: serve ./site as is, clean URLs
wrangler.jsonc         Cloudflare Workers static assets: serve ./site
```

## Requirements

- Node 22 or newer for the tests. The site itself needs nothing installed.
- Python with `pymupdf` (and `numpy` and `Pillow` for the card script), only to regenerate the résumés or the card images.

## Test

    npm test

These run the `node:test` suites in `tests/`. They cover the deck and fan math, the quaternion rotation, the paging, the
i18n keys in every language, the markup (deck order, links, alt texts, image sizes), and the check that the phone number
never appears.

## Preview locally

    python -m http.server -d site 8080

Then open http://localhost:8080. (`.claude/launch.json` holds the same command for the Claude desktop preview.)

## Deploy

- **Vercel**: the site is served straight from `site/` (`vercel.json`), with no build or install step. If the Vercel project is connected to this repository, pushing deploys it.
- **Cloudflare Workers** (static assets):

      npx wrangler login   # once
      npm run deploy       # runs the tests, then wrangler deploy

## Age

Set `BIRTH_DATE` (ISO `YYYY-MM-DD`) in `site/i18n.js`. While it's empty, the page shows 21.
