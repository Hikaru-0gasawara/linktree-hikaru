import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
