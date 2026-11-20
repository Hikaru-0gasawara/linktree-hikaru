// Original pixel-art walkers for the ground in card mode. Side view, facing right, 2 walk frames.
// Each grid: one char per pixel, '.' transparent, other chars are palette keys.

// frames share the top rows and differ in the leg rows
const sprite = (palette, top, ...legs) => ({ palette, frames: legs.map((l) => [...top, ...l]) });

export const SPRITES = {
  cat: sprite({ f: '#8a8f99', d: '#5c616b', e: '#c9b25a', n: '#c98a8a' }, [
    '...........d..d.',
    '.d.........fdfd.',
    '.d.........ffff.',
    '.d.........ffeff',
    '..d........ffffn',
    '..d.......fffff.',
    '..dffffffffffff.',
    '..fdfdfdfffffff.',
    '..ffffffffffff..',
  ], [
    '..ff.....ff.....',
    '.f..f...f..f....',
    'f....f.f....f...',
  ], [
    '..ff......ff....',
    '..ff......ff....',
    '..ff......ff....',
  ]),

  dog: sprite({ b: '#a0724a', d: '#5e3f28', m: '#c9a27a', k: '#2a201a', e: '#1f1a16', r: '#a84a42' }, [
    '..........bbbb..',
    '.........bbbbbb.',
    '.........dbbebmm',
    '.d.......dbbbmmk',
    '..d......dbbbmm.',
    '..d.......rrrr..',
    '...bbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbb...',
    '..bmmmmmmmmbb...',
  ], [
    '..bb......bb....',
    '.b..b....b..b...',
    'd....d..d....d..',
  ], [
    '..bb......bb....',
    '..bb......bb....',
    '..dd......dd....',
  ]),

  pig: sprite({ p: '#d39a98', d: '#a86e70', s: '#e0aaa8', k: '#4a2a2c', e: '#2a1a1a' }, [
    '..........dd....',
    '.........dpd....',
    '...pppppppppp...',
    'd.ppppppppppep..',
    '.dpppppppppppsss',
    'd.ppppppppppppsk',
    '..ppppppppppppss',
    '..pppppppppppp..',
    '..dppppppppppd..',
    '...pppppppppp...',
  ], [
    '...p.p....p.p...',
    '..d...d..d...d..',
  ], [
    '...pp.....pp....',
    '...dd.....dd....',
  ]),

  chicken: sprite({ c: '#d8d2c0', w: '#aaa492', r: '#b04a3e', y: '#d2a43c', e: '#1a1a1a' }, [
    '........r...',
    '.......rrr..',
    '.......cccc.',
    '.......cecyy',
    'c......cccr.',
    'cc.....ccc..',
    'ccc..cccccc.',
    'cccccccccccc',
    '.ccwwwwccccc',
    '..ccwwccccc.',
    '...ccccccc..',
  ], [
    '....y..y....',
    '...yy..yy...',
  ], [
    '.....yy.....',
    '....yy.yy...',
  ]),

  horse: sprite({ b: '#8a5a3a', m: '#3a2a20', k: '#2a1e18', e: '#151010', l: '#a87452' }, [
    '.................bb...',
    '................mbbb..',
    '...............mbbebb.',
    '...............mbbbbbb',
    '..............mbbbbbbk',
    '..............mbbb.ll.',
    '.............mbbbb....',
    '..mbbbbbbbbbbbbbbb....',
    '.mmbbbbbbbbbbbbbbb....',
    '.m.bbbbbbbbbbbbbbb....',
    '.m.bbbbbbbbbbbbbbb....',
    'm...bbbbbbbbbbbbb.....',
  ], [
    'm...bb.........bb.....',
    '...b..b.......b..b....',
    '...b..b.......b..b....',
    '..b....b.....b....b...',
    '..b....b.....b....b...',
    '..k....k.....k....k...',
  ], [
    'm...bb.........bb.....',
    '....bb.........bb.....',
    '....bb.........bb.....',
    '....bb.........bb.....',
    '....bb.........bb.....',
    '....kk.........kk.....',
  ]),

  pikachu: sprite({ y: '#e0c040', k: '#2a2420', r: '#c0504a', n: '#8a6430', e: '#1a1612' }, [
    '.......k...k...',
    '.......yk..yk..',
    '.......yy..yy..',
    '.yyyy..yy..yy..',
    '.yyy....yyyy...',
    '..yyy..yyyyyy..',
    '..yy...yyyyeyy.',
    '...yy..yyyyyyky',
    '...n...yyyyrry.',
    '...nn.yyyyyyy..',
    '....nyynyyyyy..',
    '.....yynyyyyy..',
    '.....yyyyyyyy..',
  ], [
    '.....yy...yy...',
    '....yy.....yy..',
  ], [
    '......yy.yy....',
    '......yy.yy....',
  ]),

  bulbasaur: sprite({ g: '#5a9a50', G: '#3a6a38', t: '#5aa090', d: '#3a7068', e: '#b04040', w: '#d8d8d0' }, [
    '....gg..........',
    '...gGgg.........',
    '..gggGgg..t..t..',
    '.gGggggGg.ttttt.',
    '.gggGggggttttttt',
    '.ggggGgggtttwett',
    '..ggggggtttttttt',
    '.ttttttttttttdt.',
    'ttdtttdtttttttt.',
    'tttttttttttttt..',
  ], [
    '.tt.......tt....',
    't..t.....t..t...',
    'dd..dd..dd..dd..',
  ], [
    '..tt.......tt...',
    '..tt.......tt...',
    '..dd.......dd...',
  ]),

  charmander: sprite({ o: '#d8803a', c: '#e0c07a', f: '#e0a030', F: '#c04a30', e: '#1a1410', d: '#a85a2a' }, [
    '........oooo..',
    '.......oooooo.',
    '.......oooeoo.',
    '.......oooooo.',
    'F.......ooooo.',
    'fF......oooo..',
    'Ff.....oocco..',
    '.o....ooccco..',
    '.o...oooccc...',
    '..o.ooooccc...',
    '...oooooocc...',
  ], [
    '......oo..o...',
    '.....dd....dd.',
  ], [
    '.......oo.....',
    '.......dddd...',
  ]),

  squirtle: sprite({ b: '#7ab0c8', B: '#4a7a90', s: '#9a6a3a', S: '#6a4424', c: '#d8c890', e: '#1a1410' }, [
    '........bbbb..',
    '.......bbbbbb.',
    '.......bbbebb.',
    '.......bbbbbbb',
    '........bbbbb.',
    '...SSSSbbbbb..',
    '..SssssScbb...',
    '..SssssScbb...',
    '..SssssScb....',
    'b..SSSSScbb...',
    'bb.bbbbbbb....',
  ], [
    '....bb...bb...',
    '...BB.....BB..',
  ], [
    '.....bb.bb....',
    '.....BBBB.....',
  ]),

  steve: sprite({ h: '#4a3020', s: '#c09070', w: '#d8d8d0', u: '#4a5aa0', m: '#7a5038', c: '#3aa0a8', C: '#2a7880', p: '#3a4a90', g: '#555560' }, [
    '.hhhhhh.',
    '.hhhhhh.',
    '.hhssss.',
    '.hsswus.',
    '.hsssss.',
    '.hssmms.',
    '..cccc..',
    '..cCcc..',
    '..cCcc..',
    '..cCcc..',
    '..cscc..',
    '..pppp..',
  ], [
    '..pppp..',
    '.pp..pp.',
    '.pp..pp.',
    'pp....pp',
    'pp....pp',
    'gg....gg',
  ], [
    '..pppp..',
    '..pppp..',
    '..pppp..',
    '..pppp..',
    '..pppp..',
    '..gggg..',
  ]),

  toph: sprite({ k: '#1e1c22', s: '#e0c0a0', e: '#b8b8b0', g: '#4a8a4a', G: '#2e5e34', y: '#c8b050', w: '#d8d0a0' }, [
    '....kk....',
    '...kkkk...',
    '..kkkkkk..',
    '.kkkkkkkk.',
    '.kkwwwwww.',
    '.kkkssssss',
    '.kkkssess.',
    '.kk.sssss.',
    '.kk..ss...',
    '...ggyg...',
    '..gggygg..',
    '..ggsygg..',
    '...yyyy...',
    '..GGGGGG..',
  ], [
    '..GGGGGG..',
    '.GGG..GGG.',
    '.GG....GG.',
    'ss......ss',
  ], [
    '..GGGGGG..',
    '..GGGGGG..',
    '..GGGGGG..',
    '..ss..ss..',
  ]),
};

