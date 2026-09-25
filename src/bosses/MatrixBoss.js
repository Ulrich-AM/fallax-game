import { BossAI } from './BossAI.js?v=27';
import { polygon, group, rasterize } from '../pixelShapes.js?v=27';

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
    this.maxHealth = 800;
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
    this.bulletSpeed = 335;
    this.bulletLife = 4.0;
    this.bulletSize = 16;
    this.bulletDamage = 8;
    this.bulletHealth = 5;
    this.fireInterval = 0.075;
    this.fireTimer = 0;

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
            ai.changeState('swirl');
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
      });
  }

  fireSwirlPair() {
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

  spawnBullet(x, y, dirX, dirY) {
    this.bullets.push({
      x,
      y,
      vx: dirX * this.bulletSpeed,
      vy: dirY * this.bulletSpeed,
      life: this.bulletLife,
      maxLife: this.bulletLife,
      health: this.bulletHealth,
      maxHealth: this.bulletHealth,
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
    this.fireTimer = 0;

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
  }

  updateBullets(dt, player, world) {
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life = Math.max(
        0,
        bullet.life - dt,
      );

      if (
        !bullet.hitPlayer &&
        player &&
        bullet.health > 0
      ) {
        const radius =
          this.bulletSize * 0.5 +
          Math.max(player.w, player.h) * 0.40;

        if (
          Math.hypot(
            bullet.x - player.x,
            bullet.y - player.y,
          ) <= radius
        ) {
          if (
            player.takeDamage?.(
              this.bulletDamage,
            )
          ) {
            bullet.hitPlayer = true;
            bullet.life = 0;
          }
        }
      }

      if (
        bullet.x < -100 ||
        bullet.x > world.width + 100 ||
        bullet.y < -100 ||
        bullet.y > world.floorY + 160
      ) {
        bullet.life = 0;
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

    const bulletRadius =
      this.bulletSize * 0.5;

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
        ) <= bulletRadius + radius
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
    const bulletRadius =
      this.bulletSize * 0.5;

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
        bulletRadius + beamRadius
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
      lerp(
        this.shellGap,
        this.attackGap,
        openAmount,
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
        clamp(openAmount, 0, 1) * 8,
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
  }

  drawBullets(ctx, cameraX) {
    const half =
      this.bulletSize / 2;

    ctx.save();
    ctx.fillStyle = '#ffffff';

    for (const bullet of this.bullets) {
      const alpha =
        bullet.life /
        bullet.maxLife;

      ctx.globalAlpha =
        Math.max(0, alpha);

      ctx.shadowColor =
        'rgba(255,255,255,0.75)';

      ctx.shadowBlur = 8;

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
        this.bulletSize,
        this.bulletSize,
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
