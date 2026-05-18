// pushes — fake push notification spawn loop, reactions, dock toggle
// ── Fake push notifications ─────────────────────────────────────
(() => {
  const root = document.getElementById('pushes');
  if (!root) return;

  const NAMES_REG = [
    'MysticElena', 'IronFist', 'Ashen_King', 'Lunaberry', 'Krieger', 'Aurelia',
    'Featherweight', 'Rynaldo', 'Thornfall', 'Korso_88', 'Sapphira', 'Pixie_Storm',
    'NewKnight_42', 'VeteranSam', 'Mirabel', 'ShadowPaw', 'Solenne', 'DragonSlayer92',
    'BraveOne', 'BloodMoon', 'LunaShade', 'Inferno777', 'Reaper', 'Mochi',
    'Bjorn', 'Astrid', 'theElf', 'Cassiopeia'
  ];
  const NAMES_CROWN = ['GuildMaster_Vex'];

  const AVATAR_PALETTE = [
    '#7B4FB8', '#3FA319', '#C03830', '#2C7AD0', '#E07020',
    '#B8852D', '#4FA840', '#9A3FB8', '#D04F8A', '#3F9AB8'
  ];

  const TEXTS = [
    { kind: 'achievement', name: 'DragonSlayer92', text: 'just upgraded Galahad to lvl 120! Glory to the champ! ⚔️' },
    { kind: 'achievement', name: 'MysticElena',    text: 'promoted to Champion III in Arena 🏆 finally past that plateau' },
    { kind: 'achievement', name: 'IronFist',       text: 'built Town Hall level 27 ✨ next stop the bank' },
    { kind: 'achievement', name: 'Ashen_King',     text: 'got promoted to General 🎖️ thanks guild for the backup' },
    { kind: 'achievement', name: 'Lunaberry',      text: 'pulled 20,000 emeralds from Heroic Chest!! 💎 luckiest day ever' },
    { kind: 'achievement', name: 'Krieger',        text: 'finally beat Tydus solo 🐉 took me 23 attempts' },
    { kind: 'achievement', name: 'Aurelia',        text: 'reached Tower floor 850 🗼 the grind is real' },
    { kind: 'achievement', name: 'Featherweight',  text: 'just unlocked my 6th faction 🌟 the journey continues' },
    { kind: 'achievement', name: 'Rynaldo',        text: 'maxed Glyphs on Julius 🎉 he hits like a truck now' },

    { kind: 'guild', name: 'GuildMaster_Vex', crown: true, text: 'everyone hit fort 3 tonight, we need 1000 points to win Guild VS' },
    { kind: 'guild', name: 'Thornfall',                    text: 'Hydra opens in 2h, save your titanite' },
    { kind: 'guild', name: 'Korso_88',                     text: 'who’s running Outland 12 tonight? need 2 more' },
    { kind: 'guild', name: 'Sapphira',                     text: 'I’m in for Outland 🙋‍♀️ ping me at 21:00 server time' },
    { kind: 'guild', name: 'Pixie_Storm',                  text: 'Arena rewards drop in 3 min btw' },
    { kind: 'guild', name: 'GuildMaster_Vex', crown: true, text: 'great push everyone, we’re 200 ahead of rival guild 🚀' },

    { kind: 'dm', name: 'NewKnight_42', text: 'guys is Galahad good or should I pick another starter?' },
    { kind: 'dm', name: 'VeteranSam',   text: '<span class="mention">@NewKnight_42</span> Galahad is the GOAT, you can’t go wrong' },
    { kind: 'dm', name: 'Mirabel',      text: 'tip for new players: don’t waste emeralds on energy, save for events' },

    { kind: 'loot', name: 'BloodMoon',  text: 'Legendary chest drop: +500 gems 💎' },
    { kind: 'loot', name: 'Reaper',     text: 'Got Aurora from a soul stone!' },
    { kind: 'loot', name: 'Inferno777', text: 'Found a Rune of Vengeance' },

    { kind: 'joining', name: 'theElf',     text: 'just joined Iron Crown guild' },
    { kind: 'joining', name: 'LunaShade',  text: 'started playing Hero Wars' },
    { kind: 'joining', name: 'Cassiopeia', text: 'is now online' },
  ];

  const STICKER_PUSHES = [
    { kind: 'reaction', name: 'ShadowPaw',  sticker: 'sad',           text: 'lost to a team 200k weaker than mine 😭 RNG is brutal' },
    { kind: 'reaction', name: 'Solenne',    sticker: 'love',          text: 'new Yasmine skin is FIRE 🔥 worth every emerald' },
    { kind: 'reaction', name: 'Mochi',      sticker: 'happy',         text: 'guild raid GG, perfect timing team' },
    { kind: 'reaction', name: 'Bjorn',      sticker: 'support',       text: 'reacted to your achievement' },
    { kind: 'reaction', name: 'Astrid',     sticker: 'congratulation',text: 'reacted to your achievement' },
    { kind: 'reaction', name: 'BraveOne',   sticker: 'ok',            text: 'sent a sticker' },
    { kind: 'reaction', name: 'Pixie_Storm',sticker: 'hello',         text: 'sent a sticker' },
    { kind: 'reaction', name: 'Aurelia',    sticker: 'coffee',        text: 'sent a sticker' },
    { kind: 'reaction', name: 'Mirabel',    sticker: 'chabba',        text: 'reacted to guild win' },
    { kind: 'reaction', name: 'Krieger',    sticker: 'shoked',        text: 'reacted to Tydus solo clear' },
  ];

  const MAX_ON_SCREEN = 3;

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Fresh timestamp — always 'X sec ago' or 'Y min ago' (no TODAY / hours)
  function freshTime() {
    if (Math.random() < 0.6) {
      // 3-58 sec ago — feels just-now
      return (3 + Math.floor(Math.random() * 56)) + ' sec ago';
    }
    // 1-45 min ago
    return (1 + Math.floor(Math.random() * 45)) + ' min ago';
  }

  function avatarColor(name) {
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
  }
  function initials(name) {
    const clean = name.replace(/[^a-zA-Z0-9_]/g, '');
    return clean.slice(0, 2).toUpperCase();
  }

  // Name → photo binding (deterministic — same name always uses same avatar)
  const AVATAR_PHOTOS = {
    'Aurelia': 'assets/v8/avatars/aurelia.jpg',
    'Solenne': 'assets/v8/avatars/solenne.jpg',
  };

  // Pre-filtered girl pool: entries where the name has a photo
  const GIRL_PUSHES = TEXTS.concat(STICKER_PUSHES).filter(d => AVATAR_PHOTOS[d.name]);

  // Hard-pinned girl slots — first impressions get specific people
  const EXPLICIT_GIRLS = { 1: 'Solenne', 2: 'Aurelia', 5: 'Aurelia' };

  // After explicit slots, random girls every 3-5 pushes (starting around #8)
  let pushIndex = 0;
  let nextGirlAt = 8;
  function scheduleNextGirl(current) {
    nextGirlAt = current + 3 + Math.floor(Math.random() * 3); // +3..5
  }

  function buildPush() {
    pushIndex += 1;
    let data;
    const explicit = EXPLICIT_GIRLS[pushIndex];
    if (explicit) {
      const matches = GIRL_PUSHES.filter(d => d.name === explicit);
      // Rotate variants so repeats don't show identical content
      data = matches.length ? matches[(pushIndex - 1) % matches.length] : pick(GIRL_PUSHES);
    } else if (pushIndex === nextGirlAt && GIRL_PUSHES.length) {
      data = pick(GIRL_PUSHES);
      scheduleNextGirl(pushIndex);
    } else {
      const wantSticker = Math.random() < 0.32;
      data = pick(wantSticker ? STICKER_PUSHES : TEXTS);
      // Skip girls outside their slot — re-pick if we accidentally hit one
      let retries = 4;
      while (retries-- && AVATAR_PHOTOS[data.name]) {
        data = pick(wantSticker ? STICKER_PUSHES : TEXTS);
      }
    }

    const el = document.createElement('div');
    el.className = 'push push--' + data.kind;

    const photo = AVATAR_PHOTOS[data.name];
    if (photo) el.classList.add('push--has-photo');

    const bar = document.createElement('div'); bar.className = 'push__bar'; el.appendChild(bar);

    const av = document.createElement('div'); av.className = 'push__avatar';
    if (photo) {
      const img = document.createElement('img');
      img.src = photo; img.alt = data.name;
      img.loading = 'lazy'; img.decoding = 'async';
      img.width = 38; img.height = 38;
      av.appendChild(img);
    } else {
      av.style.background = avatarColor(data.name);
      av.textContent = initials(data.name);
    }
    el.appendChild(av);

    const body = document.createElement('div'); body.className = 'push__body';
    const head = document.createElement('div'); head.className = 'push__head';
    const nm = document.createElement('span'); nm.className = 'push__name';
    nm.textContent = data.name;
    if (data.crown) { const cr = document.createElement('span'); cr.className = 'crown'; cr.textContent = '👑'; nm.appendChild(cr); }
    const tm = document.createElement('span'); tm.className = 'push__time';
    tm.textContent = '· ' + freshTime();
    head.appendChild(nm); head.appendChild(tm);
    body.appendChild(head);

    if (data.text) {
      const tx = document.createElement('div'); tx.className = 'push__text';
      tx.innerHTML = data.text;
      body.appendChild(tx);
    }
    const reactions = document.createElement('div'); reactions.className = 'push__reactions';
    body.appendChild(reactions);
    el._kind = data.kind;
    el._reactionsBox = reactions;
    el._hasPhoto = !!photo;
    el.appendChild(body);

    if (data.sticker) {
      const img = document.createElement('img');
      img.className = 'push__sticker';
      img.src = 'assets/v8/stickers/' + data.sticker + '.png';
      img.alt = '';
      img.loading = 'lazy'; img.decoding = 'async';
      img.width = 56; img.height = 56;
      el.appendChild(img);
    } else {
      // Keep grid columns consistent — add empty 4th col
      const filler = document.createElement('span');
      filler.style.width = '0';
      el.appendChild(filler);
    }

    return el;
  }

  let activePushes = [];
  let dismissTimers = new WeakMap();
  let reactionTimers = new WeakMap();

  const REACTIONS = {
    like:   { img: 'assets/reaction-like.png',  emoji: null },
    love:   { img: 'assets/reaction-love.png',  emoji: null },
    fire:   { img: null, emoji: '🔥' },
    swords: { img: null, emoji: '⚔️' },
  };
  const REACT_BIAS = {
    achievement: ['swords', 'fire', 'like', 'love'],
    loot:        ['fire', 'swords', 'love', 'like'],
    guild:       ['like', 'fire', 'swords', 'love'],
    dm:          ['like', 'love', 'fire'],
    reaction:    ['love', 'like', 'fire'],
    joining:     ['like', 'love'],
  };

  function attachReactions(el, kind) {
    const box = el._reactionsBox;
    if (!box) return;
    const hot = !!el._hasPhoto;  // girl avatars get supercharged reactions
    const bias = hot
      ? ['love', 'fire', 'like', 'swords']
      : (REACT_BIAS[kind] || ['like', 'love', 'fire', 'swords']);
    const pool = bias.slice();
    const used = new Map(); // type -> { pill, count }
    const timers = new Set();
    reactionTimers.set(el, timers);

    function makePill(type, startCount) {
      const def = REACTIONS[type];
      const pill = document.createElement('span');
      pill.className = 'reaction-pill reaction-pill--' + type;
      const ic = document.createElement('span');
      ic.className = 'reaction-pill__ic';
      if (def.img) {
        const img = document.createElement('img');
        img.src = def.img; img.alt = '';
        img.loading = 'lazy'; img.decoding = 'async';
        img.width = 14; img.height = 14;
        ic.appendChild(img);
      } else {
        ic.textContent = def.emoji;
      }
      const cnt = document.createElement('span');
      cnt.className = 'reaction-pill__count';
      cnt.textContent = startCount;
      pill.appendChild(ic); pill.appendChild(cnt);
      box.appendChild(pill);
      used.set(type, { pill, cnt, count: startCount });
    }

    function bump(type, delta) {
      const slot = used.get(type);
      if (!slot) return;
      slot.count += delta;
      slot.cnt.textContent = slot.count;
      slot.cnt.classList.remove('is-bumped');
      // Force reflow so animation re-triggers
      void slot.cnt.offsetWidth;
      slot.cnt.classList.add('is-bumped');
    }

    function pickFresh() {
      const remaining = pool.filter(t => !used.has(t));
      if (!remaining.length) return null;
      // Front-of-pool weighted: 65% first, 25% second, 10% rest
      const r = Math.random();
      if (remaining[0] && r < 0.65) return remaining[0];
      if (remaining[1] && r < 0.9)  return remaining[1];
      return remaining[Math.floor(Math.random() * remaining.length)];
    }

    function pickUsed() {
      const arr = Array.from(used.keys());
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function schedule(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    }

    // Tuning per push kind: girl pushes (hot) get high seed counts + bigger
    // bumps + faster cadence + more reactions added overall.
    const tune = hot
      ? { introMin: 22, introRange: 38, bumpMin: 5, bumpRange: 14, addProb: 0.55, contProb: 0.92, delayMin: 500, delayRange: 900 }
      : { introMin: 1,  introRange: 4,  bumpMin: 1, bumpRange: 3,  addProb: 0.40, contProb: 0.70, delayMin: 800, delayRange: 1400 };

    function stepIntro() {
      if (el.classList.contains('is-out')) return;
      const t = pickFresh();
      if (t) makePill(t, tune.introMin + Math.floor(Math.random() * tune.introRange));
      schedule(stepTick, tune.delayMin + Math.random() * tune.delayRange);
    }

    function stepTick() {
      if (el.classList.contains('is-out')) return;
      const addNew = used.size < pool.length && Math.random() < tune.addProb;
      if (addNew) {
        const t = pickFresh();
        if (t) makePill(t, tune.introMin + Math.floor(Math.random() * tune.introRange));
      } else {
        const t = pickUsed();
        if (t) bump(t, tune.bumpMin + Math.floor(Math.random() * tune.bumpRange));
      }
      if (Math.random() < tune.contProb) schedule(stepTick, tune.delayMin + Math.random() * tune.delayRange);
    }

    schedule(stepIntro, hot ? (600 + Math.random() * 500) : (1000 + Math.random() * 800));
  }

  function clearReactionTimers(el) {
    const set = reactionTimers.get(el);
    if (!set) return;
    set.forEach(id => clearTimeout(id));
    set.clear();
  }

  function dismiss(el) {
    if (!el || el.classList.contains('is-out')) return;
    clearTimeout(dismissTimers.get(el));
    clearReactionTimers(el);
    el.classList.add('is-out');
    el.addEventListener('animationend', () => {
      el.remove();
      activePushes = activePushes.filter(p => p !== el);
    }, { once: true });
  }

  function spawn() {
    // Pause spawn while modal is open
    if (document.getElementById('loginModal').classList.contains('is-open')) {
      scheduleNext(1500);
      return;
    }
    const el = buildPush();
    // Insert at the top so freshest is on top
    root.insertBefore(el, root.firstChild);
    activePushes.unshift(el);

    // Click anywhere on the push toggles dock side: top-right ↔ top-left (under logo)
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      root.classList.toggle('is-left');
    });

    // Cap stack
    while (activePushes.length > MAX_ON_SCREEN) {
      const old = activePushes.pop();
      dismiss(old);
    }

    // Auto-dismiss 6-9s
    const life = 6000 + Math.random() * 3000;
    dismissTimers.set(el, setTimeout(() => dismiss(el), life));

    // Reactions sequence
    attachReactions(el, el._kind);

    // Pause auto-dismiss on hover
    el.addEventListener('mouseenter', () => clearTimeout(dismissTimers.get(el)));
    el.addEventListener('mouseleave', () => {
      dismissTimers.set(el, setTimeout(() => dismiss(el), 3500));
    });

    scheduleNext(4000 + Math.random() * 4000);
  }

  function scheduleNext(ms) { setTimeout(spawn, ms); }
  setTimeout(spawn, 2500);
})();
