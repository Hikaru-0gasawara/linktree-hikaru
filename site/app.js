import { STRINGS, BIRTH_DATE, ageOn, resumeUrl, loadLang, saveLang } from './i18n.js';
import { saveTcg, fitScale } from './tcg.js';
import { deckScale } from './deck.js';
import { initDeck } from './tcg-dom.js';
import { initCritters } from './critters.js';

let storage = null;
try { storage = window.localStorage; } catch {}

const d = new Date();
// ageOn reads UTC parts, so feed it today's local date as a UTC date
const age = ageOn(BIRTH_DATE, new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))) ?? 21;

function apply(lang) {
  const s = STRINGS[lang];
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = s[el.dataset.i18n];
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', b.dataset.lang === lang);
  document.querySelector('.lang').setAttribute('aria-label', s.langLabel);
  document.querySelector('.circ img').alt = s.photoAlt;
  document.querySelector('.art img').alt = s.pfAlt;
  document.getElementById('skills').replaceChildren(...s.skills.split(' · ').map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  document.getElementById('resume').href = resumeUrl(lang);
  document.getElementById('age').textContent = age;
  document.getElementById('ageSuffix').textContent = (lang === 'ja' ? '' : ' ') + s.ageSuffix;
  document.querySelector('meta[name="description"]').content = s.metaDescription;
  toggle.setAttribute('aria-label', s.tcgLabel);
  closeBtn.setAttribute('aria-label', s.close);
  if (root.classList.contains('tcg')) labelCards(s);
}

// Hikaru's card has its own label; project cards are named by their title
const labelCards = (s) => { for (const c of cards) c.setAttribute('aria-label', c.parentNode.dataset.card === 'hikaru' ? s.cardLabel : c.querySelector('.name').textContent); };

const root = document.documentElement;
const toggle = document.querySelector('.tcg-toggle');
const flipBtn = document.querySelector('.tcg-flip');
const resetBtn = document.querySelector('.tcg-reset');
const closeBtn = document.querySelector('.deck-close');
const cards = [...document.querySelectorAll('.tcg-card')];
const fit = document.querySelector('.tcg-fit');
const stage = document.querySelector('.tcg-stage');
const front = document.querySelector('.face-front');
const langEl = document.querySelector('.lang');
const crittersEl = document.querySelector('.critters');
const coarse = matchMedia('(pointer: coarse)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let stopCritters = null;

const focused = () => root.classList.contains('deck-focus');
const fitNow = () => fit.style.setProperty('--s', (focused() ? fitScale : deckScale)(innerWidth, innerHeight));

// the head script already chose the mode; this syncs the DOM to it
function setMode(on) {
  root.classList.toggle('tcg', on);
  toggle.setAttribute('aria-pressed', on);
  if (on) {
    for (const c of cards) { c.tabIndex = 0; c.setAttribute('role', 'group'); }
    labelCards(STRINGS[current]);
    // out of the transformed card so position: fixed hits the viewport; moving a node restarts its entrance, so only when needed
    if (langEl.parentNode === front) flipBtn.after(langEl);
    stopCritters ??= initCritters(crittersEl);
  } else {
    setFocus(false);
    for (const c of cards) for (const a of ['tabindex', 'role', 'aria-label']) c.removeAttribute(a);
    if (langEl.parentNode !== front) front.prepend(langEl);
    stopCritters?.();
    stopCritters = null;
  }
  fitNow();
}

let current = loadLang(storage, navigator.languages);
apply(current);
setMode(root.classList.contains('tcg'));
const deck = initDeck(document.querySelector('.deck-track'));
flipBtn.addEventListener('click', () => deck.controllers[deck.current()]?.flip());
resetBtn.addEventListener('click', () => deck.controllers[deck.current()]?.reset());
toggle.addEventListener('click', () => {
  const on = !root.classList.contains('tcg');
  saveTcg(storage, on); // only an explicit choice is stored, so the pointer default keeps applying otherwise
  setMode(on);
});

// touch focus mode: a tap on the current card grows it to the full fit size, fades the others and lets a drag rotate it;
// ✕, a tap on the stage beside the card, Escape, leaving card mode or a switch to a fine pointer leave it
function setFocus(yes) {
  if (yes === focused()) return;
  root.classList.toggle('deck-focus', yes);
  deck.lockPaging(yes);
  fitNow();
  // reduced motion: no growth, the new size fades in
  if (reduced.matches) fit.animate({ opacity: [0, 1] }, { duration: 150, easing: 'ease-out' });
}
let tap = null; // a press on the current card that may still be a tap (< 6px); links and buttons keep their own tap
stage.addEventListener('pointerdown', (e) => {
  const ok = coarse.matches && root.classList.contains('tcg') && !focused() && cards[deck.current()]?.contains(e.target) && !e.target.closest('a, button');
  tap = ok ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
});
addEventListener('pointerup', (e) => {
  if (tap?.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 6) setFocus(true);
  tap = null;
});
addEventListener('pointercancel', () => { tap = null; }); // the swipe became a leaf
stage.addEventListener('click', (e) => { if (focused() && !cards[deck.current()].contains(e.target)) setFocus(false); });
closeBtn.addEventListener('click', () => { setFocus(false); cards[deck.current()]?.focus({ preventScroll: true }); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') setFocus(false); });
coarse.addEventListener('change', () => { if (!coarse.matches) setFocus(false); });

let raf = 0;
addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fitNow(); }); });

// 75ms fade out, swap, 75ms fade in. A click mid-fade restarts the timer, which always clears the class.
let timer;
function switchTo(lang) {
  if (lang === current) return;
  current = lang;
  saveLang(storage, lang);
  const root = document.documentElement;
  root.classList.add('swapping');
  clearTimeout(timer);
  timer = setTimeout(() => { apply(lang); root.classList.remove('swapping'); }, 75);
}
for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => switchTo(b.dataset.lang));
