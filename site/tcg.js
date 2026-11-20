// Quaternions are [x, y, z, w]. CSS space: +x right, +y down, +z toward viewer.
export const CARD_W = 460;
export const CARD_H = 642;
export const IDENTITY = [0, 0, 0, 1];

export function loadTcg(storage, fineHover) {
  try {
    const v = storage.getItem('tcg');
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {}
  return fineHover;
}

export function saveTcg(storage, on) {
  try { storage.setItem('tcg', on ? '1' : '0'); } catch {}
}

export const fitScale = (vw, vh) => Math.min((vw - 32) / CARD_W, (vh - 120) / CARD_H, 1.25);

export function quatMul([ax, ay, az, aw], [bx, by, bz, bw]) {
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function quatNormalize(q) {
  const n = Math.hypot(...q);
  return n ? q.map((v) => v / n) : [0, 0, 0, 1];
}

export function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (dot < 0) { b = b.map((v) => -v); dot = -dot; } // shorter path
  if (dot > 0.9995) return quatNormalize(a.map((v, i) => v + (b[i] - v) * t));
  const theta = Math.acos(dot);
  const sin = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sin;
  const wb = Math.sin(t * theta) / sin;
  return a.map((v, i) => v * wa + b[i] * wb);
}

// Turn of hypot(dx,dy)*degPerPx degrees about axis (-dy, dx, 0): right drag = +Y turn, down drag = -X turn.
export function quatFromDrag(dx, dy, degPerPx = 0.5) {
  const len = Math.hypot(dx, dy);
  if (!len) return [0, 0, 0, 1];
  const half = (len * degPerPx * Math.PI) / 360;
  const s = Math.sin(half) / len;
  return [-dy * s, dx * s, 0, Math.cos(half)];
}

export const applyDrag = (q, dx, dy, degPerPx = 0.5) => quatNormalize(quatMul(quatFromDrag(dx, dy, degPerPx), q));

export function quatToCss(q) {
  const [x, y, z, w] = w_pos(quatNormalize(q));
  const s = Math.hypot(x, y, z);
  if (s < 1e-9) return 'rotate3d(0, 1, 0, 0deg)';
  const angle = 2 * Math.atan2(s, w) * (180 / Math.PI);
  const f = (v, d) => Number(v.toFixed(d)) + 0; // + 0 turns -0 into 0
  return `rotate3d(${f(x / s, 4)}, ${f(y / s, 4)}, ${f(z / s, 4)}, ${f(angle, 2)}deg)`;
}

const w_pos = (q) => (q[3] < 0 ? q.map((v) => -v) : q);

export const facingFront = ([x, y]) => 1 - 2 * (x * x + y * y) > 0;

export const flipTarget = (q) => (facingFront(q) ? [0, 1, 0, 0] : IDENTITY);
