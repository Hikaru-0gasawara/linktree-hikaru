# hikaru-card

One-screen business card for Hikaru Ogasawara. Static site in `site/` (HTML, CSS, one small JS module), no build step, deployed as Cloudflare Workers static assets.

## Test

    npm test

## Preview locally

    python -m http.server -d site 8080

Then open http://localhost:8080.

## Deploy

    npx wrangler login   # once
    npm run deploy       # runs the tests, then wrangler deploy

## Age

Set `BIRTH_DATE` (ISO `YYYY-MM-DD`) in `site/i18n.js`. While empty, the page shows 21.
