import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { STRINGS, resumeUrl } from '../site/i18n.js';

const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
const BASE = 'https://hikaru-card.vercel.app/';

test('viewport, theme-color and Open Graph', () => {
  const vp = /<meta name="viewport" content="([^"]+)"/.exec(html)?.[1] ?? '';
  assert.match(vp, /viewport-fit=cover/);
  assert.doesNotMatch(vp, /user-scalable|maximum-scale/);
  assert.match(html, /<meta name="theme-color" content="#0A0F0B">/);
  for (const p of ['og:image', 'og:url']) {
    const v = new RegExp(`property="${p}" content="([^"]+)"`).exec(html)?.[1] ?? '';
    assert.ok(v.startsWith(BASE), `${p} = ${v}`);
  }
});

test('every data-i18n is a known key', () => {
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 10);
  for (const k of keys) assert.ok(k in STRINGS.pt, `unknown key ${k}`);
});

test('links are mailto/https and new tabs use noopener', () => {
  const tags = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
  assert.ok(tags.length >= 5);
  for (const t of tags) {
    const href = /href="([^"]*)"/.exec(t)?.[1] ?? '';
    assert.match(href, /^(mailto:|https:\/\/|\/resume\/hikaru-(pt|en|ja)\.pdf$)/, t);
    if (/target="_blank"/.test(t)) assert.match(/rel="([^"]*)"/.exec(t)?.[1] ?? '', /noopener/, t);
  }
});

test('links point to the exact contact URLs', () => {
  for (const href of [
    'mailto:hogasawara2311@outlook.com',
    'https://www.linkedin.com/in/hikaru-ogasawara',
    'https://github.com/Hikaru-0gasawara',
    'https://hikaru-portfolio.okaru01.workers.dev/',
  ]) {
    assert.ok(html.includes(`href="${href}"`), `missing href ${href}`);
  }
  assert.equal(resumeUrl('pt'), '/resume/hikaru-pt.pdf');
  for (const l of ['pt', 'en', 'ja']) assert.ok(existsSync(new URL(`../site${resumeUrl(l)}`, import.meta.url)), `missing ${resumeUrl(l)}`);
});

test('photo has alt and explicit size', () => {
  const img = /<img\b[^>]*>/.exec(html)?.[0] ?? '';
  assert.match(img, /alt="[^"]+"/);
  assert.match(img, /width="\d+"/);
  assert.match(img, /height="\d+"/);
});

test('wrangler.jsonc names the Worker and serves ./site', () => {
  const cfg = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(cfg.name, 'hikaru-card');
  assert.equal(cfg.assets.directory, './site');
});

