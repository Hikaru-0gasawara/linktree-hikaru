import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IDENTITY, loadTcg, saveTcg, fitScale, quatFromDrag, applyDrag, quatToCss, facingFront, flipTarget, slerp,
} from '../site/tcg.js';

// q and -q are the same rotation, so compare up to sign
function near(a, b, eps = 1e-9) {
  if (typeof a === 'number') return assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const sign = dot < 0 ? -1 : 1;
  a.forEach((v, i) => assert.ok(Math.abs(v - sign * b[i]) <= eps, `[${a}] != [${b}]`));
}
const store = (v) => ({ getItem: () => v });
const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };

test('loadTcg: stored value wins, else fineHover', () => {
  assert.equal(loadTcg(store('1'), false), true);
  assert.equal(loadTcg(store('0'), true), false);
  assert.equal(loadTcg(store(null), true), true);
  assert.equal(loadTcg(store(null), false), false);
  assert.equal(loadTcg(store('x'), true), true);
  assert.equal(loadTcg(boom, true), true);
  assert.equal(loadTcg(boom, false), false);
});

test('saveTcg ignores errors and round-trips', () => {
  assert.doesNotThrow(() => saveTcg(boom, true));
  const m = new Map();
  const s = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  saveTcg(s, true);
  assert.equal(m.get('tcg'), '1');
  assert.equal(loadTcg(s, false), true);
  saveTcg(s, false);
  assert.equal(loadTcg(s, true), false);
});

test('fitScale', () => {
  near(fitScale(1440, 900), 780 / 642);
  near(fitScale(390, 844), 358 / 460);
  near(fitScale(4000, 4000), 1.25);
});

test('quatFromDrag', () => {
  assert.deepEqual(quatFromDrag(0, 0), IDENTITY);
  near(quatFromDrag(360, 0), [0, 1, 0, 0]);
  near(quatFromDrag(0, 180), [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
});

test('quatToCss', () => {
  assert.equal(quatToCss(IDENTITY), 'rotate3d(0, 1, 0, 0deg)');
  assert.equal(quatToCss([0, 1, 0, 0]), 'rotate3d(0, 1, 0, 180deg)');
});

test('facingFront and flipTarget', () => {
  assert.equal(facingFront(IDENTITY), true);
  assert.equal(facingFront([0, 1, 0, 0]), false);
  near(flipTarget(IDENTITY), [0, 1, 0, 0]);
  near(flipTarget([0, 1, 0, 0]), IDENTITY);
});

test('slerp', () => {
  const b = [0, 1, 0, 0];
  near(slerp(IDENTITY, b, 0.5), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
  near(slerp(IDENTITY, b, 0), IDENTITY);
  near(slerp(IDENTITY, b, 1), b);
});

test('stays unit after many drags', () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 80 - 40;
  let q = IDENTITY;
  for (let i = 0; i < 1000; i++) q = applyDrag(q, rnd(), rnd());
  near(Math.hypot(...q), 1);
});
