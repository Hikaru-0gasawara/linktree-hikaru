export const LANGS = ['pt', 'en', 'ja'];
export const BIRTH_DATE = ''; // ISO YYYY-MM-DD, filled in by the owner

export const STRINGS = {
  pt: {
    role: 'Estudante de Eng. de Computação', school: 'Ibmec SP', ageSuffix: 'anos',
    focusLabel: 'Foco', focus: 'Infra · Segurança · Dados',
    speaksLabel: 'Fala', speaks: 'PT · EN · 日本語',
    baseLabel: 'Base', base: 'São Paulo, BR',
    play: 'Play', email: 'E-mail', linkedin: 'LinkedIn', github: 'GitHub', resume: 'Currículo',
    open: 'aberto a projetos', photoAlt: 'Foto de Hikaru Ogasawara',
    metaDescription: 'Hikaru Ogasawara, estudante de Engenharia de Computação no Ibmec SP. Infra, segurança e dados.',
    langLabel: 'Idioma',
  },
  en: {
    role: 'Computer Engineering student', school: 'Ibmec SP', ageSuffix: 'y/o',
    focusLabel: 'Focus', focus: 'Infra · Security · Data',
    speaksLabel: 'Speaks', speaks: 'PT · EN · 日本語',
    baseLabel: 'Base', base: 'São Paulo, BR',
    play: 'Play', email: 'Email', linkedin: 'LinkedIn', github: 'GitHub', resume: 'Résumé',
    open: 'open to projects', photoAlt: 'Photo of Hikaru Ogasawara',
    metaDescription: 'Hikaru Ogasawara, Computer Engineering student at Ibmec SP. Infra, security and data.',
    langLabel: 'Language',
  },
  ja: {
    role: 'コンピューター工学を専攻する学生', school: 'Ibmec SP', ageSuffix: '歳',
    focusLabel: '専門', focus: 'インフラ · セキュリティ · データ',
    speaksLabel: '言語', speaks: 'PT · EN · 日本語',
    baseLabel: '拠点', base: 'ブラジル・サンパウロ',
    play: 'Play', email: 'メール', linkedin: 'LinkedIn', github: 'GitHub', resume: '履歴書',
    open: '案件募集中', photoAlt: '小笠原ヒカルの写真',
    metaDescription: '小笠原ヒカル。Ibmec SPでコンピューター工学を学ぶ学生。インフラ、セキュリティ、データ。',
    langLabel: '言語',
  },
};

export function pickLang(navLangs) {
  for (const l of navLangs || []) {
    const p = String(l).toLowerCase().slice(0, 2);
    if (LANGS.includes(p)) return p;
  }
  return 'pt';
}

export function ageOn(birthISO, now) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthISO || '');
  if (!m) return null;
  const [y, mo, d] = m.slice(1).map(Number);
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age--;
  return age;
}

export const resumeUrl = (lang) => `/resume/hikaru-${lang}.pdf`;

export function loadLang(storage, navLangs) {
  try {
    const v = storage.getItem('lang');
    if (LANGS.includes(v)) return v;
  } catch {}
  return pickLang(navLangs);
}

export function saveLang(storage, lang) {
  try { storage.setItem('lang', lang); } catch {}
}
