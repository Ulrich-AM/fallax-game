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
  }

  reset() {
    this.chargeTimer = 0;
    this.flashTimer = 0;
    this.cooldownTimer = 0;
    this.wasFiring = false;
    this.lockedAngle = 0;
    this.shotApplied = false;
    this.weaponKickTimer = 0;
  }

  get specialAbilities() {
    return [];
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
      ctx.lineWidth = 10;
      ctx.shadowColor = 'rgba(255,255,255,1)';
      ctx.shadowBlur = 24;
    } else {
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = 4;
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
  }
}
