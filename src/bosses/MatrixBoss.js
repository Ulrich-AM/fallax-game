import { BossAI } from './BossAI.js?v=32';
import { polygon, group, rasterize } from '../pixelShapes.js?v=32';

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
    this.compressionSplitCount = 11;
    this.compressionSplitSpread = Math.PI * 0.78;
    this.compressionSplitSize = 16;
    this.compressionSplitDamage = 10;
    this.compressionSplitSpeed = 390;
    this.compressionSplitLife = 3.8;
    this.compressionSplitHealth = 4;

    // Core burst.
    this.coreBurstFired = false;
    this.coreFlash = 0;
    this.burstBulletCount = 8;
    this.burstBulletSize = 30;
    this.burstBulletDamage = 22;
    this.burstBulletSpeed = 300;
    this.burstBulletLife = 10.0;
    this.burstBulletHealth = 10;
    this.burstBounceFade = 0.68;
    this.burstMaxBounces = 4;

    this.ai = new BossAI(this, {
      initialState: 'idle',
      phases: [
        { id: 'phase1', atOrBelow: 1.0 },
      ],
    });

    this.installStates(world);
  }

  get healthRatio() {
    return this.health / this.maxHealth;
  }

  get phaseLabel() {
    return 'phase 1';
  }

  installStates(world) {
    this.ai
      .addState('idle', {
        enter: (owner, ai) => {
          owner.shellOpen = 0;
          owner.attackAnchorY = owner.y;

          ai.setTimer(
            'attackDelay',
            1.8 + Math.random() * 1.4,
          );
        },

        update: (owner, ai, dt) => {
          owner.rotation += 12 * dt;
          owner.coreRotation -= 68 * dt;

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

          owner.y = owner.spawnY;

          if (ai.timerDone('attackDelay')) {
            const choices = [
              'swirl',
              'coreBurst',
              'coreOrbit',
              'compressionShot',
            ].filter(name => name !== owner.lastAttack);

            const next =
              choices[
                Math.floor(Math.random() * choices.length)
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
              owner.shellOpen =
                -smoothstep(local / 0.56);
            } else {
              owner.shellOpen = lerp(
                -1,
                0.12,
                smoothstep(
                  (local - 0.56) / 0.44,
                ),
              );
            }

            owner.y =
              owner.attackAnchorY +
              Math.sin(local * Math.PI) * 5;

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
      });
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

  fireCompressionShot(player) {
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
      },
    );
  }

  spawnCompressionSplit(
    x,
    y,
    inwardAngle,
  ) {
    this.shotSerial++;

    for (
      let i = 0;
      i < this.compressionSplitCount;
      i++
    ) {
      const t =
        this.compressionSplitCount === 1
          ? 0.5
          : i /
            (this.compressionSplitCount - 1);

      const angle =
        inwardAngle +
        (t - 0.5) *
        this.compressionSplitSpread;

      this.spawnBullet(
        x,
        y,
        Math.cos(angle),
        Math.sin(angle),
        {
          size: this.compressionSplitSize,
          damage: this.compressionSplitDamage,
          speed: this.compressionSplitSpeed,
          life: this.compressionSplitLife,
          health: this.compressionSplitHealth,
          kind: 'compressionSplit',
        },
      );
    }
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
          bounceFade: this.burstBounceFade,
          maxBounces: this.burstMaxBounces,
          bounceCount: 0,
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
      bounceFade = 1,
      maxBounces = 0,
      bounceCount = 0,
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
      bounceFade,
      maxBounces,
      bounceCount,
      orbiting: false,
      hitPlayer: false,
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
    this.shotSerial = 0;
    this.fireTimer = 0;
    this.lastAttack = null;
    this.orbitReleaseTimer = 0;
    this.orbitBulletsReleased = 0;
    this.orbitSpawned = false;
    this.compressionPulsesFired = 0;
    this.compressionShotFired = false;
    this.coreBurstFired = false;
    this.coreFlash = 0;

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

  updateBullets(dt, player, world) {
    const compressionSplits = [];

    for (const bullet of this.bullets) {
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
          bullet.y - radius <= 0 &&
          bullet.vy < 0
        ) {
          bullet.y = radius;
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

        if (bounced) {
          bullet.bounceCount++;
          bullet.opacity *= bullet.bounceFade;

          if (
            bullet.bounceCount >=
            bullet.maxBounces
          ) {
            bullet.life = 0;
          }
        }
      } else if (
        bullet.kind === 'compression' &&
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
          bullet.y - radius <= 0 &&
          bullet.vy < 0
        ) {
          bullet.y = radius;
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
          compressionSplits.push({
            x: bullet.x,
            y: bullet.y,
            angle: splitAngle,
          });

          bullet.life = 0;
        }
      }

      if (
        !bullet.hitPlayer &&
        !bullet.orbiting &&
        player &&
        bullet.health > 0 &&
        bullet.life > 0
      ) {
        const radius =
          bullet.size * 0.5 +
          Math.max(player.w, player.h) *
          0.40;

        if (
          Math.hypot(
            bullet.x - player.x,
            bullet.y - player.y,
          ) <= radius
        ) {
          const opacity =
            bullet.opacity ?? 1;

          if (
            player.takeDamage?.(
              bullet.damage * opacity,
            )
          ) {
            bullet.hitPlayer = true;
            bullet.life = 0;
          }
        }
      }

      if (
        bullet.kind !== 'burst' &&
        bullet.kind !== 'compression' &&
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
      this.spawnCompressionSplit(
        split.x,
        split.y,
        split.angle,
      );
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
        bullet.health = Math.max(
          0,
          bullet.health - damage,
        );

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
        bullet.health = Math.max(
          0,
          bullet.health - damage,
        );

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

      const half = bullet.size / 2;

      ctx.globalAlpha =
        Math.max(0, alpha);

      const strongGlow =
        bullet.kind === 'burst' ||
        bullet.kind === 'orbit' ||
        bullet.kind === 'compression';

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
        bullet.size,
        bullet.size,
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
