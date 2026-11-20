// Deck pose math: each card's pose is a pure function of progress p.
export const deckScale = (vw, vh) => Math.min((vw - 96) / 460, (vh - 160) / 642, 1.1);

export const progressFrom = (scroll, stop, n) => Math.min(Math.max(scroll / stop, 0), n - 1);

// x, y in card widths; rz in degrees; d = i - p (negative: passed, to the left; positive: still in the pile, face up beneath).
// Leafing: the top card arcs left onto the passed stack while the one beneath swings out right from under it and comes to
// the centre; the rest of the pile moves up one place.
export function poseFor(i, p, reduced = false) {
  const d = i - p;
  let x, y, s, rz, shade, opacity = 1;
  if (d === 0) {
    [x, y, s, rz, shade] = [0, 0, 1, 0, 0];
  } else if (d >= -1 && d < 0) {
    const u = -d;
    x = -0.62 * u; y = -0.04 * Math.sin(Math.PI * u); s = 1 - 0.14 * u; rz = -6 * u; shade = 0.35 * u;
  } else if (d < -1) {
    const k = -d - 1;
    x = -0.62 - 0.035 * k; y = 0.012 * k; s = 0.86 - 0.02 * k; rz = -6 - 1.5 * k;
    shade = Math.min(0.35 + 0.1 * k, 0.6);
    if (k > 2) opacity = 0;
  } else if (d <= 1) {
    const swing = Math.sin(Math.PI * d); // out from under the leaving card, then back to the centre
    x = 0.09 * d + 0.34 * swing; y = 0.03 * d; s = 1 - 0.04 * d; rz = 1.5 * d + 4 * swing; shade = 0.25 * d;
  } else {
    const k = d - 1;
    x = 0.09 + 0.035 * k; y = 0.03 + 0.015 * k; s = 0.96 - 0.02 * k; rz = 1.5 + 1.5 * k;
    shade = Math.min(0.25 + 0.1 * k, 0.55);
    if (k > 3) opacity = 0;
  }
  if (reduced) { y = 0; rz = 0; if (d > 0 && d <= 1) x = 0.09 * d; }
  return { x, y, s, rz, shade, z: 100 - Math.round(Math.abs(d) * 10), opacity };
}

// Critically damped spring toward target, exact for any dt: returns [position, velocity].
export function springStep(pos, vel, target, dt, omega) {
  const e = pos - target, k = Math.exp(-omega * dt), c = vel + omega * e;
  return [target + (e + c * dt) * k, (vel - omega * c * dt) * k];
}
