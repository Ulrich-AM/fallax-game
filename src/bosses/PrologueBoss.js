import { BossAI } from './BossAI.js?v=19';
import { rectangle, group, rasterize } from '../pixelShapes.js?v=19';

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
    this.phase2Transition = 0;
    this.phase2TransitionDuration = 1.15;

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
    this.phase2Speed = 1.45;
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

    // Radial satellite burst attack.
    this.satelliteBurstRowsFired = 0;
    this.satelliteBurstRows = 3;
    this.satelliteBurstInterval = 0.36;
    this.phase2BurstRows = 8;
    this.phase2BurstInterval = 0.24;
    this.burstAnchorX = this.x;
    this.burstAnchorY = this.y;
    this.satelliteBurstBaseAngle = 0;
    this.satelliteBullets = [];
    this.satelliteBulletCount = 20;
    this.satelliteBulletSpeed = 390;
    this.satelliteBulletLife = 2.8;
    this.satelliteBulletSize = this.satelliteSize * 0.25;
    this.satelliteBulletHealth = 6;

    // High-damage wall rush.
    this.wallRushDirection = 1;
    this.wallRushSpeed = 1550;
    this.wallRushHitPlayer = false;
    this.wallRushDraggingPlayer = false;
    this.wallRushEscaped = false;
    this.wallRushGrabDashSerial = 0;
    this.wallRushDrainPerSecond = 10;
    this.wallRushImpactDamage = 55;
    this.wallRushStartX = this.x;
    this.wallRushStartY = this.y;
    this.wallRushImpactX = this.x;
    this.wallRushImpactY = this.y;

    // Pixelated radial shockwaves created by wall impacts.
    this.shockwaves = [];

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
        {
          id: 'phase2',
          atOrBelow: 0.5,
          onEnter(owner, ai, ctx) {
            owner.phase2Transition = 0;
            owner.satelliteMode = 'orbit';
            const home = owner.getSatelliteOrbitPosition();
            owner.satelliteX = home.x;
            owner.satelliteY = home.y;
            ai.changeState('phaseTransition', ctx);
          },
        },
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

  get isPhase2() {
    return this.ai?.phaseId === 'phase2';
  }

  get actionSpeed() {
    return this.isPhase2 ? this.phase2Speed : 1;
  }

  get phaseLabel() {
    return this.isPhase2 ? 'phase 2' : 'phase 1';
  }

  getSatelliteOrbitPosition(angleOffsetDegrees = 0) {
    const orbitRadians =
      (
        this.rotation +
        this.satelliteOrbitAngle +
        angleOffsetDegrees
      ) * Math.PI / 180;

    return {
      x: this.x + Math.cos(orbitRadians) * this.satelliteOrbitRadius,
      y: this.y + Math.sin(orbitRadians) * this.satelliteOrbitRadius,
    };
  }

  installStates(world) {
    this.ai
      .addState('phaseTransition', {
        enter: (owner) => {
          owner.trackStartX = owner.x;
          owner.trackStartY = owner.y;
          owner.rotationLocked = false;
          owner.rotationSpeed = 34;
          owner.scaleX = 1;
          owner.scaleY = 1;
        },

        update: (owner, ai) => {
          const t = clamp(
            ai.stateTime / owner.phase2TransitionDuration,
            0,
            1,
          );

          owner.phase2Transition = smoothstep(t);
          owner.x = owner.trackStartX;
          owner.y =
            owner.trackStartY -
            Math.sin(t * Math.PI) * 12;

          const pulse = Math.sin(t * Math.PI) * 0.08;
          owner.scaleX = 1 + pulse;
          owner.scaleY = 1 + pulse;

          if (t >= 1) {
            owner.phase2Transition = 1;
            ai.changeState('idle');
          }
        },
      })

      .addState('idle', {
        enter: (owner, ai) => {
          owner.scaleX = 1;
          owner.scaleY = 1;
          owner.rotationLocked = false;
          owner.rotationSpeed = 52 * owner.actionSpeed;
          owner.satelliteMode = 'orbit';

          const attackDelay = owner.isPhase2
            ? 1.15 + Math.random() * 0.75
            : 2.8 + Math.random() * 1.8;

          ai.setTimer('attackDelay', attackDelay);
        },

        update: (owner, ai, dt, ctx) => {
          const player = ai.targetPlayer(ctx);
          owner.updateFigureEightAbovePlayer(
            dt,
            player,
            owner.isPhase2 ? 1.45 : 1,
          );

          if (ai.timerDone('attackDelay')) {
            const nextAttack = ai.chooseWeighted([
              { value: 'track', weight: 1.0 },
              { value: 'satelliteLunge', weight: 0.85 },
              { value: 'satelliteBurst', weight: 0.90 },
              { value: 'wallRushPrep', weight: 0.80 },
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
          owner.rotationSpeed = 68 * owner.actionSpeed;
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

          const follow =
            1 - Math.exp(-2.05 * owner.actionSpeed * dt);
          owner.x = lerp(owner.x, owner.trackTargetX, follow);
          owner.y = lerp(owner.y, owner.trackTargetY, follow);

          owner.y += Math.sin(ai.stateTime * 4.0) * 0.20;

          const settle = smoothstep(
            ai.stateTime / (1.15 / owner.actionSpeed),
          );
          owner.scaleX = lerp(1.035, 1, settle);
          owner.scaleY = lerp(0.965, 1, settle);

          if (ai.stateTime >= 1.30 / owner.actionSpeed) {
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
          const t = clamp(
            ai.stateTime / (0.52 / owner.actionSpeed),
            0,
            1,
          );
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
          const duration = 0.31 / owner.actionSpeed;
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
          owner.spawnGroundSpray(
            owner.x,
            world.floorY - 8,
          );
        },

        update: (owner, ai) => {
          const duration = 0.44 / owner.actionSpeed;
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
          const duration = 0.90 / owner.actionSpeed;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const eased = easeOutBack(t);

          // Rejoin the already-smoothed idle anchor. Do not rebuild the
          // recovery destination from the player's instantaneous position,
          // otherwise a blink dash can yank the boss toward the player.
          const targetCenterX = owner.figureCenterX;
          const targetCenterY = owner.figureCenterY;

          const idleT = owner.idleClock * 0.94;
          const targetX = targetCenterX + Math.sin(idleT) * owner.figureWidth;
          const targetY = targetCenterY + Math.sin(idleT * 2) * owner.figureHeight;

          owner.x = lerp(owner.trackStartX, targetX, eased);
          owner.y = lerp(owner.trackStartY, targetY, eased);

          owner.scaleX = lerp(1.08, 1, smoothstep(t));
          owner.scaleY = lerp(0.92, 1, smoothstep(t));
          owner.rotationSpeed = lerp(
            18,
            52 * owner.actionSpeed,
            smoothstep(t),
          );

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
          owner.updateFigureEightAbovePlayer(
            dt,
            player,
            0.74 * owner.actionSpeed,
          );

          const anticipationEnd = 0.20;
          const lungeEnd = 0.48;
          const holdEnd = 0.58;
          const returnEnd = 1.06;
          const time = ai.stateTime * owner.actionSpeed;

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
      })

      .addState('satelliteBurst', {
        enter: (owner) => {
          owner.satelliteMode = 'attack';
          owner.satelliteBurstRowsFired = 0;
          owner.burstAnchorX = owner.x;
          owner.burstAnchorY = owner.y;
          owner.satelliteBurstBaseAngle =
            owner.satelliteOrbitAngle * Math.PI / 180;

          const home = owner.getSatelliteOrbitPosition();
          owner.satelliteLungeStartX = home.x;
          owner.satelliteLungeStartY = home.y;
          owner.satelliteX = home.x;
          owner.satelliteY = home.y;
        },

        update: (owner, ai, dt, ctx) => {
          const player = ai.targetPlayer(ctx);

          if (owner.isPhase2) {
            owner.x = owner.burstAnchorX;
            owner.y = owner.burstAnchorY;
          } else {
            owner.updateFigureEightAbovePlayer(dt, player, 0.70);
          }

          const rows = owner.isPhase2
            ? owner.phase2BurstRows
            : owner.satelliteBurstRows;

          const interval = owner.isPhase2
            ? owner.phase2BurstInterval
            : owner.satelliteBurstInterval;

          const pullInEnd = owner.isPhase2 ? 0.32 : 0.46;
          const firingEnd =
            pullInEnd +
            interval * (rows - 1) +
            (owner.isPhase2 ? 0.12 : 0.18);
          const returnEnd =
            firingEnd + (owner.isPhase2 ? 0.30 : 0.42);

          const time = ai.stateTime;

          const dx = owner.satelliteLungeStartX - owner.x;
          const dy = owner.satelliteLungeStartY - owner.y;
          const startDistance = Math.hypot(dx, dy) || owner.satelliteOrbitRadius;
          const startAngle = Math.atan2(dy, dx);
          const innerRadius = owner.halfSize * 0.30;

          if (time < pullInEnd) {
            const t = smoothstep(time / pullInEnd);
            const radius = lerp(startDistance, innerRadius, t);

            owner.satelliteX = owner.x + Math.cos(startAngle) * radius;
            owner.satelliteY = owner.y + Math.sin(startAngle) * radius;
          } else if (time < firingEnd) {
            owner.satelliteX = owner.x + Math.cos(startAngle) * innerRadius;
            owner.satelliteY = owner.y + Math.sin(startAngle) * innerRadius;

            const elapsed = time - pullInEnd;
            const shouldHaveFired =
              Math.min(
                rows,
                Math.floor(elapsed / interval) + 1,
              );

            while (owner.satelliteBurstRowsFired < shouldHaveFired) {
              const row = owner.satelliteBurstRowsFired;
              const angleOffset =
                owner.satelliteBurstBaseAngle +
                row * (Math.PI / owner.satelliteBulletCount) * 0.72;

              owner.spawnSatelliteBurst(
                owner.satelliteX,
                owner.satelliteY,
                angleOffset,
              );

              owner.satelliteBurstRowsFired++;
            }
          } else {
            const home = owner.getSatelliteOrbitPosition();
            const t = easeOutCubic(
              (time - firingEnd) / (returnEnd - firingEnd),
            );

            owner.satelliteX = lerp(
              owner.x + Math.cos(startAngle) * innerRadius,
              home.x,
              t,
            );
            owner.satelliteY = lerp(
              owner.y + Math.sin(startAngle) * innerRadius,
              home.y,
              t,
            );
          }

          if (time >= returnEnd) {
            owner.satelliteMode = 'orbit';
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('wallRushPrep', {
        enter: (owner, ai, ctx) => {
          const player = ai.targetPlayer(ctx);

          owner.wallRushDirection =
            player && player.x < owner.x ? -1 : 1;

          owner.wallRushStartX = owner.x;
          owner.wallRushStartY = owner.y;
          owner.trackTargetY = player
            ? clamp(
                player.y,
                owner.halfSize + 18,
                world.floorY - owner.halfSize - 16,
              )
            : owner.y;

          owner.anticipateStartRotation = owner.rotation;
          owner.lockedRotation = 0;
          owner.rotationLocked = true;
          owner.rotationSpeed = 0;
          owner.satelliteMode = 'orbit';
        },

        update: (owner, ai) => {
          const duration = 0.92 / owner.actionSpeed;
          const t = clamp(ai.stateTime / duration, 0, 1);
          const eased = smoothstep(t);

          // Line up with the player while pulling away from the charge direction.
          owner.y = lerp(
            owner.wallRushStartY,
            owner.trackTargetY,
            eased,
          );

          // Strong backwards wind-up. The boss visibly retreats away from the
          // charge direction before it commits to the rush.
          const pullback = Math.sin(t * Math.PI * 0.5) * 165;
          owner.x =
            owner.wallRushStartX -
            owner.wallRushDirection * pullback;

          owner.rotation = lerpAngle(
            owner.anticipateStartRotation,
            owner.lockedRotation,
            eased,
          );

          // Horizontal anticipation squash.
          owner.scaleX = lerp(1, 0.76, eased);
          owner.scaleY = lerp(1, 1.22, eased);

          if (t >= 1) {
            owner.rotation = owner.lockedRotation;
            ai.changeState('wallRush');
          }
        },
      })

      .addState('wallRush', {
        enter: (owner) => {
          owner.rotationLocked = true;
          owner.rotation = owner.lockedRotation;
          owner.rotationSpeed = 0;

          owner.scaleX = 1.23;
          owner.scaleY = 0.84;

          owner.wallRushHitPlayer = false;
          owner.wallRushDraggingPlayer = false;
          owner.wallRushEscaped = false;
          owner.wallRushGrabDashSerial = 0;
          owner.smashTrail.length = 0;
          owner.smashTrailTimer = 0;
        },

        update: (owner, ai, dt, ctx) => {
          const previousX = owner.x;

          const rushSpeed =
            owner.wallRushSpeed *
            (owner.isPhase2 ? 1.22 : 1);

          owner.x +=
            owner.wallRushDirection *
            rushSpeed *
            dt;

          owner.rotation = owner.lockedRotation;

          owner.smashTrailTimer -= dt;
          if (owner.smashTrailTimer <= 0) {
            owner.smashTrail.push({
              x: owner.x,
              y: owner.y,
              rotation: owner.rotation,
              scaleX: owner.scaleX,
              scaleY: owner.scaleY,
              life: 0.16,
              maxLife: 0.16,
            });

            if (owner.smashTrail.length > 10) {
              owner.smashTrail.shift();
            }

            owner.smashTrailTimer = 0.020;
          }

          // Piercing swept horizontal collision. Once caught, the player is
          // pinned to the leading face and dragged with the rush until wall impact.
          if (ctx.player) {
            const player = ctx.player;
            const halfW = owner.halfSize * owner.scaleX;
            const halfH = owner.halfSize * owner.scaleY;
            const playerHalfW = player.w / 2;
            const playerHalfH = player.h / 2;

            const sweepLeft =
              Math.min(previousX - halfW, owner.x - halfW);
            const sweepRight =
              Math.max(previousX + halfW, owner.x + halfW);

            const overlapsX =
              sweepRight > player.x - playerHalfW &&
              sweepLeft < player.x + playerHalfW;

            const overlapsY =
              owner.y + halfH > player.y - playerHalfH &&
              owner.y - halfH < player.y + playerHalfH;

            if (
              !owner.wallRushDraggingPlayer &&
              !owner.wallRushEscaped &&
              overlapsX &&
              overlapsY
            ) {
              owner.wallRushDraggingPlayer = true;
              owner.wallRushGrabDashSerial = player.dashSerial;
            }

            if (
              owner.wallRushDraggingPlayer &&
              player.dashSerial !== owner.wallRushGrabDashSerial
            ) {
              owner.wallRushDraggingPlayer = false;
              owner.wallRushEscaped = true;
            }

            if (owner.wallRushDraggingPlayer) {
              player.takeContinuousDamage?.(
                owner.wallRushDrainPerSecond * dt,
              );

              const frontX =
                owner.x +
                owner.wallRushDirection *
                  (halfW + playerHalfW - 5);

              player.x = clamp(
                frontX,
                playerHalfW,
                world.width - playerHalfW,
              );
              player.y = clamp(
                owner.y,
                playerHalfH,
                world.floorY - playerHalfH,
              );
              player.prevY = player.y;
              player.vx = owner.wallRushDirection * rushSpeed;
              player.vy = 0;
              player.grounded = false;
            }
          }

          const hitRight =
            owner.wallRushDirection > 0 &&
            owner.x + owner.halfSize >= world.width;

          const hitLeft =
            owner.wallRushDirection < 0 &&
            owner.x - owner.halfSize <= 0;

          if (hitRight || hitLeft) {
            owner.x = hitRight
              ? world.width - owner.halfSize
              : owner.halfSize;

            owner.wallRushImpactX = owner.x;
            owner.wallRushImpactY = owner.y;

            ai.changeState('wallImpact', ctx);
          }
        },
      })

      .addState('wallImpact', {
        enter: (owner, ai, ctx) => {
          owner.rotationLocked = true;
          owner.rotation = owner.lockedRotation;
          owner.rotationSpeed = 0;

          ctx.shakeCamera?.(28, 0.52);

          if (owner.wallRushDraggingPlayer && ctx.player) {
            ctx.player.takeDamage?.(
              owner.wallRushImpactDamage,
              { ignoreDashInvulnerability: true },
            );
            ctx.player.vx = -owner.wallRushDirection * 520;
            ctx.player.vy = -260;
            ctx.player.grounded = false;
          }
          owner.wallRushDraggingPlayer = false;

          owner.spawnShockwave(
            owner.wallRushImpactX,
            owner.wallRushImpactY,
          );
        },

        update: (owner, ai) => {
          const duration = 0.58 / owner.actionSpeed;
          const t = clamp(ai.stateTime / duration, 0, 1);

          const recoil =
            Math.sin(t * Math.PI) *
            Math.exp(-2.8 * t) *
            46;

          owner.x =
            owner.wallRushImpactX -
            owner.wallRushDirection * recoil;

          const squash = Math.exp(-8 * t);
          owner.scaleX = 1 - squash * 0.25;
          owner.scaleY = 1 + squash * 0.18;

          if (t >= 1) {
            ai.changeState('recover', { world });
          }
        },
      });
  }

  reset(world) {
    this.health = this.maxHealth;
    this.dead = false;
    this.hurtFlash = 0;
    this.phase2Transition = 0;

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
    this.wallRushHitPlayer = false;
    this.wallRushDraggingPlayer = false;
    this.wallRushEscaped = false;
    this.wallRushGrabDashSerial = 0;
    this.satelliteBurstRowsFired = 0;
    this.satelliteBullets.length = 0;
    this.shockwaves.length = 0;

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

    const orbitSpeedScale = this.isPhase2 ? 1.35 : 1;

    this.satelliteOrbitAngle =
      (
        this.satelliteOrbitAngle +
        this.satelliteOrbitSpeed * orbitSpeedScale * dt
      ) % 360;

    this.satelliteLocalRotation =
      (
        this.satelliteLocalRotation +
        this.satelliteSpinSpeed * orbitSpeedScale * dt
      ) % 360;

    if (this.satelliteMode === 'orbit') {
      const home = this.getSatelliteOrbitPosition();
      this.satelliteX = home.x;
      this.satelliteY = home.y;
    }

    this.updateSatelliteBullets(dt, context.player, context.world);
    this.updateShockwaves(dt, context.player);

    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 7.5);

    for (const ghost of this.smashTrail) {
      ghost.life -= dt;
    }
    this.smashTrail = this.smashTrail.filter(ghost => ghost.life > 0);
  }

  spawnGroundSpray(x, y) {
    const count = this.isPhase2 ? 18 : 14;
    const speed = this.isPhase2 ? 500 : 440;

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = Math.PI + t * Math.PI;

      this.satelliteBullets.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2.0,
        maxLife: 2.0,
        health: this.satelliteBulletHealth,
        maxHealth: this.satelliteBulletHealth,
        hitPlayer: false,
      });
    }
  }

  spawnSatelliteBurst(x, y, angleOffset = 0) {
    for (let i = 0; i < this.satelliteBulletCount; i++) {
      const angle =
        angleOffset +
        (i / this.satelliteBulletCount) * Math.PI * 2;

      this.satelliteBullets.push({
        x,
        y,
        vx: Math.cos(angle) * this.satelliteBulletSpeed,
        vy: Math.sin(angle) * this.satelliteBulletSpeed,
        life: this.satelliteBulletLife,
        maxLife: this.satelliteBulletLife,
        health: this.satelliteBulletHealth,
        maxHealth: this.satelliteBulletHealth,
        hitPlayer: false,
      });
    }
  }

  updateSatelliteBullets(dt, player, world) {
    for (const bullet of this.satelliteBullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life = Math.max(0, bullet.life - dt);

      if (!bullet.hitPlayer && player) {
        const hitRadius =
          this.satelliteBulletSize * 0.5 +
          Math.max(player.w, player.h) * 0.40;

        if (
          Math.hypot(
            bullet.x - player.x,
            bullet.y - player.y,
          ) <= hitRadius
        ) {
          bullet.hitPlayer = true;
          player.takeDamage?.(12);
        }
      }

      if (
        bullet.x < -80 ||
        bullet.x > world.width + 80 ||
        bullet.y < -80 ||
        bullet.y > world.floorY + 120
      ) {
        bullet.life = 0;
      }
    }

    this.satelliteBullets =
      this.satelliteBullets.filter(
        bullet => bullet.life > 0 && bullet.health > 0,
      );
  }


  damageProjectileAt(x, y, radius, damage) {
    if (damage <= 0) return false;

    const bulletRadius = this.satelliteBulletSize * 0.5;

    for (const bullet of this.satelliteBullets) {
      if (bullet.life <= 0 || bullet.health <= 0) continue;

      if (
        Math.hypot(bullet.x - x, bullet.y - y) <=
        bulletRadius + radius
      ) {
        bullet.health = Math.max(0, bullet.health - damage);
        return true;
      }
    }

    return false;
  }

  damageProjectilesAlongRay(
    originX,
    originY,
    dirX,
    dirY,
    maxDistance,
    beamRadius,
    damage,
  ) {
    if (damage <= 0) return 0;

    let hits = 0;
    const bulletRadius = this.satelliteBulletSize * 0.5;

    for (const bullet of this.satelliteBullets) {
      if (bullet.life <= 0 || bullet.health <= 0) continue;

      const relX = bullet.x - originX;
      const relY = bullet.y - originY;
      const along = relX * dirX + relY * dirY;

      if (along < 0 || along > maxDistance) continue;

      const closestX = originX + dirX * along;
      const closestY = originY + dirY * along;
      const distance = Math.hypot(
        bullet.x - closestX,
        bullet.y - closestY,
      );

      if (distance <= bulletRadius + beamRadius) {
        bullet.health = Math.max(0, bullet.health - damage);
        hits++;
      }
    }

    return hits;
  }

  spawnShockwave(x, y) {
    this.shockwaves.push({
      x,
      y,
      radius: 0,
      previousRadius: 0,
      maxRadius: 520,
      speed: 780,
      thickness: 30,
      life: 1,
      hitPlayer: false,
    });
  }

  updateShockwaves(dt, player) {
    for (const wave of this.shockwaves) {
      wave.previousRadius = wave.radius;
      wave.radius = Math.min(
        wave.maxRadius,
        wave.radius + wave.speed * dt,
      );
      wave.life = 1 - wave.radius / wave.maxRadius;

      if (!wave.hitPlayer && player) {
        const dx = player.x - wave.x;
        const dy = player.y - wave.y;
        const distance = Math.hypot(dx, dy) || 1;

        const playerRadius =
          Math.max(player.w, player.h) * 0.5;

        const inner = wave.previousRadius - wave.thickness - playerRadius;
        const outer = wave.radius + wave.thickness + playerRadius;

        if (distance >= Math.max(0, inner) && distance <= outer) {
          const nx = dx / distance;
          const ny = dy / distance;

          // Strong radial knockback with a slight upward bias so the wave feels
          // like a physical blast rather than a flat horizontal shove.
          player.vx += nx * 760;
          player.vy += ny * 620 - 180;
          player.grounded = false;

          wave.hitPlayer = true;
        }
      }
    }

    this.shockwaves = this.shockwaves.filter(
      wave => wave.radius < wave.maxRadius,
    );
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

  drawSatelliteBullets(ctx, cameraX) {
    const size = this.satelliteBulletSize;
    const half = size / 2;

    ctx.save();

    for (const bullet of this.satelliteBullets) {
      const alpha =
        Math.max(0, bullet.life / bullet.maxLife);

      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(255,255,255,0.95)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';

      ctx.fillRect(
        Math.round(bullet.x - cameraX - half),
        Math.round(bullet.y - half),
        size,
        size,
      );
    }

    ctx.restore();
  }

  drawSatelliteAt(ctx, cameraX, x, y, localRotation) {
    const size = this.satelliteSize;

    ctx.save();
    ctx.translate(
      Math.round(x - cameraX),
      Math.round(y),
    );
    ctx.rotate(localRotation * Math.PI / 180);

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

  drawSatellite(ctx, cameraX) {
    this.drawSatelliteAt(
      ctx,
      cameraX,
      this.satelliteX,
      this.satelliteY,
      this.satelliteLocalRotation,
    );

    if (this.isPhase2) {
      const secondTarget = this.getSatelliteOrbitPosition(180);
      const emerge = this.phase2Transition;

      const secondX = lerp(
        this.satelliteX,
        secondTarget.x,
        emerge,
      );
      const secondY = lerp(
        this.satelliteY,
        secondTarget.y,
        emerge,
      );

      this.drawSatelliteAt(
        ctx,
        cameraX,
        secondX,
        secondY,
        -this.satelliteLocalRotation,
      );
    }
  }

  drawShockwaves(ctx, cameraX) {
    for (const wave of this.shockwaves) {
      if (wave.radius <= 0) continue;

      const circumference =
        Math.max(24, Math.ceil(wave.radius / 9));
      const pixelSize = 9;
      const alpha = Math.max(0, wave.life) * 0.55;

      ctx.save();
      ctx.fillStyle = `rgba(220,224,232,${alpha})`;

      for (let i = 0; i < circumference; i++) {
        const angle =
          (i / circumference) * Math.PI * 2;

        const x =
          wave.x +
          Math.cos(angle) * wave.radius -
          cameraX;

        const y =
          wave.y +
          Math.sin(angle) * wave.radius;

        ctx.fillRect(
          Math.round(x - pixelSize / 2),
          Math.round(y - pixelSize / 2),
          pixelSize,
          pixelSize,
        );
      }

      // A second broken inner ring makes the shockwave read as pixel art
      // rather than a smooth dotted circle.
      if (wave.radius > 24) {
        ctx.globalAlpha = 0.42;

        for (let i = 0; i < circumference; i += 2) {
          const angle =
            (i / circumference) * Math.PI * 2;

          const r = Math.max(0, wave.radius - 18);
          const x = wave.x + Math.cos(angle) * r - cameraX;
          const y = wave.y + Math.sin(angle) * r;

          ctx.fillRect(
            Math.round(x - 3),
            Math.round(y - 3),
            6,
            6,
          );
        }
      }

      ctx.restore();
    }
  }

  draw(ctx, cameraX, artPixelSize) {
    if (this.dead) return;

    this.drawShockwaves(ctx, cameraX);
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

    this.drawSatelliteBullets(ctx, cameraX);
    this.drawSatellite(ctx, cameraX);
  }
}
