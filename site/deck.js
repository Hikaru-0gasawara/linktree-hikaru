// Deck pose math: each card's pose is a pure function of progress p.
export const deckScale = (vw, vh) => Math.min((vw - 96) / 460, (vh - 160) / 642, 1.1);

export const progressFrom = (scroll, stop, n) => Math.min(Math.max(scroll / stop, 0), n - 1);

export const unwindWeight = (i, p) => Math.min(Math.abs(i - p), 1);

// x, y in card widths; rz/ry in degrees; d = i - p (negative: leaving left, positive: still in the pile)
export function poseFor(i, p, reduced = false) {
  const d = i - p;
  let x, y, s, rz, ry, shade, opacity = 1;
  if (d === 0) {
    [x, y, s, rz, ry, shade] = [0, 0, 1, 0, 0, 0];
  } else if (d >= -1 && d < 0) {
    const u = -d;
    x = -0.62 * u; y = -0.04 * Math.sin(Math.PI * u); s = 1 - 0.14 * u; rz = -6 * u; ry = 0; shade = 0.35 * u;
  } else if (d < -1) {
    const k = -d - 1;
    x = -0.62 - 0.035 * k; y = 0.012 * k; s = 0.86 - 0.02 * k; rz = -6 - 1.5 * k; ry = 0;
    shade = Math.min(0.35 + 0.1 * k, 0.6);
    if (k > 2) opacity = 0;
  } else if (d <= 1) {
    x = 0.58 * d; y = 0.02 * d; s = 1 - 0.14 * d; rz = 0; ry = 180 * d; shade = 0.2 * d;
  } else {
    const k = d - 1;
    x = 0.58 + 0.03 * k; y = 0.02 + 0.015 * k; s = 0.86 - 0.02 * k; rz = 0; ry = 180;
    shade = Math.min(0.2 + 0.08 * k, 0.5);
    if (k > 3) opacity = 0;
  }
  if (reduced) { y = 0; rz = 0; ry = d > 0.5 ? 180 : 0; }
  return { x, y, s, rz, ry, shade, z: 100 - Math.round(Math.abs(d) * 10), opacity };
}
