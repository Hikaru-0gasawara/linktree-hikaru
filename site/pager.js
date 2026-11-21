// Plain mode turns one card per gesture. Keys and the scrollbar use the native snap (styles.css); a wheel tick, a short trackpad
// push or a short swipe would only nudge the page and snap back, so those are taken here: each goes to the next card that way.
//   stops  each card's (or group row's) top in the track, measured when a gesture starts
// A card taller than the screen scrolls natively until its edge; the next gesture then turns the page.

// where a gesture in `dir` goes from scroll `y`: the next stop that way, or null to leave it to the native scroll
export function pageTarget(stops, y, view, dir, max) {
  let i = 0;
  while (i + 1 < stops.length && stops[i + 1] <= y + 1) i++;
  const end = i + 1 < stops.length ? stops[i + 1] : max + view;
  if (dir > 0 && y + view < end - 1) return null; // still inside a tall card
  if (dir < 0 && y > stops[i] + 1) return null; // below a tall card's top
  const j = Math.min(Math.max(i + dir, 0), stops.length - 1);
  return stops[j];
}

export function initPager(track, reduced) {
  const root = document.documentElement;
  const targets = [...track.querySelectorAll('.deck-slot:not([data-group]) > .tcg-card > .face-front, .deck-slot[data-group]')];
  let last = 0, lockUntil = 0;
  const stopsNow = () => targets.map((el) => el.offsetTop); // layout offsets (the track is their offsetParent), not client rects:
  // a leaving card is scaled down (reveal.js)
  const go = (to, now) => {
    lockUntil = now + 600;
    track.scrollTo({ top: to, behavior: reduced.matches ? 'auto' : 'smooth' });
  };
  track.addEventListener('wheel', (e) => {
    if (root.classList.contains('tcg') || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const now = performance.now();
    if (now < lockUntil) { e.preventDefault(); last = now; return; } // gliding to a card: nothing interrupts it
    // one gesture = one burst of wheel events (a trackpad's glide keeps sending them): only its first event turns the page
    const fresh = now - last > 250;
    last = now;
    const y = track.scrollTop, view = track.clientHeight;
    const to = pageTarget(stopsNow(), y, view, Math.sign(e.deltaY), track.scrollHeight - view);
    if (to === null) return;
    e.preventDefault();
    if (fresh && to !== y) go(to, now);
  }, { passive: false });

  // a vertical swipe of 30px or more turns the page. The page does not follow the finger: a native drag would end in the snap
  // pulling it back to where it was, against this turn. A card taller than the screen, and a group's sideways row, pan natively.
  let from = null; // { x, y, top, to }: to is undefined until the swipe's direction is known, null when it pans natively
  track.addEventListener('touchstart', (e) => {
    from = !root.classList.contains('tcg') && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, top: track.scrollTop } : null;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (!from || e.touches.length !== 1) { from = null; return; }
    const t = e.touches[0], dy = from.y - t.clientY, dx = t.clientX - from.x;
    if (from.to === undefined) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
      if (Math.abs(dx) > Math.abs(dy)) { from = null; return; } // sideways: a group's row
      const view = track.clientHeight;
      from.to = pageTarget(stopsNow(), from.top, view, Math.sign(dy), track.scrollHeight - view);
    }
    if (from.to !== null && e.cancelable) e.preventDefault();
  }, { passive: false });
  track.addEventListener('touchend', (e) => {
    if (!from || e.touches.length) return;
    const t = e.changedTouches[0], dy = from.y - t.clientY, now = performance.now(), { to, top } = from;
    from = null;
    if (to == null || Math.abs(dy) < 30 || now < lockUntil || to === top) return;
    go(to, now);
  }, { passive: true });
}
