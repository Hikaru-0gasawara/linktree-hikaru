import { IDENTITY, facingFront, applyDrag, quatToCss, slerp, flipTarget, CARD_W } from './tcg.js';
import { progressFrom, poseFor, unwindWeight } from './deck.js';

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

export function initCard(cardEl) {
  const front = cardEl.querySelector('.face-front');
  let q = IDENTITY;
  let w = 0; // unwind weight: the shown orientation is q blended toward upright
  let anim = 0; // rAF id of the running inertia or flip
  let press = null; // { id, x, y, lastX, lastY, moved, samples }
  let dragged = false; // swallow the click that follows a drag

  function write() {
    const shown = w > 0 ? slerp(q, IDENTITY, w) : q;
    cardEl.style.setProperty('--rot', quatToCss(shown));
    front.inert = !facingFront(shown);
    // front normal (0,0,1) rotated by the shown orientation
    const [x, y, z, r] = shown;
    cardEl.style.setProperty('--sheen-x', (2 * (x * z + r * y)).toFixed(3));
    cardEl.style.setProperty('--sheen-y', (2 * (y * z - r * x)).toFixed(3));
  }
  const stop = () => { cancelAnimationFrame(anim); anim = 0; };

  cardEl.addEventListener('pointerdown', (e) => {
    // touch rotates only in focus mode (html.deck-focus); in browse a swipe leafs the deck
    if (!on() || press || (e.pointerType === 'mouse' && e.button !== 0) || (e.pointerType === 'touch' && !root.classList.contains('deck-focus'))) return;
    stop();
    dragged = false;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, samples: [] };
  });

  // move/up/cancel on window: a flick can leave the card before the 6px capture starts
  addEventListener('pointermove', (e) => {
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
    // the click that follows this pointerup is dispatched before the timer; after that the guard is off
    if (moved) setTimeout(() => { dragged = false; });
    if (!coast) dragged = false;
    if (!moved || !coast || reduced.matches) return;
    // release velocity in px/frame from the last 80ms; a pause before release leaves nothing
    const recent = samples.filter((s) => s.t >= e.timeStamp - 80);
    if (!recent.length) return;
    const span = Math.max(e.timeStamp - recent[0].t, FRAME);
    let vx = recent.reduce((a, s) => a + s.dx, 0) / span * FRAME;
    let vy = recent.reduce((a, s) => a + s.dy, 0) / span * FRAME;
    let last = performance.now();
    const step = (now) => {
      const frames = Math.min(Math.max((now - last) / FRAME, 0), 4);
      last = now;
      q = applyDrag(q, vx * frames, vy * frames);
      write();
      const f = 0.94 ** frames;
      vx *= f; vy *= f;
      anim = Math.hypot(vx, vy) * 0.5 < 0.02 ? 0 : requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  addEventListener('pointerup', (e) => end(e, true));
  addEventListener('pointercancel', (e) => end(e, false));

  // a native link/image drag would cancel the pointer and stop the rotation
  cardEl.addEventListener('dragstart', (e) => { if (on()) e.preventDefault(); });

  cardEl.addEventListener('click', (e) => {
    if (!on() || !dragged) return;
    dragged = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  function turnTo(to) {
    if (!on()) return;
    stop();
    const from = q;
    if (reduced.matches) { q = to; write(); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 500, 1);
      q = slerp(from, to, ease(t));
      write();
      anim = t < 1 ? requestAnimationFrame(step) : 0;
    };
    anim = requestAnimationFrame(step);
  }

  const KEYS = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }; // 15° at 0.5°/px
  cardEl.addEventListener('keydown', (e) => {
    if (!on() || e.target !== cardEl || !KEYS[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    stop();
    q = applyDrag(q, ...KEYS[e.key]);
    write();
  });

  // mode switched off: stop loops and drop the rotation so the plain layout is untouched
  new MutationObserver(() => {
    if (on()) return;
    stop();
    press = null;
    dragged = false;
    q = IDENTITY;
    w = 0;
    front.inert = false;
    cardEl.classList.remove('dragging');
    for (const p of ['--rot', '--sheen-x', '--sheen-y']) cardEl.style.removeProperty(p);
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  return {
    flip: () => turnTo(flipTarget(q)),
    reset: () => turnTo(IDENTITY),
    // off-centre the card shows its rotation blended away; once fully off-centre it forgets it
    unwind(weight) {
      if (weight === w) return; // idle cards: nothing to rewrite
      w = weight;
      if (w >= 1) {
        stop();
        press = null;
        cardEl.classList.remove('dragging');
        q = IDENTITY;
      }
      write();
    },
    isBusy: () => anim !== 0 || !!press?.moved,
  };
}

// inert also drops pointer events (CSS: .deck-slot[inert])
export const setInteractive = (el, yes) => { el.closest('.deck-slot').inert = !yes; };

const PAGE = { ArrowLeft: -1, ArrowRight: 1, PageUp: -1, PageDown: 1, Home: -Infinity, End: Infinity };

// card mode: the track's native scroll (snap, one stop per card) is the deck's only clock
export function initDeck(track) {
  const slots = [...track.querySelectorAll('.deck-slot')];
  const n = slots.length;
  const controllers = slots.map((s) => initCard(s.querySelector('.tcg-card')));
  const coarse = matchMedia('(pointer: coarse)'); // touch leafs sideways; mouse and trackpad scroll down
  let cur = -1, raf = 0, locked = false, wasOn = null;
  const deck = track.querySelector('.deck');
  // snap stops: an empty one at 0 (the sticky stage cannot snap: its position moves with the scroll), then one per further card,
  // each half the track (CSS), so a short wheel or swipe leafs one card
  const stop = () => Object.assign(document.createElement('div'), { className: 'deck-stop' });
  track.prepend(stop());
  for (let i = 1; i < n; i++) track.append(stop());
  const stopSize = () => (coarse.matches ? track.clientWidth : track.clientHeight) / 2;

  function update() {
    raf = 0;
    const size = stopSize();
    if (!on() || size <= 0) return; // hidden or not laid out yet
    let p = progressFrom(coarse.matches ? track.scrollLeft : track.scrollTop, size, n);
    if (Math.abs(p - Math.round(p)) < 1e-3) p = Math.round(p); // sub-pixel snap offsets count as the stop
    slots.forEach((slot, i) => {
      const { x, y, s, rz, ry, shade, z, opacity } = poseFor(i, p, reduced.matches);
      slot.style.transform = `translate3d(${x * CARD_W}px, ${y * CARD_W}px, 0) rotateZ(${rz}deg) rotateY(${ry}deg) scale(${s})`;
      slot.style.zIndex = z;
      slot.style.opacity = opacity;
      slot.style.setProperty('--shade', shade);
      controllers[i].unwind(unwindWeight(i, p));
    });
    if (Math.round(p) !== cur) {
      // focus inside the card that is going inert moves to the new current card's wrapper
      const handOff = slots[cur]?.contains(document.activeElement);
      const first = cur < 0;
      cur = Math.round(p);
      slots.forEach((slot, i) => setInteractive(slot, i === cur));
      if (handOff) slots[cur].querySelector('.tcg-card').focus({ preventScroll: true });
      // reduced motion: no turn, the new arrangement fades in instead
      if (!first && reduced.matches) deck.animate({ opacity: [0, 1] }, { duration: 150, easing: 'ease-out' });
    }
  }
  const schedule = () => { raf ||= requestAnimationFrame(update); };
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);

  // mode switch: start at card 1 with a fresh p; off, the plain page gets its slots back untouched
  const sync = () => {
    if (on() === wasOn) return;
    wasOn = on();
    locked = false; // a focus-mode lock never outlives the mode
    track.style.overflow = '';
    track.scrollTo(0, 0);
    cur = -1;
    if (wasOn) schedule();
    else for (const slot of slots) { slot.inert = false; slot.removeAttribute('style'); }
  };
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  sync();

  addEventListener('keydown', (e) => {
    // defaultPrevented: a focused card wrapper already used the arrow to rotate
    if (!on() || locked || cur < 0 || e.defaultPrevented || !(e.key in PAGE) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    const to = Math.min(Math.max(cur + PAGE[e.key], 0), n - 1) * stopSize();
    track.scrollTo({ [coarse.matches ? 'left' : 'top']: to, behavior: 'smooth' });
  });

  return {
    current: () => cur,
    controllers,
    // focus mode: no paging; overflow hidden keeps the snap position
    lockPaging(yes) { locked = yes; track.style.overflow = yes ? 'hidden' : ''; },
  };
}
