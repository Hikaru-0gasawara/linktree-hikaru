import test from 'node:test';
import assert from 'node:assert/strict';
import { deckScale, progressFrom, poseFor, unwindWeight } from '../site/deck.js';

function near(a, b, eps = 1e-9) {
  assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
}
const at = (d) => poseFor(0, -d); // d = i - p
const check = (pose, want) => Object.entries(want).forEach(([k, v]) => near(pose[k], v));

test('poseFor: exact poses', () => {
  check(at(0), { x: 0, y: 0, s: 1, rz: 0, ry: 0, shade: 0, z: 100, opacity: 1 });
  check(at(1), { x: 0.58, y: 0.02, s: 0.86, rz: 0, ry: 180, shade: 0.2, z: 90, opacity: 1 });
  check(at(-1), { x: -0.62, y: 0, s: 0.86, rz: -6, ry: 0, shade: 0.35, z: 90, opacity: 1 });
  check(at(0.5), { x: 0.29, y: 0.01, s: 0.93, rz: 0, ry: 90, shade: 0.1, z: 95, opacity: 1 });
  check(at(-0.5), { x: -0.31, y: -0.04, s: 0.93, rz: -3, ry: 0, shade: 0.175, z: 95, opacity: 1 });
  check(at(2), { x: 0.61, y: 0.035, s: 0.84, rz: 0, ry: 180, shade: 0.28, z: 80, opacity: 1 });
  check(at(-2), { x: -0.655, y: 0.012, s: 0.84, rz: -7.5, ry: 0, shade: 0.45, z: 80, opacity: 1 });
  check(at(5), { x: 0.7, y: 0.08, s: 0.78, rz: 0, ry: 180, shade: 0.5, z: 50, opacity: 0 });
  check(at(-5), { x: -0.76, y: 0.048, s: 0.78, rz: -12, ry: 0, shade: 0.6, z: 50, opacity: 0 });
});

test('poseFor: continuous across d = +-1', () => {
  for (const d of [1, -1]) {
    const a = at(d - 1e-9), b = at(d + 1e-9);
    for (const k of ['x', 'y', 's', 'rz', 'ry', 'shade']) near(a[k], b[k], 1e-6);
  }
});

test('poseFor: opacity 0 beyond the limits', () => {
  assert.equal(at(-3).opacity, 1);
  assert.equal(at(-3.01).opacity, 0);
  assert.equal(at(4).opacity, 1);
  assert.equal(at(4.01).opacity, 0);
});

test('poseFor: z strictly decreases with |d|', () => {
  const ds = [0, 0.5, 1, 2, 5];
  for (const sign of [1, -1]) {
    const zs = ds.map((d) => at(sign * d).z);
    zs.slice(1).forEach((z, i) => assert.ok(z < zs[i], `${zs}`));
  }
});

test('poseFor: reduced motion flips in one step', () => {
  for (const [d, ry] of [[0.4, 0], [0.6, 180]]) {
    const r = poseFor(0, -d, true);
    check(r, { ry, rz: 0, y: 0 });
    near(r.x, at(d).x);
  }
});

test('deckScale', () => {
  near(deckScale(1440, 900), Math.min(1344 / 460, 740 / 642, 1.1));
  near(deckScale(390, 844), 294 / 460);
});

test('progressFrom clamps to [0, n-1]', () => {
  near(progressFrom(1500, 1000, 2), 1);
  near(progressFrom(500, 1000, 2), 0.5);
  near(progressFrom(-20, 1000, 2), 0);
});

test('unwindWeight', () => {
  near(unwindWeight(1, 0.3), 0.7);
  near(unwindWeight(0, 2), 1);
});
