// Plain mode scroll motion, in every browser: the scroll position sets CSS variables, styles.css turns them into motion.
//   --in  on each block of a card after the first: 0 below the fold, 1 once it has fully entered (it rises into place)
//   --cin on each card after the first: 0..1 over its first 60% of a screen (the card is laid down straight)
//   --out on each card: 0..1 as it scrolls out of the top (it settles back under the next)
//   --par on each art window: -1..1 from the bottom of the screen to the top (its image drifts, a slow parallax)
// A project card (.proj) instead assembles: styles.css holds it in place (sticky) over an extra half screen of scroll, and its blocks
// read one progress, how near the card is to filling the screen and how far into that hold, each block over its own window of
// it, so the parts land one after another; the last lands halfway through the hold. From above, it is whole as it arrives.
// styles.css gives each project its own way in.
//   --in  on each block: its window of that progress; --pin on the panel: its labels and values, after the box has landed
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOut = (t) => 1 - (1 - t) ** 3;

export const enterAt = (top, h, view) => easeOut(clamp01((view - top) / Math.max(Math.min(h, view / 2), 1)));
export const leaveAt = (top, h) => clamp01(-top / Math.max(h, 1));
// top: where the card's place starts; pin: how long it is held. From below: 0 while that place is 83% of a screen away, 1 once
// half the hold has been scrolled. From above: 1 while any of the hold is left, 0 once it is 83% of a screen past the screen.
export const focusAt = (top, h, view, pin = 0) => {
  const below = top + pin / 2;
  const d = below > 0 ? below : Math.max(0, view - (top + pin + h));
  const x = 1 - clamp01((d - view * 0.03) / (view * 0.8 + (below > 0 ? pin / 2 : 0)));
  return x * x * (3 - 2 * x);
};
export const windowed = (p, [a, b]) => clamp01((p - a) / (b - a));
// each block's window, in reading order: the image first, the foot last
const WINDOWS = { art: [0, 0.6], name: [0.05, 0.8], role: [0.22, 0.58], desc: [0.3, 0.66], panel: [0.38, 0.62], links: [0.58, 0.88], foot: [0.7, 1] };
const PIECES = [0.5, 1];
const windowOf = (el) => WINDOWS[Object.keys(WINDOWS).find((k) => el.classList.contains(k))] ?? [0, 1];
export const driftAt = (top, h, view) => Math.min(Math.max((top + h / 2 - view / 2) / (view / 2), -1), 1);

export function initReveal(track) {
  const root = document.documentElement;
  const cards = [...track.querySelectorAll('.card.face-front')];
  let raf = 0;
  function update() {
    raf = 0;
    if (root.classList.contains('tcg')) return;
    // layout offsets, not client rects: the motion's own transforms must not feed back into it.
    // The track is the cards' offsetParent (position: fixed), each card its blocks' (position: relative).
    const view = track.clientHeight, y = track.scrollTop;
    const writes = [];
    cards.forEach((card, i) => {
      const top = card.offsetTop - y;
      if (card.classList.contains('proj')) {
        // its place is the holder (.pin) around it: the card itself moves while held
        const box = card.parentElement, h = card.offsetHeight;
        const p = focusAt(box.offsetTop - y, h, view, box.offsetHeight - h);
        if (top < view * 1.5) for (const img of card.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
        for (const el of card.children) {
          if (el.classList.contains('sheen')) continue;
          writes.push([el, '--in', windowed(p, windowOf(el))]);
          if (el.classList.contains('panel')) writes.push([el, '--pin', windowed(p, PIECES)]);
        }
      } else writes.push([card, '--out', leaveAt(top, card.offsetHeight)]);
      if (i > 0 && !card.classList.contains('proj')) {
        writes.push([card, '--cin', clamp01((view - top) / (view * 0.6))]);
        // a lazy image off to the side of a group's row only loads once scrolled into the row: load it as its card comes near
        if (top < view * 1.5) for (const img of card.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
        for (const el of card.children) {
          if (el.classList.contains('sheen')) continue;
          writes.push([el, '--in', enterAt(top + el.offsetTop, el.offsetHeight, view)]);
        }
      }
      for (const art of card.querySelectorAll('.art')) writes.push([art, '--par', driftAt(top + art.offsetTop, art.offsetHeight, view)]);
    });
    // only what changed: an unchanged custom property would still restyle the element and whatever inherits it
    for (const [el, k, v] of writes) { const t = v.toFixed(3); if (el.style.getPropertyValue(k) !== t) el.style.setProperty(k, t); }
  }
  const schedule = () => { raf ||= requestAnimationFrame(update); };
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['class'] });
  schedule();
}
