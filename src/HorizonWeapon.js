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
  }

  triggerSpecial() {
    if (this.specialCooldownTimer > 0) return false;

    this.specialCooldownTimer = this.specialCooldown;
    return true;
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

    const angle = this.getTargetAngle(player, pointerWorld);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const originX = player.x + dirX * this.orbitRadius;
    const originY = player.y + dirY * this.orbitRadius;

    this.specialProjectiles.push({
      x: originX,
      y: originY,
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
            this.specialProjectileDamage *
            Math.max(
              0.20,
              projectile.life / projectile.maxLife,
            ),
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

    const dirX = Math.cos(this.lockedAngle);
    const dirY = Math.sin(this.lockedAngle);

    const originX = player.x + dirX * this.orbitRadius;
    const originY = player.y + dirY * this.orbitRadius;

    target?.damageProjectilesAlongRay?.(
      originX,
      originY,
      dirX,
      dirY,
      this.beamRange,
      4,
      this.damage,
    );

    if (target && !target.dead) {
      const radius = (target.halfSize ?? 48) * 0.94;
      const hitDistance = rayCircleHit(
        originX,
        originY,
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

  draw(ctx, player, pointerWorld, cameraX) {
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

    ctx.save();
    ctx.translate(
      Math.round(weaponX - cameraX),
      Math.round(weaponY),
    );
    ctx.rotate(aim.angle);
    ctx.fillStyle = '#6f747c';
    ctx.fillRect(
      -this.bodyLengthPixels / 2,
      -this.bodyThicknessPixels / 2,
      this.bodyLengthPixels,
      this.bodyThicknessPixels,
    );
    ctx.restore();

    const endX = aim.x + aim.dirX * this.beamRange;
    const endY = aim.y + aim.dirY * this.beamRange;

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
      Math.round(aim.x - cameraX),
      Math.round(aim.y),
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
