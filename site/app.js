import { STRINGS, BIRTH_DATE, ageOn, resumeUrl, loadLang, saveLang } from './i18n.js';

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
  document.getElementById('resume').href = resumeUrl(lang);
  document.getElementById('age').textContent = age;
  document.getElementById('ageSuffix').textContent = (lang === 'ja' ? '' : ' ') + s.ageSuffix;
  document.querySelector('meta[name="description"]').content = s.metaDescription;
}

let current = loadLang(storage, navigator.languages);
apply(current);

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
