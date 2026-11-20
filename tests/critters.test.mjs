import test from 'node:test';
import assert from 'node:assert/strict';
import { SPRITES } from '../site/critters.js';

test('every sprite is well formed', () => {
  for (const [name, { palette, frames }] of Object.entries(SPRITES)) {
    assert.ok(frames.length >= 2, `${name}: frames`);
    const h = frames[0].length, w = frames[0][0].length;
    assert.ok(h >= 10 && h <= 24, `${name}: height ${h}`);
    for (const v of Object.values(palette)) assert.match(v, /^#[0-9a-f]{6}$/i, `${name}: ${v}`);
    for (const f of frames) {
      assert.equal(f.length, h, `${name}: frame height`);
      for (const row of f) {
        assert.equal(row.length, w, `${name}: row "${row}"`);
        for (const c of row) if (c !== '.') assert.ok(c in palette, `${name}: char ${c}`);
      }
    }
  }
});

test('the cast is all there', () => {
  for (const k of ['cat', 'dog', 'horse', 'pig', 'chicken', 'pikachu', 'bulbasaur', 'charmander', 'squirtle', 'steve', 'toph'])
    assert.ok(k in SPRITES, k);
});
