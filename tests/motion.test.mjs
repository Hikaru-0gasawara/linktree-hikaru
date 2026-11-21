import test from 'node:test';
import assert from 'node:assert/strict';
import { letterVars } from '../site/split.js';
import { scatter, driftY } from '../site/gutter.js';
import { titleAt } from '../site/reveal.js';
import { STRINGS } from '../site/i18n.js';

test('letterVars: index, distance from the middle letter, and its size', () => {
  assert.deepEqual(letterVars(3).map(({ d }) => d), [-1, 0, 1]);
  assert.deepEqual(letterVars(4).map(({ d, a }) => [d, a]), [[-1.5, 1.5], [-0.5, 0.5], [0.5, 0.5], [1.5, 1.5]]);
  assert.deepEqual(letterVars(5).map(({ k }) => k), [0, 1, 2, 3, 4]);
});

test('scatter: same field every visit, each bit once per side, every spot inside its band', () => {
  const counts = [4, 4, 3];
  assert.deepEqual(scatter(7, counts), scatter(7, counts));
  const flat = scatter(7, counts).flat();
  assert.equal(flat.length, 11);
  assert.equal(new Set(flat.map((b) => b.bit)).size, flat.length);
  for (const { x, y, bit } of flat) assert.ok(bit && x >= 0 && x < 1 && y >= 0 && y < 1, JSON.stringify({ x, y, bit }));
});

test('driftY: moves up with the scroll at its speed and wraps at the band height', () => {
  assert.equal(driftY(0, 0.5, 800), -0);
  assert.equal(driftY(400, 0.5, 800), -200);
  assert.equal(driftY(2000, 0.5, 800), -200); // 1000 wraps to 200
  assert.equal(driftY(500, 0.5, 0), 0); // not measured yet
});

test('titleAt: 0 below the screen, 1 once 40% up from the bottom', () => {
  assert.equal(titleAt(1000, 1000), 0);
  assert.equal(titleAt(600, 1000), 1);
  assert.equal(titleAt(0, 1000), 1);
  const mid = titleAt(800, 1000);
  assert.ok(mid > 0.5 && mid < 1, String(mid));
});

test('the index and its hint are translated', () => {
  for (const l of Object.keys(STRINGS)) for (const k of ['railLabel', 'scrollHint', 'railMtg', 'railGroup']) assert.ok(STRINGS[l][k], `${l}.${k}`);
  for (const l of Object.keys(STRINGS)) assert.match(STRINGS[l].railGroup, /\{n\}/);
});
