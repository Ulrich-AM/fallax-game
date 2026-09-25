function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

export class BackfireAbility {
  constructor() {
    this.name = 'Backfire';

    this.dashCooldownMultiplier = 1.70;

    this.bulletCount = 9;
    this.totalSpread = degToRad(100);
    this.bulletSpeed = 840;
    this.bulletLife = 1.15;
    this.damage = 5;
    this.bulletSize = 10;

    this.lastDashSerial = 0;
    this.bullets = [];
  }

  reset(player) {
    this.lastDashSerial = player?.dashSerial ?? 0;
    this.bullets.length = 0;
  }

  update(dt, player, world, target, equipped) {
    if (
      equipped &&
      player.dashSerial !== this.lastDashSerial &&
      player.lastDash
    ) {
      this.lastDashSerial = player.dashSerial;
      this.fireFromDash(player.lastDash);
    } else if (!equipped) {
      this.lastDashSerial = player.dashSerial;
    }

    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life = Math.max(0, bullet.life - dt);
      bullet.opacity = bullet.life / bullet.maxLife;
    }

    if (target && !target.dead) {
      this.applyHitsToTarget(target);
    }

    this.bullets = this.bullets.filter(bullet =>
      bullet.life > 0 &&
      bullet.x > -100 &&
      bullet.x < world.width + 100 &&
      bullet.y > -100 &&
      bullet.y < world.floorY + 160
    );
  }

  fireFromDash(dash) {
    const backAngle =
      Math.atan2(-dash.ny, -dash.nx);

    const originX =
      dash.endX - dash.nx * 24;

    const originY =
      dash.endY - dash.ny * 24;

    for (let i = 0; i < this.bulletCount; i++) {
      const t =
        this.bulletCount === 1
          ? 0.5
          : i / (this.bulletCount - 1);

      const angle =
        backAngle +
        (t - 0.5) * this.totalSpread;

      this.bullets.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * this.bulletSpeed,
        vy: Math.sin(angle) * this.bulletSpeed,
        life: this.bulletLife,
        maxLife: this.bulletLife,
        opacity: 1,
      });
    }
  }

  applyHitsToTarget(target) {
    const radius = this.bulletSize * 0.5;

    for (const bullet of this.bullets) {
      if (bullet.life <= 0) continue;

      const currentDamage =
        this.damage * bullet.opacity;

      const hitProjectile = target.damageProjectileAt?.(
        bullet.x,
        bullet.y,
        radius,
        currentDamage,
      );

      if (hitProjectile) {
        bullet.life = 0;
        continue;
      }

      if (!target.hitTest?.(bullet.x, bullet.y, radius)) {
        continue;
      }

      target.takeDamage?.(currentDamage);
      bullet.life = 0;
    }
  }

  draw(ctx, cameraX) {
    const half = this.bulletSize / 2;

    ctx.save();
    ctx.fillStyle = '#e5e7eb';

    for (const bullet of this.bullets) {
      ctx.globalAlpha = bullet.opacity;
      ctx.fillRect(
        Math.round(bullet.x - cameraX - half),
        Math.round(bullet.y - half),
        this.bulletSize,
        this.bulletSize,
      );
    }

    ctx.restore();
  }
}
