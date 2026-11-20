import { IDENTITY, applyDrag, quatToCss, slerp, flipTarget } from './tcg.js';

const THRESHOLD = 6; // px before a press becomes a drag
const FRAME = 1000 / 60; // 16.7ms
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const on = () => root.classList.contains('tcg');

// CSS cubic-bezier(x1, y1, x2, y2) as t -> eased value, solved for x by bisection
function cubicBezier(x1, y1, x2, y2) {
  const b = (p1, p2, t) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;
  return (x) => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (b(x1, x2, t) < x) lo = t; else hi = t; }
    return b(y1, y2, t);
  };
}
const ease = cubicBezier(0.2, 0.7, 0.2, 1);

export function initCard(cardEl, flipBtn) {
  let q = IDENTITY;
  let anim = 0; // rAF id of the running inertia or flip
  let press = null; // { id, x, y, lastX, lastY, moved, samples }
  let dragged = false; // swallow the click that follows a drag

  function write() {
    cardEl.style.setProperty('--rot', quatToCss(q));
    // front normal (0,0,1) rotated by q
    const [x, y, z, w] = q;
    cardEl.style.setProperty('--sheen-x', (2 * (x * z + w * y)).toFixed(3));
    cardEl.style.setProperty('--sheen-y', (2 * (y * z - w * x)).toFixed(3));
  }
  const stop = () => { cancelAnimationFrame(anim); anim = 0; };

  cardEl.addEventListener('pointerdown', (e) => {
    if (!on() || press || (e.pointerType === 'mouse' && e.button !== 0)) return;
    stop();
    dragged = false;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, samples: [] };
  });

  cardEl.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    if (!press.moved) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < THRESHOLD) return;
      press.moved = dragged = true;
      cardEl.setPointerCapture(e.pointerId); // only now, so taps reach links normally
      cardEl.classList.add('dragging');
    }
    const dx = e.clientX - press.lastX, dy = e.clientY - press.lastY;
    press.lastX = e.clientX; press.lastY = e.clientY;
    q = applyDrag(q, dx, dy);
    write();
    const now = e.timeStamp;
    press.samples.push({ t: now, dx, dy });
    while (press.samples[0].t < now - 80) press.samples.shift();
  });

  function end(e, coast) {
    if (!press || e.pointerId !== press.id) return;
    const { moved, samples } = press;
    press = null;
    cardEl.classList.remove('dragging');
    if (!moved || !coast || reduced.matches) return;
    // release velocity in px/frame from the last 80ms; a pause before release leaves nothing
    const recent = samples.filter((s) => s.t >= e.timeStamp - 80);
    if (!recent.length) return;
    const span = Math.max(e.timeStamp - recent[0].t, FRAME);
    let vx = recent.reduce((a, s) => a + s.dx, 0) / span * FRAME;
    let vy = recent.reduce((a, s) => a + s.dy, 0) / span * FRAME;
    let last = performance.now();
    const step = (now) => {
      const frames = (now - last) / FRAME;
      last = now;
      q = applyDrag(q, vx * frames, vy * frames);
      write();
      const f = 0.94 ** frames;
      vx *= f; vy *= f;
      anim = Math.hypot(vx, vy) * 0.5 < 0.02 ? 0 : requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  cardEl.addEventListener('pointerup', (e) => end(e, true));
  cardEl.addEventListener('pointercancel', (e) => end(e, false));

  cardEl.addEventListener('click', (e) => {
    if (!dragged) return;
    dragged = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  flipBtn.addEventListener('click', () => {
    if (!on()) return;
    stop();
    const from = q, to = flipTarget(q);
    if (reduced.matches) { q = to; write(); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 500, 1);
      q = slerp(from, to, ease(t));
      write();
      anim = t < 1 ? requestAnimationFrame(step) : 0;
    };
    anim = requestAnimationFrame(step);
  });

  const KEYS = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }; // 15° at 0.5°/px
  cardEl.addEventListener('keydown', (e) => {
    if (!on() || e.target !== cardEl || !KEYS[e.key]) return;
    e.preventDefault();
    stop();
    q = applyDrag(q, ...KEYS[e.key]);
    write();
  });

  // mode switched off: stop loops and drop the rotation so the plain layout is untouched
  new MutationObserver(() => {
    if (on() || (!anim && !press && q === IDENTITY)) return;
    stop();
    press = null;
    q = IDENTITY;
    cardEl.classList.remove('dragging');
    for (const p of ['--rot', '--sheen-x', '--sheen-y']) cardEl.style.removeProperty(p);
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
}
