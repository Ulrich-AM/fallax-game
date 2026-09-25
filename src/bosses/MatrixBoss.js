import { BossAI } from './BossAI.js?v=26';

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

function drawHexagon(ctx, radiusX, radiusY) {
  ctx.beginPath();

  for (let i = 0; i < 6; i++) {
    const angle =
      -Math.PI / 2 +
      i * Math.PI / 3;

    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
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
    this.idleClock = 0;
    this.attackAnchorY = this.y;

    this.baseColor = '#777b82';
    this.outlineColor = '#494c52';
    this.coreColor = '#ffffff';

    // Matrix is rendered to a low-resolution offscreen canvas and then
    // nearest-neighbor upscaled so its silhouette/glow stay visibly pixelated.
    this.pixelScale = 4;
    this.pixelCanvasSize = 320;
    this.pixelCanvas = document.createElement('canvas');
    this.pixelCanvas.width = this.pixelCanvasSize / this.pixelScale;
    this.pixelCanvas.height = this.pixelCanvasSize / this.pixelScale;
    this.pixelCtx = this.pixelCanvas.getContext('2d');
    this.pixelCtx.imageSmoothingEnabled = false;

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
          owner.attackAnchorY = owner.spawnY;
          ai.setTimer(
            'attackDelay',
            1.8 + Math.random() * 1.4,
          );
        },

        update: (owner, ai, dt) => {
          owner.idleClock += dt;
          owner.rotation += 12 * dt;
          owner.coreRotation -= 68 * dt;

          // Simple left-to-right hover. Matrix keeps a fixed altitude instead
          // of following a looping or figure-eight path.
          const travel = 360;
          const cycle = owner.idleClock * 0.42;
          owner.x =
            owner.spawnX +
            Math.sin(cycle) * travel;

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

          owner.idleClock += dt;

          if (time < openEnd) {
            const t = smoothstep(time / openEnd);
            owner.shellOpen = t;

            // The entire boss rises slightly while the shell opens.
            owner.y = lerp(
              owner.attackAnchorY,
              owner.attackAnchorY - 24,
              t,
            );
          } else if (time < fireEnd) {
            owner.shellOpen = 1;
            owner.y = owner.attackAnchorY - 24;

            // Rotation drives both emitter positions and projectile directions,
            // producing a two-arm spiral rather than a fixed radial burst.
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
    const angle = this.rotation * Math.PI / 180;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    // Both arms originate from the exposed white core. Opposite directions
    // still create the two-arm rotating spiral, but visually the projectiles
    // now burst directly out of Matrix's center.
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
    this.idleClock = 0;
    this.shellOpen = 0;
    this.attackAnchorY = this.y;

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
      bullet.life = Math.max(0, bullet.life - dt);

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
          if (player.takeDamage?.(this.bulletDamage)) {
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

  damageProjectileAt(x, y, radius, damage) {
    if (damage <= 0) return false;

    const bulletRadius = this.bulletSize * 0.5;

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
    const bulletRadius = this.bulletSize * 0.5;

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
        relX * dirX + relY * dirY;

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
      Math.hypot(x - this.x, y - this.y) <=
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

  drawShellHalf(ctx, top) {
    const gap =
      lerp(
        this.shellGap,
        this.attackGap,
        this.shellOpen,
      );

    const yOffset =
      top
        ? -gap / 2
        : gap / 2;

    const rx = this.shellRadiusX;
    const ry = this.shellRadiusY;
    const innerY = 7;
    const topY = -ry;
    const bottomY = ry;

    ctx.beginPath();

    if (top) {
      ctx.moveTo(-rx * 0.56, topY + yOffset);
      ctx.lineTo(rx * 0.56, topY + yOffset);
      ctx.lineTo(rx, -innerY + yOffset);
      ctx.lineTo(-rx, -innerY + yOffset);
    } else {
      ctx.moveTo(-rx, innerY + yOffset);
      ctx.lineTo(rx, innerY + yOffset);
      ctx.lineTo(rx * 0.56, bottomY + yOffset);
      ctx.lineTo(-rx * 0.56, bottomY + yOffset);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawCore(ctx) {
    ctx.save();
    ctx.rotate(
      this.coreRotation * Math.PI / 180,
    );

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,255,255,1)';
    ctx.shadowBlur = 28;

    drawHexagon(ctx, 42, 42);
    ctx.fill();

    ctx.shadowBlur = 12;
    drawHexagon(ctx, 35, 35);
    ctx.fill();

    ctx.restore();
  }

  drawBullets(ctx, cameraX) {
    const half = this.bulletSize / 2;

    ctx.save();
    ctx.fillStyle = '#ffffff';

    for (const bullet of this.bullets) {
      const alpha =
        bullet.life / bullet.maxLife;

      ctx.globalAlpha =
        Math.max(0, alpha);

      ctx.shadowColor =
        'rgba(255,255,255,0.75)';
      ctx.shadowBlur = 8;

      ctx.fillRect(
        Math.round(
          bullet.x -
          cameraX -
          half
        ),
        Math.round(
          bullet.y -
          half
        ),
        this.bulletSize,
        this.bulletSize,
      );
    }

    ctx.restore();
  }

  renderPixelSprite() {
    const pctx = this.pixelCtx;
    const size = this.pixelCanvas.width;
    const scale = 1 / this.pixelScale;

    pctx.clearRect(0, 0, size, size);
    pctx.save();
    pctx.translate(size / 2, size / 2);
    pctx.scale(scale, scale);
    pctx.rotate(this.rotation * Math.PI / 180);

    // Core first, so the shell naturally masks its edges.
    pctx.save();
    pctx.rotate(this.coreRotation * Math.PI / 180);

    // A low-resolution glow becomes a deliberately chunky halo once the
    // offscreen canvas is enlarged.
    pctx.fillStyle = 'rgba(255,255,255,0.18)';
    drawHexagon(pctx, 52, 52);
    pctx.fill();

    pctx.fillStyle = 'rgba(255,255,255,0.42)';
    drawHexagon(pctx, 47, 47);
    pctx.fill();

    pctx.fillStyle = '#ffffff';
    drawHexagon(pctx, 42, 42);
    pctx.fill();

    pctx.restore();

    pctx.lineWidth = 5;
    pctx.lineJoin = 'miter';
    pctx.fillStyle = this.baseColor;
    pctx.strokeStyle = this.outlineColor;

    this.drawShellHalf(pctx, true);
    this.drawShellHalf(pctx, false);

    if (this.hurtFlash > 0) {
      pctx.globalAlpha = this.hurtFlash * 0.82;
      pctx.fillStyle = '#ffffff';
      pctx.strokeStyle = '#ffffff';

      this.drawShellHalf(pctx, true);
      this.drawShellHalf(pctx, false);
    }

    pctx.restore();
  }

  draw(ctx, cameraX) {
    if (this.dead) return;

    this.drawBullets(ctx, cameraX);
    this.renderPixelSprite();

    const drawSize = this.pixelCanvasSize;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.pixelCanvas,
      Math.round(this.x - cameraX - drawSize / 2),
      Math.round(this.y - drawSize / 2),
      drawSize,
      drawSize,
    );
    ctx.restore();
  }

}
