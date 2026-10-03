export class WeaponRuntime {
  constructor(entries = {}) {
    this.entries =
      new Map(
        Object.entries(entries),
      );

    this.shotAudio = new Map([
      ['vector', 'vector'],
      ['horizon', 'horizon'],
      ['relay', 'default'],
      ['parallax', 'default'],
      ['anchor', 'default'],
      ['kepler', 'default'],
    ]);
  }

  get(id) {
    return (
      this.entries.get(id) ??
      null
    );
  }

  has(id) {
    return this.entries.has(id);
  }

  values() {
    return [
      ...this.entries.values(),
    ];
  }

  resetAll() {
    for (
      const weapon
      of this.entries.values()
    ) {
      weapon?.reset?.();
    }
  }

  triggerSpecial(
    id,
    context,
  ) {
    return (
      this.get(id)
        ?.triggerSpecial?.(
          context,
        ) ??
      false
    );
  }

  captureShotSerials() {
    const snapshot = {};

    for (
      const [id, weapon]
      of this.entries
    ) {
      if (
        Number.isFinite(
          weapon?.shotSerial,
        )
      ) {
        snapshot[id] =
          weapon.shotSerial;
      }
    }

    return snapshot;
  }

  playShotAudio(
    before,
    audio,
  ) {
    if (!audio) return;

    for (
      const [id, sound]
      of this.shotAudio
    ) {
      const weapon =
        this.get(id);

      const previous =
        before?.[id] ?? 0;

      const current =
        weapon?.shotSerial ?? 0;

      const count =
        Math.max(
          0,
          current - previous,
        );

      for (
        let i = 0;
        i < count;
        i++
      ) {
        audio.playShot(sound);
      }
    }
  }

  updateAll({
    dt,
    player,
    pointerWorld,
    firing,
    world,
    target,
    artPixel,
    activeId,
    resolveHit = null,
  }) {
    const active =
      id =>
        activeId === id;

    const vector =
      this.get('vector');

    vector?.update?.(
      dt,
      player,
      pointerWorld,
      active('vector') &&
        firing,
      world,
      active('vector'),
    );

    vector
      ?.applyHitsToTarget?.(
        target,
        artPixel,
      );

    this.get('euclid')
      ?.update?.(
        dt,
        player,
        pointerWorld,
        active('euclid') &&
          firing,
        target,
        artPixel,
        active('euclid'),
      );

    this.get('horizon')
      ?.update?.(
        dt,
        player,
        pointerWorld,
        active('horizon') &&
          firing,
        target,
        artPixel,
        active('horizon'),
        {
          resolveHit,
        },
      );

    this.get('mach')
      ?.update?.(
        dt,
        player,
        pointerWorld,
        active('mach') &&
          firing,
        target,
        active('mach'),
        {
          resolveHit,
        },
      );

    for (
      const id
      of [
        'relay',
        'parallax',
        'anchor',
      ]
    ) {
      this.get(id)
        ?.update?.(
          dt,
          player,
          pointerWorld,
          active(id) &&
            firing,
          world,
          target,
          artPixel,
          active(id),
          {
            resolveHit,
          },
        );
    }

    this.get('kepler')
      ?.update?.(
        dt,
        player,
        pointerWorld,
        active('kepler') &&
          firing,
        world,
        target,
        active('kepler'),
      );
  }

  drawAll({
    ctx,
    player,
    pointerWorld,
    cameraX = 0,
    artPixel,
    activeId,
  }) {
    const vector =
      this.get('vector');

    if (activeId === 'vector') {
      vector?.draw?.(
        ctx,
        player,
        pointerWorld,
        cameraX,
        artPixel,
      );
    } else {
      vector
        ?.drawBullets?.(
          ctx,
          cameraX,
          artPixel,
        );
    }

    if (activeId === 'euclid') {
      this.get('euclid')
        ?.draw?.(
          ctx,
          player,
          pointerWorld,
          cameraX,
          artPixel,
        );
    }

    const horizon =
      this.get('horizon');

    if (activeId === 'horizon') {
      horizon?.draw?.(
        ctx,
        player,
        pointerWorld,
        cameraX,
        artPixel,
      );
    } else {
      horizon
        ?.drawSpecialProjectiles?.(
          ctx,
          cameraX,
        );
    }

    const mach =
      this.get('mach');

    if (activeId === 'mach') {
      mach?.draw?.(
        ctx,
        player,
        pointerWorld,
        cameraX,
        artPixel,
      );
    } else {
      mach
        ?.drawWaves?.(
          ctx,
          cameraX,
        );
    }

    for (
      const id
      of [
        'relay',
        'parallax',
        'anchor',
        'kepler',
      ]
    ) {
      this.get(id)
        ?.draw?.(
          ctx,
          player,
          pointerWorld,
          cameraX,
          artPixel,
          activeId === id,
        );
    }
  }

  getPreviewEntry(
    id,
    angleRadians = 0,
    centered = false,
  ) {
    return (
      this.get(id)
        ?.getSpriteEntry?.(
          angleRadians,
          centered,
        ) ??
      null
    );
  }

  locksPlayer(activeId) {
    const active =
      this.get(activeId);

    const mach =
      this.get('mach');

    return (
      !!active?.locksPlayer ||
      !!mach?.locksPlayer
    );
  }

  syncLoopAudio({
    activeId,
    currentScreen,
    encounterOver,
    firing,
    audio,
  }) {
    if (!audio) return;

    if (
      currentScreen !== 'game' ||
      encounterOver
    ) {
      audio.stopWeaponLoops();
      return;
    }

    const euclid =
      this.get('euclid');

    const mach =
      this.get('mach');

    const euclidSpecial =
      activeId === 'euclid' &&
      euclid?.specialActiveTimer > 0;

    audio.setLoop(
      'euclidSpecial',
      euclidSpecial,
    );

    audio.setLoop(
      'euclidShoot',
      activeId === 'euclid' &&
        !!euclid?.firing &&
        !euclidSpecial,
    );

    audio.setLoop(
      'machShoot',
      activeId === 'mach' &&
        firing &&
        (
          mach?.specialActiveTimer ??
          0
        ) <= 0,
    );
  }
}
