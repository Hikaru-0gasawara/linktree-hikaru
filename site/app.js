import { STRINGS, BIRTH_DATE, ageOn, resumeUrl, loadLang, saveLang } from './i18n.js';
import { saveTcg, fitScale, IDENTITY } from './tcg.js';
import { deckScale } from './deck.js';
import { initDeck } from './tcg-dom.js';
import { initCritters } from './critters.js';
import { initReveal } from './reveal.js';

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
  for (const img of document.querySelectorAll('[data-i18n-alt]')) img.alt = s[img.dataset.i18nAlt];
  document.getElementById('skills').replaceChildren(...s.skills.split(' · ').map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  document.getElementById('resume').href = resumeUrl(lang);
  document.getElementById('age').textContent = age;
  document.getElementById('ageSuffix').textContent = (lang === 'ja' ? '' : ' ') + s.ageSuffix;
  document.querySelector('meta[name="description"]').content = s.metaDescription;
  toggle.setAttribute('aria-label', s.tcgLabel);
  closeBtn.setAttribute('aria-label', s.close);
  if (root.classList.contains('tcg')) labelCards(s);
}

// Hikaru's card has its own label; project cards are named by their title; image cards by their slot's data-label key
const labelCards = (s) => {
  for (const c of cards) {
    const slot = c.parentNode;
    c.setAttribute('aria-label', slot.dataset.card === 'hikaru' ? s.cardLabel : slot.dataset.label ? s[slot.dataset.label] : c.querySelector('.name').textContent);
  }
};

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

const focused = () => root.classList.contains('deck-focus');
// the whole deck shows one face; only a focused card turns on its own
let back = false;
const deckFace = () => (back ? [0, 1, 0, 0] : IDENTITY); // 180° about Y
const fitNow = () => fit.style.setProperty('--s', (focused() ? fitScale : deckScale)(innerWidth, innerHeight));

// the head script already chose the mode; this syncs the DOM to it
function setMode(on) {
  root.classList.toggle('tcg', on);
  toggle.setAttribute('aria-pressed', on);
  if (on) {
    for (const c of cards) { c.tabIndex = 0; c.setAttribute('role', 'group'); }
    labelCards(STRINGS[current]);
    // out of the transformed card so position: fixed hits the viewport; moving a node restarts its entrance, so only when needed
    if (langEl.parentNode === front) resetBtn.after(langEl);
  } else {
    setFocus(false);
    back = false;
    for (const c of cards) for (const a of ['tabindex', 'role', 'aria-label']) c.removeAttribute(a);
    if (langEl.parentNode !== front) front.prepend(langEl);
  }
  fitNow();
}

let current = loadLang(storage, navigator.languages);
apply(current);
setMode(root.classList.contains('tcg'));
initCritters(crittersEl); // once, for both modes
const deck = initDeck(document.querySelector('.deck-track'));
initReveal(document.querySelector('.deck-track'));
const turnAll = () => { for (const c of deck.controllers) c.turnTo(deckFace()); };
flipBtn.addEventListener('click', () => { if (focused()) deck.controllers[deck.current()]?.flip(); else { back = !back; turnAll(); } });
resetBtn.addEventListener('click', () => { if (focused()) deck.controllers[deck.current()]?.reset(); else { back = false; turnAll(); } });
toggle.addEventListener('click', () => {
  const on = !root.classList.contains('tcg');
  saveTcg(storage, on); // only an explicit choice is stored, so the pointer default keeps applying otherwise
  setMode(on);
});

// focus mode: a click or tap on the current card (or Enter/Space on it) grows it to the full fit size, fades the others and
// lets a drag rotate it; ✕, a click beside the card, Escape or leaving card mode turn it back to the deck's face and leave
function setFocus(yes) {
  if (yes === focused()) return;
  if (!yes) deck.controllers[deck.current()]?.turnTo(deckFace());
  root.classList.toggle('deck-focus', yes);
  deck.lockPaging(yes);
  fitNow();
}
let tap = null; // a press on the current card that may still be a tap (< 6px); links and buttons keep their own tap
stage.addEventListener('pointerdown', (e) => {
  const ok = root.classList.contains('tcg') && !focused() && e.button === 0 && cards[deck.current()]?.contains(e.target) && !e.target.closest('a, button');
  tap = ok ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
});
addEventListener('pointerup', (e) => {
  if (tap?.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 6) setFocus(true);
  tap = null;
});
addEventListener('pointercancel', () => { tap = null; }); // the swipe became a leaf
stage.addEventListener('click', (e) => { if (focused() && !cards[deck.current()].contains(e.target)) setFocus(false); });
closeBtn.addEventListener('click', () => { setFocus(false); cards[deck.current()]?.focus({ preventScroll: true }); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && focused()) closeBtn.click(); });
addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && !focused() && e.target === cards[deck.current()]) { e.preventDefault(); setFocus(true); }
});

let raf = 0;
addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fitNow(); if (focused()) deck.lockPaging(true); }); });

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
