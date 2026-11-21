import { STRINGS, BIRTH_DATE, ageOn, resumeUrl, loadLang, saveLang } from './i18n.js';
import { saveTcg, fitScale, IDENTITY } from './tcg.js';
import { deckScale, fanLayout, fanPose } from './deck.js';
import { initDeck } from './tcg-dom.js';
import { initCritters } from './critters.js';
import { initReveal } from './reveal.js';
import { splitLetters } from './split.js';
import { initGutter } from './gutter.js';

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
  for (const t of titles) splitLetters(t);
  labelRail?.(lang);
  if (root.classList.contains('tcg')) labelCards(s);
}

// Hikaru's card has its own label; project cards are named by their title; image cards by a data-label key on the card or its
// slot; the top card of a group's pack also says the pack opens as a fan
const labelCards = (s) => {
  for (const c of cards) {
    const slot = c.closest('.deck-slot'), key = c.closest('[data-label]')?.dataset.label;
    let label = slot.dataset.card === 'hikaru' ? s.cardLabel : key ? s[key] : c.querySelector('.name .sr').textContent;
    if (isGroup(slot) && c === slot.querySelector('.tcg-card')) label += ` · ${s.groupHint.replace('{n}', slot.querySelectorAll('.tcg-card').length)}`;
    c.setAttribute('aria-label', label);
  }
};

const root = document.documentElement;
const toggle = document.querySelector('.tcg-toggle');
const flipBtn = document.querySelector('.tcg-flip');
const resetBtn = document.querySelector('.tcg-reset');
const closeBtn = document.querySelector('.deck-close');
const cards = [...document.querySelectorAll('.tcg-card')];
const slots = [...document.querySelectorAll('.deck-slot')];
const isGroup = (slot) => !!slot?.hasAttribute('data-group');
// a closed group is a pack: only its top card takes focus and clicks
const packInert = (on) => { for (const sl of slots) if (isGroup(sl)) [...sl.querySelectorAll('.fan-item')].slice(1).forEach((it) => { it.inert = on; }); };
const fit = document.querySelector('.tcg-fit');
const stage = document.querySelector('.tcg-stage');
const front = document.querySelector('.face-front');
const langEl = document.querySelector('.lang');
const crittersEl = document.querySelector('.critters');
const track = document.querySelector('.deck-track');
// title letters (split.js) move in plain mode; the project titles take turns between three ways in (styles.css)
const titles = [...document.querySelectorAll('h2.name[data-i18n]')];
titles.forEach((t, i) => { t.dataset.fx = ['rise', 'spread', 'tilt'][i % 3]; });
splitLetters(document.querySelector('h1.name'));
let labelRail = null;

const focused = () => root.classList.contains('deck-focus');
// the whole deck shows one face; only a focused card turns on its own
let back = false;
const deckFace = () => (back ? [0, 1, 0, 0] : IDENTITY); // 180° about Y
let group = null; // the open card group: { slot, items (.fan-item), ctl (one controller per card), sel (focused card or -1) }
const fitNow = () => {
  fit.style.setProperty('--s', focused() ? fitScale(innerWidth, innerHeight)
    : group ? fanLayout(innerWidth, innerHeight, group.items.length).s : deckScale(innerWidth, innerHeight));
  root.style.setProperty('--ds', deckScale(innerWidth, innerHeight)); // the control bar follows the deck's card (styles.css)
};

// the head script already chose the mode; this syncs the DOM to it
function setMode(on) {
  root.classList.toggle('tcg', on);
  toggle.setAttribute('aria-pressed', on);
  if (on) {
    for (const c of cards) { c.tabIndex = 0; c.setAttribute('role', 'group'); }
    labelCards(STRINGS[current]);
    packInert(true);
    // out of the transformed card so position: fixed hits the viewport; moving a node restarts its entrance, so only when needed
    if (langEl.parentNode === front) resetBtn.after(langEl);
  } else {
    closeGroup();
    setFocus(false);
    packInert(false);
    back = false;
    for (const c of cards) for (const a of ['tabindex', 'role', 'aria-label']) c.removeAttribute(a);
    if (langEl.parentNode !== front) front.prepend(langEl);
  }
  fitNow();
}

