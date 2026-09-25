import { BossAI } from './BossAI.js?v=11';
import { rectangle, group, rasterize } from '../pixelShapes.js?v=11';

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

function easeInCubic(t) {
  t = clamp(t, 0, 1);
  return t * t * t;
}

function easeInQuart(t) {
  t = clamp(t, 0, 1);
  return t * t * t * t;
}

function easeOutCubic(t) {
  t = clamp(t, 0, 1);
  return 1 - Math.pow(1 - t, 3);
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
    this.hurtFlash = 0;

    // The idle infinity cycle now follows the player rather than covering the
    // entire room.
    this.idleClock = 0;
    this.figureCenterX = 650;
    this.figureCenterY = 205;
    this.figureWidth = 205;
    this.figureHeight = 66;

    this.trackStartX = this.x;
    this.trackStartY = this.y;
    this.trackTargetX = this.x;
    this.trackTargetY = this.y;

    this.smashStartY = this.y;
    this.smashTargetY = world.floorY - this.halfSize;
    this.lockedSmashX = this.x;
    this.smashHitPlayer = false;

    this.smashTrail = [];
    this.smashTrailTimer = 0;

    // The satellite is now only 50% smaller than Prologue's own body.
    this.satelliteSize = this.size * 0.50;
    this.satelliteOrbitAngle = 0;
    this.satelliteLocalRotation = 0;
    this.satelliteOrbitSpeed = 56;
    this.satelliteSpinSpeed = 220;
    this.satelliteOrbitRadius = this.halfSize + this.satelliteSize * 0.72;

    this.satelliteMode = 'orbit';
    this.satelliteX = this.x + this.satelliteOrbitRadius;
    this.satelliteY = this.y;
    this.satelliteLungeStartX = this.satelliteX;
    this.satelliteLungeStartY = this.satelliteY;
    this.satelliteTargetX = this.satelliteX;
    this.satelliteTargetY = this.satelliteY;
    this.satelliteDirX = 1;
    this.satelliteDirY = 0;
    this.satelliteAttackHit = false;
    this.satelliteMaxRange = 950;

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

    this.flashDefinition = group([
      rectangle({
        width: this.size / 4,
        height: this.size / 4,
        color: '#ffffff',
      }),
    ], {
      mergeOutlines: true,
      outline: false,
      padding: 2,
    });

    this.rasterCache = new Map();
    this.flashRasterCache = new Map();

    this.ai = new BossAI(this, {
      initialState: 'idle',
      phases: [
        { id: 'phase1', atOrBelow: 1.0 },
      ],
    });

    this.installStates(world);
  }

  updateFigureEightAbovePlayer(dt, player, speedMultiplier = 1) {
    if (!player) return;

    this.idleClock += dt * speedMultiplier;

    const desiredCenterX = clamp(
      player.x,
      this.halfSize + this.figureWidth + 20,
      2700 - this.halfSize - this.figureWidth - 20,
    );
    const desiredCenterY = clamp(player.y - 290, 150, 235);

    const centerFollow = 1 - Math.exp(-2.7 * dt);
    this.figureCenterX = lerp(this.figureCenterX, desiredCenterX, centerFollow);
    this.figureCenterY = lerp(this.figureCenterY, desiredCenterY, centerFollow);

    const t = this.idleClock * 0.94;
    const targetX =
      this.figureCenterX +
      Math.sin(t) * this.figureWidth;
    const targetY =
      this.figureCenterY +
      Math.sin(t * 2) * this.figureHeight +
      Math.sin(t * 0.55) * 8;

    const follow = 1 - Math.exp(-4.0 * dt);
    this.x = lerp(this.x, targetX, follow);
    this.y = lerp(this.y, targetY, follow);

    const breathe = Math.sin(this.idleClock * 2.3) * 0.014;
    this.scaleX = 1 + breathe;
    this.scaleY = 1 - breathe;
  }

  getSatelliteOrbitPosition() {
    const orbitRadians =
      (this.rotation + this.satelliteOrbitAngle) * Math.PI / 180;

    return {
      x: this.x + Math.cos(orbitRadians) * this.satelliteOrbitRadius,
      y: this.y + Math.sin(orbitRadians) * this.satelliteOrbitRadius,
    };
  }

  installStates(world) {
    this.ai
      .addState('idle', {
        enter: (owner, ai) => {
          owner.scaleX = 1;
          owner.scaleY = 1;
          owner.rotationLocked = false;
          owner.rotationSpeed = 52;
          owner.satelliteMode = 'orbit';
          ai.setTimer('attackDelay', 2.8 + Math.random() * 1.8);
        },

        update: (owner, ai, dt, ctx) => {
          const player = ai.targetPlayer(ctx);
          owner.updateFigureEightAbovePlayer(dt, player);

          if (ai.timerDone('attackDelay')) {
            const nextAttack = ai.chooseWeighted([
              { value: 'track', weight: 1.0 },
              { value: 'satelliteLunge', weight: 0.85 },
            ]);

            ai.changeState(nextAttack, ctx);
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
          owner.smashHitPlayer = false;
        },

        update: (owner, ai, dt, ctx) => {
          const duration = 0.31;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const fall = easeInQuart(t);

          const previousY = owner.y;

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

          // Swept, piercing collision. The boss never stops when it hits the
          // player, and the vertical sweep prevents tunneling between frames.
          if (!owner.smashHitPlayer && ctx.player) {
            const player = ctx.player;
            const halfW = owner.halfSize * owner.scaleX;
            const halfH = owner.halfSize * owner.scaleY;
            const playerHalfW = player.w / 2;
            const playerHalfH = player.h / 2;

            const overlapsX =
              owner.x + halfW > player.x - playerHalfW &&
              owner.x - halfW < player.x + playerHalfW;

            const sweepTop = Math.min(previousY - halfH, owner.y - halfH);
            const sweepBottom = Math.max(previousY + halfH, owner.y + halfH);
            const overlapsY =
              sweepBottom > player.y - playerHalfH &&
              sweepTop < player.y + playerHalfH;

            if (overlapsX && overlapsY) {
              owner.smashHitPlayer = player.takeDamage?.(30) ?? true;
            }
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

        update: (owner, ai, dt, ctx) => {
          const duration = 0.90;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const eased = easeOutBack(t);

          const player = ai.targetPlayer(ctx);
          const targetCenterX = player
            ? clamp(player.x, owner.halfSize + owner.figureWidth + 20, world.width - owner.halfSize - owner.figureWidth - 20)
            : owner.figureCenterX;
          const targetCenterY = player
            ? clamp(player.y - 290, 150, 235)
            : owner.figureCenterY;

          const idleT = owner.idleClock * 0.94;
          const targetX = targetCenterX + Math.sin(idleT) * owner.figureWidth;
          const targetY = targetCenterY + Math.sin(idleT * 2) * owner.figureHeight;

          owner.x = lerp(owner.trackStartX, targetX, eased);
          owner.y = lerp(owner.trackStartY, targetY, eased);

          owner.scaleX = lerp(1.08, 1, smoothstep(t));
          owner.scaleY = lerp(0.92, 1, smoothstep(t));
          owner.rotationSpeed = lerp(18, 52, smoothstep(t));

          if (t >= 1) {
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('satelliteLunge', {
        enter: (owner, ai, ctx) => {
          const player = ai.targetPlayer(ctx);
          const home = owner.getSatelliteOrbitPosition();

          owner.satelliteMode = 'attack';
          owner.satelliteX = home.x;
          owner.satelliteY = home.y;
          owner.satelliteLungeStartX = home.x;
          owner.satelliteLungeStartY = home.y;
          owner.satelliteAttackHit = false;

          const targetX = player?.x ?? owner.x;
          const targetY = player?.y ?? owner.y;
          let dx = targetX - home.x;
          let dy = targetY - home.y;
          const distance = Math.hypot(dx, dy) || 1;

          owner.satelliteDirX = dx / distance;
          owner.satelliteDirY = dy / distance;

          const travel = Math.min(distance, owner.satelliteMaxRange);
          owner.satelliteTargetX = home.x + owner.satelliteDirX * travel;
          owner.satelliteTargetY = home.y + owner.satelliteDirY * travel;
        },

        update: (owner, ai, dt, ctx) => {
          const player = ai.targetPlayer(ctx);

          // Prologue itself keeps circling above the player while the satellite
          // attacks, which makes the whole encounter feel less passive.
          owner.updateFigureEightAbovePlayer(dt, player, 0.74);

          const anticipationEnd = 0.20;
          const lungeEnd = 0.48;
          const holdEnd = 0.58;
          const returnEnd = 1.06;
          const time = ai.stateTime;

          if (time < anticipationEnd) {
            const t = smoothstep(time / anticipationEnd);
            owner.satelliteX =
              owner.satelliteLungeStartX - owner.satelliteDirX * 28 * t;
            owner.satelliteY =
              owner.satelliteLungeStartY - owner.satelliteDirY * 28 * t;
          } else if (time < lungeEnd) {
            const t = easeInCubic(
              (time - anticipationEnd) / (lungeEnd - anticipationEnd),
            );

            const pullbackX =
              owner.satelliteLungeStartX - owner.satelliteDirX * 28;
            const pullbackY =
              owner.satelliteLungeStartY - owner.satelliteDirY * 28;

            owner.satelliteX = lerp(pullbackX, owner.satelliteTargetX, t);
            owner.satelliteY = lerp(pullbackY, owner.satelliteTargetY, t);
          } else if (time < holdEnd) {
            const t = (time - lungeEnd) / (holdEnd - lungeEnd);
            const overshoot = Math.sin(t * Math.PI) * 18;

            owner.satelliteX =
              owner.satelliteTargetX + owner.satelliteDirX * overshoot;
            owner.satelliteY =
              owner.satelliteTargetY + owner.satelliteDirY * overshoot;
          } else {
            const home = owner.getSatelliteOrbitPosition();
            const t = easeOutCubic(
              (time - holdEnd) / (returnEnd - holdEnd),
            );

            owner.satelliteX = lerp(owner.satelliteTargetX, home.x, t);
            owner.satelliteY = lerp(owner.satelliteTargetY, home.y, t);
          }

          if (!owner.satelliteAttackHit && player && time >= anticipationEnd && time <= holdEnd) {
            const radius = owner.satelliteSize * 0.5 + Math.max(player.w, player.h) * 0.42;
            if (Math.hypot(owner.satelliteX - player.x, owner.satelliteY - player.y) <= radius) {
              owner.satelliteAttackHit = player.takeDamage?.(18) ?? true;
            }
          }

          if (time >= returnEnd) {
            owner.satelliteMode = 'orbit';
            const home = owner.getSatelliteOrbitPosition();
            owner.satelliteX = home.x;
            owner.satelliteY = home.y;
            ai.changeState('idle', ctx);
          }
        },
      });
  }

  reset(world) {
    this.health = this.maxHealth;
    this.dead = false;
    this.hurtFlash = 0;

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
    this.figureCenterX = 650;
    this.figureCenterY = 205;

    this.smashTargetY = world.floorY - this.halfSize;
    this.smashTrail.length = 0;
    this.smashTrailTimer = 0;
    this.smashHitPlayer = false;

    this.satelliteOrbitAngle = 0;
    this.satelliteLocalRotation = 0;
    this.satelliteMode = 'orbit';
    this.satelliteAttackHit = false;

    const home = this.getSatelliteOrbitPosition();
    this.satelliteX = home.x;
    this.satelliteY = home.y;

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

    if (this.satelliteMode === 'orbit') {
      const home = this.getSatelliteOrbitPosition();
      this.satelliteX = home.x;
      this.satelliteY = home.y;
    }

    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 7.5);

    for (const ghost of this.smashTrail) {
      ghost.life -= dt;
    }
    this.smashTrail = this.smashTrail.filter(ghost => ghost.life > 0);
  }

  takeDamage(amount) {
    if (this.dead || amount <= 0) return;

    this.health = Math.max(0, this.health - amount);
    this.hurtFlash = 1;

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

  getFlashRaster(angle = this.rotation) {
    const cacheAngle = ((Math.round(angle / 3) * 3) % 360 + 360) % 360;

    if (!this.flashRasterCache.has(cacheAngle)) {
      this.flashRasterCache.set(
        cacheAngle,
        rasterize(this.flashDefinition, cacheAngle),
      );
    }

    return this.flashRasterCache.get(cacheAngle);
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

  drawSatellite(ctx, cameraX) {
    const size = this.satelliteSize;

    ctx.save();
    ctx.translate(
      Math.round(this.satelliteX - cameraX),
      Math.round(this.satelliteY),
    );
    ctx.rotate(this.satelliteLocalRotation * Math.PI / 180);

    // Layered glow for a much stronger white aura.
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.shadowColor = 'rgba(255,255,255,1)';
    ctx.shadowBlur = 42;
    ctx.fillRect(-size * 0.54, -size * 0.54, size * 1.08, size * 1.08);

    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.shadowBlur = 26;
    ctx.fillRect(-size * 0.51, -size * 0.51, size * 1.02, size * 1.02);

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 14;
    ctx.fillRect(-size / 2, -size / 2, size, size);

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

    if (this.hurtFlash > 0) {
      const flashRaster = this.getFlashRaster();
      this.drawRasterInstance(
        ctx,
        flashRaster,
        this.x,
        this.y,
        cameraX,
        artPixelSize,
        this.scaleX,
        this.scaleY,
        this.hurtFlash,
      );
    }

    this.drawSatellite(ctx, cameraX);
  }
}
