import { BossAI } from './BossAI.js?v=9';
import { rectangle, group, rasterize } from '../pixelShapes.js?v=9';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInQuart(t) {
  t = clamp(t, 0, 1);
  return t * t * t * t;
}

function easeOutBack(t) {
  t = clamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export class PrologueBoss {
  constructor(world) {
    this.name = 'prologue';
    this.maxHealth = 650;
    this.health = this.maxHealth;

    this.size = 76;
    this.halfSize = this.size / 2;
    this.x = 650;
    this.y = 220;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.rotationSpeed = 52;

    this.scaleX = 1;
    this.scaleY = 1;
    this.dead = false;

    this.idleClock = 0;
    this.figureCenterX = 650;
    this.figureCenterY = 220;
    this.figureWidth = 360;
    this.figureHeight = 82;

    this.trackStartX = this.x;
    this.trackStartY = this.y;
    this.trackTargetX = this.x;
    this.trackTargetY = this.y;

    this.smashStartY = this.y;
    this.smashTargetY = world.floorY - this.halfSize;
    this.lockedSmashX = this.x;
    this.impactPulse = 0;

    this.definition = group([
      rectangle({
        width: this.size / 4,
        height: this.size / 4,
        color: '#777b82',
      }),
    ], {
      mergeOutlines: true,
      outline: { enabled: true, color: '#15171b', thickness: 1 },
      padding: 2,
    });

    this.rasterCache = new Map();

    this.ai = new BossAI(this, {
      initialState: 'idle',
      phases: [
        { id: 'phase1', atOrBelow: 1.0 },
      ],
    });

    this.installStates(world);
  }

  installStates(world) {
    this.ai
      .addState('idle', {
        enter: (owner, ai) => {
          owner.scaleX = 1;
          owner.scaleY = 1;
          owner.rotationSpeed = 52;
          ai.setTimer('attackDelay', 3.6 + Math.random() * 2.2);
        },

        update: (owner, ai, dt, ctx) => {
          owner.idleClock += dt;

          // Lissajous figure-eight. The doubled Y frequency produces the
          // sideways infinity path while a tiny secondary sine keeps it organic.
          const t = owner.idleClock * 0.78;
          const targetX = owner.figureCenterX + Math.sin(t) * owner.figureWidth;
          const targetY =
            owner.figureCenterY +
            Math.sin(t * 2) * owner.figureHeight +
            Math.sin(t * 0.53) * 10;

          // Exponential-like following gives the path a little drag and weight.
          const follow = 1 - Math.exp(-4.2 * dt);
          owner.x = lerp(owner.x, targetX, follow);
          owner.y = lerp(owner.y, targetY, follow);

          const breathe = Math.sin(owner.idleClock * 2.2) * 0.018;
          owner.scaleX = 1 + breathe;
          owner.scaleY = 1 - breathe;

          if (ai.timerDone('attackDelay')) {
            ai.changeState('track', ctx);
          }
        },
      })
      .addState('track', {
        enter: (owner) => {
          owner.trackStartX = owner.x;
          owner.trackStartY = owner.y;
          owner.rotationSpeed = 68;
        },

        update: (owner, ai, dt, ctx) => {
          const player = ai.targetPlayer(ctx);
          if (!player) return;

          // The target keeps following the player, but the boss follows that
          // target slowly enough to telegraph what it is about to do.
          owner.trackTargetX = clamp(player.x, owner.halfSize + 20, world.width - owner.halfSize - 20);
          owner.trackTargetY = clamp(player.y - 235, 120, 300);

          const follow = 1 - Math.exp(-2.2 * dt);
          owner.x = lerp(owner.x, owner.trackTargetX, follow);
          owner.y = lerp(owner.y, owner.trackTargetY, follow);

          // Slow vertical float while tracking keeps it alive visually.
          owner.y += Math.sin(ai.stateTime * 4.0) * 0.22;

          const settle = smoothstep(ai.stateTime / 1.15);
          owner.scaleX = lerp(1.04, 1, settle);
          owner.scaleY = lerp(0.96, 1, settle);

          if (ai.stateTime >= 1.25) {
            ai.changeState('anticipate', ctx);
          }
        },
      })
      .addState('anticipate', {
        enter: (owner, ai, ctx) => {
          const player = ai.targetPlayer(ctx);
          owner.lockedSmashX = player
            ? clamp(player.x, owner.halfSize + 8, world.width - owner.halfSize - 8)
            : owner.x;

          owner.trackStartX = owner.x;
          owner.trackStartY = owner.y;
          owner.rotationSpeed = 92;
        },

        update: (owner, ai, dt) => {
          const t = clamp(ai.stateTime / 0.48, 0, 1);
          const eased = smoothstep(t);

          // Anticipation: drift into alignment, rise slightly, then compress.
          owner.x = lerp(owner.trackStartX, owner.lockedSmashX, eased);
          owner.y = owner.trackStartY - Math.sin(t * Math.PI) * 32;

          owner.scaleX = 1 + 0.12 * eased;
          owner.scaleY = 1 - 0.16 * eased;

          if (t >= 1) {
            ai.changeState('smash', { world });
          }
        },
      })
      .addState('smash', {
        enter: (owner) => {
          owner.smashStartY = owner.y;
          owner.smashTargetY = world.floorY - owner.halfSize;
          owner.rotationSpeed = 260;
          owner.scaleX = 0.86;
          owner.scaleY = 1.18;
        },

        update: (owner, ai) => {
          const duration = 0.30;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const fall = easeInQuart(t);

          owner.x = owner.lockedSmashX;
          owner.y = lerp(owner.smashStartY, owner.smashTargetY, fall);

          // Stretch into the movement, then snap toward square at impact.
          owner.scaleX = lerp(0.84, 0.96, t);
          owner.scaleY = lerp(1.20, 1.04, t);

          if (t >= 1) {
            owner.impactPulse = 1;
            ai.changeState('impact', { world });
          }
        },
      })
      .addState('impact', {
        enter: (owner) => {
          owner.rotationSpeed = 80;
        },

        update: (owner, ai) => {
          const duration = 0.42;
          const t = clamp(ai.stateTime / duration, 0, 1);

          // Impact squash followed by a damped bounce. This is follow-through,
          // not another attack, and keeps the landing from feeling mechanical.
          const squash = Math.exp(-8 * t);
          const bounce = Math.sin(t * Math.PI * 2.25) * Math.exp(-4.5 * t);

          owner.y = owner.smashTargetY - Math.max(0, bounce) * 38;
          owner.scaleX = 1 + squash * 0.24;
          owner.scaleY = 1 - squash * 0.22;

          if (t >= 1) {
            ai.changeState('recover', { world });
          }
        },
      })
      .addState('recover', {
        enter: (owner) => {
          owner.trackStartX = owner.x;
          owner.trackStartY = owner.y;
          owner.rotationSpeed = 60;
        },

        update: (owner, ai) => {
          const duration = 0.85;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const eased = easeOutBack(t);

          // Rejoin the idle figure-eight smoothly rather than snapping back.
          const idleT = owner.idleClock * 0.78;
          const targetX = owner.figureCenterX + Math.sin(idleT) * owner.figureWidth;
          const targetY =
            owner.figureCenterY +
            Math.sin(idleT * 2) * owner.figureHeight;

          owner.x = lerp(owner.trackStartX, targetX, eased);
          owner.y = lerp(owner.trackStartY, targetY, eased);
          owner.scaleX = lerp(1.08, 1, smoothstep(t));
          owner.scaleY = lerp(0.92, 1, smoothstep(t));

          if (t >= 1) {
            ai.changeState('idle');
          }
        },
      });
  }

  reset(world) {
    this.health = this.maxHealth;
    this.dead = false;
    this.x = 650;
    this.y = 220;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.rotationSpeed = 52;
    this.scaleX = 1;
    this.scaleY = 1;
    this.idleClock = 0;
    this.smashTargetY = world.floorY - this.halfSize;
    this.impactPulse = 0;

    this.ai.stateName = null;
    this.ai.stateTime = 0;
    this.ai.cooldowns.clear();
    this.ai.timers.clear();
    this.ai.phaseId = null;
    this.ai.changeState('idle');
  }

  update(dt, context) {
    if (this.dead) return;

    this.rotation = (this.rotation + this.rotationSpeed * dt) % 360;
    this.impactPulse = Math.max(0, this.impactPulse - dt * 4);

    this.ai.update(dt, context);
  }

  takeDamage(amount) {
    if (this.dead || amount <= 0) return;

    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.dead = true;
      this.scaleX = 1;
      this.scaleY = 1;
    }
  }

  hitTest(x, y, radius = 0) {
    if (this.dead) return false;

    // Conservative circle around the rotating square. Good enough for current
    // projectile testing, and it avoids angle-dependent hitbox glitches.
    const hitRadius = this.halfSize * 0.92 + radius;
    return Math.hypot(x - this.x, y - this.y) <= hitRadius;
  }

  get healthRatio() {
    return this.health / this.maxHealth;
  }

  getRaster() {
    // Quantize only the visual cache angle. Physics/AI remain continuous.
    const angle = Math.round(this.rotation / 3) * 3 % 360;

    if (!this.rasterCache.has(angle)) {
      this.rasterCache.set(angle, rasterize(this.definition, angle));
    }

    return this.rasterCache.get(angle);
  }

  draw(ctx, cameraX, artPixelSize) {
    if (this.dead) return;

    const raster = this.getRaster();
    const dw = raster.width * artPixelSize;
    const dh = raster.height * artPixelSize;

    ctx.save();
    ctx.translate(Math.round(this.x - cameraX), Math.round(this.y));
    ctx.scale(this.scaleX, this.scaleY);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      raster,
      Math.round(-dw / 2),
      Math.round(-dh / 2),
      dw,
      dh,
    );
    ctx.restore();
  }
}
