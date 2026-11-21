// Plain mode on a wide screen (styles.css shows these from 1040px): the empty sides beside the card column.
//   .rail   the deck's index beside the card: one button per card, the current one lit, a line filling with the scroll
//   .drift  small bits from the projects floating in three depths at the outer edges, moving with the scroll at different speeds
// One scroll handler, one frame: a translate per drift layer and the rail's fill; the current card only when it changes.
import { STRINGS } from './i18n.js';

const BITS = ['光', 'pH 7.40', 'ORP 700', '0x27', 'MQTT', 'ΔT ≥ 5°', '</>', 'git push', '[**__]', 'ESP32', 'SELECT *', '200 OK',
  '1UP', 'WASD', ':wq', 'Tp 28.0°', '01001000', 'ping 3ms', 'GG', '日本語', 'TLS', '♥♥♥', 'ssh', '127.0.0.1', '{ }', '>_'];
const DEPTHS = [{ speed: 0.12, n: 4 }, { speed: 0.26, n: 4 }, { speed: 0.45, n: 3 }];

// deterministic scatter (mulberry32), so a side looks the same on every visit: one list per depth, each bit used once per side,
// one bit per row band of its depth (the depths' bands offset), so the bits never pile up
export function scatter(seed, counts) {
  let t = seed >>> 0;
  const rnd = () => { t = (t + 0x6d2b79f5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  const pool = [...BITS];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return counts.map((n, depth) => Array.from({ length: n }, (_, i) => ({
    x: rnd(), y: ((i + (depth + 0.5) / counts.length) / n) % 1, bit: pool.pop(), tone: Math.floor(rnd() * 5),
  })));
}

// the deck's offset for a layer moving at `speed` of the scroll, wrapped to the band height
export const driftY = (scroll, speed, h) => (h > 0 ? -((scroll * speed) % h) : 0);

// a project card by its title; the Magic cards as Hikaru's and the groups by their place among the groups
const railName = (slot, s, groups) => {
  const key = slot.querySelector('h2.name[data-i18n]')?.dataset.i18n;
  if (key) return s[key];
  if (slot.dataset.card === 'hikaru') return 'Hikaru';
  return groups.includes(slot) ? s.railGroup.replace('{n}', groups.indexOf(slot) + 1) : s.railMtg;
};

export function initGutter(track, rail, drift, reduced) {
  const root = document.documentElement;
  const slots = [...track.querySelectorAll('.deck-slot')];
  const cards = slots.map((sl) => sl.querySelector('.card'));

  // rail: list, and beside it a line with its fill and the marker at the current card; the scroll hint under them
  const body = Object.assign(document.createElement('div'), { className: 'rail-body' });
  const list = document.createElement('ol');
  const fill = Object.assign(document.createElement('span'), { className: 'rail-fill' });
  const mark = Object.assign(document.createElement('span'), { className: 'rail-mark' });
  const line = Object.assign(document.createElement('span'), { className: 'rail-line' });
  line.append(fill, mark);
  const hint = Object.assign(document.createElement('p'), { className: 'rail-hint' });
  const buttons = slots.map((sl, i) => {
    const b = Object.assign(document.createElement('button'), { type: 'button' });
    b.addEventListener('click', () => track.scrollTo({ top: tops[i], behavior: reduced.matches ? 'auto' : 'smooth' }));
    list.append(document.createElement('li'));
    list.lastChild.append(b);
    return b;
  });
  body.append(list, line);
  rail.append(body, hint);

  // drift: a band per side and depth, its bits twice (the second copy one band lower) so the wrap is seamless
  const layers = [];
  for (const side of ['l', 'r']) {
    const field = scatter(side === 'l' ? 7 : 31, DEPTHS.map((d) => d.n));
    DEPTHS.forEach(({ speed }, depth) => {
      const layer = Object.assign(document.createElement('div'), { className: `drift-layer d${depth} ${side}` });
      for (const copy of [0, 1]) for (const { x, y, bit, tone } of field[depth]) {
        const g = Object.assign(document.createElement('span'), { className: `bit t${tone}`, textContent: bit });
        g.style.cssText = `left:${(x * 70 + 4).toFixed(1)}%;top:${((y + copy) * 50).toFixed(2)}%`;
        layer.append(g);
      }
      drift.append(layer);
      layers.push({ layer, speed });
    });
  }

  // measured on resize, mode change and card size change only, never inside a frame (a read there would force a layout)
  let tops = [], bandH = 0, shown = false, current = -1, raf = 0;
  const measure = () => { shown = rail.getClientRects().length > 0; tops = cards.map((c) => (c.classList.contains('proj') ? c.parentElement.offsetTop + (c.parentElement.offsetHeight - c.offsetHeight) / 2 : c.offsetTop)); bandH = drift.clientHeight; };
  function update() {
    raf = 0;
    if (!shown) return; // card mode or a narrow screen: the sides are hidden
    const y = track.scrollTop, view = track.clientHeight, max = track.scrollHeight - view;
    fill.style.scale = `1 ${max > 0 ? (y / max).toFixed(4) : 0}`;
    if (!reduced.matches) for (const { layer, speed } of layers) layer.style.translate = `0 ${driftY(y, speed, bandH).toFixed(1)}px`;
    let i = 0;
    while (i + 1 < tops.length && tops[i + 1] <= y + view / 2) i++;
    if ((y > 24) !== rail.classList.contains('scrolled')) rail.classList.toggle('scrolled');
    if (i === current) return;
    current = i;
    buttons.forEach((b, j) => (j === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    // the list's rows are all one height (styles.css), so the marker's place is arithmetic, not a read of the layout
    mark.style.translate = `0 calc(${i + 0.5} * var(--row))`;
    // a group's row is as wide as the screen: the sides step back while it shows
    root.classList.toggle('row-view', slots[i].hasAttribute('data-group'));
  }
  const schedule = () => { raf ||= requestAnimationFrame(update); };
  const remeasure = () => { measure(); current = -1; schedule(); };
  track.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(remeasure).observe(track);
  for (const c of cards) new ResizeObserver(remeasure).observe(c);
  let tcg = root.classList.contains('tcg');
  new MutationObserver(() => { if (tcg !== root.classList.contains('tcg')) { tcg = !tcg; remeasure(); } })
    .observe(root, { attributes: true, attributeFilter: ['class'] });

  // labels follow the language (app.js calls this from apply)
  return function label(lang) {
    const s = STRINGS[lang];
    rail.setAttribute('aria-label', s.railLabel);
    hint.textContent = s.scrollHint;
    const groups = slots.filter((sl) => sl.hasAttribute('data-group'));
    buttons.forEach((b, i) => { b.textContent = railName(slots[i], s, groups); });
    current = -1;
    schedule();
  };
}
