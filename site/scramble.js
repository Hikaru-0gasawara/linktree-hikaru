// The language switch: every changed character runs through random characters of its own kind (a capital through capitals,
// kana through kana...) and settles on the new language's, roughly left to right. Spaces and punctuation stand still, so
// the words keep their shape. frameText is pure (tested); scramble drives the text nodes and returns a stop that finishes.
export const DURATION = 700; // ms until the last character settles
const TICK = 45; // ms a random character holds before the next one

const POOLS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digit: '0123456789',
  kana: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンガギグゲゴ',
  kanji: '日本語技術開発状態公開中画面試作言語拠点専門情報安全計算機工学生名刺部品回路設計検証実装',
};
export const kind = (c) => (/[A-ZÀ-Þ]/.test(c) ? 'upper' : /[a-zß-ÿ]/.test(c) ? 'lower' : /\d/.test(c) ? 'digit'
  : /[ぁ-ヺー]/.test(c) ? 'kana' : /[一-鿿]/.test(c) ? 'kanji' : null);

const hash = (n) => {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
};

// when character i of n settles: a sweep from left to right with some jitter, all within DURATION
export const settleAt = (i, n, seed = 0) => 120 + 380 * (n > 1 ? i / (n - 1) : 0) + 200 * (hash(i * 7 + seed) % 1000) / 1000;

// the text t ms into the switch from `from` to `to`: as long as `to`; a character first shows the old one at its place, then
// random ones of the new one's kind, then the new one
export function frameText(from, to, t, seed = 0) {
  const tick = Math.floor(t / TICK);
  let out = '';
  for (let i = 0; i < to.length; i++) {
    const ch = to[i], k = kind(ch), at = settleAt(i, to.length, seed);
    if (!k || t >= at) out += ch;
    else if (t < at * 0.3 && i < from.length) out += from[i];
    else { const pool = POOLS[k]; out += pool[hash(i * 131 + tick * 7919 + seed) % pool.length]; }
  }
  return out;
}

// the visible text nodes of an element, in order; a screen reader's hidden copy (.sr) gets its text at once
const textNodes = (el) => {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('.sr') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  return nodes;
};

// els already hold the new text; before[j] is what els[j] said until now
export function scramble(els, before) {
  const runs = els.map((el, j) => {
    const nodes = textNodes(el), finals = nodes.map((n) => n.data);
    return { nodes, finals, from: before[j], to: finals.join(''), seed: j * 1009 };
  }).filter((r) => r.to && r.to !== r.from);
  const paint = (t) => {
    for (const r of runs) {
      const s = frameText(r.from, r.to, t, r.seed);
      let k = 0;
      r.nodes.forEach((n, i) => { const v = s.slice(k, k += r.finals[i].length); if (n.data !== v) n.data = v; });
    }
  };
  let raf = 0;
  const start = performance.now();
  const stop = () => { cancelAnimationFrame(raf); for (const r of runs) r.nodes.forEach((n, i) => { n.data = r.finals[i]; }); };
  const step = (now) => { if (now - start >= DURATION) stop(); else { paint(now - start); raf = requestAnimationFrame(step); } };
  paint(0);
  raf = requestAnimationFrame(step);
  return stop;
}
