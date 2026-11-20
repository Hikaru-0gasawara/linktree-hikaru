import { IDENTITY, facingFront, applyDrag, quatToCss, slerp, flipTarget, CARD_W } from './tcg.js';
import { progressFrom, poseFor, springStep } from './deck.js';

const THRESHOLD = 6; // px before a press becomes a drag
const FRAME = 1000 / 60; // 16.7ms
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const on = () => root.classList.contains('tcg');
const focusMode = () => root.classList.contains('deck-focus');

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
  const sheen = front.querySelector('.sheen');
  let q = IDENTITY;
  let anim = 0; // rAF id of the running inertia or flip
  let press = null; // { id, x, y, lastX, lastY, moved, samples }
  let dragged = false; // swallow the click that follows a drag

  function write() {
    cardEl.style.setProperty('--rot', quatToCss(q));
    front.inert = !facingFront(q);
    // front normal (0,0,1) rotated by the orientation; on the sheen itself, so only it restyles
    const [x, y, z, r] = q;
    sheen?.style.setProperty('--sheen-x', (2 * (x * z + r * y)).toFixed(3));
    sheen?.style.setProperty('--sheen-y', (2 * (y * z - r * x)).toFixed(3));
  }
  const stop = () => { cancelAnimationFrame(anim); anim = 0; };

  cardEl.addEventListener('pointerdown', (e) => {
    // only a focused card rotates; in browse the deck is a carousel (a swipe or wheel leafs it)
    if (!on() || !focusMode() || press || (e.pointerType === 'mouse' && e.button !== 0)) return;
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
    if (!on() || !focusMode() || e.target !== cardEl || !KEYS[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
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
    front.inert = false;
    cardEl.classList.remove('dragging');
    cardEl.style.removeProperty('--rot');
    for (const p of ['--sheen-x', '--sheen-y']) sheen?.style.removeProperty(p);
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  return {
    flip: () => turnTo(flipTarget(q)),
    reset: () => turnTo(IDENTITY),
    turnTo,
  };
}

// inert also drops pointer events (CSS: .deck-slot[inert])
export const setInteractive = (el, yes) => { el.closest('.deck-slot').inert = !yes; };

const OMEGA = 11; // spring stiffness (1/s): critically damped, a leaf settles in about half a second
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const PAGE = { ArrowLeft: -1, ArrowRight: 1, PageUp: -1, PageDown: 1, Home: -Infinity, End: Infinity };

// card mode: the track's native scroll (snap, one stop per card) sets the target; the shown progress follows it on a spring,
// so even a quick snap plays the whole leaf and a new scroll redirects it mid-flight
export function initDeck(track) {
  const slots = [...track.querySelectorAll('.deck-slot')];
  const n = slots.length;
  // one controller per card; a group slot (several cards) answers as one, so the deck's face turns the whole pack
  const cards = slots.map((s) => [...s.querySelectorAll('.tcg-card')].map(initCard));
  const controllers = cards.map((cs) => (cs.length === 1 ? cs[0] : {
    flip: () => cs.forEach((c) => c.flip()),
    reset: () => cs.forEach((c) => c.reset()),
    turnTo: (q) => cs.forEach((c) => c.turnTo(q)),
  }));
  const coarse = matchMedia('(pointer: coarse)'); // touch leafs sideways; mouse and trackpad scroll down
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let cur = -1, raf = 0, locked = false, wasOn = null;
  let drag = null; // a mouse or pen press on the stage that may become a leaf: { id, x, p0, per, moved, samples }
  let target = 0, shown = 0, vel = 0, last = 0;
  const deck = track.querySelector('.deck');
  // each slot's shade (a card deeper in the pile is darker), an element of its own so the pose sets its opacity directly
  const shades = slots.map((slot) => slot.appendChild(Object.assign(document.createElement('div'), { className: 'deck-shade' })));
  // snap stops: an empty one at 0 (the sticky stage cannot snap: its position moves with the scroll), then one per further card,
  // each half the track (CSS), so a short wheel or swipe leafs one card
  const stop = () => Object.assign(document.createElement('div'), { className: 'deck-stop' });
  track.prepend(stop());
  for (let i = 1; i < n; i++) track.append(stop());
  const stopSize = () => (coarse.matches ? track.clientWidth : track.clientHeight) / 2;

  function update(now) {
    raf = 0;
    const size = stopSize();
    if (!on() || size <= 0) return; // hidden or not laid out yet
    target = progressFrom(coarse.matches ? track.scrollLeft : track.scrollTop, size, n);
    if (Math.abs(target - Math.round(target)) < 1e-3) target = Math.round(target); // sub-pixel snap offsets count as the stop
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    // a drag holds the deck to the pointer; otherwise the spring follows (reduced motion too: the leaf still slides,
    // poseFor drops the swing and tilt)
    if (drag?.moved || cur < 0) [shown, vel] = [target, drag?.moved ? vel : 0];
    else [shown, vel] = springStep(shown, vel, target, dt, OMEGA);
    if (Math.abs(shown - target) < 1e-4 && Math.abs(vel) < 1e-3) [shown, vel] = [target, 0];
    last = shown === target ? 0 : now;
    if (last) raf = requestAnimationFrame(update);
    const p = shown;
    slots.forEach((slot, i) => {
      const { x, y, s, rz, shade, z, opacity } = poseFor(i, p, reduced.matches);
      slot.style.transform = `translate3d(${x * CARD_W}px, ${y * CARD_W}px, 0) rotateZ(${rz}deg) scale(${s})`;
      slot.style.zIndex = z;
      slot.style.opacity = opacity;
      slot.style.visibility = opacity ? '' : 'hidden'; // a card deep in the pile is not painted at all
      shades[i].style.opacity = shade;
    });
    if (Math.round(p) !== cur) {
      if (cur >= 0) tiltOff(slots[cur]);
      // focus inside the card that is going inert moves to the new card: wrapper to wrapper, otherwise to its first
      // link or button, which does not consume arrows, so ←/→ keep paging
      const was = document.activeElement;
      const handOff = slots[cur]?.contains(was);
      cur = Math.round(p);
      slots.forEach((slot, i) => setInteractive(slot, i === cur));
      if (handOff) {
        const card = slots[cur].querySelector('.tcg-card');
        const to = was.classList.contains('tcg-card') ? card : card.querySelector('.face-front :is(a, button)') ?? card;
        to.focus({ preventScroll: true });
      }
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
    target = shown = vel = last = 0;
    if (wasOn) schedule();
    else for (const slot of slots) { slot.inert = false; slot.removeAttribute('style'); }
  };
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  sync();

  // the spring animates every page turn, so the scroll itself jumps
  const scrollToStop = (k) => track.scrollTo({ [coarse.matches ? 'left' : 'top']: clamp(k, 0, n - 1) * stopSize() });
  addEventListener('keydown', (e) => {
    // defaultPrevented: a focused card wrapper already used the arrow to rotate
    if (!on() || locked || cur < 0 || e.defaultPrevented || !(e.key in PAGE) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    scrollToStop(Math.round(target) + PAGE[e.key]);
  });

  // mouse and pen: a sideways drag anywhere on the stage leafs like a swipe; the deck holds to the pointer, and on release
  // the spring carries the drag's speed to the nearest card (a flick reaches the next one). Touch scrolls the track natively.
  track.addEventListener('pointerdown', (e) => {
    if (!on() || locked || drag || e.pointerType === 'touch' || e.button !== 0 || e.target.closest('button')) return;
    drag = { id: e.pointerId, x: e.clientX, p0: target, per: deck.getBoundingClientRect().width * 0.62, moved: false, samples: [] };
  });
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < THRESHOLD) return;
      drag.moved = true;
      track.setPointerCapture(e.pointerId); // only now, so a click still reaches links and the card
      track.style.scrollSnapType = 'none';
      root.classList.add('leafing');
      if (cur >= 0) tiltOff(slots[cur]);
    }
    drag.samples.push({ t: e.timeStamp, x: e.clientX });
    while (drag.samples[0].t < e.timeStamp - 100) drag.samples.shift();
    track[coarse.matches ? 'scrollLeft' : 'scrollTop'] = clamp(drag.p0 - dx / drag.per, 0, n - 1) * stopSize();
  });
  let swallow = false; // the click that ends a leaf is not a click on the card
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, samples, per } = drag;
    drag = null;
    if (!moved) return;
    root.classList.remove('leafing');
    track.style.scrollSnapType = '';
    const s0 = samples[0], span = (e.timeStamp - s0.t) / 1000;
    vel = span > 0.01 ? -(e.clientX - s0.x) / per / span : 0; // cards per second, handed to the spring
    scrollToStop(Math.round(target + clamp(vel * 0.25, -0.5, 0.5)));
    schedule();
    swallow = true;
    setTimeout(() => { swallow = false; });
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  track.addEventListener('click', (e) => { if (swallow) { e.preventDefault(); e.stopPropagation(); } }, true);

  // trackpad: a sideways two-finger swipe pages once per gesture (its momentum tail keeps the lock)
  let acc = 0, wheelLock = 0;
  track.addEventListener('wheel', (e) => {
    if (!on() || locked || coarse.matches || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (e.timeStamp < wheelLock) { wheelLock = e.timeStamp + 200; return; }
    acc += e.deltaX;
    if (Math.abs(acc) > 40) { scrollToStop(Math.round(target) + Math.sign(acc)); acc = 0; wheelLock = e.timeStamp + 200; }
  }, { passive: false });

  // hover tilt (fine pointer, browse, full motion): the current card leans toward the cursor and its sheen follows
  let tilt = [0, 0], aim = [0, 0], tiltRaf = 0;
  function tiltOff(slot) {
    tilt = aim = [0, 0];
    cancelAnimationFrame(tiltRaf); tiltRaf = 0;
    for (const card of slot.querySelectorAll('.tcg-card')) card.style.removeProperty('--tilt');
    for (const sh of slot.querySelectorAll('.sheen')) for (const v of ['--tilt-x', '--tilt-y']) sh.style.removeProperty(v);
  }
  function tiltStep() {
    tiltRaf = 0;
    if (cur < 0) return;
    tilt = tilt.map((t, i) => t + (aim[i] - t) * 0.18);
    const [x, y] = tilt;
    for (const card of slots[cur].querySelectorAll('.tcg-card')) { // a group's pack leans together
      card.style.setProperty('--tilt', `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`);
      const sh = card.querySelector('.sheen');
      sh?.style.setProperty('--tilt-x', (x * 0.35).toFixed(3));
      sh?.style.setProperty('--tilt-y', (y * 0.35).toFixed(3));
    }
    if (Math.hypot(aim[0] - x, aim[1] - y) > 1e-3) tiltRaf = requestAnimationFrame(tiltStep);
    else if (!aim[0] && !aim[1]) tiltOff(slots[cur]);
  }
  const aimAt = (a) => { aim = a; tiltRaf ||= requestAnimationFrame(tiltStep); };
  track.addEventListener('pointermove', (e) => {
    if (!on() || locked || drag?.moved || cur < 0 || e.pointerType !== 'mouse' || !fine.matches || reduced.matches) return;
    const r = slots[cur].querySelector('.tcg-card').getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    aimAt(inside ? [clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1), clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1)] : [0, 0]);
  });
  track.addEventListener('pointerleave', () => { if (cur >= 0) aimAt([0, 0]); });

  return {
    current: () => cur,
    slots,
    controllers,
    cards, // per slot, one controller per card
    // focus mode: no paging; overflow hidden keeps the snap position
    lockPaging(yes) {
      if (yes && cur >= 0) tiltOff(slots[cur]);
      // settle on the current stop first, so a tap during a snap never locks between cards
      if (yes) scrollToStop(Math.round(shown));
      locked = yes; track.style.overflow = yes ? 'hidden' : '';
    },
  };
}
