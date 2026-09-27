import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=54c';

const VECTOR_SPRITE_ASSET = {
  version: 2,
  name: 'vector',
  displayName: 'Vector',
  type: 'weapon',
  scale: 1,
  pivot: [0, 0],
  parts: [
    {
      id: 'vector-body',
      name: 'vector-body',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ],
    },
  ],
  groups: [],
  animations: {
    clips: {
      idle: {
        name: 'idle',
        duration: 1,
        loop: true,
        tracks: [],
      },
      fire: {
        name: 'fire',
        duration: 0.25,
        loop: false,
        tracks: [],
      },
      special: {
        name: 'special',
        duration: 0.6,
        loop: false,
        tracks: [],
      },
    },
  },
  markers: {
    muzzle: {
      x: 3,
      y: 0,
      rotation: 0,
    },
  },
  render: {
    mergeOutlines: true,
    outline: {
      enabled: true,
      color: '#35383e',
      thickness: 1,
    },
    padding: 2,
  },
};

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

    this.specialCooldown = 7.5;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialShotCount = 20;
    this.specialShotsRemaining = 0;
    this.specialShotInterval = 0.028;
    this.specialShotTimer = 0;
    this.specialInaccuracy = degToRad(10);

    this.cooldownTimer = 0;
    this.specialShotsRemaining = 0;
    this.specialShotTimer = 0;
    this.burstShotsRemaining = 0;
    this.burstShotTimer = 0;
    this.bullets = [];
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        VECTOR_SPRITE_ASSET,
      );
  }

  reset() {
    this.cooldownTimer = 0;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialShotsRemaining = 0;
    this.specialShotTimer = 0;
    this.burstShotsRemaining = 0;
    this.burstShotTimer = 0;
    this.bullets.length = 0;
    this.shotSerial = 0;
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

  update(dt, player, pointerWorld, firing, world, active = true) {
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    if (active) {
      this.specialCooldownTimer = Math.max(
        0,
        this.specialCooldownTimer - dt,
      );
    }
    this.specialShotTimer = Math.max(0, this.specialShotTimer - dt);
    this.burstShotTimer = Math.max(0, this.burstShotTimer - dt);

    if (this.specialShotsRemaining > 0 && this.specialShotTimer <= 0) {
      this.fireOne(player, pointerWorld, this.specialInaccuracy);
      this.specialShotsRemaining--;
      this.specialShotTimer = this.specialShotInterval;
    }

    if (
      firing &&
      this.specialShotsRemaining <= 0 &&
      this.cooldownTimer <= 0 &&
      this.burstShotsRemaining <= 0
    ) {
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
      bullet.life = Math.max(0, bullet.life - dt);

      // Projectile strength and visibility are the same curve. A shot that has
      // faded to 40% opacity also deals 40% of its original damage.
      bullet.opacity = Math.max(0, bullet.life / bullet.maxLife);
      bullet.currentDamage = bullet.baseDamage * bullet.opacity;
    }

    this.bullets = this.bullets.filter(bullet =>
      bullet.life > 0
      && bullet.x > -100
      && bullet.x < world.width + 100
      && bullet.y > -100
      && bullet.y < world.floorY + 160
    );
  }

  triggerSpecial() {
    if (this.specialCooldownTimer > 0) return false;

    this.specialCooldownTimer = this.specialCooldown;
    this.specialShotsRemaining = this.specialShotCount;
    this.specialShotTimer = 0;
    this.burstShotsRemaining = 0;
    return true;
  }

  get specialAbilities() {
    return [{
      id: 'vector-volley',
      name: 'volley',
      cooldown: this.specialCooldown,
      remaining: this.specialCooldownTimer,
      active: this.specialShotsRemaining > 0,
    }];
  }

  fireOne(player, pointerWorld, spread = this.inaccuracy) {
    this.shotSerial++;
    const aim = this.getAim(player, pointerWorld);
    const shotAngle = aim.angle + randomSpread(spread);

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          shotAngle,
          4,
        );

    this.bullets.push({
      x: muzzle.x,
      y: muzzle.y,
      vx: Math.cos(shotAngle) * this.bulletSpeed,
      vy: Math.sin(shotAngle) * this.bulletSpeed,
      baseDamage: this.damage,
      currentDamage: this.damage,
      life: this.bulletLife,
      maxLife: this.bulletLife,
      opacity: 1,
      trailTimer: 0,
      trail: [],
    });
  }

  getSpriteEntry(
    angleRadians = 0,
    centered = false,
  ) {
    return centered
      ? this.sprite
          .getCenteredEntry(
            angleRadians,
          )
      : this.sprite
          .getEntry(
            angleRadians,
          );
  }

  draw(ctx, player, pointerWorld, cameraX, artPixelSize) {
    const aim = this.getAim(player, pointerWorld);
    this.sprite.draw(
      ctx,
      aim.x - cameraX,
      aim.y,
      aim.angle,
      artPixelSize,
    );

    this.drawBullets(ctx, cameraX, artPixelSize);
  }

  getBulletRenderSize(artPixelSize) {
    // Keep projectiles just slightly smaller than Vector's outlined body.
    const visibleWeaponSize = this.bodyArtSize * artPixelSize;
    return Math.max(1, visibleWeaponSize - 1);
  }

  applyHitsToTarget(target, artPixelSize) {
    if (!target || target.dead) return;

    const size = this.getBulletRenderSize(artPixelSize);
    const radius = size * 0.5;

    for (const bullet of this.bullets) {
      if (bullet.life <= 0) continue;

      const hitProjectile = target.damageProjectileAt?.(
        bullet.x,
        bullet.y,
        radius,
        bullet.currentDamage,
      );

      if (hitProjectile) {
        bullet.life = 0;
        bullet.opacity = 0;
        bullet.currentDamage = 0;
        continue;
      }

      if (!target.hitTest?.(bullet.x, bullet.y, radius)) continue;

      target.takeDamage?.(bullet.currentDamage);
      bullet.life = 0;
      bullet.opacity = 0;
      bullet.currentDamage = 0;
    }
  }

  drawBullets(ctx, cameraX, artPixelSize) {
    ctx.save();

    const size = this.getBulletRenderSize(artPixelSize);
    const half = size / 2;

    for (const bullet of this.bullets) {
      // Phantom trail inherits the projectile fade, then fades again by age.
      for (const ghost of bullet.trail) {
        const ageAlpha = Math.max(0, ghost.life / ghost.maxLife);
        ctx.globalAlpha = ageAlpha * bullet.opacity * 0.26;
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(
          Math.round(ghost.x - cameraX - half),
          Math.round(ghost.y - half),
          size,
          size,
        );
      }

      ctx.globalAlpha = bullet.opacity;
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
