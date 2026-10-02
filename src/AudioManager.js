const PATHS = {
  themeMainmenu: 'audio/theme-mainmenu.mp3',
  themePrologue: 'audio/theme-prologue.mp3',
  themeMatrix: 'audio/theme-matrix.mp3',
  themeMonolith: 'audio/theme-monolith.mp3',
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
  themeMonolith: 0.46,
  vectorShoot: 0.62,
  machShoot: 0.54,
  horizonShoot: 0.68,
  euclidShoot: 0.48,
  euclidSpecial: 0.58,
  defaultBullet: 0.52,
  defaultBoom: 0.62,
  buttonHover: 0.34,
};

const THEME_AUDIO_KEYS = {
  mainmenu: 'themeMainmenu',
  prologue: 'themePrologue',
  matrix: 'themeMatrix',
  monolith: 'themeMonolith',
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
    this.suspended = false;
    this.themeKey = null;
    this.currentThemeKey = null;

    // Music uses decoded Web Audio buffers when available. AudioBufferSourceNode
    // looping is sample-accurate and avoids the small MP3 media-element seam.
    this.musicContext = null;
    this.musicGain = null;
    this.themeSource = null;
    this.themeBuffers =
      new Map();
    this.themeBufferPromises =
      new Map();
    this.themeStartSerial = 0;
    this.pendingThemeKey = null;

    this.themes = {
      mainmenu: makeAudio('themeMainmenu', true),
      prologue: makeAudio('themePrologue', true),
      matrix: makeAudio('themeMatrix', true),
      monolith: makeAudio('themeMonolith', true),
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

  ensureMusicContext() {
    if (this.musicContext) {
      return this.musicContext;
    }

    const AudioContextClass =
      globalThis.AudioContext ??
      globalThis.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    try {
      this.musicContext =
        new AudioContextClass();

      this.musicGain =
        this.musicContext
          .createGain();

      this.musicGain
        .connect(
          this.musicContext
            .destination,
        );

      return this.musicContext;
    } catch {
      this.musicContext = null;
      this.musicGain = null;
      return null;
    }
  }

  loadThemeBuffer(key) {
    const cached =
      this.themeBuffers.get(
        key,
      );

    if (cached) {
      return Promise.resolve(
        cached,
      );
    }

    const pending =
      this.themeBufferPromises
        .get(key);

    if (pending) {
      return pending;
    }

    const context =
      this.ensureMusicContext();

    const audioKey =
      THEME_AUDIO_KEYS[key];

    if (
      !context ||
      !audioKey
    ) {
      return Promise.resolve(
        null,
      );
    }

    const promise =
      fetch(
        PATHS[audioKey],
      )
        .then(response => {
          if (!response.ok) {
            throw new Error(
              'theme fetch failed',
            );
          }

          return response
            .arrayBuffer();
        })
        .then(bytes =>
          context.decodeAudioData(
            bytes,
          ),
        )
        .then(buffer => {
          this.themeBuffers.set(
            key,
            buffer,
          );

          this.themeBufferPromises
            .delete(key);

          return buffer;
        })
        .catch(() => {
          this.themeBufferPromises
            .delete(key);

          return null;
        });

    this.themeBufferPromises
      .set(
        key,
        promise,
      );

    return promise;
  }

  stopBufferedTheme() {
    this.themeStartSerial++;
    this.pendingThemeKey = null;

    if (!this.themeSource) {
      return;
    }

    try {
      this.themeSource.stop();
    } catch {
      // Source may already have stopped.
    }

    try {
      this.themeSource
        .disconnect();
    } catch {
      // Ignore already-disconnected sources.
    }

    this.themeSource = null;
  }

  startBufferedTheme(
    key,
    buffer,
    serial,
  ) {
    if (
      !buffer ||
      !this.musicContext ||
      !this.musicGain ||
      serial !==
        this.themeStartSerial ||
      this.themeKey !== key ||
      this.suspended ||
      !this.unlocked
    ) {
      return false;
    }

    if (this.themeSource) {
      try {
        this.themeSource.stop();
      } catch {
        // Ignore already-stopped sources.
      }

      try {
        this.themeSource
          .disconnect();
      } catch {
        // Ignore already-disconnected sources.
      }
    }

    const source =
      this.musicContext
        .createBufferSource();

    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd =
      buffer.duration;

    const audioKey =
      THEME_AUDIO_KEYS[key];

    this.musicGain.gain.value =
      VOLUMES[audioKey] ??
      1;

    source.connect(
      this.musicGain,
    );

    source.start(0);

    this.themeSource = source;
    this.currentThemeKey = key;
    this.pendingThemeKey = null;

    for (
      const audio
      of Object.values(
        this.themes,
      )
    ) {
      audio.pause();
    }

    return true;
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    const context =
      this.ensureMusicContext();

    if (
      context &&
      context.state ===
        'suspended'
    ) {
      context
        .resume()
        .catch(() => {});
    }

    if (!this.suspended) {
      this.syncTheme();
    }

    for (const [key, active] of this.loopStates) {
      if (active && !this.suspended) {
        this.startLoop(key);
      }
    }
  }

  setTheme(key) {
    if (this.themeKey === key) {
      this.syncTheme();
      return;
    }

    this.stopBufferedTheme();

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
    if (
      this.suspended ||
      !this.unlocked ||
      !this.themeKey
    ) {
      return;
    }

    const key =
      this.themeKey;

    const context =
      this.ensureMusicContext();

    if (context) {
      if (
        context.state ===
          'suspended'
      ) {
        context
          .resume()
          .catch(() => {});
      }

      if (
        this.themeSource &&
        this.currentThemeKey ===
          key
      ) {
        return;
      }

      if (
        this.pendingThemeKey ===
          key
      ) {
        return;
      }

      this.pendingThemeKey = key;

      const serial =
        ++this.themeStartSerial;

      this.loadThemeBuffer(
        key,
      ).then(buffer => {
        if (
          this.startBufferedTheme(
            key,
            buffer,
            serial,
          )
        ) {
          return;
        }

        // If decoding is unavailable, retain the old HTMLAudio fallback.
        if (
          serial !==
            this.themeStartSerial ||
          this.themeKey !==
            key ||
          this.suspended
        ) {
          return;
        }

        this.pendingThemeKey = null;

        const audio =
          this.themes[key];

        if (!audio) {
          return;
        }

        if (
          this.currentThemeKey !==
            key
        ) {
          audio.currentTime = 0;
          this.currentThemeKey =
            key;
        }

        if (audio.paused) {
          audio
            .play()
            .catch(() => {});
        }
      });

      return;
    }

    const audio =
      this.themes[key];

    if (!audio) return;

    if (
      this.currentThemeKey !==
      key
    ) {
      audio.currentTime = 0;
      this.currentThemeKey =
        key;
    }

    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }

  setLoop(key, active) {
    const next = !!active;
    const previous =
      this.loopStates.get(key) ?? false;

    // syncWeaponAudio runs from the fixed 120 Hz simulation. Avoid touching
    // HTMLAudioElement state unless the requested loop state actually changed.
    if (previous === next) return;

    this.loopStates.set(key, next);

    if (!next) {
      this.stopLoop(key);
      return;
    }

    if (
      this.unlocked &&
      !this.suspended
    ) {
      this.startLoop(key);
    }
  }

  startLoop(key) {
    if (this.suspended) return;

    const audio = this.loops[key];
    if (!audio || !audio.paused) return;
    audio.play().catch(() => {});
  }

  stopLoop(key) {
    const audio = this.loops[key];
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
    }

    // Seeking a media element can trigger browser/media work. Only reset a
    // loop when it has actually advanced instead of doing this every tick.
    if (audio.currentTime > 0) {
      try {
        audio.currentTime = 0;
      } catch {
        // Ignore browsers that reject a seek before metadata is ready.
      }
    }
  }

  setSuspended(suspended) {
    const next = !!suspended;

    if (this.suspended === next) {
      return;
    }

    this.suspended = next;

    if (next) {
      if (
        this.musicContext &&
        this.musicContext.state ===
          'running'
      ) {
        this.musicContext
          .suspend()
          .catch(() => {});
      }
      for (
        const audio
        of Object.values(this.themes)
      ) {
        audio.pause();
      }

      for (
        const audio
        of Object.values(this.loops)
      ) {
        audio.pause();
      }

      return;
    }

    if (
      this.musicContext &&
      this.musicContext.state ===
        'suspended'
    ) {
      this.musicContext
        .resume()
        .then(() =>
          this.syncTheme(),
        )
        .catch(() =>
          this.syncTheme(),
        );
    } else {
      this.syncTheme();
    }

    for (
      const [key, active]
      of this.loopStates
    ) {
      if (active) {
        this.startLoop(key);
      }
    }
  }

  stopWeaponLoops() {
    for (const key of Object.keys(this.loops)) {
      this.setLoop(key, false);
    }
  }

  playOneShot(key, volumeMultiplier = 1) {
    if (
      this.suspended ||
      !this.unlocked
    ) {
      return false;
    }

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
