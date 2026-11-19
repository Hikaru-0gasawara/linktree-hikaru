import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STRINGS } from '../site/i18n.js';

const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
const BASE = 'https://hikaru-card.okaru01.workers.dev/';

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
    assert.match(href, /^(mailto:|https:\/\/)/, t);
    if (/target="_blank"/.test(t)) assert.match(/rel="([^"]*)"/.exec(t)?.[1] ?? '', /noopener/, t);
  }
});

test('photo has alt and explicit size', () => {
  const img = /<img\b[^>]*>/.exec(html)?.[0] ?? '';
  assert.match(img, /alt="[^"]+"/);
  assert.match(img, /width="\d+"/);
  assert.match(img, /height="\d+"/);
});
