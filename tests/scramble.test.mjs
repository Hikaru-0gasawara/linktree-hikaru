import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameText, settleAt, kind, DURATION } from '../site/scramble.js';

test('scramble: starts on the old text, ends exactly on the new one', () => {
  const from = 'Estudante de Engenharia', to = 'Computer Engineering Student';
  assert.equal(frameText(from, to, 0).slice(0, 8), from.slice(0, 8)); // (the new text's space at 8 stands still)
  assert.equal(frameText(from, to, DURATION), to);
  for (let i = 0; i < 40; i++) assert.ok(settleAt(i, 40) < DURATION);
});

test('scramble: each character runs through its own kind; spaces and punctuation stand still', () => {
  const to = 'Stack · ESP32 — 専門 プロジェクト';
  for (const t of [200, 300, 400]) {
    const f = frameText('', to, t);
    assert.equal(f.length, to.length);
    [...to].forEach((c, i) => {
      if (!kind(c)) assert.equal(f[i], c, `${t}ms: "${c}" at ${i}`);
      else assert.equal(kind(f[i]), kind(c), `${t}ms: "${f[i]}" for "${c}"`);
    });
  }
});
