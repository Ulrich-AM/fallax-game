import { BossAI } from './BossAI.js?v=36';
import { polygon, group, rasterize } from '../pixelShapes.js?v=36';

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

function easeOutCubic(t) {
  t = clamp(t, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBounce(t) {
  t = clamp(t, 0, 1);

  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  }

  if (t < 2 / d1) {
    t -= 1.5 / d1;
    return n1 * t * t + 0.75;
  }

  if (t < 2.5 / d1) {
    t -= 2.25 / d1;
    return n1 * t * t + 0.9375;
  }

  t -= 2.625 / d1;
  return n1 * t * t + 0.984375;
}

function hexPoints(radiusX, radiusY) {
  const points = [];

  for (let i = 0; i < 6; i++) {
    const angle =
      -Math.PI / 2 +
      i * Math.PI / 3;

    points.push([
      Math.cos(angle) * radiusX,
      Math.sin(angle) * radiusY,
    ]);
  }

  return points;
}

export class MatrixBoss {
  constructor(world) {
    this.name = 'matrix';
    this.maxHealth = 1000;
    this.health = this.maxHealth;
    this.dead = false;

    this.x = 900;
    this.y = 255;
    this.spawnX = this.x;
    this.spawnY = this.y;

    this.halfSize = 102;
    this.shellRadiusX = 108;
    this.shellRadiusY = 86;
    this.shellGap = 18;
    this.attackGap = 64;
    this.shellOpen = 0;

    this.rotation = 0;
    this.coreRotation = 0;
    this.attackAnchorY = this.y;

    // Stateful horizontal patrol. Position is never reconstructed from a clock,
    // so returning from an attack cannot snap Matrix somewhere else.
    this.patrolDistance = 360;
    this.patrolSpeed = 125;
    this.patrolDirection = 1;
    this.patrolMinX = this.spawnX - this.patrolDistance;
    this.patrolMaxX = this.spawnX + this.patrolDistance;

    this.baseColor = '#777b82';
    this.outlineColor = '#494c52';

    this.artPixelSize = 4;
    this.shellRasterCache = new Map();
    this.flashRasterCache = new Map();
    this.coreRasterCache = new Map();

    this.coreDefinition = group([
      polygon({
        points: hexPoints(42 / this.artPixelSize, 42 / this.artPixelSize),
        color: '#ffffff',
        outline: false,
      }),
    ], {
      mergeOutlines: true,
      outline: false,
      padding: 3,
    });

    this.hurtFlash = 0;

    this.bullets = [];
    this.fxEvents = [];
    this.shotSerial = 0;
    this.bulletSpeed = 335;
    this.bulletLife = 4.0;
    this.bulletSize = 16;
    this.bulletDamage = 8;
    this.bulletHealth = 5;
    this.fireInterval = 0.075;
    this.fireTimer = 0;

    this.lastAttack = null;

    // Core Orbit: bullets form a ring around the exposed core, then peel off
    // one by one toward predicted player positions.
    this.orbitBulletCount = 8;
    this.orbitBulletRadius = 84;
    this.orbitBulletSize = 18;
    this.orbitBulletDamage = 12;
    this.orbitBulletSpeed = 455;
    this.orbitBulletLife = 5.0;
    this.orbitBulletHealth = 7;
    this.orbitAngularSpeed = Math.PI * 1.15;
    this.orbitReleaseInterval = 0.22;
    this.orbitReleaseTimer = 0;
    this.orbitBulletsReleased = 0;
    this.orbitSpawned = false;

    // Compression Shot: three jaw compressions charge one huge projectile.
    // The giant projectile splits into a smaller bullet fan at a room border.
    this.compressionPulseCount = 3;
    this.compressionPulsesFired = 0;
    this.compressionShotFired = false;
    this.compressionBulletSize = 76;
    this.compressionBulletDamage = 36;
    this.compressionBulletSpeed = 245;
    this.compressionBulletLife = 7.0;
    this.compressionBulletHealth = 28;
    this.compressionFirstSplitCount = 4;
    this.compressionFirstSplitSpread = Math.PI * 0.62;
    this.compressionFirstSplitSize = 22;
    this.compressionFirstSplitDamage = 12;
    this.compressionFirstSplitSpeed = 330;
    this.compressionFirstSplitLife = 4.2;
    this.compressionFirstSplitHealth = 6;

    this.compressionSecondSplitCount = 2;
    this.compressionSecondSplitSpread = Math.PI * 0.22;
    this.compressionSecondSplitSize = 14;
    this.compressionSecondSplitDamage = 8;
    this.compressionSecondSplitSpeed = 440;
    this.compressionSecondSplitLife = 3.2;
    this.compressionSecondSplitHealth = 3;
    this.compressionSplitTransitionDuration = 0.12;

    // Core burst.
    this.coreBurstFired = false;
    this.coreFlash = 0;
    this.burstBulletCount = 8;
    this.burstBulletSize = 30;
    this.burstBulletDamage = 22;
    this.burstBulletSpeed = 300;
    this.burstBulletLife = 10.0;
    this.burstBulletHealth = 10;
    this.burstMaxBounces = 4;
    this.burstFinalFadeDuration = 0.72;

    // Moving bullet-flood variant of the swirl attack.
    this.floodFireInterval = 0.05;
    this.floodMoveSpeed = 300;
    this.floodDirection = 1;
    this.floodFireTimer = 0;

    // Phase 2 remixes existing projectile systems instead of only speeding
    // everything up. The transition temporarily freezes the current field,
    // then releases it at a rotated trajectory.
    this.phaseTransitionReleased = false;
    this.phaseTransitionRotateAngle = Math.PI / 4;

    // Swirl + Orbit.
    this.phase2SwirlFireInterval = 0.11;
    this.phase2OrbitReleaseInterval = 0.30;

    // Orbit Collapse.
    this.phase2OrbitExpandRadius = 174;
    this.phase2OrbitCollapseSpeed = 520;
    this.phase2OrbitCollapseReleased = false;

    // Compression Cascade.
    this.phase2CascadeSpeed = 520;
    this.phase2CascadeDamage = 10;
    this.phase2CascadeHealth = 4;
    this.phase2CascadeLife = 3.2;

    this.ai = new BossAI(this, {
      initialState: 'idle',
      phases: [
        { id: 'phase1', atOrBelow: 1.0 },
        {
          id: 'phase2',
          atOrBelow: 0.5,
          onEnter: (owner, ai, ctx) => {
            if (owner.dead) return;
            ai.changeState(
              'phaseTransition',
              ctx,
            );
          },
        },
      ],
    });

    this.installStates(world);
  }

  get healthRatio() {
    return this.health / this.maxHealth;
  }

  get phaseLabel() {
    return this.ai.phaseId === 'phase2'
      ? 'phase 2'
      : 'phase 1';
  }

  installStates(world) {
    this.ai
      .addState('idle', {
        enter: (owner, ai) => {
          owner.shellOpen = 0;
          owner.attackAnchorY = owner.y;

          const phase2 =
            ai.phaseId === 'phase2';

          ai.setTimer(
            'attackDelay',
            phase2
              ? 0.95 + Math.random() * 0.75
              : 1.8 + Math.random() * 1.4,
          );
        },

        update: (owner, ai, dt) => {
          const phase2 =
            ai.phaseId === 'phase2';

          owner.rotation +=
            (phase2 ? 22 : 12) *
            dt;

          owner.coreRotation -=
            (phase2 ? 118 : 68) *
            dt;

          owner.x +=
            owner.patrolDirection *
            owner.patrolSpeed *
            dt;

          if (owner.x >= owner.patrolMaxX) {
            owner.x = owner.patrolMaxX;
            owner.patrolDirection = -1;
          } else if (owner.x <= owner.patrolMinX) {
            owner.x = owner.patrolMinX;
            owner.patrolDirection = 1;
          }

          owner.y =
            owner.spawnY +
            (
              phase2
                ? Math.sin(
                    ai.stateTime *
                    8.5,
                  ) * 3
                : 0
            );

          if (ai.timerDone('attackDelay')) {
            const choices =
              phase2
                ? [
                    'phase2SwirlOrbit',
                    'phase2OrbitCollapse',
                    'phase2CompressionCascade',
                    'floodSwirl',
                    'coreBurst',
                  ]
                : [
                    'swirl',
                    'floodSwirl',
                    'coreBurst',
                    'coreOrbit',
                    'compressionShot',
                  ];

            const filtered =
              choices.filter(
                name =>
                  name !==
                  owner.lastAttack,
              );

            const next =
              filtered[
                Math.floor(
                  Math.random() *
                  filtered.length,
                )
              ];

            owner.lastAttack = next;
            ai.changeState(next);
          }
        },
      })

      .addState('swirl', {
        enter: (owner) => {
          owner.attackAnchorY = owner.y;
          owner.fireTimer = 0;
        },

        update: (owner, ai, dt, ctx) => {
          const openEnd = 0.48;
          const fireEnd = 2.75;
          const end = 3.18;
          const time = ai.stateTime;

          if (time < openEnd) {
            const t = smoothstep(time / openEnd);
            owner.shellOpen = t;

            owner.y = lerp(
              owner.attackAnchorY,
              owner.attackAnchorY - 24,
              t,
            );
          } else if (time < fireEnd) {
            owner.shellOpen = 1;
            owner.y = owner.attackAnchorY - 24;

            owner.rotation += 190 * dt;
            owner.coreRotation -= 260 * dt;

            owner.fireTimer -= dt;

            while (owner.fireTimer <= 0) {
              owner.fireSwirlPair();
              owner.fireTimer += owner.fireInterval;
            }
          } else {
            const t = smoothstep(
              (time - fireEnd) / (end - fireEnd),
            );

            owner.shellOpen = 1 - t;
            owner.y = lerp(
              owner.attackAnchorY - 24,
              owner.attackAnchorY,
              easeOutCubic(t),
            );

            owner.rotation += 70 * dt;
            owner.coreRotation -= 120 * dt;
          }

          if (time >= end) {
            owner.shellOpen = 0;
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('floodSwirl', {
        enter: (owner) => {
          owner.attackAnchorY = owner.y;
          owner.floodFireTimer = 0;
          owner.floodDirection =
            owner.patrolDirection || 1;
        },

        update: (owner, ai, dt, ctx) => {
          const openEnd = 0.45;
          const fireEnd = 4.05;
          const end = 4.48;
          const time = ai.stateTime;

          if (time < openEnd) {
            const t = smoothstep(time / openEnd);
            owner.shellOpen = t;
            owner.y = lerp(
              owner.attackAnchorY,
              owner.attackAnchorY - 20,
              t,
            );
          } else if (time < fireEnd) {
            owner.shellOpen = 1;
            owner.y = owner.attackAnchorY - 20;

            owner.x +=
              owner.floodDirection *
              owner.floodMoveSpeed *
              dt;

            if (owner.x >= owner.patrolMaxX) {
              owner.x = owner.patrolMaxX;
              owner.floodDirection = -1;
            } else if (
              owner.x <= owner.patrolMinX
            ) {
              owner.x = owner.patrolMinX;
              owner.floodDirection = 1;
            }

            owner.patrolDirection =
              owner.floodDirection;

            owner.rotation += 225 * dt;
            owner.coreRotation -= 300 * dt;

            owner.floodFireTimer -= dt;

            while (owner.floodFireTimer <= 0) {
              owner.fireSwirlPair();
              owner.floodFireTimer +=
                owner.floodFireInterval;
            }
          } else {
            const t = smoothstep(
              (time - fireEnd) /
              (end - fireEnd),
            );

            owner.shellOpen = 1 - t;
            owner.y = lerp(
              owner.attackAnchorY - 20,
              owner.attackAnchorY,
              easeOutCubic(t),
            );

            owner.rotation += 80 * dt;
            owner.coreRotation -= 130 * dt;
          }

          if (time >= end) {
            owner.shellOpen = 0;
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('coreBurst', {
        enter: (owner) => {
          owner.attackAnchorY = owner.y;
          owner.coreBurstFired = false;
          owner.coreFlash = 0;
        },

        update: (owner, ai, dt, ctx) => {
          const closeEnd = 0.34;
          const holdEnd = 0.50;
          const burstEnd = 0.72;
          const end = 1.16;
          const time = ai.stateTime;

          owner.rotation += 36 * dt;
          owner.coreRotation -= 150 * dt;

          if (time < closeEnd) {
            const t = smoothstep(time / closeEnd);

            // Negative shellOpen compresses the slit fully shut.
            owner.shellOpen = -t;
            owner.y =
              owner.attackAnchorY +
              Math.sin(t * Math.PI) * 8;
          } else if (time < holdEnd) {
            owner.shellOpen = -1;
            owner.y = owner.attackAnchorY;
          } else if (time < burstEnd) {
            const t = smoothstep(
              (time - holdEnd) / (burstEnd - holdEnd),
            );

            owner.shellOpen = lerp(-1, 0.92, t);

            if (!owner.coreBurstFired && t >= 0.34) {
              owner.coreBurstFired = true;
              owner.coreFlash = 1;
              owner.fireCoreBurst();
              ctx.shakeCamera?.(18, 0.24);
            }
          } else {
            const t = smoothstep(
              (time - burstEnd) / (end - burstEnd),
            );

            owner.shellOpen = lerp(0.92, 0, t);
          }

          if (time >= end) {
            owner.shellOpen = 0;
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('coreOrbit', {
        enter: (owner) => {
          owner.attackAnchorY = owner.y;
          owner.orbitSpawned = false;
          owner.orbitReleaseTimer = 0;
          owner.orbitBulletsReleased = 0;
        },

        update: (owner, ai, dt, ctx) => {
          const openEnd = 0.48;
          const orbitHoldEnd = 1.22;
          const releaseEnd = 3.15;
          const end = 3.58;
          const time = ai.stateTime;
          const player = ai.targetPlayer(ctx);

          owner.rotation += 28 * dt;
          owner.coreRotation -= 190 * dt;

          if (time < openEnd) {
            const t = smoothstep(time / openEnd);
            owner.shellOpen = lerp(0, 1.05, t);
            owner.y = lerp(
              owner.attackAnchorY,
              owner.attackAnchorY - 18,
              t,
            );
          } else if (time < orbitHoldEnd) {
            owner.shellOpen = 1.05;
            owner.y = owner.attackAnchorY - 18;

            if (!owner.orbitSpawned) {
              owner.orbitSpawned = true;
              owner.spawnCoreOrbit();
              owner.coreFlash = 0.72;
            }
          } else if (time < releaseEnd) {
            owner.shellOpen = 1.05;
            owner.y = owner.attackAnchorY - 18;

            owner.orbitReleaseTimer -= dt;

            if (
              owner.orbitBulletsReleased <
                owner.orbitBulletCount &&
              owner.orbitReleaseTimer <= 0
            ) {
              owner.releaseNextOrbitBullet(player);
              owner.orbitBulletsReleased++;
              owner.orbitReleaseTimer =
                owner.orbitReleaseInterval;
              owner.coreFlash = Math.max(
                owner.coreFlash,
                0.34,
              );
            }
          } else {
            const t = smoothstep(
              (time - releaseEnd) /
              (end - releaseEnd),
            );

            owner.shellOpen = lerp(1.05, 0, t);
            owner.y = lerp(
              owner.attackAnchorY - 18,
              owner.attackAnchorY,
              easeOutCubic(t),
            );
          }

          if (time >= end) {
            owner.shellOpen = 0;
            owner.releaseAllOrbitBullets(player);
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('compressionShot', {
        enter: (owner) => {
          owner.attackAnchorY = owner.y;
          owner.compressionPulsesFired = 0;
          owner.compressionShotFired = false;
        },

        update: (owner, ai, dt, ctx) => {
          const pulseDuration = 0.48;
          const chargeEnd =
            owner.compressionPulseCount *
            pulseDuration;
          const revealEnd = chargeEnd + 0.42;
          const end = revealEnd + 0.48;
          const time = ai.stateTime;
          const player = ai.targetPlayer(ctx);

          owner.rotation += 22 * dt;
          owner.coreRotation -= 135 * dt;

          if (time < chargeEnd) {
            const pulseIndex = Math.min(
              owner.compressionPulseCount - 1,
              Math.floor(time / pulseDuration),
            );

            const local =
              (time - pulseIndex * pulseDuration) /
              pulseDuration;

            if (local < 0.56) {
              const down =
                easeOutBounce(local / 0.56);

              owner.shellOpen = -down;
              owner.y =
                owner.attackAnchorY +
                down * 10;
            } else {
              const up =
                easeOutCubic(
                  (local - 0.56) / 0.44,
                );

              owner.shellOpen = lerp(
                -1,
                0.12,
                up,
              );

              owner.y = lerp(
                owner.attackAnchorY + 10,
                owner.attackAnchorY,
                up,
              );
            }

            if (
              local >= 0.50 &&
              owner.compressionPulsesFired <= pulseIndex
            ) {
              owner.compressionPulsesFired++;
              owner.coreFlash = Math.min(
                1,
                0.34 +
                owner.compressionPulsesFired * 0.2,
              );
              ctx?.shakeCamera?.(
                4 + owner.compressionPulsesFired * 2,
                0.10,
              );
            }
          } else if (time < revealEnd) {
            const t = smoothstep(
              (time - chargeEnd) /
              (revealEnd - chargeEnd),
            );

            owner.shellOpen = lerp(0.12, 1.12, t);
            owner.y = lerp(
              owner.attackAnchorY,
              owner.attackAnchorY - 14,
              t,
            );

            if (
              !owner.compressionShotFired &&
              t >= 0.46 &&
              player
            ) {
              owner.compressionShotFired = true;
              owner.coreFlash = 1;
              owner.fireCompressionShot(player);
              ctx?.shakeCamera?.(16, 0.22);
            }
          } else {
            const t = smoothstep(
              (time - revealEnd) /
              (end - revealEnd),
            );

            owner.shellOpen = lerp(1.12, 0, t);
            owner.y = lerp(
              owner.attackAnchorY - 14,
              owner.attackAnchorY,
              easeOutCubic(t),
            );
          }

          if (time >= end) {
            owner.shellOpen = 0;
            ai.changeState('idle', ctx);
          }
        },
      })

      .addState('phaseTransition', {
        enter: (owner, ai, ctx) => {
          owner.attackAnchorY =
            owner.y;

          owner.shellOpen = 0;
          owner.coreFlash = 1;
          owner.phaseTransitionReleased =
            false;

          owner.freezeBulletsForPhaseTransition(
            ai.targetPlayer(ctx),
          );
        },

        update: (owner, ai, dt, ctx) => {
          const closeEnd = 0.34;
          const releaseTime = 0.82;
          const openEnd = 1.28;
          const end = 1.72;
          const time = ai.stateTime;

          owner.rotation += 58 * dt;
          owner.coreRotation -= 360 * dt;

          if (time < closeEnd) {
            const t =
              smoothstep(
                time / closeEnd,
              );

            owner.shellOpen =
              lerp(
                0,
                -1,
                t,
              );

            owner.y =
              owner.attackAnchorY +
              Math.sin(
                t *
                Math.PI,
              ) * 10;
          } else if (time < releaseTime) {
            owner.shellOpen = -1;
            owner.y =
              owner.attackAnchorY;
          } else if (time < openEnd) {
            if (
              !owner
                .phaseTransitionReleased
            ) {
              owner.phaseTransitionReleased =
                true;

              owner.releasePhaseTransitionBullets(
                owner
                  .phaseTransitionRotateAngle,
              );

              owner.coreFlash = 1;
              ctx?.shakeCamera?.(
                20,
                0.28,
              );
            }

            const t =
              smoothstep(
                (time - releaseTime) /
                (openEnd -
                releaseTime),
              );

            owner.shellOpen =
              lerp(
                -1,
                1.22,
                t,
              );

            owner.y =
              lerp(
                owner.attackAnchorY,
                owner.attackAnchorY - 20,
                t,
              );
          } else {
            const t =
              smoothstep(
                (time - openEnd) /
                (end - openEnd),
              );

            owner.shellOpen =
              lerp(
                1.22,
                0,
                t,
              );

            owner.y =
              lerp(
                owner.attackAnchorY - 20,
                owner.spawnY,
                easeOutCubic(t),
              );
          }

          if (time >= end) {
            owner.shellOpen = 0;
            owner.y = owner.spawnY;
            owner.lastAttack = null;
            ai.changeState(
              'idle',
              ctx,
            );
          }
        },
      })

      .addState('phase2SwirlOrbit', {
        enter: (owner) => {
          owner.attackAnchorY =
            owner.y;

          owner.fireTimer = 0;
          owner.orbitSpawned = false;
          owner.orbitReleaseTimer = 0;
          owner.orbitBulletsReleased = 0;
        },

        update: (owner, ai, dt, ctx) => {
          const openEnd = 0.44;
          const orbitHoldEnd = 1.08;
          const fireEnd = 3.52;
          const end = 3.94;
          const time = ai.stateTime;
          const player =
            ai.targetPlayer(ctx);

          owner.rotation += 214 * dt;
          owner.coreRotation -= 326 * dt;

          if (time < openEnd) {
            const t =
              smoothstep(
                time / openEnd,
              );

            owner.shellOpen =
              lerp(0, 1.08, t);

            owner.y =
              lerp(
                owner.attackAnchorY,
                owner.attackAnchorY - 22,
                t,
              );
          } else if (time < fireEnd) {
            owner.shellOpen = 1.08;
            owner.y =
              owner.attackAnchorY - 22;

            if (!owner.orbitSpawned) {
              owner.orbitSpawned = true;
              owner.spawnCoreOrbit();
              owner.coreFlash = 0.7;
            }

            owner.fireTimer -= dt;

            while (
              owner.fireTimer <= 0
            ) {
              owner.fireSwirlPair();
              owner.fireTimer +=
                owner
                  .phase2SwirlFireInterval;
            }

            if (
              time >=
              orbitHoldEnd
            ) {
              owner.orbitReleaseTimer -= dt;

              if (
                owner.orbitBulletsReleased <
                  owner.orbitBulletCount &&
                owner.orbitReleaseTimer <= 0
              ) {
                owner.releaseNextOrbitBullet(
                  player,
                );

                owner.orbitBulletsReleased++;

                owner.orbitReleaseTimer =
                  owner
                    .phase2OrbitReleaseInterval;

                owner.coreFlash =
                  Math.max(
                    owner.coreFlash,
                    0.32,
                  );
              }
            }
          } else {
            const t =
              smoothstep(
                (time - fireEnd) /
                (end - fireEnd),
              );

            owner.shellOpen =
              lerp(1.08, 0, t);

            owner.y =
              lerp(
                owner.attackAnchorY - 22,
                owner.spawnY,
                easeOutCubic(t),
              );
          }

          if (time >= end) {
            owner.releaseAllOrbitBullets(
              player,
            );

            owner.shellOpen = 0;
            ai.changeState(
              'idle',
              ctx,
            );
          }
        },
      })

      .addState('phase2OrbitCollapse', {
        enter: (owner) => {
          owner.attackAnchorY =
            owner.y;

          owner.orbitSpawned = false;
          owner.phase2OrbitCollapseReleased =
            false;
        },

        update: (owner, ai, dt, ctx) => {
          const openEnd = 0.42;
          const expandEnd = 1.45;
          const collapseTime = 1.62;
          const end = 2.38;
          const time = ai.stateTime;

          owner.rotation += 94 * dt;
          owner.coreRotation -= 288 * dt;

          if (time < openEnd) {
            const t =
              smoothstep(
                time / openEnd,
              );

            owner.shellOpen =
              lerp(0, 1.12, t);

            owner.y =
              lerp(
                owner.attackAnchorY,
                owner.attackAnchorY - 18,
                t,
              );
          } else if (time < collapseTime) {
            owner.shellOpen = 1.12;
            owner.y =
              owner.attackAnchorY - 18;

            if (!owner.orbitSpawned) {
              owner.orbitSpawned = true;
              owner.spawnCoreOrbit();
              owner.coreFlash = 0.75;
            }

            const expandT =
              smoothstep(
                clamp(
                  (time - openEnd) /
                    (expandEnd -
                    openEnd),
                  0,
                  1,
                ),
              );

            owner.setOrbitRadius(
              lerp(
                owner.orbitBulletRadius,
                owner
                  .phase2OrbitExpandRadius,
                expandT,
              ),
            );
          } else {
            if (
              !owner
                .phase2OrbitCollapseReleased
            ) {
              owner
                .phase2OrbitCollapseReleased =
                true;

              owner.releaseOrbitCollapse();

              owner.coreFlash = 1;
              ctx?.shakeCamera?.(
                13,
                0.18,
              );
            }

            const t =
              smoothstep(
                (time - collapseTime) /
                (end -
                collapseTime),
              );

            owner.shellOpen =
              lerp(
                1.12,
                0,
                t,
              );

            owner.y =
              lerp(
                owner.attackAnchorY - 18,
                owner.spawnY,
                easeOutCubic(t),
              );
          }

          if (time >= end) {
            owner.shellOpen = 0;
            ai.changeState(
              'idle',
              ctx,
            );
          }
        },
      })

      .addState('phase2CompressionCascade', {
        enter: (owner) => {
          owner.attackAnchorY =
            owner.y;

          owner.compressionPulsesFired = 0;
          owner.compressionShotFired = false;
        },

        update: (owner, ai, dt, ctx) => {
          const pulseDuration = 0.43;
          const chargeEnd =
            owner.compressionPulseCount *
            pulseDuration;

          const revealEnd =
            chargeEnd + 0.38;

          const end =
            revealEnd + 0.44;

          const time = ai.stateTime;
          const player =
            ai.targetPlayer(ctx);

          owner.rotation += 35 * dt;
          owner.coreRotation -= 205 * dt;

          if (time < chargeEnd) {
            const pulseIndex =
              Math.min(
                owner.compressionPulseCount - 1,
                Math.floor(
                  time /
                  pulseDuration,
                ),
              );

            const local =
              (
                time -
                pulseIndex *
                  pulseDuration
              ) /
              pulseDuration;

            if (local < 0.54) {
              const down =
                easeOutBounce(
                  local / 0.54,
                );

              owner.shellOpen = -down;

              owner.y =
                owner.attackAnchorY +
                down * 11;
            } else {
              const up =
                easeOutCubic(
                  (local - 0.54) /
                  0.46,
                );

              owner.shellOpen =
                lerp(
                  -1,
                  0.16,
                  up,
                );

              owner.y =
                lerp(
                  owner.attackAnchorY + 11,
                  owner.attackAnchorY,
                  up,
                );
            }

            if (
              local >= 0.48 &&
              owner.compressionPulsesFired <=
                pulseIndex
            ) {
              owner.compressionPulsesFired++;

              owner.coreFlash =
                Math.min(
                  1,
                  0.42 +
                    owner
                      .compressionPulsesFired *
                    0.19,
                );

              ctx?.shakeCamera?.(
                5 +
                  owner.compressionPulsesFired *
                  2,
                0.10,
              );
            }
          } else if (
            time < revealEnd
          ) {
            const t =
              smoothstep(
                (time - chargeEnd) /
                (revealEnd -
                chargeEnd),
              );

            owner.shellOpen =
              lerp(
                0.16,
                1.18,
                t,
              );

            owner.y =
              lerp(
                owner.attackAnchorY,
                owner.attackAnchorY - 15,
                t,
              );

            if (
              !owner.compressionShotFired &&
              t >= 0.43 &&
              player
            ) {
              owner.compressionShotFired = true;
              owner.coreFlash = 1;

              owner.fireCompressionShot(
                player,
                true,
              );

              ctx?.shakeCamera?.(
                18,
                0.23,
              );
            }
          } else {
            const t =
              smoothstep(
                (time - revealEnd) /
                (end - revealEnd),
              );

            owner.shellOpen =
              lerp(
                1.18,
                0,
                t,
              );

            owner.y =
              lerp(
                owner.attackAnchorY - 15,
                owner.spawnY,
                easeOutCubic(t),
              );
          }

          if (time >= end) {
            owner.shellOpen = 0;
            ai.changeState(
              'idle',
              ctx,
            );
          }
        },
      });
  }

  freezeBulletsForPhaseTransition(
    player,
  ) {
    // Orbiting bullets need a velocity first so the transition can rotate them
    // together with the rest of the field.
    this.releaseAllOrbitBullets(
      player,
    );

    for (const bullet of this.bullets) {
      if (
        bullet.life <= 0 ||
        bullet.health <= 0
      ) {
        continue;
      }

      bullet.phaseFrozen = true;
      bullet.phaseFrozenVX =
        bullet.vx ?? 0;

      bullet.phaseFrozenVY =
        bullet.vy ?? 0;

      bullet.vx = 0;
      bullet.vy = 0;
    }
  }

  releasePhaseTransitionBullets(
    rotation,
  ) {
    const c =
      Math.cos(rotation);

    const s =
      Math.sin(rotation);

    for (const bullet of this.bullets) {
      if (!bullet.phaseFrozen) {
        continue;
      }

      const vx =
        bullet.phaseFrozenVX ?? 0;

      const vy =
        bullet.phaseFrozenVY ?? 0;

      bullet.vx =
        vx * c -
        vy * s;

      bullet.vy =
        vx * s +
        vy * c;

      bullet.phaseFrozen = false;
      delete bullet.phaseFrozenVX;
      delete bullet.phaseFrozenVY;
    }

    this.shotSerial++;
  }

  setOrbitRadius(radius) {
    for (const bullet of this.bullets) {
      if (
        bullet.kind === 'orbit' &&
        bullet.orbiting
      ) {
        bullet.orbitRadius =
          radius;
      }
    }
  }

  releaseOrbitCollapse() {
    let released = false;

    for (const bullet of this.bullets) {
      if (
        bullet.kind !== 'orbit' ||
        !bullet.orbiting ||
        bullet.life <= 0 ||
        bullet.health <= 0
      ) {
        continue;
      }

      const dx =
        this.x - bullet.x;

      const dy =
        this.y - bullet.y;

      const length =
        Math.hypot(dx, dy) || 1;

      bullet.orbiting = false;

      bullet.vx =
        dx /
        length *
        this.phase2OrbitCollapseSpeed;

      bullet.vy =
        dy /
        length *
        this.phase2OrbitCollapseSpeed;

      bullet.life =
        this.orbitBulletLife;

      bullet.maxLife =
        this.orbitBulletLife;

      released = true;
    }

    if (released) {
      this.shotSerial++;
    }
  }

  getPredictedIntercept(
    player,
    projectileSpeed,
    originX = this.x,
    originY = this.y,
  ) {
    const rx = player.x - originX;
    const ry = player.y - originY;
    const vx = player.vx ?? 0;
    const vy = player.vy ?? 0;

    const a =
      vx * vx +
      vy * vy -
      projectileSpeed * projectileSpeed;

    const b =
      2 * (rx * vx + ry * vy);

    const d =
      rx * rx +
      ry * ry;

    let t = 0;

    if (Math.abs(a) < 0.0001) {
      if (Math.abs(b) > 0.0001) {
        const linearT = -d / b;
        if (linearT > 0) t = linearT;
      }
    } else {
      const discriminant =
        b * b - 4 * a * d;

      if (discriminant >= 0) {
        const root = Math.sqrt(discriminant);

        const candidates = [
          (-b - root) / (2 * a),
          (-b + root) / (2 * a),
        ]
          .filter(value => value > 0)
          .sort((x, y) => x - y);

        if (candidates.length > 0) {
          t = candidates[0];
        }
      }
    }

    if (!(t > 0) || !Number.isFinite(t)) {
      t =
        Math.hypot(rx, ry) /
        projectileSpeed;
    }

    t = clamp(t, 0, 1.10);

    return {
      x: player.x + vx * t,
      y: player.y + vy * t,
    };
  }

  spawnCoreOrbit() {
    const startAngle =
      this.coreRotation * Math.PI / 180;

    for (let i = 0; i < this.orbitBulletCount; i++) {
      const angle =
        startAngle +
        (i / this.orbitBulletCount) *
        Math.PI *
        2;

      this.bullets.push({
        x:
          this.x +
          Math.cos(angle) *
          this.orbitBulletRadius,
        y:
          this.y +
          Math.sin(angle) *
          this.orbitBulletRadius,
        vx: 0,
        vy: 0,
        life: this.orbitBulletLife,
        maxLife: this.orbitBulletLife,
        health: this.orbitBulletHealth,
        maxHealth: this.orbitBulletHealth,
        size: this.orbitBulletSize,
        damage: this.orbitBulletDamage,
        kind: 'orbit',
        opacity: 1,
        bounceFade: 1,
        maxBounces: 0,
        bounceCount: 0,
        orbiting: true,
        orbitAngle: angle,
        orbitRadius: this.orbitBulletRadius,
        hitPlayer: false,
      });
    }

    this.shotSerial++;
  }

  releaseNextOrbitBullet(player) {
    const bullet = this.bullets.find(
      entry =>
        entry.kind === 'orbit' &&
        entry.orbiting &&
        entry.life > 0 &&
        entry.health > 0,
    );

    if (!bullet) return false;

    bullet.orbiting = false;

    const predicted = player
      ? this.getPredictedIntercept(
          player,
          this.orbitBulletSpeed,
          bullet.x,
          bullet.y,
        )
      : {
          x: bullet.x + 1,
          y: bullet.y,
        };

    const dx = predicted.x - bullet.x;
    const dy = predicted.y - bullet.y;
    const length = Math.hypot(dx, dy) || 1;

    bullet.vx =
      (dx / length) *
      this.orbitBulletSpeed;

    bullet.vy =
      (dy / length) *
      this.orbitBulletSpeed;

    bullet.life = this.orbitBulletLife;
    bullet.maxLife = this.orbitBulletLife;
    this.shotSerial++;

    return true;
  }

  releaseAllOrbitBullets(player) {
    let released = false;

    for (const bullet of this.bullets) {
      if (
        bullet.kind !== 'orbit' ||
        !bullet.orbiting ||
        bullet.life <= 0 ||
        bullet.health <= 0
      ) {
        continue;
      }

      bullet.orbiting = false;

      const predicted = player
        ? this.getPredictedIntercept(
            player,
            this.orbitBulletSpeed,
            bullet.x,
            bullet.y,
          )
        : {
            x: bullet.x + 1,
            y: bullet.y,
          };

      const dx = predicted.x - bullet.x;
      const dy = predicted.y - bullet.y;
      const length = Math.hypot(dx, dy) || 1;

      bullet.vx =
        (dx / length) *
        this.orbitBulletSpeed;

      bullet.vy =
        (dy / length) *
        this.orbitBulletSpeed;

      bullet.life = this.orbitBulletLife;
      bullet.maxLife = this.orbitBulletLife;
      released = true;
    }

    if (released) this.shotSerial++;
  }

  fireCompressionShot(
    player,
    cascade = false,
  ) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;

    this.shotSerial++;

    this.spawnBullet(
      this.x,
      this.y,
      dx / length,
      dy / length,
      {
        size: this.compressionBulletSize,
        damage: this.compressionBulletDamage,
        speed: this.compressionBulletSpeed,
        life: this.compressionBulletLife,
        health: this.compressionBulletHealth,
        kind: 'compression',
        cascade,
      },
    );
  }

  spawnCompressionFirstSplit(
    x,
    y,
    inwardAngle,
    cascade = false,
  ) {
    this.shotSerial++;

    for (
      let i = 0;
      i < this.compressionFirstSplitCount;
      i++
    ) {
      const t =
        this.compressionFirstSplitCount === 1
          ? 0.5
          : i /
            (this.compressionFirstSplitCount - 1);

      const angle =
        inwardAngle +
        (t - 0.5) *
        this.compressionFirstSplitSpread;

      this.spawnBullet(
        x,
        y,
        Math.cos(angle),
        Math.sin(angle),
        {
          size: this.compressionFirstSplitSize,
          damage: this.compressionFirstSplitDamage,
          speed: this.compressionFirstSplitSpeed,
          life: this.compressionFirstSplitLife,
          health: this.compressionFirstSplitHealth,
          kind: 'compressionSplit1',
          cascade,
        },
      );
    }
  }

  spawnCompressionSecondSplit(
    x,
    y,
    inwardAngle,
  ) {
    this.shotSerial++;

    for (
      let i = 0;
      i < this.compressionSecondSplitCount;
      i++
    ) {
      const t =
        this.compressionSecondSplitCount === 1
          ? 0.5
          : i /
            (this.compressionSecondSplitCount - 1);

      const angle =
        inwardAngle +
        (t - 0.5) *
        this.compressionSecondSplitSpread;

      this.spawnBullet(
        x,
        y,
        Math.cos(angle),
        Math.sin(angle),
        {
          size: this.compressionSecondSplitSize,
          damage: this.compressionSecondSplitDamage,
          speed: this.compressionSecondSplitSpeed,
          life: this.compressionSecondSplitLife,
          health: this.compressionSecondSplitHealth,
          kind: 'compressionSplit2',
        },
      );
    }
  }

  spawnCompressionCascadeReturn(
    x,
    y,
    player,
  ) {
    if (!player) return;

    const predicted =
      this.getPredictedIntercept(
        player,
        this.phase2CascadeSpeed,
        x,
        y,
      );

    const dx =
      predicted.x - x;

    const dy =
      predicted.y - y;

    const length =
      Math.hypot(dx, dy) || 1;

    this.shotSerial++;

    this.spawnBullet(
      x,
      y,
      dx / length,
      dy / length,
      {
        size:
          this.compressionSecondSplitSize,
        damage:
          this.phase2CascadeDamage,
        speed:
          this.phase2CascadeSpeed,
        life:
          this.phase2CascadeLife,
        health:
          this.phase2CascadeHealth,
        kind:
          'compressionSplit2',
      },
    );
  }

  fireCoreBurst() {
    this.shotSerial++;
    for (let i = 0; i < this.burstBulletCount; i++) {
      const angle =
        (i / this.burstBulletCount) *
        Math.PI *
        2;

      this.spawnBullet(
        this.x,
        this.y,
        Math.cos(angle),
        Math.sin(angle),
        {
          size: this.burstBulletSize,
          damage: this.burstBulletDamage,
          speed: this.burstBulletSpeed,
          life: this.burstBulletLife,
          health: this.burstBulletHealth,
          kind: 'burst',
          opacity: 1,
          maxBounces: this.burstMaxBounces,
          bounceCount: 0,
          fading: false,
          fadeTimer: this.burstFinalFadeDuration,
          fadeDuration: this.burstFinalFadeDuration,
        },
      );
    }
  }

  fireSwirlPair() {
    this.shotSerial++;
    const angle =
      this.rotation * Math.PI / 180;

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    // Both spiral arms originate directly from the exposed core.
    this.spawnBullet(
      this.x,
      this.y,
      dirX,
      dirY,
    );

    this.spawnBullet(
      this.x,
      this.y,
      -dirX,
      -dirY,
    );
  }

  spawnBullet(
    x,
    y,
    dirX,
    dirY,
    {
      size = this.bulletSize,
      damage = this.bulletDamage,
      speed = this.bulletSpeed,
      life = this.bulletLife,
      health = this.bulletHealth,
      kind = 'swirl',
      opacity = 1,
      maxBounces = 0,
      bounceCount = 0,
      fading = false,
      fadeTimer = 0,
      fadeDuration = 0,
      cascade = false,
    } = {},
  ) {
    this.bullets.push({
      x,
      y,
      vx: dirX * speed,
      vy: dirY * speed,
      life,
      maxLife: life,
      health,
      maxHealth: health,
      size,
      damage,
      kind,
      opacity,
      maxBounces,
      bounceCount,
      fading,
      fadeTimer,
      fadeDuration,
      orbiting: false,
      hitPlayer: false,
      splitting: false,
      splitTimer: 0,
      splitDuration: 0,
      splitAngle: 0,
      splitStage: 0,
      cascade,
      phaseFrozen: false,
    });
  }

  reset(world) {
    this.health = this.maxHealth;
    this.dead = false;
    this.hurtFlash = 0;

    this.x = this.spawnX;
    this.y = this.spawnY;
    this.rotation = 0;
    this.coreRotation = 0;
    this.shellOpen = 0;
    this.attackAnchorY = this.y;
    this.patrolDirection = 1;

    this.bullets.length = 0;
    this.fxEvents.length = 0;
    this.shotSerial = 0;
    this.fireTimer = 0;
    this.lastAttack = null;
    this.orbitReleaseTimer = 0;
    this.orbitBulletsReleased = 0;
    this.orbitSpawned = false;
    this.compressionPulsesFired = 0;
    this.compressionShotFired = false;
    this.floodFireTimer = 0;
    this.floodDirection = this.patrolDirection;
    this.coreBurstFired = false;
    this.coreFlash = 0;
    this.phaseTransitionReleased = false;
    this.phase2OrbitCollapseReleased = false;

    this.ai.stateName = null;
    this.ai.stateTime = 0;
    this.ai.cooldowns.clear();
    this.ai.timers.clear();
    this.ai.phaseId = null;
    this.ai.changeState('idle', { world });
  }

  update(dt, context) {
    if (this.dead) return;

    this.ai.update(dt, context);

    this.updateBullets(
      dt,
      context.player,
      context.world,
      context.damageTargets ??
        [context.player],
    );

    this.hurtFlash = Math.max(
      0,
      this.hurtFlash - dt * 7.5,
    );

    this.coreFlash = Math.max(
      0,
      this.coreFlash - dt * 5.8,
    );
  }

  updateBullets(
    dt,
    player,
    world,
    targets,
  ) {
    const compressionSplits = [];

    for (const bullet of this.bullets) {
      if (bullet.phaseFrozen) {
        continue;
      }

      if (bullet.splitting) {
        bullet.splitTimer = Math.max(
          0,
          bullet.splitTimer - dt,
        );

        bullet.opacity =
          bullet.splitDuration > 0
            ? Math.max(
                0.25,
                bullet.splitTimer /
                  bullet.splitDuration,
              )
            : 0.25;

        if (bullet.splitTimer <= 0) {
          compressionSplits.push({
            x: bullet.x,
            y: bullet.y,
            angle: bullet.splitAngle,
            stage: bullet.splitStage,
            cascade:
              !!bullet.cascade,
          });

          bullet.life = 0;
        }

        continue;
      }

      if (
        bullet.kind === 'orbit' &&
        bullet.orbiting
      ) {
        bullet.orbitAngle +=
          this.orbitAngularSpeed * dt;

        bullet.x =
          this.x +
          Math.cos(bullet.orbitAngle) *
          bullet.orbitRadius;

        bullet.y =
          this.y +
          Math.sin(bullet.orbitAngle) *
          bullet.orbitRadius;

        continue;
      }

      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life = Math.max(
        0,
        bullet.life - dt,
      );

      if (
        bullet.reflected &&
        this.hitTest?.(
          bullet.x,
          bullet.y,
          bullet.size * 0.5,
        )
      ) {
        this.takeDamage(
          bullet.reflectedDamage ??
            bullet.damage ??
            10,
        );

        bullet.life = 0;
        bullet.health = 0;
        continue;
      }

      if (bullet.kind === 'burst') {
        const radius = bullet.size * 0.5;
        let bounced = false;

        if (
          bullet.x - radius <= 0 &&
          bullet.vx < 0
        ) {
          bullet.x = radius;
          bullet.vx = Math.abs(bullet.vx);
          bounced = true;
        } else if (
          bullet.x + radius >= world.width &&
          bullet.vx > 0
        ) {
          bullet.x =
            world.width - radius;
          bullet.vx = -Math.abs(bullet.vx);
          bounced = true;
        }

        if (
          bullet.y - radius <= world.roofY &&
          bullet.vy < 0
        ) {
          bullet.y = world.roofY + radius;
          bullet.vy = Math.abs(bullet.vy);
          bounced = true;
        } else if (
          bullet.y + radius >= world.floorY &&
          bullet.vy > 0
        ) {
          bullet.y =
            world.floorY - radius;
          bullet.vy = -Math.abs(bullet.vy);
          bounced = true;
        }

        if (bounced && !bullet.fading) {
          this.fxEvents.push({
            type: 'ricochet',
            x: bullet.x,
            y: bullet.y,
          });

          bullet.bounceCount++;

          if (
            bullet.bounceCount >=
            bullet.maxBounces
          ) {
            bullet.fading = true;
            bullet.fadeTimer =
              bullet.fadeDuration;
          }
        }

        if (bullet.fading) {
          bullet.fadeTimer = Math.max(
            0,
            bullet.fadeTimer - dt,
          );

          bullet.opacity =
            bullet.fadeDuration > 0
              ? bullet.fadeTimer /
                bullet.fadeDuration
              : 0;

          if (bullet.fadeTimer <= 0) {
            bullet.life = 0;
          }
        }
      } else if (
        (
          bullet.kind === 'compression' ||
          bullet.kind === 'compressionSplit1'
        ) &&
        bullet.life > 0
      ) {
        const radius = bullet.size * 0.5;
        let splitAngle = null;

        if (
          bullet.x - radius <= 0 &&
          bullet.vx < 0
        ) {
          bullet.x = radius;
          splitAngle = 0;
        } else if (
          bullet.x + radius >= world.width &&
          bullet.vx > 0
        ) {
          bullet.x =
            world.width - radius;
          splitAngle = Math.PI;
        } else if (
          bullet.y - radius <= world.roofY &&
          bullet.vy < 0
        ) {
          bullet.y = world.roofY + radius;
          splitAngle = Math.PI / 2;
        } else if (
          bullet.y + radius >= world.floorY &&
          bullet.vy > 0
        ) {
          bullet.y =
            world.floorY - radius;
          splitAngle = -Math.PI / 2;
        }

        if (splitAngle !== null) {
          this.fxEvents.push({
            type: 'wallImpact',
            x: bullet.x,
            y: bullet.y,
          });

          bullet.splitting = true;
          bullet.splitDuration =
            this.compressionSplitTransitionDuration;
          bullet.splitTimer =
            bullet.splitDuration;
          bullet.splitAngle =
            splitAngle;
          bullet.splitStage =
            bullet.kind === 'compression'
              ? 1
              : (
                  bullet.cascade
                    ? 3
                    : 2
                );
          bullet.vx = 0;
          bullet.vy = 0;
          bullet.opacity = 1;
        }
      }

      if (
        !bullet.hitPlayer &&
        !bullet.reflected &&
        !bullet.orbiting &&
        targets?.length &&
        bullet.health > 0 &&
        bullet.life > 0
      ) {
        for (
          const target
          of targets
        ) {
          if (!target) continue;

          const radius =
            bullet.size * 0.5 +
            Math.max(
              target.w ?? 0,
              target.h ?? 0,
            ) *
            0.40;

          if (
            Math.hypot(
              bullet.x - target.x,
              bullet.y - target.y,
            ) <= radius
          ) {
            const opacity =
              bullet.opacity ?? 1;

            const damage =
              bullet.damage *
              opacity;

            const incoming =
              target.handleIncomingProjectile?.(
                bullet,
                {
                  damage,
                  owner: this,
                },
              );

            if (incoming?.handled) {
              if (
                incoming.destroyProjectile
              ) {
                bullet.hitPlayer = true;
                bullet.life = 0;
              }

              break;
            }

            if (
              target.takeDamage?.(
                damage,
              )
            ) {
              bullet.hitPlayer = true;
              bullet.life = 0;
              break;
            }
          }
        }
      }

      if (
        bullet.kind !== 'burst' &&
        bullet.kind !== 'compression' &&
        bullet.kind !== 'compressionSplit1' &&
        (
          bullet.x < -100 ||
          bullet.x > world.width + 100 ||
          bullet.y < -100 ||
          bullet.y > world.floorY + 160
        )
      ) {
        bullet.life = 0;
      }
    }

    for (const split of compressionSplits) {
      if (split.stage === 1) {
        this.spawnCompressionFirstSplit(
          split.x,
          split.y,
          split.angle,
          split.cascade,
        );
      } else if (split.stage === 3) {
        this.spawnCompressionCascadeReturn(
          split.x,
          split.y,
          player,
        );
      } else {
        this.spawnCompressionSecondSplit(
          split.x,
          split.y,
          split.angle,
        );
      }
    }

    this.bullets = this.bullets.filter(
      bullet =>
        bullet.life > 0 &&
        bullet.health > 0,
    );
  }

  damageProjectileAt(
    x,
    y,
    radius,
    damage,
  ) {
    if (damage <= 0) return false;

    for (const bullet of this.bullets) {
      if (
        bullet.life <= 0 ||
        bullet.health <= 0
      ) {
        continue;
      }

      if (
        Math.hypot(
          bullet.x - x,
          bullet.y - y,
        ) <= bullet.size * 0.5 + radius
      ) {
        const healthBefore =
          bullet.health;

        bullet.health = Math.max(
          0,
          bullet.health - damage,
        );

        if (
          healthBefore > 0 &&
          bullet.health <= 0
        ) {
          this.fxEvents.push({
            type: 'projectileBreak',
            x: bullet.x,
            y: bullet.y,
          });
        }

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

    for (const bullet of this.bullets) {
      if (
        bullet.life <= 0 ||
        bullet.health <= 0
      ) {
        continue;
      }

      const relX = bullet.x - originX;
      const relY = bullet.y - originY;

      const along =
        relX * dirX +
        relY * dirY;

      if (
        along < 0 ||
        along > maxDistance
      ) {
        continue;
      }

      const closestX =
        originX + dirX * along;

      const closestY =
        originY + dirY * along;

      const distance = Math.hypot(
        bullet.x - closestX,
        bullet.y - closestY,
      );

      if (
        distance <=
        bullet.size * 0.5 + beamRadius
      ) {
        const healthBefore =
          bullet.health;

        bullet.health = Math.max(
          0,
          bullet.health - damage,
        );

        if (
          healthBefore > 0 &&
          bullet.health <= 0
        ) {
          this.fxEvents.push({
            type: 'projectileBreak',
            x: bullet.x,
            y: bullet.y,
          });
        }

        hits++;
      }
    }

    return hits;
  }

  hitTest(x, y, radius = 0) {
    return (
      Math.hypot(
        x - this.x,
        y - this.y,
      ) <=
      this.halfSize + radius
    );
  }

  takeDamage(amount) {
    if (
      this.dead ||
      amount <= 0
    ) {
      return false;
    }

    this.health = Math.max(
      0,
      this.health - amount,
    );

    this.hurtFlash = 1;

    if (this.health <= 0) {
      this.dead = true;
    }

    return true;
  }

  makeShellDefinition(
    openAmount,
    flash = false,
  ) {
    const px = this.artPixelSize;
    const rx = this.shellRadiusX / px;
    const ry = this.shellRadiusY / px;

    const gap =
      (
        openAmount < 0
          ? lerp(
              this.shellGap,
              0,
              -openAmount,
            )
          : lerp(
              this.shellGap,
              this.attackGap,
              openAmount,
            )
      ) / px;

    const innerY = 7 / px;

    const topOffset = -gap / 2;
    const bottomOffset = gap / 2;

    const color =
      flash
        ? '#ffffff'
        : this.baseColor;

    return group([
      polygon({
        points: [
          [-rx * 0.56, -ry + topOffset],
          [rx * 0.56, -ry + topOffset],
          [rx, -innerY + topOffset],
          [-rx, -innerY + topOffset],
        ],
        color,
      }),
      polygon({
        points: [
          [-rx, innerY + bottomOffset],
          [rx, innerY + bottomOffset],
          [rx * 0.56, ry + bottomOffset],
          [-rx * 0.56, ry + bottomOffset],
        ],
        color,
      }),
    ], {
      mergeOutlines: false,
      outline: flash
        ? false
        : {
            enabled: true,
            color: this.outlineColor,
            thickness: 1,
          },
      padding: 3,
    });
  }

  getShellRaster(
    angle = this.rotation,
    openAmount = this.shellOpen,
    flash = false,
  ) {
    const cacheAngle =
      (
        (
          Math.round(angle / 3) *
          3
        ) %
        360 +
        360
      ) %
      360;

    const openStep =
      Math.round(
        clamp(openAmount, -1, 1.5) * 8,
      ) / 8;

    const key =
      `${cacheAngle}:${openStep}`;

    const cache =
      flash
        ? this.flashRasterCache
        : this.shellRasterCache;

    if (!cache.has(key)) {
      const definition =
        this.makeShellDefinition(
          openStep,
          flash,
        );

      cache.set(
        key,
        rasterize(
          definition,
          cacheAngle,
        ),
      );
    }

    return cache.get(key);
  }

  getCoreRaster(
    angle = this.coreRotation,
  ) {
    const cacheAngle =
      (
        (
          Math.round(angle / 3) *
          3
        ) %
        360 +
        360
      ) %
      360;

    if (
      !this.coreRasterCache.has(
        cacheAngle,
      )
    ) {
      this.coreRasterCache.set(
        cacheAngle,
        rasterize(
          this.coreDefinition,
          cacheAngle,
        ),
      );
    }

    return this.coreRasterCache.get(
      cacheAngle,
    );
  }

  drawRaster(
    ctx,
    raster,
    x,
    y,
    cameraX,
    artPixelSize,
    alpha = 1,
  ) {
    const dw =
      raster.width * artPixelSize;

    const dh =
      raster.height * artPixelSize;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      raster,
      Math.round(
        x -
        cameraX -
        dw / 2,
      ),
      Math.round(
        y -
        dh / 2,
      ),
      dw,
      dh,
    );

    ctx.restore();
  }

  drawCore(
    ctx,
    cameraX,
    artPixelSize,
  ) {
    const raster =
      this.getCoreRaster();

    // Chunky stepped glow using the exact same pixel raster at larger scales.
    this.drawRaster(
      ctx,
      raster,
      this.x,
      this.y,
      cameraX,
      artPixelSize * 1.34,
      0.16,
    );

    this.drawRaster(
      ctx,
      raster,
      this.x,
      this.y,
      cameraX,
      artPixelSize * 1.16,
      0.34,
    );

    this.drawRaster(
      ctx,
      raster,
      this.x,
      this.y,
      cameraX,
      artPixelSize,
      1,
    );

    if (this.coreFlash > 0) {
      this.drawRaster(
        ctx,
        raster,
        this.x,
        this.y,
        cameraX,
        artPixelSize * 1.62,
        this.coreFlash * 0.46,
      );

      this.drawRaster(
        ctx,
        raster,
        this.x,
        this.y,
        cameraX,
        artPixelSize * 1.28,
        this.coreFlash * 0.88,
      );
    }
  }

  drawBullets(ctx, cameraX) {
    ctx.save();
    ctx.fillStyle = '#ffffff';

    for (const bullet of this.bullets) {
      const alpha =
        (bullet.life / bullet.maxLife) *
        (bullet.opacity ?? 1);

      let renderSize =
        bullet.size;

      let renderAlpha =
        Math.max(0, alpha);

      if (bullet.phaseFrozen) {
        const pulse =
          0.5 +
          0.5 *
          Math.sin(
            this.ai.stateTime *
            24,
          );

        renderSize *=
          1.10 +
          pulse * 0.08;

        renderAlpha =
          Math.max(
            renderAlpha,
            0.82 +
            pulse * 0.18,
          );
      }

      if (bullet.splitting) {
        const t =
          bullet.splitDuration > 0
            ? 1 -
              bullet.splitTimer /
              bullet.splitDuration
            : 1;

        renderSize =
          bullet.size *
          lerp(
            1,
            0.42,
            smoothstep(t),
          );

        renderAlpha =
          Math.max(
            renderAlpha,
            0.45 +
            Math.sin(t * Math.PI) *
              0.45,
          );
      }

      const half =
        renderSize / 2;

      ctx.globalAlpha =
        renderAlpha;

      const strongGlow =
        bullet.phaseFrozen ||
        bullet.kind === 'burst' ||
        bullet.kind === 'orbit' ||
        bullet.kind === 'compression' ||
        bullet.kind === 'compressionSplit1';

      ctx.shadowColor =
        strongGlow
          ? 'rgba(255,255,255,1)'
          : 'rgba(255,255,255,0.75)';

      ctx.shadowBlur =
        strongGlow
          ? 18
          : 8;

      ctx.fillRect(
        Math.round(
          bullet.x -
          cameraX -
          half,
        ),
        Math.round(
          bullet.y -
          half,
        ),
        renderSize,
        renderSize,
      );
    }

    ctx.restore();
  }

  draw(
    ctx,
    cameraX,
    artPixelSize = 4,
  ) {
    if (this.dead) return;

    // Core behind the split shell.
    this.drawCore(
      ctx,
      cameraX,
      artPixelSize,
    );

    const shell =
      this.getShellRaster();

    this.drawRaster(
      ctx,
      shell,
      this.x,
      this.y,
      cameraX,
      artPixelSize,
      1,
    );

    if (this.hurtFlash > 0) {
      const flash =
        this.getShellRaster(
          this.rotation,
          this.shellOpen,
          true,
        );

      this.drawRaster(
        ctx,
        flash,
        this.x,
        this.y,
        cameraX,
        artPixelSize,
        this.hurtFlash,
      );
    }

    // Matrix bullets intentionally render last so they sit above the shell/core
    // instead of disappearing behind the boss at spawn.
    this.drawBullets(
      ctx,
      cameraX,
    );

  }
}
