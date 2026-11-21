// Title letters for the plain-mode motion (styles.css): each letter its own box, with its place in the title as variables.
//   --k  index (0..n-1), --d  distance from the middle letter (negative: left of it), --a  |d|
// Screen readers get the whole title once from a visually hidden copy; the letters are hidden from them.
export const letterVars = (n) => Array.from({ length: n }, (_, k) => {
  const d = k - (n - 1) / 2;
  return { k, d, a: Math.abs(d) };
});

const letters = (word, vars) => {
  const w = Object.assign(document.createElement('span'), { className: 'w' });
  for (const ch of word) {
    const { k, d, a } = vars.shift();
    const c = Object.assign(document.createElement('span'), { className: 'ch', textContent: ch });
    c.style.cssText = `--k:${k};--d:${d};--a:${a}`;
    w.append(c);
  }
  return w;
};

// lines: the element's .w children (the name's two lines) or else its text split at spaces; a line never breaks inside a word
export function splitLetters(el) {
  const lines = el.querySelector(':scope > .w') ? [...el.querySelectorAll(':scope > .w')].map((w) => w.textContent) : null;
  const text = lines ? lines.join(' ') : el.textContent;
  const words = lines ?? text.split(' ').filter(Boolean);
  const vars = letterVars(words.reduce((n, w) => n + [...w].length, 0));
  el.style.setProperty('--n', vars.length);
  const sr = Object.assign(document.createElement('span'), { className: 'sr', textContent: text });
  const box = Object.assign(document.createElement('span'), { className: 'letters' });
  box.setAttribute('aria-hidden', 'true');
  words.forEach((w, i) => { if (i) box.append(' '); box.append(letters(w, vars)); });
  el.replaceChildren(sr, box);
}

// A project's panel for its assembly (styles.css): the labels in order, then each value's words, numbered across the panel.
//   --j  the piece's place (labels 0..2, then the words), --m  the number of pieces, on the panel
// The words stay real text (only wrapped), so the panel reads the same to everyone.
export function splitPanel(dl) {
  let j = 0;
  const dts = [...dl.querySelectorAll('dt')], dds = [...dl.querySelectorAll('dd')];
  for (const dt of dts) dt.style.setProperty('--j', j++);
  for (const dd of dds) {
    const words = dd.textContent.split(' ').filter(Boolean);
    dd.replaceChildren(...words.flatMap((w, i) => {
      const t = Object.assign(document.createElement('span'), { className: 'tok', textContent: w });
      t.style.setProperty('--j', j++);
      return i ? [' ', t] : [t];
    }));
  }
  dl.style.setProperty('--m', j);
  return j;
}
