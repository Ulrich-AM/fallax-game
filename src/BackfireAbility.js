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
    this.burnBuildup = 10;
    this.bulletSize = 10;

    this.lastDashSerial = 0;
    this.shotSerial = 0;
    this.bullets = [];
  }

  reset(player) {
    this.lastDashSerial = player?.dashSerial ?? 0;
    this.shotSerial = 0;
    this.bullets.length = 0;
  }

  update(
    dt,
    player,
    world,
    target,
    equipped,
    {
      resolveHit = null,
    } = {},
  ) {
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
      this.applyHitsToTarget(
        target,
        player,
        resolveHit,
      );
    }

    this.bullets = this.bullets.filter(bullet =>
      bullet.life > 0 &&
      bullet.x > -100 &&
      bullet.x < world.width + 100 &&
      bullet.y > world.roofY - 160 &&
      bullet.y < world.floorY + 160
    );
  }

  fireFromDash(dash) {
    this.shotSerial++;

    const backAngle =
      Math.atan2(-dash.ny, -dash.nx);

    // Backfire originates from the point where the dash began, not where
    // the player lands. This keeps it a true rear-propulsion ability instead
    // of behaving like Strike when dashing through a boss.
    const originX =
      dash.startX;

    const originY =
      dash.startY;

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

  applyHitsToTarget(
    target,
    player,
    resolveHit,
  ) {
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

      const burn =
        this.burnBuildup *
        bullet.opacity;

      if (
        typeof resolveHit ===
        'function'
      ) {
        resolveHit(
          target,
          {
            damage:
              currentDamage,
            buildup: {
              burn,
            },
            source:
              'backfire',
            attacker:
              player,
          },
        );
      } else {
        target.takeDamage?.(
          currentDamage,
        );

        target.status
          ?.addBuildup
          ?.(
            'burn',
            burn,
            {
              source:
                'backfire',
            },
          );
      }

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
