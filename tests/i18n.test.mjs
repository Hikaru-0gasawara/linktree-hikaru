import test from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, pickLang, ageOn, resumeUrl, loadLang, saveLang } from '../site/i18n.js';

test('every language has every key', () => {
  const keys = Object.keys(STRINGS.pt).sort();
  for (const l of ['en', 'ja']) assert.deepEqual(Object.keys(STRINGS[l]).sort(), keys);
  for (const l of Object.keys(STRINGS)) for (const [k, v] of Object.entries(STRINGS[l])) assert.ok(v, `${l}.${k} empty`);
});

test('pickLang', () => {
  assert.equal(pickLang(['ja-JP']), 'ja');
  assert.equal(pickLang(['en-GB']), 'en');
  assert.equal(pickLang(['fr-FR', 'en-US']), 'en');
  assert.equal(pickLang(['fr-FR']), 'pt');
  assert.equal(pickLang([]), 'pt');
});

test('ageOn', () => {
  assert.equal(ageOn('2005-03-10', new Date('2026-03-09')), 20);
  assert.equal(ageOn('2005-03-10', new Date('2026-03-10')), 21);
  assert.equal(ageOn('', new Date('2026-03-10')), null);
  assert.equal(ageOn('garbage', new Date('2026-03-10')), null);
});

test('resumeUrl', () => {
  assert.equal(resumeUrl('ja'), 'https://hikaru-portfolio.okaru01.workers.dev/resume/hikaru-ja.pdf');
});

test('loadLang survives throwing storage', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(loadLang(bad, ['ja']), 'ja');
  assert.doesNotThrow(() => saveLang(bad, 'en'));
  assert.equal(loadLang({ getItem: () => 'xx' }, ['en']), 'en');
  assert.equal(loadLang({ getItem: () => 'ja' }, ['en']), 'ja');
});
