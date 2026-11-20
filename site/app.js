import { STRINGS, BIRTH_DATE, ageOn, resumeUrl, loadLang, saveLang } from './i18n.js';
import { saveTcg } from './tcg.js';
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
  if (root.classList.contains('tcg')) labelCards(s);
}

// Hikaru's card has its own label; project cards are named by their title
const labelCards = (s) => { for (const c of cards) c.setAttribute('aria-label', c.parentNode.dataset.card === 'hikaru' ? s.cardLabel : c.querySelector('.name').textContent); };

const root = document.documentElement;
const toggle = document.querySelector('.tcg-toggle');
const flipBtn = document.querySelector('.tcg-flip');
const resetBtn = document.querySelector('.tcg-reset');
const cards = [...document.querySelectorAll('.tcg-card')];
const fit = document.querySelector('.tcg-fit');
const front = document.querySelector('.face-front');
const langEl = document.querySelector('.lang');
const crittersEl = document.querySelector('.critters');
let stopCritters = null;

const fitNow = () => fit.style.setProperty('--s', deckScale(innerWidth, innerHeight));

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
