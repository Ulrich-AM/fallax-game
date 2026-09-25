import { BossAI } from './BossAI.js?v=10';
import { rectangle, group, rasterize } from '../pixelShapes.js?v=10';

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

function shortestAngleDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function lerpAngle(from, to, t) {
  return from + shortestAngleDelta(from, to) * t;
}

export class PrologueBoss {
  constructor(world) {
    this.name = 'prologue';
    this.maxHealth = 650;
    this.health = this.maxHealth;

    // Considerably larger than the original prototype.
    this.size = 132;
    this.halfSize = this.size / 2;
    this.baseColor = '#777b82';
    this.outlineColor = '#494c52';

    this.x = 650;
    this.y = 210;
    this.vx = 0;
    this.vy = 0;

    this.rotation = 0;
    this.rotationSpeed = 52;
    this.rotationLocked = false;
    this.lockedRotation = 0;
    this.anticipateStartRotation = 0;

    this.scaleX = 1;
    this.scaleY = 1;
    this.dead = false;

    this.idleClock = 0;
    this.figureCenterX = 650;
    this.figureCenterY = 205;
    this.figureWidth = 325;
    this.figureHeight = 74;

    this.trackStartX = this.x;
    this.trackStartY = this.y;
    this.trackTargetX = this.x;
    this.trackTargetY = this.y;

    this.smashStartY = this.y;
    this.smashTargetY = world.floorY - this.halfSize;
    this.lockedSmashX = this.x;

    // Smash motion trail.
    this.smashTrail = [];
    this.smashTrailTimer = 0;

    // Small glowing satellite square. It orbits around Prologue's center and
    // also spins around its own local center.
    this.satelliteOrbitAngle = 0;
    this.satelliteLocalRotation = 0;
    this.satelliteOrbitSpeed = 54;
    this.satelliteSpinSpeed = 210;
    this.satelliteOrbitRadius = this.halfSize + 34;
    this.satelliteArtSize = 3;

    this.definition = group([
      rectangle({
        width: this.size / 4,
        height: this.size / 4,
        color: this.baseColor,
      }),
    ], {
      mergeOutlines: true,
      outline: { enabled: true, color: this.outlineColor, thickness: 1 },
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
          owner.rotationLocked = false;
          owner.rotationSpeed = 52;
          ai.setTimer('attackDelay', 3.6 + Math.random() * 2.2);
        },

        update: (owner, ai, dt, ctx) => {
          owner.idleClock += dt;

          const t = owner.idleClock * 0.78;
          const targetX = owner.figureCenterX + Math.sin(t) * owner.figureWidth;
          const targetY =
            owner.figureCenterY +
            Math.sin(t * 2) * owner.figureHeight +
            Math.sin(t * 0.53) * 10;

          const follow = 1 - Math.exp(-4.2 * dt);
          owner.x = lerp(owner.x, targetX, follow);
          owner.y = lerp(owner.y, targetY, follow);

          const breathe = Math.sin(owner.idleClock * 2.2) * 0.015;
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
          owner.rotationLocked = false;
          owner.rotationSpeed = 68;
        },

        update: (owner, ai, dt, ctx) => {
          const player = ai.targetPlayer(ctx);
          if (!player) return;

          owner.trackTargetX = clamp(
            player.x,
            owner.halfSize + 20,
            world.width - owner.halfSize - 20,
          );
          owner.trackTargetY = clamp(player.y - 250, 115, 270);

          const follow = 1 - Math.exp(-2.05 * dt);
          owner.x = lerp(owner.x, owner.trackTargetX, follow);
          owner.y = lerp(owner.y, owner.trackTargetY, follow);

          owner.y += Math.sin(ai.stateTime * 4.0) * 0.20;

          const settle = smoothstep(ai.stateTime / 1.15);
          owner.scaleX = lerp(1.035, 1, settle);
          owner.scaleY = lerp(0.965, 1, settle);

          if (ai.stateTime >= 1.30) {
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

          // Ease toward the nearest straight/cardinal orientation before the
          // actual drop so the boss never hits the floor at a weird angle.
          owner.anticipateStartRotation = owner.rotation;
          owner.lockedRotation = Math.round(owner.rotation / 90) * 90;
          owner.rotationLocked = true;
          owner.rotationSpeed = 0;
        },

        update: (owner, ai) => {
          const t = clamp(ai.stateTime / 0.52, 0, 1);
          const eased = smoothstep(t);

          owner.x = lerp(owner.trackStartX, owner.lockedSmashX, eased);
          owner.y = owner.trackStartY - Math.sin(t * Math.PI) * 36;

          owner.rotation = lerpAngle(
            owner.anticipateStartRotation,
            owner.lockedRotation,
            eased,
          );

          owner.scaleX = 1 + 0.12 * eased;
          owner.scaleY = 1 - 0.16 * eased;

          if (t >= 1) {
            owner.rotation = owner.lockedRotation;
            ai.changeState('smash', { world });
          }
        },
      })

      .addState('smash', {
        enter: (owner) => {
          owner.smashStartY = owner.y;
          owner.smashTargetY = world.floorY - owner.halfSize;

          owner.rotationLocked = true;
          owner.rotation = owner.lockedRotation;
          owner.rotationSpeed = 0;

          owner.scaleX = 0.86;
          owner.scaleY = 1.18;

          owner.smashTrail.length = 0;
          owner.smashTrailTimer = 0;
        },

        update: (owner, ai, dt, ctx) => {
          const duration = 0.31;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const fall = easeInQuart(t);

          owner.x = owner.lockedSmashX;
          owner.y = lerp(owner.smashStartY, owner.smashTargetY, fall);
          owner.rotation = owner.lockedRotation;

          owner.scaleX = lerp(0.84, 0.97, t);
          owner.scaleY = lerp(1.20, 1.03, t);

          owner.smashTrailTimer -= dt;
          if (owner.smashTrailTimer <= 0) {
            owner.smashTrail.push({
              x: owner.x,
              y: owner.y,
              rotation: owner.rotation,
              scaleX: owner.scaleX,
              scaleY: owner.scaleY,
              life: 0.18,
              maxLife: 0.18,
            });

            if (owner.smashTrail.length > 9) owner.smashTrail.shift();
            owner.smashTrailTimer = 0.024;
          }

          if (t >= 1) {
            ai.changeState('impact', ctx);
          }
        },
      })

      .addState('impact', {
        enter: (owner, ai, ctx) => {
          owner.rotationLocked = true;
          owner.rotation = owner.lockedRotation;
          owner.rotationSpeed = 0;

          // The world shakes, but the HUD does not.
          ctx.shakeCamera?.(14, 0.28);
        },

        update: (owner, ai) => {
          const duration = 0.44;
          const t = clamp(ai.stateTime / duration, 0, 1);

          const squash = Math.exp(-8 * t);
          const bounce = Math.sin(t * Math.PI * 2.25) * Math.exp(-4.5 * t);

          owner.y = owner.smashTargetY - Math.max(0, bounce) * 42;
          owner.rotation = owner.lockedRotation;

          owner.scaleX = 1 + squash * 0.25;
          owner.scaleY = 1 - squash * 0.23;

          if (t >= 1) {
            ai.changeState('recover', { world });
          }
        },
      })

      .addState('recover', {
        enter: (owner) => {
          owner.trackStartX = owner.x;
          owner.trackStartY = owner.y;
          owner.rotationLocked = false;
          owner.rotationSpeed = 18;
        },

        update: (owner, ai) => {
          const duration = 0.90;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const eased = easeOutBack(t);

          const idleT = owner.idleClock * 0.78;
          const targetX = owner.figureCenterX + Math.sin(idleT) * owner.figureWidth;
          const targetY =
            owner.figureCenterY +
            Math.sin(idleT * 2) * owner.figureHeight;

          owner.x = lerp(owner.trackStartX, targetX, eased);
          owner.y = lerp(owner.trackStartY, targetY, eased);

          owner.scaleX = lerp(1.08, 1, smoothstep(t));
          owner.scaleY = lerp(0.92, 1, smoothstep(t));
          owner.rotationSpeed = lerp(18, 52, smoothstep(t));

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
    this.y = 210;
    this.vx = 0;
    this.vy = 0;

    this.rotation = 0;
    this.rotationSpeed = 52;
    this.rotationLocked = false;
    this.lockedRotation = 0;

    this.scaleX = 1;
    this.scaleY = 1;

    this.idleClock = 0;
    this.smashTargetY = world.floorY - this.halfSize;
    this.smashTrail.length = 0;
    this.smashTrailTimer = 0;

    this.satelliteOrbitAngle = 0;
    this.satelliteLocalRotation = 0;

    this.ai.stateName = null;
    this.ai.stateTime = 0;
    this.ai.cooldowns.clear();
    this.ai.timers.clear();
    this.ai.phaseId = null;
    this.ai.changeState('idle');
  }

  update(dt, context) {
    if (this.dead) return;

    this.ai.update(dt, context);

    if (!this.rotationLocked) {
      this.rotation = (this.rotation + this.rotationSpeed * dt) % 360;
    }

    this.satelliteOrbitAngle =
      (this.satelliteOrbitAngle + this.satelliteOrbitSpeed * dt) % 360;
    this.satelliteLocalRotation =
      (this.satelliteLocalRotation + this.satelliteSpinSpeed * dt) % 360;

    for (const ghost of this.smashTrail) {
      ghost.life -= dt;
    }
    this.smashTrail = this.smashTrail.filter(ghost => ghost.life > 0);
  }

  takeDamage(amount) {
    if (this.dead || amount <= 0) return;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.dead = true;
      this.scaleX = 1;
      this.scaleY = 1;
      this.smashTrail.length = 0;
    }
  }

  hitTest(x, y, radius = 0) {
    if (this.dead) return false;

    const hitRadius = this.halfSize * 0.92 + radius;
    return Math.hypot(x - this.x, y - this.y) <= hitRadius;
  }

  get healthRatio() {
    return this.health / this.maxHealth;
  }

  getRaster(angle = this.rotation) {
    const cacheAngle = ((Math.round(angle / 3) * 3) % 360 + 360) % 360;

    if (!this.rasterCache.has(cacheAngle)) {
      this.rasterCache.set(cacheAngle, rasterize(this.definition, cacheAngle));
    }

    return this.rasterCache.get(cacheAngle);
  }

  drawRasterInstance(
    ctx,
    raster,
    x,
    y,
    cameraX,
    artPixelSize,
    scaleX = 1,
    scaleY = 1,
    alpha = 1,
  ) {
    const dw = raster.width * artPixelSize;
    const dh = raster.height * artPixelSize;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x - cameraX), Math.round(y));
    ctx.scale(scaleX, scaleY);
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

  drawSmashTrail(ctx, cameraX, artPixelSize) {
    for (const ghost of this.smashTrail) {
      const alpha = Math.max(0, ghost.life / ghost.maxLife) * 0.22;
      const raster = this.getRaster(ghost.rotation);

      this.drawRasterInstance(
        ctx,
        raster,
        ghost.x,
        ghost.y,
        cameraX,
        artPixelSize,
        ghost.scaleX,
        ghost.scaleY,
        alpha,
      );
    }
  }

  drawSatellite(ctx, cameraX, artPixelSize) {
    // Orbit around the boss center. Adding the boss rotation means the satellite
    // feels attached to Prologue's orientation while the independent orbit angle
    // keeps it floating even when the boss itself is locked straight.
    const orbitRadians =
      (this.rotation + this.satelliteOrbitAngle) * Math.PI / 180;

    const satelliteX =
      this.x + Math.cos(orbitRadians) * this.satelliteOrbitRadius;
    const satelliteY =
      this.y + Math.sin(orbitRadians) * this.satelliteOrbitRadius;

    const size = this.satelliteArtSize * artPixelSize;

    ctx.save();
    ctx.translate(
      Math.round(satelliteX - cameraX),
      Math.round(satelliteY),
    );
    ctx.rotate(this.satelliteLocalRotation * Math.PI / 180);

    // No outline. The glow is presentation only and can be smooth even though
    // the square itself remains hard-edged.
    ctx.shadowColor = 'rgba(255,255,255,0.95)';
    ctx.shadowBlur = 11;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      Math.round(-size / 2),
      Math.round(-size / 2),
      size,
      size,
    );
    ctx.restore();
  }

  draw(ctx, cameraX, artPixelSize) {
    if (this.dead) return;

    this.drawSmashTrail(ctx, cameraX, artPixelSize);

    const raster = this.getRaster();
    this.drawRasterInstance(
      ctx,
      raster,
      this.x,
      this.y,
      cameraX,
      artPixelSize,
      this.scaleX,
      this.scaleY,
      1,
    );

    // Draw last so it visually floats in front of the boss.
    this.drawSatellite(ctx, cameraX, artPixelSize);
  }
}
