import test from 'node:test';
import assert from 'node:assert/strict';
import { deckScale, progressFrom, poseFor, springStep, fanLayout, fanPose } from '../site/deck.js';

function near(a, b, eps = 1e-9) {
  assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
}
const at = (d) => poseFor(0, -d); // d = i - p
const check = (pose, want) => Object.entries(want).forEach(([k, v]) => near(pose[k], v));

test('poseFor: exact poses, every card face up', () => {
  check(at(0), { x: 0, y: 0, s: 1, rz: 0, shade: 0, z: 100, opacity: 1 });
  check(at(1), { x: 0.09, y: 0.03, s: 0.96, rz: 1.5, shade: 0.25, z: 90, opacity: 1 });
  check(at(-1), { x: -0.62, y: 0, s: 0.86, rz: -6, shade: 0.35, z: 90, opacity: 1 });
  check(at(0.5), { x: 0.385, y: 0.015, s: 0.98, rz: 4.75, shade: 0.125, z: 95, opacity: 1 });
  check(at(-0.5), { x: -0.31, y: -0.04, s: 0.93, rz: -3, shade: 0.175, z: 95, opacity: 1 });
  check(at(2), { x: 0.125, y: 0.045, s: 0.94, rz: 3, shade: 0.35, z: 80, opacity: 1 });
  check(at(-2), { x: -0.655, y: 0.012, s: 0.84, rz: -7.5, shade: 0.45, z: 80, opacity: 1 });
  check(at(5), { x: 0.23, y: 0.09, s: 0.88, rz: 7.5, shade: 0.55, z: 50, opacity: 0 });
  check(at(-5), { x: -0.76, y: 0.048, s: 0.78, rz: -12, shade: 0.6, z: 50, opacity: 0 });
  for (const d of [-2, -0.5, 0.5, 2]) assert.equal('ry' in at(d), false);
});

test('poseFor: continuous across d = +-1', () => {
  for (const d of [1, -1]) {
    const a = at(d - 1e-9), b = at(d + 1e-9);
    for (const k of ['x', 'y', 's', 'rz', 'shade']) near(a[k], b[k], 1e-6);
  }
});

test('poseFor: the incoming card swings out right, under the leaving one until halfway', () => {
  near(Math.max(...[0.25, 0.5, 0.75].map((d) => at(d).x)), at(0.5).x);
  assert.ok(at(0.5).x > at(1).x);
  assert.ok(at(0.6).z < at(-0.4).z); // p = 0.4: card 1 still under card 0
  assert.ok(at(0.4).z > at(-0.6).z); // p = 0.6: card 1 on top
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

test('poseFor: reduced motion has no tilt, arc or swing', () => {
  const r = poseFor(0, -0.4, true);
  check(r, { rz: 0, y: 0, x: 0.036 });
  near(poseFor(0, 0.4, true).x, at(-0.4).x);
});

test('springStep: exact for any step size, settles without overshoot', () => {
  let a = [0, 0];
  for (let i = 0; i < 10; i++) a = springStep(...a, 1, 0.1, 11);
  const b = springStep(0, 0, 1, 1, 11);
  near(a[0], b[0], 1e-9); near(a[1], b[1], 1e-9);
  near(springStep(0, 0, 1, 1, 11)[0], 1, 1e-3);
  let x = [0, 0];
  for (let i = 0; i < 120; i++) { x = springStep(...x, 1, 1 / 60, 11); assert.ok(x[0] <= 1 + 1e-12); }
  near(springStep(1, 0, 1, 0.5, 11)[0], 1); // at rest on target stays there
});

test('deckScale', () => {
  near(deckScale(1440, 900), Math.min(1344 / 460, 740 / 642, 1.1));
  near(deckScale(390, 844), 390 * 0.76 / 460); // narrow: the iPhone 17 proportion
  near(deckScale(320, 568), 320 * 0.76 / 460);
  near(deckScale(402, 874), 306 / 460); // the iPhone 17 itself: both rules agree
});

test('progressFrom clamps to [0, n-1]', () => {
  near(progressFrom(1500, 1000, 2), 1);
  near(progressFrom(500, 1000, 2), 0.5);
  near(progressFrom(-20, 1000, 2), 0);
});


test('fanPose: a hand of cards, symmetric, the middle one upright', () => {
  const p = [0, 1, 2].map((i) => fanPose(i, 3, 0.5));
  near(p[1].x, 0); near(p[1].rz, 0); near(p[1].y, 0);
  near(p[0].x, -0.5); near(p[2].x, 0.5); near(p[0].rz, -p[2].rz); near(p[0].y, p[2].y);
  assert.ok(p[2].rz > 0 && p[2].y > 0);
});

test('fanLayout: every corner of the open fan stays on screen, from a 320px phone to a desktop', () => {
  for (const n of [3, 13]) for (const [vw, vh] of [[320, 568], [360, 640], [402, 874], [768, 1024], [1440, 900]]) {
    const { s, spread } = fanLayout(vw, vh, n);
    assert.ok(s > 0 && s <= deckScale(vw, vh), `${vw}: scale ${s}`);
    const W = 460 * s, H = 642 * s;
    for (let i = 0; i < n; i++) {
      const { x, rz } = fanPose(i, n, spread), a = rz * Math.PI / 180;
      // corners relative to the bottom-centre pivot, turned, then moved to the card's place in the fan
      for (const [cx, cy] of [[-W / 2, 0], [W / 2, 0], [-W / 2, -H], [W / 2, -H]]) {
        const px = vw / 2 + x * W + cx * Math.cos(a) - cy * Math.sin(a);
        assert.ok(px >= 0 && px <= vw, `${vw}: card ${i} corner at ${px.toFixed(1)}`);
      }
    }
  }
  assert.equal(fanLayout(1440, 900, 1).spread, 0);
  // a big hand (the Magic group) overlaps more instead of shrinking: still a usable size on a desktop
  const big = fanLayout(1440, 900, 13);
  assert.ok(big.spread < 0.62 && big.s > 0.5, JSON.stringify(big));
});
