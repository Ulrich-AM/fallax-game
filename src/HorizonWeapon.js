import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=54c';

const HORIZON_SPRITE_ASSET = {
  version: 2,
  name: 'horizon',
  displayName: 'Horizon',
  type: 'weapon',
  scale: 1,
  pivot: [0, 0],
  parts: [
    {
      id: 'polygon-3',
      name: 'polygon-3',
      type: 'polygon',
      material: 'dark-gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [6, 1],
        [4, 2],
        [4, 0],
        [6, 0],
      ],
    },
    {
      id: 'polygon-mirror-4',
      name: 'polygon-3 mirror',
      type: 'polygon',
      material: 'dark-gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [6, 0],
        [4, 0],
        [4, -2],
        [6, -1],
      ],
    },
    {
      id: 'polygon-4',
      name: 'polygon-4',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [4, -2],
        [0, -2],
        [0, 2],
        [4, 2],
      ],
    },
    {
      id: 'polygon-5',
      name: 'polygon-5',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [6, -1],
        [6, 1],
        [20, 1],
        [20, -1],
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
      x: 20,
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

function rayCircleHit(
  originX,
  originY,
  dirX,
  dirY,
  maxDistance,
  circleX,
  circleY,
  radius,
) {
  const ox = originX - circleX;
  const oy = originY - circleY;

  const b = 2 * (ox * dirX + oy * dirY);
  const c = ox * ox + oy * oy - radius * radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const t1 = (-b - root) / 2;
  const t2 = (-b + root) / 2;

  if (t1 >= 0 && t1 <= maxDistance) return t1;
  if (t2 >= 0 && t2 <= maxDistance) return t2;
  return null;
}

export class HorizonWeapon {
  constructor() {
    this.name = 'Horizon';

    this.damage = 42;
    this.recoil = 900;
    this.orbitRadius = 45;
    this.beamRange = 1850;

    this.bodyLengthPixels = 26;
    this.bodyThicknessPixels = 19;

    this.sprite =
      new WeaponSpriteRenderer(
        HORIZON_SPRITE_ASSET,
      );

    this.chargeDuration = 0.34;
    this.flashDuration = 0.06;
    this.fireCooldown = 1.10;

    this.chargeTimer = 0;
    this.flashTimer = 0;
    this.cooldownTimer = 0;
    this.wasFiring = false;
    this.lockedAngle = 0;
    this.shotApplied = false;
    this.weaponKickTimer = 0;
    this.weaponKickDuration = 0.13;
    this.weaponKickDistance = 14;

    this.specialCooldown = 14;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialProjectileSpeed = 190;
    this.specialProjectileLife = 5.2;
    this.specialProjectileSize = 58;
    this.specialProjectileDamage = 68;
    this.specialHomingStrength = 1.15;
    this.specialRecoil = 1350;
    this.specialWeaponKickDistance = 28;
    this.specialProjectiles = [];
    this.shotSerial = 0;
  }

  reset() {
    this.chargeTimer = 0;
    this.flashTimer = 0;
    this.cooldownTimer = 0;
    this.wasFiring = false;
    this.lockedAngle = 0;
    this.shotApplied = false;
    this.weaponKickTimer = 0;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialProjectiles.length = 0;
    this.shotSerial = 0;
  }

  triggerSpecial({ player, pointerWorld } = {}) {
    if (!player || !pointerWorld) return false;
    return this.fireSpecial(player, pointerWorld);
  }

  get specialAbilities() {
    return [{
      id: 'horizon-star',
      name: 'star',
      cooldown: this.specialCooldown,
      remaining: this.specialCooldownTimer,
      active: false,
    }];
  }

  get locksPlayer() {
    return false;
  }

  getTargetAngle(player, pointerWorld) {
    return Math.atan2(
      pointerWorld.y - player.y,
      pointerWorld.x - player.x,
    );
  }

  getAim(player, pointerWorld) {
    const angle =
      this.chargeTimer > 0 || this.flashTimer > 0
        ? this.lockedAngle
        : this.getTargetAngle(player, pointerWorld);

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    return {
      angle,
      dirX,
      dirY,
      x: player.x + dirX * this.orbitRadius,
      y: player.y + dirY * this.orbitRadius,
    };
  }

  beginCharge(player, pointerWorld) {
    if (this.cooldownTimer > 0) return false;

    this.lockedAngle = this.getTargetAngle(player, pointerWorld);
    this.chargeTimer = this.chargeDuration;
    this.flashTimer = 0;
    this.shotApplied = false;
    return true;
  }

  update(
    dt,
    player,
    pointerWorld,
    firing,
    target,
    artPixelSize,
    active = true,
  ) {
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    if (active) {
      this.specialCooldownTimer = Math.max(
        0,
        this.specialCooldownTimer - dt,
      );
    }

    if (!active && this.chargeTimer > 0) {
      this.chargeTimer = 0;
    }

    if (active && firing && !this.wasFiring) {
      this.beginCharge(player, pointerWorld);
    }
    this.wasFiring = firing;

    if (this.chargeTimer > 0) {
      this.chargeTimer = Math.max(0, this.chargeTimer - dt);

      if (this.chargeTimer <= 0) {
        this.flashTimer = this.flashDuration;
        this.cooldownTimer = this.fireCooldown;
        this.applyShot(player, target, artPixelSize);
      }
    }

    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.weaponKickTimer = Math.max(
      0,
      this.weaponKickTimer - dt,
    );

    this.updateSpecialProjectiles(dt, target);
  }

  fireSpecial(player, pointerWorld) {
    if (this.specialCooldownTimer > 0) return false;

    this.shotSerial++;

    const angle = this.getTargetAngle(player, pointerWorld);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const pivotX =
      player.x +
      dirX *
      this.orbitRadius;

    const pivotY =
      player.y +
      dirY *
      this.orbitRadius;

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          pivotX,
          pivotY,
          angle,
          4,
        );

    this.specialProjectiles.push({
      x: muzzle.x,
      y: muzzle.y,
      vx: dirX * this.specialProjectileSpeed,
      vy: dirY * this.specialProjectileSpeed,
      life: this.specialProjectileLife,
      maxLife: this.specialProjectileLife,
      hitTarget: false,
    });

    this.specialCooldownTimer = this.specialCooldown;
    this.weaponKickTimer = this.weaponKickDuration;
    this.weaponKickDistance = this.specialWeaponKickDistance;

    player.vx -= dirX * this.specialRecoil;
    player.vy -= dirY * this.specialRecoil;
    player.grounded = false;
    return true;
  }

  updateSpecialProjectiles(dt, target) {
    for (const projectile of this.specialProjectiles) {
      projectile.life = Math.max(0, projectile.life - dt);

      if (target && !target.dead && projectile.life > 0) {
        const dx = target.x - projectile.x;
        const dy = target.y - projectile.y;
        const distance = Math.hypot(dx, dy) || 1;

        const desiredX =
          dx / distance * this.specialProjectileSpeed;
        const desiredY =
          dy / distance * this.specialProjectileSpeed;

        const steer = Math.min(
          1,
          this.specialHomingStrength * dt,
        );

        projectile.vx +=
          (desiredX - projectile.vx) * steer;
        projectile.vy +=
          (desiredY - projectile.vy) * steer;

        const hitRadius =
          this.specialProjectileSize * 0.5 +
          (target.halfSize ?? 48) * 0.82;

        if (
          !projectile.hitTarget &&
          distance <= hitRadius
        ) {
          target.takeDamage?.(
            this.specialProjectileDamage,
          );

          projectile.hitTarget = true;
          projectile.life = 0;
        }
      }

      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
    }

    this.specialProjectiles =
      this.specialProjectiles.filter(
        projectile => projectile.life > 0,
      );
  }

  applyShot(player, target, artPixelSize) {
    if (this.shotApplied) return;
    this.shotApplied = true;
    this.shotSerial++;

    const dirX = Math.cos(this.lockedAngle);
    const dirY = Math.sin(this.lockedAngle);

    const pivotX =
      player.x +
      dirX *
      this.orbitRadius;

    const pivotY =
      player.y +
      dirY *
      this.orbitRadius;

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          pivotX,
          pivotY,
          this.lockedAngle,
          artPixelSize,
        );

    target?.damageProjectilesAlongRay?.(
      muzzle.x,
      muzzle.y,
      dirX,
      dirY,
      this.beamRange,
      4,
      this.damage,
    );

    if (target && !target.dead) {
      const radius = (target.halfSize ?? 48) * 0.94;
      const hitDistance = rayCircleHit(
        muzzle.x,
        muzzle.y,
        dirX,
        dirY,
        this.beamRange,
        target.x,
        target.y,
        radius,
      );

      if (hitDistance !== null) {
        target.takeDamage?.(this.damage);
      }
    }

    this.weaponKickDistance = 14;
    this.weaponKickTimer = this.weaponKickDuration;

    player.vx -= dirX * this.recoil;
    player.vy -= dirY * this.recoil;
    player.grounded = false;
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

  draw(
    ctx,
    player,
    pointerWorld,
    cameraX,
    artPixelSize = 4,
  ) {
    const aim = this.getAim(player, pointerWorld);

    const kickRatio =
      this.weaponKickDuration > 0
        ? this.weaponKickTimer / this.weaponKickDuration
        : 0;

    const kick =
      Math.sin(kickRatio * Math.PI * 0.5) *
      this.weaponKickDistance;

    const weaponX = aim.x - aim.dirX * kick;
    const weaponY = aim.y - aim.dirY * kick;

    this.sprite.draw(
      ctx,
      weaponX - cameraX,
      weaponY,
      aim.angle,
      artPixelSize,
    );

    const visualMuzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          weaponX,
          weaponY,
          aim.angle,
          artPixelSize,
        );

    const endX =
      visualMuzzle.x +
      aim.dirX *
      this.beamRange;

    const endY =
      visualMuzzle.y +
      aim.dirY *
      this.beamRange;

    ctx.save();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#ffffff';

    if (this.flashTimer > 0) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = this.bodyThicknessPixels;
      ctx.shadowColor = 'rgba(255,255,255,1)';
      ctx.shadowBlur = 24;
    } else {
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = this.bodyThicknessPixels;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.moveTo(
      Math.round(
        visualMuzzle.x -
        cameraX,
      ),
      Math.round(
        visualMuzzle.y,
      ),
    );
    ctx.lineTo(
      Math.round(endX - cameraX),
      Math.round(endY),
    );
    ctx.stroke();
    ctx.restore();

    this.drawSpecialProjectiles(ctx, cameraX);
  }

  drawSpecialProjectiles(ctx, cameraX) {
    ctx.save();

    for (const projectile of this.specialProjectiles) {
      const ratio =
        projectile.life / projectile.maxLife;

      const size =
        this.specialProjectileSize *
        (0.84 + ratio * 0.16);

      ctx.globalAlpha = Math.max(0, ratio);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255,255,255,1)';
      ctx.shadowBlur = 30;

      ctx.fillRect(
        Math.round(projectile.x - cameraX - size / 2),
        Math.round(projectile.y - size / 2),
        size,
        size,
      );
    }

    ctx.restore();
  }
}
