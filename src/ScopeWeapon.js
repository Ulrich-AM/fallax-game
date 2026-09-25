import { rectangle, group, rasterize } from './pixelShapes.js?v=17';

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

export class ScopeWeapon {
  constructor() {
    this.name = 'Scope';

    this.damage = 14;
    this.specialDamage = 24;
    this.bulletSpeed = 900;
    this.bulletLife = 1.45;
    this.pelletCount = 6;
    this.totalSpread = degToRad(70);
    this.fireCooldown = 0.82;

    this.recoil = 420;
    this.specialRecoil = 820;

    this.bodyLength = 6;
    this.bodyThickness = 4;
    this.orbitRadius = 44;

    this.specialCooldown = 11;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialDuration = 4;
    this.specialActiveTimer = 0;

    this.cooldownTimer = 0;
    this.bullets = [];

    this.definition = group([
      rectangle({
        width: this.bodyLength,
        height: this.bodyThickness,
        color: '#050505',
      }),
    ], {
      mergeOutlines: true,
      outline: false,
      padding: 1,
    });

    this.rasterCache = new Map();
  }

  reset() {
    this.cooldownTimer = 0;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialActiveTimer = 0;
    this.bullets.length = 0;
  }

  triggerSpecial() {
    if (this.specialCooldownTimer > 0) return false;

    this.specialCooldownTimer = this.specialCooldown;
    this.specialActiveTimer = this.specialDuration;
    return true;
  }

  get specialAbilities() {
    return [{
      id: 'scope-overdrive',
      name: 'overdrive',
      cooldown: this.specialCooldown,
      remaining: this.specialCooldownTimer,
      active: this.specialActiveTimer > 0,
    }];
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

    this.specialActiveTimer = Math.max(
      0,
      this.specialActiveTimer - dt,
    );

    if (active && firing && this.cooldownTimer <= 0) {
      this.fire(player, pointerWorld);
      this.cooldownTimer = this.fireCooldown;
    }

    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life = Math.max(0, bullet.life - dt);
      bullet.opacity = bullet.life / bullet.maxLife;
    }

    this.bullets = this.bullets.filter(bullet =>
      bullet.life > 0 &&
      bullet.x > -120 &&
      bullet.x < world.width + 120 &&
      bullet.y > -120 &&
      bullet.y < world.floorY + 180
    );
  }

  fire(player, pointerWorld) {
    const aim = this.getAim(player, pointerWorld);
    const special = this.specialActiveTimer > 0;
    const damage = special ? this.specialDamage : this.damage;
    const recoil = special ? this.specialRecoil : this.recoil;

    for (let i = 0; i < this.pelletCount; i++) {
      const t = this.pelletCount === 1
        ? 0.5
        : i / (this.pelletCount - 1);

      const angle =
        aim.angle +
        (t - 0.5) * this.totalSpread;

      this.bullets.push({
        x: aim.x + Math.cos(angle) * 16,
        y: aim.y + Math.sin(angle) * 16,
        vx: Math.cos(angle) * this.bulletSpeed,
        vy: Math.sin(angle) * this.bulletSpeed,
        damage,
        life: this.bulletLife,
        maxLife: this.bulletLife,
        opacity: 1,
        special,
      });
    }

    player.vx -= Math.cos(aim.angle) * recoil;
    player.vy -= Math.sin(aim.angle) * recoil;

    if (special) {
      player.grounded = false;
    }
  }

  applyHitsToTarget(target, artPixelSize) {
    if (!target || target.dead) return;

    for (const bullet of this.bullets) {
      if (bullet.life <= 0) continue;

      const size = this.getBulletSize(artPixelSize, bullet.special);
      const radius = size * 0.5;

      const hitProjectile = target.damageProjectileAt?.(
        bullet.x,
        bullet.y,
        radius,
        bullet.damage,
      );

      if (hitProjectile) {
        bullet.life = 0;
        continue;
      }

      if (!target.hitTest?.(bullet.x, bullet.y, radius)) continue;

      target.takeDamage?.(bullet.damage);
      bullet.life = 0;
    }
  }

  getBulletSize(artPixelSize, special) {
    const normal = this.bodyThickness * artPixelSize * 0.72;
    return special ? normal * 1.85 : normal;
  }

  getRaster(angleRadians) {
    const degrees = angleRadians * 180 / Math.PI;
    const quantized = Math.round(degrees / 3) * 3;
    const key = ((quantized % 360) + 360) % 360;

    if (!this.rasterCache.has(key)) {
      this.rasterCache.set(
        key,
        rasterize(this.definition, key),
      );
    }

    return this.rasterCache.get(key);
  }

  draw(ctx, player, pointerWorld, cameraX, artPixelSize) {
    const aim = this.getAim(player, pointerWorld);
    const raster = this.getRaster(aim.angle);
    const dw = raster.width * artPixelSize;
    const dh = raster.height * artPixelSize;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      raster,
      Math.round(aim.x - cameraX - dw / 2),
      Math.round(aim.y - dh / 2),
      dw,
      dh,
    );
    ctx.restore();

    this.drawBullets(ctx, cameraX, artPixelSize);
  }

  drawBullets(ctx, cameraX, artPixelSize) {
    ctx.save();
    ctx.fillStyle = '#e5e7eb';

    for (const bullet of this.bullets) {
      const size = this.getBulletSize(artPixelSize, bullet.special);
      const half = size / 2;

      ctx.globalAlpha = bullet.opacity;
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
