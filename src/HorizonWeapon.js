import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=63a';

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

    this.recoilDriveCooldown = 6.5;
    this.recoilDriveCooldownTimer =
      this.recoilDriveCooldown;
    this.recoilDriveArmed = false;
    this.recoilDriveRecoil = 2250;
    this.recoilDriveStagger = 18;

    this.overchargeCooldown = 12;
    this.overchargeCooldownTimer =
      this.overchargeCooldown;
    this.overchargeArmed = false;
    this.overchargeChargeMultiplier = 2;
    this.overchargeDamageMultiplier = 2.5;
    this.overchargeRecoilMultiplier = 1.45;
    this.overchargeStagger = 34;

    this.activeShotRecoilDrive = false;
    this.activeShotOvercharge = false;
    this.lastShotOvercharge = false;
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
    this.recoilDriveCooldownTimer =
      this.recoilDriveCooldown;
    this.overchargeCooldownTimer =
      this.overchargeCooldown;
    this.recoilDriveArmed = false;
    this.overchargeArmed = false;
    this.activeShotRecoilDrive = false;
    this.activeShotOvercharge = false;
    this.lastShotOvercharge = false;
    this.shotSerial = 0;
  }

  triggerSpecial() {
    if (
      this.recoilDriveCooldownTimer > 0 ||
      this.recoilDriveArmed ||
      this.activeShotRecoilDrive ||
      this.chargeTimer > 0
    ) {
      return false;
    }

    this.recoilDriveArmed = true;
    this.recoilDriveCooldownTimer =
      this.recoilDriveCooldown;
    return true;
  }

  triggerSecondarySpecial() {
    if (
      this.overchargeCooldownTimer > 0 ||
      this.overchargeArmed ||
      this.activeShotOvercharge ||
      this.chargeTimer > 0
    ) {
      return false;
    }

    this.overchargeArmed = true;
    this.overchargeCooldownTimer =
      this.overchargeCooldown;
    return true;
  }

  get specialAbilities() {
    return [
      {
        id: 'horizon-recoil-drive',
        name: 'recoil drive',
        hudLabel: 'RECOIL DRIVE',
        binding: 'special',
        activeText: 'ARMED',
        cooldown:
          this.recoilDriveCooldown,
        remaining:
          this.recoilDriveCooldownTimer,
        active:
          this.recoilDriveArmed ||
          this.activeShotRecoilDrive,
      },
      {
        id: 'horizon-overcharge',
        name: 'overcharge',
        hudLabel: 'OVERCHARGE',
        binding: 'special2',
        activeText: 'ARMED',
        cooldown:
          this.overchargeCooldown,
        remaining:
          this.overchargeCooldownTimer,
        active:
          this.overchargeArmed ||
          this.activeShotOvercharge,
      },
    ];
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

    this.lockedAngle =
      this.getTargetAngle(
        player,
        pointerWorld,
      );

    this.activeShotRecoilDrive =
      this.recoilDriveArmed;

    this.activeShotOvercharge =
      this.overchargeArmed;

    this.chargeTimer =
      this.chargeDuration *
      (
        this.activeShotOvercharge
          ? this.overchargeChargeMultiplier
          : 1
      );

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
    {
      resolveHit = null,
    } = {},
  ) {
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    if (active) {
      this.recoilDriveCooldownTimer =
        Math.max(
          0,
          this.recoilDriveCooldownTimer - dt,
        );

      this.overchargeCooldownTimer =
        Math.max(
          0,
          this.overchargeCooldownTimer - dt,
        );
    }

    if (!active && this.chargeTimer > 0) {
      this.chargeTimer = 0;
      this.activeShotRecoilDrive = false;
      this.activeShotOvercharge = false;
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
        this.applyShot(
          player,
          target,
          artPixelSize,
          resolveHit,
        );
      }
    }

    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.weaponKickTimer = Math.max(
      0,
      this.weaponKickTimer - dt,
    );

  }

  applyShot(
    player,
    target,
    artPixelSize,
    resolveHit = null,
  ) {
    if (this.shotApplied) return;
    this.shotApplied = true;
    this.shotSerial++;

    const recoilDrive =
      this.activeShotRecoilDrive;

    const overcharged =
      this.activeShotOvercharge;

    const shotDamage =
      this.damage *
      (
        overcharged
          ? this.overchargeDamageMultiplier
          : 1
      );

    const shotStagger =
      (
        recoilDrive
          ? this.recoilDriveStagger
          : 0
      ) +
      (
        overcharged
          ? this.overchargeStagger
          : 0
      );

    let shotRecoil =
      this.recoil *
      (
        overcharged
          ? this.overchargeRecoilMultiplier
          : 1
      );

    if (recoilDrive) {
      shotRecoil =
        this.recoilDriveRecoil *
        (
          overcharged
            ? this.overchargeRecoilMultiplier
            : 1
        );
    }

    const dirX =
      Math.cos(this.lockedAngle);

    const dirY =
      Math.sin(this.lockedAngle);

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
      overcharged ? 8 : 4,
      shotDamage,
    );

    if (target && !target.dead) {
      const radius =
        (target.halfSize ?? 48) *
        0.94;

      const hitDistance =
        rayCircleHit(
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
        if (
          typeof resolveHit ===
          'function'
        ) {
          resolveHit(
            target,
            {
              damage: shotDamage,
              stagger: shotStagger,
              source:
                overcharged
                  ? (
                      recoilDrive
                        ? 'horizon-drive-overcharge'
                        : 'horizon-overcharge'
                    )
                  : (
                      recoilDrive
                        ? 'horizon-recoil-drive'
                        : 'horizon'
                    ),
              attacker: player,
            },
          );
        } else {
          target.takeDamage?.(
            shotDamage,
          );
        }
      }
    }

    this.lastShotOvercharge =
      overcharged;

    this.weaponKickDistance =
      recoilDrive
        ? 30
        : (
            overcharged
              ? 22
              : 14
          );

    this.weaponKickTimer =
      this.weaponKickDuration;

    player.vx -=
      dirX *
      shotRecoil;

    player.vy -=
      dirY *
      shotRecoil;

    player.grounded = false;

    if (recoilDrive) {
      this.recoilDriveArmed = false;
    }

    if (overcharged) {
      this.overchargeArmed = false;
    }

    this.activeShotRecoilDrive = false;
    this.activeShotOvercharge = false;
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
      ctx.lineWidth =
        this.bodyThicknessPixels *
        (
          this.lastShotOvercharge
            ? 1.8
            : 1
        );
      ctx.shadowColor =
        'rgba(255,255,255,1)';
      ctx.shadowBlur =
        this.lastShotOvercharge
          ? 42
          : 24;
    } else {
      ctx.globalAlpha =
        this.activeShotOvercharge
          ? 0.38
          : 0.24;
      ctx.lineWidth =
        this.bodyThicknessPixels *
        (
          this.activeShotOvercharge
            ? 1.28
            : 1
        );
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

  }
}
