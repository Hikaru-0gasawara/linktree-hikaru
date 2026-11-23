import test from 'node:test';
import assert from 'node:assert/strict';
import { letterVars } from '../site/split.js';
import { scatter, driftY } from '../site/gutter.js';
import { STRINGS } from '../site/i18n.js';
import { pageTarget } from '../site/pager.js';
import { shownAt, arrival } from '../site/reveal.js';

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

test('the index and its hint are translated', () => {
  for (const l of Object.keys(STRINGS)) for (const k of ['railLabel', 'scrollHint', 'railMtg']) assert.ok(STRINGS[l][k], `${l}.${k}`);
});

test('pageTarget: one card per gesture, a tall card scrolls to its edge first', () => {
  const stops = [0, 800, 1600, 2400];
  assert.equal(pageTarget(stops, 0, 800, 1, 2400), 800);
  assert.equal(pageTarget(stops, 800, 800, -1, 2400), 0);
  assert.equal(pageTarget(stops, 2400, 800, 1, 2400), 2400); // the last card stays
  assert.equal(pageTarget(stops, 0, 800, -1, 2400), 0);
  const tall = [0, 1200, 2000]; // the first card is 1200 tall in an 800 screen
  assert.equal(pageTarget(tall, 0, 800, 1, 2000), null); // scroll inside it
  assert.equal(pageTarget(tall, 400, 800, 1, 2000), 1200); // at its bottom: next card
  assert.equal(pageTarget(tall, 400, 800, -1, 2000), null); // back up inside it
});

test('arrival: a card replays each time it comes back, from either direction', () => {
  const view = 658, h = 658;
  assert.equal(shownAt(0, h, view), 1);
  assert.equal(shownAt(-h, h, view), 0); // passed, above
  assert.equal(shownAt(h, h, view), 0); // still to come, below
  assert.equal(shownAt(-h / 2, h, view), 0.5);
  // down to the next card and back up: gone, then arrives again
  let away = false;
  for (const top of [-100, -400, -658]) away = arrival(away, shownAt(top, h, view));
  assert.equal(away, true);
  away = arrival(away, shownAt(-600, h, view)); // a sliver back on screen: not yet
  assert.equal(away, true);
  away = arrival(away, shownAt(-500, h, view));
  assert.equal(away, false);
  // from below, the same
  away = arrival(true, shownAt(500, h, view));
  assert.equal(away, false);
});
