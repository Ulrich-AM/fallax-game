function clamp(
  value,
  min,
  max,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function easeOutCubic(t) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function drawImpactRing(
  ctx,
  effect,
  {
    cameraX = 0,
  } = {},
) {
  const progress =
    clamp(
      effect.age /
      effect.duration,
      0,
      1,
    );

  const radius =
    effect.startRadius +
    (
      effect.endRadius -
      effect.startRadius
    ) *
    easeOutCubic(progress);

  const alpha =
    Math.pow(
      1 - progress,
      effect.fadePower,
    );

  ctx.save();
  ctx.globalAlpha =
    alpha *
    effect.alpha;

  ctx.strokeStyle =
    effect.color;

  ctx.lineWidth =
    effect.lineWidth *
    (
      0.45 +
      0.55 *
      alpha
    );

  if (effect.glow > 0) {
    ctx.shadowColor =
      effect.glowColor;
    ctx.shadowBlur =
      effect.glow;
  }

  ctx.beginPath();
  ctx.arc(
    Math.round(
      effect.x -
      cameraX,
    ),
    Math.round(
      effect.y,
    ),
    radius,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.restore();
}

function drawFlareGlow(
  ctx,
  effect,
  {
    cameraX = 0,
  } = {},
) {
  const progress =
    clamp(
      effect.age /
      effect.duration,
      0,
      1,
    );

  const alpha =
    (1 - progress) *
    effect.alpha;

  const radius =
    effect.startRadius +
    (
      effect.endRadius -
      effect.startRadius
    ) *
    easeOutCubic(progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation =
    effect.composite;

  const gradient =
    ctx.createRadialGradient(
      effect.x - cameraX,
      effect.y,
      0,
      effect.x - cameraX,
      effect.y,
      radius,
    );

  gradient.addColorStop(
    0,
    effect.innerColor,
  );

  gradient.addColorStop(
    1,
    effect.outerColor,
  );

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(
    effect.x - cameraX,
    effect.y,
    radius,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

const BUILTIN_EFFECTS = {
  'impact-ring': {
    layer: 'world',
    init(effect, options) {
      const scale =
        Math.max(
          0.05,
          Number(
            options.scale ?? 1,
          ) || 1,
        );

      effect.x =
        Number(options.x) || 0;
      effect.y =
        Number(options.y) || 0;

      effect.duration =
        Math.max(
          0.02,
          Number(
            options.duration ??
            0.22,
          ) || 0.22,
        );

      effect.startRadius =
        Math.max(
          0,
          Number(
            options.startRadius ??
            3 * scale,
          ) || 0,
        );

      effect.endRadius =
        Math.max(
          effect.startRadius,
          Number(
            options.endRadius ??
            42 * scale,
          ) ||
          42 * scale,
        );

      effect.lineWidth =
        Math.max(
          0.25,
          Number(
            options.lineWidth ??
            4 * scale,
          ) ||
          4 * scale,
        );

      effect.color =
        options.color ??
        '#ffffff';

      effect.glowColor =
        options.glowColor ??
        effect.color;

      effect.glow =
        Math.max(
          0,
          Number(
            options.glow ?? 22,
          ) || 0,
        );

      effect.alpha =
        clamp(
          Number(
            options.alpha ?? 1,
          ) || 1,
          0,
          1,
        );

      effect.fadePower =
        Math.max(
          0.1,
          Number(
            options.fadePower ??
            1.35,
          ) || 1.35,
        );
    },
    draw: drawImpactRing,
  },

  'flare-glow': {
    layer: 'world',
    init(effect, options) {
      effect.x =
        Number(options.x) || 0;
      effect.y =
        Number(options.y) || 0;

      effect.duration =
        Math.max(
          0.02,
          Number(
            options.duration ??
            0.18,
          ) || 0.18,
        );

      effect.startRadius =
        Math.max(
          0,
          Number(
            options.startRadius ??
            4,
          ) || 0,
        );

      effect.endRadius =
        Math.max(
          effect.startRadius,
          Number(
            options.endRadius ??
            46,
          ) || 46,
        );

      effect.innerColor =
        options.innerColor ??
        'rgba(255,255,255,0.95)';

      effect.outerColor =
        options.outerColor ??
        'rgba(255,255,255,0)';

      effect.alpha =
        clamp(
          Number(
            options.alpha ?? 1,
          ) || 1,
          0,
          1,
        );

      effect.composite =
        options.composite ??
        'lighter';
    },
    draw: drawFlareGlow,
  },
};

export class EffectsLibrary {
  constructor() {
    this.definitions =
      new Map();

    this.active = [];
    this.pool = [];
    this.serial = 0;

    for (
      const [
        id,
        definition,
      ]
      of Object.entries(
        BUILTIN_EFFECTS,
      )
    ) {
      this.register(
        id,
        definition,
      );
    }
  }

  register(
    id,
    definition,
  ) {
    if (
      !id ||
      !definition ||
      typeof definition.init !==
        'function' ||
      typeof definition.draw !==
        'function'
    ) {
      return false;
    }

    this.definitions.set(
      String(id),
      {
        layer:
          definition.layer ===
          'screen'
            ? 'screen'
            : 'world',
        init:
          definition.init,
        update:
          typeof definition.update ===
          'function'
            ? definition.update
            : null,
        draw:
          definition.draw,
      },
    );

    return true;
  }

  has(id) {
    return this.definitions.has(
      String(id),
    );
  }

  spawn(
    id,
    options = {},
  ) {
    const key =
      String(id);

    const definition =
      this.definitions.get(key);

    if (!definition) {
      return null;
    }

    const effect =
      this.pool.pop() ??
      {};

    for (
      const property
      of Object.keys(effect)
    ) {
      delete effect[property];
    }

    effect.id =
      ++this.serial;
    effect.type = key;
    effect.layer =
      definition.layer;
    effect.age = 0;
    effect.duration = 0.1;

    definition.init(
      effect,
      options,
    );

    this.active.push(effect);

    return effect.id;
  }

  clear() {
    while (
      this.active.length > 0
    ) {
      this.recycle(
        this.active.pop(),
      );
    }
  }

  recycle(effect) {
    if (!effect) return;

    if (
      this.pool.length < 256
    ) {
      this.pool.push(effect);
    }
  }

  update(dt) {
    for (
      let i =
        this.active.length - 1;
      i >= 0;
      i--
    ) {
      const effect =
        this.active[i];

      const definition =
        this.definitions.get(
          effect.type,
        );

      if (!definition) {
        this.active.splice(
          i,
          1,
        );

        this.recycle(effect);
        continue;
      }

      effect.age += dt;

      definition.update?.(
        effect,
        dt,
      );

      if (
        effect.age >=
        effect.duration
      ) {
        this.active.splice(
          i,
          1,
        );

        this.recycle(effect);
      }
    }
  }

  drawLayer(
    layer,
    ctx,
    context = {},
  ) {
    for (
      const effect
      of this.active
    ) {
      if (
        effect.layer !==
        layer
      ) {
        continue;
      }

      const definition =
        this.definitions.get(
          effect.type,
        );

      definition?.draw?.(
        ctx,
        effect,
        context,
      );
    }
  }

  drawWorld(
    ctx,
    cameraX = 0,
  ) {
    this.drawLayer(
      'world',
      ctx,
      {
        cameraX,
      },
    );
  }

  drawScreen(
    ctx,
    width,
    height,
  ) {
    this.drawLayer(
      'screen',
      ctx,
      {
        width,
        height,
      },
    );
  }
}
