const PATHS = {
  themeMainmenu: 'audio/theme-mainmenu.mp3',
  themePrologue: 'audio/theme-prologue.mp3',
  themeMatrix: 'audio/theme-matrix.mp3',
  vectorShoot: 'audio/gun-vectorshoot.mp3',
  machShoot: 'audio/gun-machshoot.mp3',
  horizonShoot: 'audio/gun-horizonshoot.mp3',
  euclidShoot: 'audio/gun-euclidshoot.mp3',
  euclidSpecial: 'audio/gun-euclidspecial.mp3',
  defaultBullet: 'audio/fx-defaultbullet.mp3',
  defaultBoom: 'audio/fx-defaultboom.mp3',
  buttonHover: 'audio/ambience-buttonhover.mp3',
};

const VOLUMES = {
  themeMainmenu: 0.42,
  themePrologue: 0.46,
  themeMatrix: 0.46,
  vectorShoot: 0.62,
  machShoot: 0.54,
  horizonShoot: 0.68,
  euclidShoot: 0.48,
  euclidSpecial: 0.58,
  defaultBullet: 0.52,
  defaultBoom: 0.62,
  buttonHover: 0.34,
};

// Fixed pools prevent rapid-fire weapons from allocating a new HTMLAudioElement
// for every projectile. The minimum interval also stops dense bullet patterns
// from asking the browser to mix dozens of near-identical sounds per second.
const ONE_SHOT_CONFIG = {
  vectorShoot: {
    voices: 5,
    minIntervalMs: 28,
  },
  horizonShoot: {
    voices: 2,
    minIntervalMs: 55,
  },
  defaultBullet: {
    voices: 4,
    minIntervalMs: 70,
  },
  defaultBoom: {
    voices: 3,
    minIntervalMs: 90,
  },
  buttonHover: {
    voices: 1,
    minIntervalMs: 55,
  },
};

function makeAudio(key, loop = false) {
  const audio = new Audio(PATHS[key]);
  audio.preload = 'auto';
  audio.loop = loop;
  audio.volume = VOLUMES[key] ?? 1;
  return audio;
}

function makePool(key, config) {
  const voices = [];

  for (let i = 0; i < config.voices; i++) {
    voices.push(makeAudio(key));
  }

  return {
    voices,
    cursor: 0,
    lastPlayedAt: -Infinity,
    minIntervalMs: config.minIntervalMs,
  };
}

export class GameAudio {
  constructor() {
    this.unlocked = false;
    this.themeKey = null;
    this.currentThemeKey = null;

    this.themes = {
      mainmenu: makeAudio('themeMainmenu', true),
      prologue: makeAudio('themePrologue', true),
      matrix: makeAudio('themeMatrix', true),
    };

    this.loops = {
      machShoot: makeAudio('machShoot', true),
      euclidShoot: makeAudio('euclidShoot', true),
      euclidSpecial: makeAudio('euclidSpecial', true),
    };

    this.oneShotPools = {};

    for (const [key, config] of Object.entries(ONE_SHOT_CONFIG)) {
      this.oneShotPools[key] = makePool(key, config);
    }

    this.loopStates = new Map();
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.syncTheme();

    for (const [key, active] of this.loopStates) {
      if (active) this.startLoop(key);
    }
  }

  setTheme(key) {
    if (this.themeKey === key) {
      this.syncTheme();
      return;
    }

    this.themeKey = key;

    for (const [name, audio] of Object.entries(this.themes)) {
      if (name === key) continue;
      audio.pause();
      audio.currentTime = 0;
    }

    this.currentThemeKey = null;
    this.syncTheme();
  }

  syncTheme() {
    if (!this.unlocked || !this.themeKey) return;

    const audio = this.themes[this.themeKey];
    if (!audio) return;

    if (this.currentThemeKey !== this.themeKey) {
      audio.currentTime = 0;
      this.currentThemeKey = this.themeKey;
    }

    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }

  setLoop(key, active) {
    this.loopStates.set(key, !!active);

    if (!active) {
      this.stopLoop(key);
      return;
    }

    if (this.unlocked) {
      this.startLoop(key);
    }
  }

  startLoop(key) {
    const audio = this.loops[key];
    if (!audio || !audio.paused) return;
    audio.play().catch(() => {});
  }

  stopLoop(key) {
    const audio = this.loops[key];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  stopWeaponLoops() {
    for (const key of Object.keys(this.loops)) {
      this.loopStates.set(key, false);
      this.stopLoop(key);
    }
  }

  playOneShot(key, volumeMultiplier = 1) {
    if (!this.unlocked) return false;

    const pool = this.oneShotPools[key];
    if (!pool) return false;

    const now = performance.now();

    if (
      now - pool.lastPlayedAt <
      pool.minIntervalMs
    ) {
      return false;
    }

    pool.lastPlayedAt = now;

    let audio = pool.voices.find(
      voice => voice.paused || voice.ended,
    );

    if (!audio) {
      audio = pool.voices[pool.cursor];
      pool.cursor =
        (pool.cursor + 1) %
        pool.voices.length;
      audio.pause();
    }

    try {
      audio.currentTime = 0;
    } catch {
      // Some browsers can reject a seek before metadata is ready.
    }

    audio.volume = Math.max(
      0,
      Math.min(
        1,
        (VOLUMES[key] ?? 1) *
        volumeMultiplier,
      ),
    );

    audio.play().catch(() => {});
    return true;
  }

  playShot(kind = 'default') {
    if (kind === 'vector') {
      this.playOneShot('vectorShoot');
    } else if (kind === 'horizon') {
      this.playOneShot('horizonShoot');
    } else {
      this.playOneShot('defaultBullet');
    }
  }

  playBoom() {
    this.playOneShot('defaultBoom');
  }

  playHover() {
    this.playOneShot('buttonHover');
  }
}
