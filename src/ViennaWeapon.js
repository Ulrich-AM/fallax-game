import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=63a';

const VIENNA_SPRITE_ASSET =
  {
  "version": 2,
  "name": "vienna",
  "displayName": "vienna",
  "type": "weapon",
  "scale": 1,
  "pivot": [
    0,
    0
  ],
  "parts": [
    {
      "id": "polygon-1",
      "name": "polygon-1",
      "type": "polygon",
      "material": "gray",
      "groupId": null,
      "x": 3,
      "y": 0,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          4,
          -2
        ],
        [
          -8,
          -2
        ],
        [
          -8,
          3
        ],
        [
          -5,
          3
        ],
        [
          -3,
          1
        ],
        [
          4,
          1
        ]
      ]
    },
    {
      "id": "polygon-2",
      "name": "polygon-2",
      "type": "polygon",
      "material": "gray",
      "groupId": null,
      "x": 3,
      "y": 0,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          5,
          -1
        ],
        [
          30,
          -1
        ],
        [
          30,
          -2
        ],
        [
          5,
          -2
        ]
      ]
    },
    {
      "id": "polygon-3",
      "name": "polygon-3",
      "type": "polygon",
      "material": "light-gray",
      "groupId": null,
      "x": 3,
      "y": -1,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          -11,
          -2
        ],
        [
          -11,
          6
        ],
        [
          -6,
          6
        ],
        [
          -6,
          7
        ],
        [
          -12,
          7
        ],
        [
          -12,
          -2
        ]
      ]
    }
  ],
  "groups": [],
  "hitboxes": [],
  "animations": {
    "clips": {
      "idle": {
        "name": "idle",
        "duration": 1,
        "loop": true,
        "tracks": []
      },
      "fire": {
        "name": "fire",
        "duration": 0.25,
        "loop": false,
        "tracks": []
      },
      "special": {
        "name": "special",
        "duration": 0.6,
        "loop": false,
        "tracks": []
      }
    }
  },
  "markers": {
    "muzzle": {
      "x": 33,
      "y": -2,
      "rotation": 0
    }
  },
  "render": {
    "mergeOutlines": true,
    "flipOnReverse": true,
    "artPixelSize": 4,
    "outline": {
      "enabled": true,
      "color": "#35383e",
      "thickness": 1
    },
    "padding": 2
  },
  "metadata": {
    "createdAt": "2026-10-03T09:32:50.004Z",
    "updatedAt": "2026-10-04T06:29:32.848Z"
  }
};

function traceTargetAlongRay(
  target,
  originX,
  originY,
  dirX,
  dirY,
  maxDistance,
  radius,
) {
  if (
    !target ||
    target.dead ||
    typeof target.hitTest !==
      'function'
  ) {
    return null;
  }

  const step = 8;

  for (
    let distance = 0;
    distance <= maxDistance;
    distance += step
  ) {
    const x =
      originX +
      dirX * distance;

    const y =
      originY +
      dirY * distance;

    if (
      target.hitTest(
        x,
        y,
        radius,
      )
    ) {
      return distance;
    }
  }

  return null;
}

export class ViennaWeapon {
  constructor() {
    this.name = 'Vienna';

    this.orbitRadius = 48;
    this.beamRange = 1900;

    this.baseDamage = 30;
    this.baseBleed = 28;
    this.baseRecoil = 420;
    this.basePulseCount = 3;
    this.basePulseInterval = 0.09;
    this.baseReload = 2.6;
    this.baseBeamWidth = 7;

    this.specialCooldown = 15;
    this.specialCooldownTimer =
      this.specialCooldown;
    this.specialDamage = 55;
    this.specialBleed = 42;
    this.specialBurn = 28;
    this.specialRecoil = 900;
    this.specialPulseCount = 3;
    this.specialPulseInterval = 0.5;
    this.specialBeamWidth = 20;

    this.reloadTimer = 0;
    this.basePulsesRemaining = 0;
    this.basePulseTimer = 0;
    this.baseAngle = 0;

    this.specialPulsesRemaining = 0;
    this.specialPulseTimer = 0;
    this.specialAngle = 0;

    this.beamFlashes = [];
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        VIENNA_SPRITE_ASSET,
      );

