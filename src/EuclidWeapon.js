import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=54c';

const EUCLID_SPRITE_ASSET = {
  version: 2,
  name: 'euclid',
  displayName: 'Euclid',
  type: 'weapon',
  scale: 1,
  pivot: [0, 0],
  parts: [
    {
      id: 'polygon-1',
      name: 'polygon-1',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 0,
      y: 1,
      rotation: 0,
      outline: null,
      points: [
        [3, -1],
        [3, -2],
        [12, -2],
        [12, 0],
        [3, 0],
      ],
    },
    {
      id: 'polygon-2',
      name: 'polygon-2',
      type: 'polygon',
      material: 'glow-white',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [12, 1],
        [12, -1],
        [13, -1],
        [13, 1],
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
      x: 13,
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

    this.sprite =
      new WeaponSpriteRenderer(
        EUCLID_SPRITE_ASSET,
      );
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
    }

    this.specialActiveTimer = Math.max(
      0,
      this.specialActiveTimer - dt,
    );

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

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          aim.angle,
          artPixelSize,
        );

    const effectiveFiring = active && (firing || specialActive);
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
        muzzle.x,
        muzzle.y,
        aim.dirX,
        aim.dirY,
        this.beamRange,
        beamRadius,
        damagePerSecond * dt,
      );

      const radius = (target.halfSize ?? 48) * 0.94;
      const hitDistance = rayCircleHit(
        muzzle.x,
        muzzle.y,
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
      muzzleX: muzzle.x,
      muzzleY: muzzle.y,
      beamEndX:
        muzzle.x +
        aim.dirX *
        beamDistance,
      beamEndY:
        muzzle.y +
        aim.dirY *
        beamDistance,
    };
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
    const aim = this.hasAimAngle
      ? this.getAimFromAngle(player, this.currentAimAngle)
      : this.getAimFromAngle(
          player,
          this.getTargetAngle(player, pointerWorld),
        );
    this.sprite.draw(
      ctx,
      aim.x - cameraX,
      aim.y,
      aim.angle,
      artPixelSize,
    );

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
      Math.round(
        this.aim.muzzleX -
        cameraX,
      ),
      Math.round(
        this.aim.muzzleY,
      ),
    );
    ctx.lineTo(
      Math.round(this.aim.beamEndX - cameraX),
      Math.round(this.aim.beamEndY),
    );
    ctx.stroke();
    ctx.restore();
  }
}
