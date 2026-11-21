// Plain mode scroll motion, in every browser: the scroll position sets CSS variables, styles.css turns them into motion.
//   --in  on each block of a card after the first: 0 below the fold, 1 once it has fully entered (it rises into place)
//   --cin on each card after the first: 0..1 over its first 60% of a screen (the card is laid down straight)
//   --out on each card: 0..1 as it scrolls out of the top (it settles back under the next)
//   --par on each art window: -1..1 from the bottom of the screen to the top (its image drifts, a slow parallax)
// A project card (.proj) is not driven by the scroll: the page moves one card per scroll (styles.css snaps it) and the card
// assembles on its own each time it arrives (class .assemble, styles.css), blank until then; it resets once fully off screen.
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOut = (t) => 1 - (1 - t) ** 3;

export const enterAt = (top, h, view) => easeOut(clamp01((view - top) / Math.max(Math.min(h, view / 2), 1)));
export const leaveAt = (top, h) => clamp01(-top / Math.max(h, 1));
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
      writes.push([card, '--out', leaveAt(top, card.offsetHeight)]);
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

  // project cards: assemble once a fifth of the card is on screen (while the page is still gliding to it), reset once it is gone
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.intersectionRatio >= 0.2) e.target.classList.add('assemble');
      else if (!e.isIntersecting) e.target.classList.remove('assemble');
    }
  }, { root: track, threshold: [0, 0.2] });
  const projects = cards.filter((card) => card.classList.contains('proj'));
  for (const card of projects) io.observe(card);
  // back from card mode, every project assembles again as it arrives (observing anew reports where each one is now)
  let tcg = root.classList.contains('tcg');
  new MutationObserver(() => {
    schedule();
    if (tcg === root.classList.contains('tcg')) return;
    tcg = !tcg;
    if (!tcg) for (const card of projects) { card.classList.remove('assemble'); io.unobserve(card); io.observe(card); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
}