// frames side by side, for a steps() sprite-sheet animation
export function renderSprite({ palette, frames }, scale) {
  const h = frames[0].length, w = frames[0][0].length;
  const cv = document.createElement('canvas');
  cv.width = w * scale * frames.length;
  cv.height = h * scale;
  const ctx = cv.getContext('2d');
  frames.forEach((f, i) => f.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    ctx.fillStyle = palette[ch];
    ctx.fillRect((i * w + x) * scale, y * scale, scale, scale);
  })));
  return cv;
}

const CAST = ['cat', 'cat', 'dog', 'dog', 'pig', 'pig', 'chicken', 'chicken', 'horse', 'pikachu', 'bulbasaur', 'charmander', 'squirtle', 'steve', 'toph'];
const rand = (a, b) => a + Math.random() * (b - a);

export function initCritters(container) {
  const scale = innerWidth < 600 ? 2 : 3;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sheets = {};
  const walkers = CAST.map((name) => {
    const s = SPRITES[name];
    const n = s.frames.length, w = s.frames[0][0].length * scale, h = s.frames[0].length * scale;
    sheets[name] ??= renderSprite(s, scale).toDataURL();
    const speed = name === 'horse' ? 60 : rand(20, 45);
    const el = document.createElement('div');
    el.className = 'critter' + (still ? ' stop' : '');
    el.style.cssText = `width:${w}px;height:${h}px;background-image:url(${sheets[name]});background-size:${w * n}px ${h}px;`
      + `--sw:${w * n}px;--n:${n};animation-duration:${Math.max(0.25, 16 / speed).toFixed(2)}s`;
    container.append(el);
    const c = { el, w, speed, base: speed, x: rand(0, Math.max(0, innerWidth - w)), dir: Math.random() < 0.5 ? 1 : -1, wait: 0, jitter: name === 'chicken' };
    place(c);
    return c;
  });

  function place(c) { c.el.style.transform = `translateX(${c.x.toFixed(1)}px) scaleX(${c.dir})`; }

  let raf = 0, last = 0;
  function tick(t) {
    const dt = Math.min((t - last) / 1000, 0.1);
    last = t;
    for (const c of walkers) {
      if (c.wait > 0) {
        if ((c.wait -= dt) <= 0) c.el.classList.remove('stop');
        continue;
      }
      if (c.jitter && Math.random() < dt * 2) {
        c.speed = rand(20, 50);
        if (Math.random() < 0.3) c.dir = -c.dir;
      }
      c.x += c.dir * c.speed * dt;
      const max = Math.max(0, innerWidth - c.w);
      if (c.x <= 0 || c.x >= max) { c.x = Math.min(max, Math.max(0, c.x)); c.dir = c.x <= 0 ? 1 : -1; }
      else if (Math.random() < dt * (c.jitter ? 0.4 : 0.08)) { c.wait = rand(1, 3); c.el.classList.add('stop'); }
      place(c);
    }
    raf = requestAnimationFrame(tick);
  }
  const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(tick); };
  const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : start());
  if (!still) {
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden) start();
  }

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
    container.replaceChildren();
  };
}
