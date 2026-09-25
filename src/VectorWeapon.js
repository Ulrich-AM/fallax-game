import { rectangle, group, rasterize } from './pixelShapes.js?v=8';

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function randomSpread(radians) {
  return (Math.random() * 2 - 1) * radians;
}

export class VectorWeapon {
  constructor() {
    this.name = 'Vector';
    this.damage = 4;
    this.orbitRadius = 42;
    this.bulletSpeed = 1020;
    this.bulletLife = 1.6;
    this.bodyArtSize = 4;
    this.bulletTrailLife = 0.14;
    this.bulletTrailInterval = 0.018;
    this.bulletTrailMaxGhosts = 7;

    // Short three-round bursts.
    this.burstSize = 3;
    this.burstInterval = 0.07;
    this.burstCooldown = 0.42;
    this.inaccuracy = degToRad(3);

    this.cooldownTimer = 0;
    this.burstShotsRemaining = 0;
    this.burstShotTimer = 0;
    this.bullets = [];

    this.definition = group([
      rectangle({
        width: this.bodyArtSize,
        height: this.bodyArtSize,
        color: '#050505',
      }),
    ], {
      mergeOutlines: true,
      outline: { enabled: true, color: '#c8ccd4', thickness: 1 },
      padding: 1,
    });

    this.raster = rasterize(this.definition);
  }

  reset() {
    this.cooldownTimer = 0;
    this.burstShotsRemaining = 0;
    this.burstShotTimer = 0;
    this.bullets.length = 0;
  }

  getAim(player, pointerWorld) {
    const dx = pointerWorld.x - player.x;
    const dy = pointerWorld.y - player.y;
    const angle = Math.atan2(dy, dx);
    return {
      angle,
      x: player.x + Math.cos(angle) * this.orbitRadius,
      y: player.y + Math.sin(angle) * this.orbitRadius,
    };
  }

  update(dt, player, pointerWorld, firing, world) {
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    this.burstShotTimer = Math.max(0, this.burstShotTimer - dt);

    if (firing && this.cooldownTimer <= 0 && this.burstShotsRemaining <= 0) {
      this.burstShotsRemaining = this.burstSize;
      this.burstShotTimer = 0;
      this.cooldownTimer = this.burstCooldown;
    }

    if (this.burstShotsRemaining > 0 && this.burstShotTimer <= 0) {
      this.fireOne(player, pointerWorld);
      this.burstShotsRemaining--;
      this.burstShotTimer = this.burstInterval;
    }

    for (const bullet of this.bullets) {
      bullet.trailTimer -= dt;

      if (bullet.trailTimer <= 0) {
        bullet.trail.push({
          x: bullet.x,
          y: bullet.y,
          life: this.bulletTrailLife,
          maxLife: this.bulletTrailLife,
        });

        if (bullet.trail.length > this.bulletTrailMaxGhosts) {
          bullet.trail.shift();
        }

        bullet.trailTimer = this.bulletTrailInterval;
      }

      for (const ghost of bullet.trail) {
        ghost.life -= dt;
      }

      bullet.trail = bullet.trail.filter(ghost => ghost.life > 0);

      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
    }

    this.bullets = this.bullets.filter(bullet =>
      bullet.life > 0
      && bullet.x > -100
      && bullet.x < world.width + 100
      && bullet.y > -100
      && bullet.y < world.floorY + 160
    );
  }

  fireOne(player, pointerWorld) {
    const aim = this.getAim(player, pointerWorld);
    const shotAngle = aim.angle + randomSpread(this.inaccuracy);

    this.bullets.push({
      x: aim.x + Math.cos(shotAngle) * 12,
      y: aim.y + Math.sin(shotAngle) * 12,
      vx: Math.cos(shotAngle) * this.bulletSpeed,
      vy: Math.sin(shotAngle) * this.bulletSpeed,
      damage: this.damage,
      life: this.bulletLife,
      trailTimer: 0,
      trail: [],
    });
  }

  draw(ctx, player, pointerWorld, cameraX, artPixelSize) {
    const aim = this.getAim(player, pointerWorld);
    const screenX = Math.round(aim.x - cameraX);
    const screenY = Math.round(aim.y);

    const dw = this.raster.width * artPixelSize;
    const dh = this.raster.height * artPixelSize;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.raster,
      Math.round(screenX - dw / 2),
      Math.round(screenY - dh / 2),
      dw,
      dh,
    );
    ctx.restore();

    this.drawBullets(ctx, cameraX, artPixelSize);
  }

  drawBullets(ctx, cameraX, artPixelSize) {
    ctx.save();

    // Vector body is bodyArtSize * artPixelSize screen pixels.
    // Bullets are exactly one screen pixel smaller.
    const size = Math.max(1, this.bodyArtSize * artPixelSize - 1);
    const half = size / 2;

    for (const bullet of this.bullets) {
      // Phantom trail: square afterimages that fade behind the projectile.
      for (const ghost of bullet.trail) {
        const alpha = Math.max(0, ghost.life / ghost.maxLife) * 0.24;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(
          Math.round(ghost.x - cameraX - half),
          Math.round(ghost.y - half),
          size,
          size,
        );
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(
        Math.round(bullet.x - cameraX - half),
        Math.round(bullet.y - half),
        size,
        size,
      );
    }

    ctx.restore();
  }
}