    this.artPixelSize =
      this.sprite.compiled.asset
        .render.artPixelSize;
  }

  reset() {
    this.specialCooldownTimer =
      this.specialCooldown;
    this.reloadTimer = 0;
    this.basePulsesRemaining = 0;
    this.basePulseTimer = 0;
    this.baseAngle = 0;
    this.specialPulsesRemaining = 0;
    this.specialPulseTimer = 0;
    this.specialAngle = 0;
    this.beamFlashes.length = 0;
    this.shotSerial = 0;
  }

  getTargetAngle(
    player,
    pointerWorld,
  ) {
    return Math.atan2(
      pointerWorld.y -
        player.y,
      pointerWorld.x -
        player.x,
    );
  }

  getAimFromAngle(
    player,
    angle,
  ) {
    return {
      angle,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      x: player.x,
      y: player.y,
    };
  }

  triggerSpecial(
    {
      player,
      pointerWorld,
    } = {},
  ) {
    if (
      !player ||
      !pointerWorld ||
      this.specialCooldownTimer > 0 ||
      this.specialPulsesRemaining > 0
    ) {
      return false;
    }

    this.specialAngle =
      this.getTargetAngle(
        player,
        pointerWorld,
      );

    this.specialPulsesRemaining =
      this.specialPulseCount;
    this.specialPulseTimer = 0;
    this.basePulsesRemaining = 0;

    this.specialCooldownTimer =
      this.specialCooldown;

    return true;
  }

  get specialAbilities() {
    return [{
      id: 'vienna-barrage',
      name: 'barrage',
      hudLabel: 'BARRAGE',
      cooldown:
        this.specialCooldown,
      remaining:
        this.specialCooldownTimer,
      active:
        this.specialPulsesRemaining >
        0,
    }];
  }

  firePulse(
    player,
    target,
    angle,
    {
      damage,
      bleed,
      burn = 0,
      recoil,
      width,
      special = false,
      resolveHit = null,
    },
  ) {
    const aim =
      this.getAimFromAngle(
        player,
        angle,
      );

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          angle,
          this.artPixelSize,
        );

    target
      ?.damageProjectilesAlongRay
      ?.(
        muzzle.x,
        muzzle.y,
        aim.dirX,
        aim.dirY,
        this.beamRange,
        width * 0.5,
        damage,
      );

    const hitDistance =
      traceTargetAlongRay(
        target,
        muzzle.x,
        muzzle.y,
        aim.dirX,
        aim.dirY,
        this.beamRange,
        width * 0.5,
      );

    if (
      hitDistance !== null
    ) {
      if (
        typeof resolveHit ===
        'function'
      ) {
        resolveHit(
          target,
          {
            damage,
            buildup: {
              bleed,
              ...(burn > 0
                ? { burn }
                : {}),
            },
            source:
              special
                ? 'vienna-barrage'
                : 'vienna',
            attacker: player,
          },
        );
      } else {
        target.takeDamage?.(
          damage,
        );

        target.status
          ?.addBuildup
          ?.(
            'bleed',
            bleed,
            {
              source:
                special
                  ? 'vienna-barrage'
                  : 'vienna',
            },
          );

        if (burn > 0) {
          target.status
            ?.addBuildup
            ?.(
              'burn',
              burn,
              {
                source:
                  'vienna-barrage',
              },
            );
        }
      }
    }

    const beamDistance =
      hitDistance ??
      this.beamRange;

    this.beamFlashes.push({
      x1: muzzle.x,
      y1: muzzle.y,
      x2:
        muzzle.x +
        aim.dirX *
        beamDistance,
      y2:
        muzzle.y +
        aim.dirY *
        beamDistance,
      width,
      life:
        special
          ? 0.16
          : 0.10,
      maxLife:
        special
          ? 0.16
          : 0.10,
      special,
    });

    player.vx -=
      aim.dirX *
      recoil;

    player.vy -=
      aim.dirY *
      recoil;

    player.grounded = false;

    this.shotSerial++;
  }

  update(
    dt,
    player,
    pointerWorld,
    firing,
    _world,
    target,
    _artPixelSize,
    active = true,
    {
      resolveHit = null,
    } = {},
  ) {
    this.reloadTimer =
      Math.max(
        0,
        this.reloadTimer - dt,
      );

    this.basePulseTimer =
      Math.max(
        0,
        this.basePulseTimer - dt,
      );

    this.specialPulseTimer =
      Math.max(
        0,
        this.specialPulseTimer - dt,
      );

    if (active) {
      this.specialCooldownTimer =
        Math.max(
          0,
          this.specialCooldownTimer -
            dt,
        );
    }

    for (
      const flash
      of this.beamFlashes
    ) {
      flash.life =
        Math.max(
          0,
          flash.life - dt,
        );
    }

    this.beamFlashes =
      this.beamFlashes.filter(
        flash =>
          flash.life > 0,
      );

    if (
      active &&
      this.specialPulsesRemaining >
        0 &&
      this.specialPulseTimer <= 0
    ) {
      this.firePulse(
        player,
        target,
        this.specialAngle,
        {
          damage:
            this.specialDamage,
          bleed:
            this.specialBleed,
          burn:
            this.specialBurn,
          recoil:
            this.specialRecoil,
          width:
            this.specialBeamWidth,
          special: true,
          resolveHit,
        },
      );

      this.specialPulsesRemaining--;

      this.specialPulseTimer =
        this.specialPulseInterval;

      if (
        this.specialPulsesRemaining <= 0
      ) {
        this.reloadTimer =
          this.baseReload;
      }
    } else if (
      active &&
      this.basePulsesRemaining > 0 &&
      this.basePulseTimer <= 0
    ) {
      this.firePulse(
        player,
        target,
        this.baseAngle,
        {
          damage:
            this.baseDamage,
          bleed:
            this.baseBleed,
          recoil:
            this.baseRecoil,
          width:
            this.baseBeamWidth,
          resolveHit,
        },
      );

      this.basePulsesRemaining--;

      this.basePulseTimer =
        this.basePulseInterval;

      if (
        this.basePulsesRemaining <= 0
      ) {
        this.reloadTimer =
          this.baseReload;
      }
    } else if (
      active &&
      firing &&
      this.reloadTimer <= 0 &&
      this.basePulsesRemaining <= 0 &&
      this.specialPulsesRemaining <= 0
    ) {
      this.baseAngle =
        this.getTargetAngle(
          player,
          pointerWorld,
        );

      this.basePulsesRemaining =
        this.basePulseCount;

      this.basePulseTimer = 0;
    }
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

  drawBeams(
    ctx,
    cameraX,
  ) {
    for (
      const flash
      of this.beamFlashes
    ) {
      const alpha =
        flash.life /
        flash.maxLife;

      ctx.save();
      ctx.globalAlpha =
        Math.max(
          0,
          Math.min(
            1,
            alpha,
          ),
        );

      ctx.strokeStyle =
        '#ffffff';

      ctx.lineWidth =
        flash.width;

      ctx.lineCap = 'butt';

      ctx.shadowColor =
        '#ffffff';

      ctx.shadowBlur =
        flash.special
          ? 34
          : 18;

      ctx.beginPath();

      ctx.moveTo(
        Math.round(
          flash.x1 -
          cameraX,
        ),
        Math.round(
          flash.y1,
        ),
      );

      ctx.lineTo(
        Math.round(
          flash.x2 -
          cameraX,
        ),
        Math.round(
          flash.y2,
        ),
      );

      ctx.stroke();
      ctx.restore();
    }
  }

  draw(
    ctx,
    player,
    pointerWorld,
    cameraX,
    _artPixelSize,
    active = true,
  ) {
    this.drawBeams(
      ctx,
      cameraX,
    );

    if (!active) {
      return;
    }

    const angle =
      this.specialPulsesRemaining >
        0
        ? this.specialAngle
        : (
            this.basePulsesRemaining >
              0
              ? this.baseAngle
              : this.getTargetAngle(
                  player,
                  pointerWorld,
                )
          );

    const aim =
      this.getAimFromAngle(
        player,
        angle,
      );

    this.sprite.draw(
      ctx,
      aim.x - cameraX,
      aim.y,
      angle,
      this.artPixelSize,
    );
  }
}