test('has the TCG switch', () => {
  const btn = /<button\b[^>]*class="tcg-toggle"[^>]*>/.exec(html)?.[0] ?? '';
  assert.match(btn, /type="button"/);
  assert.match(btn, /aria-pressed="/);
});

test('back art is decorative and lazy', () => {
  const img = /<img\b[^>]*src="img\/card-back\.webp"[^>]*>/.exec(html)?.[0] ?? '';
  for (const a of ['alt=""', 'width="688"', 'height="961"', 'loading="lazy"']) assert.ok(img.includes(a), `missing ${a} in ${img}`);
});

test('mode class is set before paint', () => {
  const head = html.split('</head>')[0];
  const inline = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  assert.ok(inline.includes("'tcg'"));
  assert.ok(inline.includes("matchMedia('(hover: hover) and (pointer: fine)')"));
});

const PLAY = 'https://hikaru-portfolio.okaru01.workers.dev/';
const CODE = 'https://github.com/Hikaru-0gasawara/Portifolio';
// each slot runs from its opening tag to the next one (the last to the end of the file)
const slots = html.split('<div class="deck-slot"').slice(1);
const slot = (name) => slots.find((s) => s.startsWith(` data-card="${name}"`)) ?? '';

test('deck: Hikaru first, then project cards, then the Magic-format cards, always last', () => {
  assert.deepEqual(slots.map((s) => / data-card="([^"]+)"/.exec(s)[1]), ['hikaru', 'portfolio', 'mtg-hikaru', 'grupo-1', 'grupo-2']);
  const mtg = slots.map((s) => s.includes('class="card face-front mtg"'));
  const first = mtg.indexOf(true);
  assert.ok(first > 0 && mtg.slice(first).every(Boolean), 'a Magic card before a project card');
  const groups = slots.map((s) => s.startsWith(' data-card="grupo-') && / data-group>/.test(s));
  const g = groups.indexOf(true);
  assert.ok(g > first && groups.slice(g).every(Boolean), 'groups come after the single Magic cards');
  for (const s of slots) {
    assert.match(s, /class="tcg-card"/);
    if (/ data-group>/.test(s)) {
      const items = s.split('<div class="fan-item"').slice(1);
      assert.equal(items.length, 3);
      items.forEach((it, i) => {
        assert.ok(it.startsWith(` style="--i: ${i}"><div class="tcg-card" data-label="`), it.slice(0, 80));
        assert.match(it, /class="card face-front mtg"/);
        assert.match(it, /class="face-back mtg"><img src="img\/(mtg-[a-z-]+-back|card-back)\.webp"/);
      });
    } else if (s.includes('face-front mtg')) {
      assert.match(s, /data-label="mtgLabel"/);
      assert.match(s, /class="face-back mtg"><img src="img\/mtg-hikaru-back\.webp"/);
    } else {
      assert.match(s, /class="card face-front"/);
      assert.match(s, /class="face-back"><img src="img\/card-back\.webp"/);
    }
  }
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
});

test('image alt texts are translated', () => {
  const keys = [...html.matchAll(/data-i18n-alt="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(keys.length, 12);
  for (const k of keys) assert.ok(k in STRINGS.pt, `unknown key ${k}`);
});

test('no phone number on the site', () => {
  assert.doesNotMatch(html, /97119|\+55/);
  for (const l of Object.keys(STRINGS)) assert.doesNotMatch(JSON.stringify(STRINGS[l]), /97119|\+55/);
});

test('Hikaru card has the four contact links and no Play', () => {
  const s = slot('hikaru');
  for (const href of ['mailto:hogasawara2311@outlook.com', 'https://www.linkedin.com/in/hikaru-ogasawara', 'https://github.com/Hikaru-0gasawara', '/resume/hikaru-pt.pdf']) {
    assert.ok(s.includes(`href="${href}"`), `missing ${href}`);
  }
  assert.ok(!s.includes(PLAY));
  assert.equal(html.split(`href="${PLAY}"`).length - 1, 1);
});

test('portfolio card has Play and the code link', () => {
  const s = slot('portfolio');
  for (const href of [PLAY, CODE]) assert.ok(s.includes(`href="${href}"`), `missing ${href}`);
});

test('portfolio art has alt, explicit size and stays small', () => {
  const img = /<img\b[^>]*src="img\/portfolio\.webp"[^>]*>/.exec(slot('portfolio'))?.[0] ?? '';
  assert.match(img, /alt="[^"]+"/);
  assert.match(img, /width="\d+"/);
  assert.match(img, /height="\d+"/);
  const file = new URL('../site/img/portfolio.webp', import.meta.url);
  assert.ok(existsSync(file), 'missing site/img/portfolio.webp');
  assert.ok(statSync(file).size < 60 * 1024);
});

test('has the Reset button', () => {
  const btn = /<button\b[^>]*class="tcg-reset"[^>]*>[\s\S]*?<\/button>/.exec(html)?.[0] ?? '';
  assert.match(btn, /type="button"/);
  assert.match(btn, /data-i18n="reset"/);
});

test('has the focus-mode close button, hidden by default', () => {
  const btn = /<button\b[^>]*class="deck-close"[^>]*>/.exec(html)?.[0] ?? '';
  assert.match(btn, /type="button"/);
  assert.ok(btn.includes(`aria-label="${STRINGS.pt.close}"`), btn);
  const css = readFileSync(new URL('../site/styles.css', import.meta.url), 'utf8');
  assert.match(css, /^[^{}\n]*\.deck-close[^{}\n]*\{ display: none; \}/m);
});
