// Plain mode scroll motion, in every browser: the scroll position sets CSS variables, styles.css turns them into motion.
//   --in  on each block of a card after the first: 0 below the fold, 1 once it has fully entered (it rises into place)
//   --cin on each card after the first: 0..1 over its first 60% of a screen (the card is laid down straight)
//   --out on each card: 0..1 as it scrolls out of the top (it settles back under the next)
//   --par on each art window: -1..1 from the bottom of the screen to the top (its image drifts, a slow parallax)
// A project card (.proj) is not driven by the scroll: the page moves one card per scroll (styles.css snaps it) and the card
// assembles on its own each time it arrives (class .assemble, styles.css), blank until then; it resets once fully off screen.
// Hikaru's card replays its entrance the same way, from either direction. Arrival is read from the layout, not from an
// IntersectionObserver: a card settling under the next one must still count as gone.
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOut = (t) => 1 - (1 - t) ** 3;

export const enterAt = (top, h, view) => easeOut(clamp01((view - top) / Math.max(Math.min(h, view / 2), 1)));
export const leaveAt = (top, h) => clamp01(-top / Math.max(h, 1));
export const driftAt = (top, h, view) => Math.min(Math.max((top + h / 2 - view / 2) / (view / 2), -1), 1);
// the share of a card's height inside the screen
export const shownAt = (top, h, view) => clamp01((Math.min(top + h, view) - Math.max(top, 0)) / Math.max(h, 1));
// a card arrives once a fifth of it is on screen and is gone once none of it is; in between it keeps its state
export const arrival = (away, shown) => (shown <= 0 ? true : shown >= 0.2 ? false : away);

export function initReveal(track) {
  const root = document.documentElement;
  const cards = [...track.querySelectorAll('.card.face-front')];
  // the cards that play an arrival animation: Hikaru's (its entrance) and the projects (their assembly)
  const arrivers = cards.filter((card) => card.classList.contains('proj') || card.closest('.deck-slot')?.dataset.card === 'hikaru');
  const away = new Map(arrivers.map((card) => [card, card.classList.contains('proj')])); // Hikaru's card enters at load
  const arrive = (card) => {
    if (card.classList.contains('proj')) { card.classList.add('assemble'); return; }
    root.classList.remove('switched'); // back on Hikaru's card, its name and icons come in again too
    for (const a of card.getAnimations({ subtree: true })) { a.cancel(); a.play(); }
  };
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
      writes.push([card, '--out', leaveAt(top, card.offsetHeight)]);
      if (away.has(card)) {
        const was = away.get(card), now = arrival(was, shownAt(top, card.offsetHeight, view));
        if (now !== was) {
          away.set(card, now);
          if (!now) arrive(card);
          else card.classList.remove('assemble');
        }
      }
      // a lazy image off to the side of a group's row only loads once scrolled into the row: load it as its card comes near
      if (i > 0 && top < view * 1.5) for (const img of card.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
      if (i > 0 && !card.classList.contains('proj')) {
        writes.push([card, '--cin', clamp01((view - top) / (view * 0.6))]);
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
  schedule();

  // back from card mode, every project assembles again as it arrives; Hikaru's card stays as it is (a mode switch is no arrival)
  let tcg = root.classList.contains('tcg');
  new MutationObserver(() => {
    schedule();
    if (tcg === root.classList.contains('tcg')) return;
    tcg = !tcg;
    if (!tcg) for (const card of arrivers) if (card.classList.contains('proj')) { card.classList.remove('assemble'); away.set(card, true); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
}