let current = loadLang(storage, navigator.languages);
labelRail = initGutter(track, document.querySelector('.rail'), document.querySelector('.drift'), matchMedia('(prefers-reduced-motion: reduce)'));
apply(current);
setMode(root.classList.contains('tcg'));
initCritters(crittersEl); // once, for both modes
const deck = initDeck(track);
initReveal(track);
const turnAll = () => { for (const c of deck.controllers) c.turnTo(deckFace()); };
// Flip and Reset act on the focused card; with a group's fan open, on all of its cards; otherwise on the whole deck
const focusedCtl = () => (group ? group.ctl[group.sel] : deck.controllers[deck.current()]);
flipBtn.addEventListener('click', () => {
  if (focused()) focusedCtl()?.flip(); else if (group) group.ctl.forEach((c) => c.flip()); else { back = !back; turnAll(); }
});
resetBtn.addEventListener('click', () => {
  if (focused()) focusedCtl()?.reset(); else if (group) group.ctl.forEach((c) => c.reset()); else { back = false; turnAll(); }
});
toggle.addEventListener('click', () => {
  const on = !root.classList.contains('tcg');
  saveTcg(storage, on); // only an explicit choice is stored, so the pointer default keeps applying otherwise
  root.classList.add('switched'); // the plain name's letters and icons came in at load; a mode switch doesn't replay them
  setMode(on);
});

// focus mode: a click or tap on the current card (or Enter/Space on it) grows it to the full fit size, fades the others and
// lets a drag rotate it; ✕, a click beside the card, Escape or leaving card mode turn it back to the deck's face and leave.
// Inside an open group the focused card is the one picked from the fan; the rest of the fan fades.
function setFocus(yes) {
  if (yes === focused()) return;
  if (!yes) focusedCtl()?.turnTo(deckFace());
  if (group) {
    if (!yes) { group.items[group.sel]?.classList.remove('sel'); group.sel = -1; }
    group.items.forEach((it, j) => { it.inert = yes && j !== group.sel; });
  }
  root.classList.toggle('deck-focus', yes);
  if (!group) deck.lockPaging(yes);
  fitNow();
}

// a group: a click on its pack (or Enter/Space) opens its cards as a fan, like a hand of cards; a click on a card of the fan
// focuses that card. Paging stays locked while the fan is open.
function layoutFan() {
  const n = group.items.length, { spread } = fanLayout(innerWidth, innerHeight, n);
  group.items.forEach((it, i) => {
    const { x, y, rz } = fanPose(i, n, spread);
    it.style.setProperty('--fx', `${(x * 100).toFixed(2)}%`);
    it.style.setProperty('--fy', `${(y * 100).toFixed(2)}%`);
    it.style.setProperty('--fr', `${rz.toFixed(2)}deg`);
  });
}
function openGroup(slot) {
  group = { slot, items: [...slot.querySelectorAll('.fan-item')], ctl: deck.cards[slots.indexOf(slot)], sel: -1 };
  for (const it of group.items) it.inert = false;
  deck.lockPaging(true);
  slot.classList.add('open');
  root.classList.add('group-open');
  layoutFan();
  fitNow();
}
function closeGroup() {
  if (!group) return;
  setFocus(false);
  const { slot, items, ctl } = group;
  group = null;
  for (const c of ctl) c.turnTo(deckFace());
  for (const it of items) for (const v of ['--fx', '--fy', '--fr']) it.style.removeProperty(v);
  packInert(true);
  slot.classList.remove('open');
  root.classList.remove('group-open');
  deck.lockPaging(false);
  fitNow();
}
const select = (j) => { group.sel = j; group.items[j].classList.add('sel'); setFocus(true); };
function activate(card) {
  const slot = card.closest('.deck-slot');
  if (group) { const j = group.items.findIndex((it) => it.contains(card)); if (j >= 0) select(j); }
  else if (isGroup(slot)) openGroup(slot);
  else setFocus(true);
}
// ✕, Escape and a click beside the card step back one level: focused card, then the fan, then the deck
const stepBack = () => (focused() ? setFocus(false) : closeGroup());

let tap = null; // a press on a card of the current slot that may still be a tap (< 6px); links and buttons keep their own tap
stage.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.tcg-card');
  const ok = root.classList.contains('tcg') && !focused() && e.button === 0 && card && slots[deck.current()]?.contains(card) && !e.target.closest('a, button');
  tap = ok ? { id: e.pointerId, x: e.clientX, y: e.clientY, card } : null;
});
addEventListener('pointerup', (e) => {
  if (tap?.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 6) activate(tap.card);
  tap = null;
});
addEventListener('pointercancel', () => { tap = null; }); // the swipe became a leaf
stage.addEventListener('click', (e) => { if ((focused() || group) && !e.target.closest('.tcg-card')) stepBack(); });
closeBtn.addEventListener('click', () => {
  const was = group?.items[group.sel]?.querySelector('.tcg-card'); // back in the fan, focus returns to the card it came from
  stepBack();
  (was ?? slots[deck.current()]?.querySelector('.tcg-card'))?.focus({ preventScroll: true });
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && (focused() || group)) closeBtn.click(); });
addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && !focused() && e.target.classList?.contains('tcg-card') && slots[deck.current()]?.contains(e.target)) {
    e.preventDefault();
    activate(e.target);
  }
});

let raf = 0;
addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fitNow(); if (group) layoutFan(); if (focused() || group) deck.lockPaging(true); }); });

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
