import { rectangle, group, rasterize } from './pixelShapes.js?v=17';

function rayCircleHit(originX, originY, dirX, dirY, maxDistance, circleX, circleY, radius) {
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

export class EuclidWeapon {
  constructor() {
    this.name = 'Euclid';
    this.damagePerSecond = 8;
    this.specialDamagePerSecond = 72;
    this.specialCooldown = 18;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialDuration = 3;
    this.specialActiveTimer = 0;
    this.specialTurnRate = Math.PI * 0.52;
    this.currentAimAngle = 0;
    this.hasAimAngle = false;

    this.orbitRadius = 42;
    this.beamRange = 1700;
    this.bodyLength = 5;
    this.bodyThickness = 3;

    this.firing = false;
    this.aim = {
      angle: 0,
      x: 0,
      y: 0,
      dirX: 1,
      dirY: 0,
      beamEndX: 0,
      beamEndY: 0,
    };

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
    this.firing = false;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialActiveTimer = 0;
    this.hasAimAngle = false;
  }

  triggerSpecial() {
    if (this.specialCooldownTimer > 0) return false;

    this.specialCooldownTimer = this.specialCooldown;
    this.specialActiveTimer = this.specialDuration;
    return true;
  }

  get specialAbilities() {
    return [{
      id: 'euclid-overcharge',
      name: 'overcharge',
      cooldown: this.specialCooldown,
      remaining: this.specialCooldownTimer,
      active: this.specialActiveTimer > 0,
    }];
  }

  getTargetAngle(player, pointerWorld) {
    return Math.atan2(
      pointerWorld.y - player.y,
      pointerWorld.x - player.x,
    );
  }

  approachAngle(current, target, maxDelta) {
    const delta =
      ((target - current + Math.PI * 3) % (Math.PI * 2)) -
      Math.PI;

    if (Math.abs(delta) <= maxDelta) return target;
    return current + Math.sign(delta) * maxDelta;
  }

  getAimFromAngle(player, angle) {
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

  update(dt, player, pointerWorld, firing, target, artPixelSize, active = true) {
    if (active) {
      this.specialCooldownTimer = Math.max(
        0,
        this.specialCooldownTimer - dt,
      );
      this.specialActiveTimer = Math.max(
        0,
        this.specialActiveTimer - dt,
      );
    }

    const specialActive = this.specialActiveTimer > 0;
    const targetAngle = this.getTargetAngle(player, pointerWorld);

    if (!this.hasAimAngle) {
      this.currentAimAngle = targetAngle;
      this.hasAimAngle = true;
    } else if (specialActive) {
      this.currentAimAngle = this.approachAngle(
        this.currentAimAngle,
        targetAngle,
        this.specialTurnRate * dt,
      );
    } else {
      this.currentAimAngle = targetAngle;
    }

    const aim = this.getAimFromAngle(player, this.currentAimAngle);
    const effectiveFiring = firing || specialActive;
    const widthMultiplier = specialActive ? 3 : 1;
    const damagePerSecond = specialActive
      ? this.specialDamagePerSecond
      : this.damagePerSecond;

    this.firing = effectiveFiring;

    let beamDistance = this.beamRange;

    if (effectiveFiring && target && !target.dead) {
      const beamRadius =
        (this.bodyThickness * artPixelSize * widthMultiplier) * 0.5;

      target.damageProjectilesAlongRay?.(
        aim.x,
        aim.y,
        aim.dirX,
        aim.dirY,
        this.beamRange,
        beamRadius,
        damagePerSecond * dt,
      );

      const radius = (target.halfSize ?? 48) * 0.94;
      const hitDistance = rayCircleHit(
        aim.x,
        aim.y,
        aim.dirX,
        aim.dirY,
        this.beamRange,
        target.x,
        target.y,
        radius,
      );

      if (hitDistance !== null) {
        beamDistance = hitDistance;
        target.takeDamage?.(damagePerSecond * dt);
      }
    }

    this.aim = {
      ...aim,
      beamEndX: aim.x + aim.dirX * beamDistance,
      beamEndY: aim.y + aim.dirY * beamDistance,
    };
  }

  getRaster(angleRadians) {
    const degrees = angleRadians * 180 / Math.PI;
    const quantized = Math.round(degrees / 3) * 3;
    const key = ((quantized % 360) + 360) % 360;

    if (!this.rasterCache.has(key)) {
      this.rasterCache.set(key, rasterize(this.definition, key));
    }

    return this.rasterCache.get(key);
  }

  draw(ctx, player, pointerWorld, cameraX, artPixelSize) {
    const aim = this.hasAimAngle
      ? this.getAimFromAngle(player, this.currentAimAngle)
      : this.getAimFromAngle(
          player,
          this.getTargetAngle(player, pointerWorld),
        );
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

    if (!this.firing) return;

    const specialActive = this.specialActiveTimer > 0;
    const widthMultiplier = specialActive ? 3 : 1;

    ctx.save();
    ctx.globalAlpha = specialActive ? 1 : 0.42;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth =
      this.bodyThickness * artPixelSize * widthMultiplier;
    ctx.lineCap = 'butt';
    ctx.shadowColor = specialActive
      ? 'rgba(255,255,255,1)'
      : 'rgba(255,255,255,0.65)';
    ctx.shadowBlur = specialActive ? 24 : 7;

    ctx.beginPath();
    ctx.moveTo(
      Math.round(this.aim.x - cameraX),
      Math.round(this.aim.y),
    );
    ctx.lineTo(
      Math.round(this.aim.beamEndX - cameraX),
      Math.round(this.aim.beamEndY),
    );
    ctx.stroke();
    ctx.restore();
  }
}
