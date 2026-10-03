import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=63a';

const FUKIYA_SPRITE_ASSET = {
  version: 2,
  name: 'fukiya',
  displayName: 'fukiya',
  type: 'weapon',
  scale: 0.4,
  pivot: [0, 0],
  parts: [
    {
      id: 'polygon-1',
      name: 'polygon-1',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 4,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [16, 0],
        [16, -1],
        [-26, -1],
        [-26, 0],
        [-26, 1],
        [16, 1],
      ],
    },
    {
      id: 'polygon-2',
      name: 'polygon-2',
      type: 'polygon',
      material: 'light-gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [23, 1],
        [23, -1],
        [30, -1],
        [30, 1],
      ],
    },
  ],
  groups: [],
  hitboxes: [],
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
      x: 30,
      y: 0,
      rotation: 0,
    },
  },
  render: {
    mergeOutlines: true,
    flipOnReverse: false,
    artPixelSize: 4,
    outline: {
      enabled: true,
      color: '#35383e',
      thickness: 1,
    },
    padding: 2,
  },
};

function clamp(
  value,
  min,
  max,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export class FukiyaWeapon {
  constructor() {
    this.name = 'Fukiya';

    this.orbitRadius = 42;
    this.dartSpeed = 1380;
    this.dartLife = 1.7;
    this.dartDamage = 12;
    this.poisonBuildup = 22;
    this.fireCooldown = 0.58;
    this.fireTimer = 0;

    this.specialCooldown = 10;
    this.specialCooldownTimer =
      this.specialCooldown;
    this.specialDartCount = 7;
    this.specialShotsRemaining = 0;
    this.specialShotInterval = 0.055;
    this.specialShotTimer = 0;
    this.specialDamage = 5;
    this.specialPoisonBuildup = 18;
    this.specialSpreadStep =
      Math.PI / 180 * 2.5;
    this.specialAngle = 0;

    this.darts = [];
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        FUKIYA_SPRITE_ASSET,
      );
  }

  reset() {
    this.fireTimer = 0;
    this.specialCooldownTimer =
      this.specialCooldown;
    this.specialShotsRemaining = 0;
    this.specialShotTimer = 0;
    this.specialAngle = 0;
    this.darts.length = 0;
    this.shotSerial = 0;
  }

  getAim(
    player,
    pointerWorld,
  ) {
    const angle =
      Math.atan2(
        pointerWorld.y -
          player.y,
        pointerWorld.x -
          player.x,
      );

    return {
      angle,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      x:
        player.x +
        Math.cos(angle) *
        this.orbitRadius,
      y:
        player.y +
        Math.sin(angle) *
        this.orbitRadius,
    };
  }

  getMuzzle(
    player,
    angle,
    artPixelSize,
  ) {
    const dirX =
      Math.cos(angle);

    const dirY =
      Math.sin(angle);

    const pivotX =
      player.x +
      dirX *
      this.orbitRadius;

    const pivotY =
      player.y +
      dirY *
      this.orbitRadius;

    return this.sprite
      .getMarkerWorldPosition(
        'muzzle',
        pivotX,
        pivotY,
        angle,
        artPixelSize,
      );
  }

  fireDart(
    player,
    angle,
    artPixelSize,
    {
      damage =
        this.dartDamage,
      poison =
        this.poisonBuildup,
      special = false,
    } = {},
  ) {
    const muzzle =
      this.getMuzzle(
        player,
        angle,
        artPixelSize,
      );

    const dirX =
      Math.cos(angle);

    const dirY =
      Math.sin(angle);

    this.darts.push({
      x: muzzle.x,
      y: muzzle.y,
      prevX: muzzle.x,
      prevY: muzzle.y,
      vx:
        dirX *
        this.dartSpeed,
      vy:
        dirY *
        this.dartSpeed,
      angle,
      life:
        this.dartLife,
      maxLife:
        this.dartLife,
      damage,
      poison,
      special,
    });

    this.shotSerial++;
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
      this.specialShotsRemaining > 0
    ) {
      return false;
    }

    this.specialAngle =
      Math.atan2(
        pointerWorld.y -
          player.y,
        pointerWorld.x -
          player.x,
      );

    this.specialShotsRemaining =
      this.specialDartCount;

    this.specialShotTimer = 0;

    this.specialCooldownTimer =
      this.specialCooldown;

    return true;
  }

  get specialAbilities() {
    return [{
      id: 'fukiya-needleburst',
      name: 'needleburst',
      hudLabel: 'NEEDLEBURST',
      cooldown:
        this.specialCooldown,
      remaining:
        this.specialCooldownTimer,
      active:
        this.specialShotsRemaining >
        0,
    }];
  }

  updateDarts(
    dt,
    world,
    target,
    player,
    resolveHit,
  ) {
    for (
      const dart
      of this.darts
    ) {
      if (dart.life <= 0) {
        continue;
      }

      dart.prevX =
        dart.x;

      dart.prevY =
        dart.y;

      dart.x +=
        dart.vx *
        dt;

      dart.y +=
        dart.vy *
        dt;

      dart.life =
        Math.max(
          0,
          dart.life - dt,
        );

      if (
        target &&
        !target.dead &&
        dart.life > 0
      ) {
        const projectileHit =
          target
            .damageProjectileAt
            ?.(
              dart.x,
              dart.y,
              3,
              dart.damage,
            );

        if (projectileHit) {
          dart.life = 0;
          continue;
        }

        if (
          target.hitTest?.(
            dart.x,
            dart.y,
            3,
          )
        ) {
          if (
            typeof resolveHit ===
            'function'
          ) {
            resolveHit(
              target,
              {
                damage:
                  dart.damage,
                buildup: {
                  poison:
                    dart.poison,
                },
                source:
                  dart.special
                    ? 'fukiya-needleburst'
                    : 'fukiya',
                attacker:
                  player,
              },
            );
          } else {
            target.takeDamage?.(
              dart.damage,
            );

            target.status
              ?.addBuildup
              ?.(
                'poison',
                dart.poison,
                {
                  source:
                    dart.special
                      ? 'fukiya-needleburst'
                      : 'fukiya',
                },
              );
          }

          dart.life = 0;
          continue;
        }
      }

      if (
        dart.x < -120 ||
        dart.x >
          world.width + 120 ||
        dart.y <
          world.roofY - 160 ||
        dart.y >
          world.floorY + 160
      ) {
        dart.life = 0;
      }
    }

    this.darts =
      this.darts.filter(
        dart =>
          dart.life > 0,
      );
  }

  update(
    dt,
    player,
    pointerWorld,
    firing,
    world,
    target,
    artPixelSize,
    active = true,
    {
      resolveHit = null,
    } = {},
  ) {
    this.fireTimer =
      Math.max(
        0,
        this.fireTimer - dt,
      );

    if (active) {
      this.specialCooldownTimer =
        Math.max(
          0,
          this.specialCooldownTimer -
            dt,
        );
    } else if (
      this.specialShotsRemaining > 0
    ) {
      this.specialShotsRemaining = 0;
    }

    if (
      active &&
      this.specialShotsRemaining >
        0
    ) {
      this.specialShotTimer =
        Math.max(
          0,
          this.specialShotTimer -
            dt,
        );

      if (
        this.specialShotTimer <= 0
      ) {
        const firedIndex =
          this.specialDartCount -
          this.specialShotsRemaining;

        const centeredIndex =
          firedIndex -
          (
            this.specialDartCount -
            1
          ) /
          2;

        const angle =
          this.specialAngle +
          centeredIndex *
          this.specialSpreadStep;

        this.fireDart(
          player,
          angle,
          artPixelSize,
          {
            damage:
              this.specialDamage,
            poison:
              this.specialPoisonBuildup,
            special: true,
          },
        );

        this.specialShotsRemaining--;

        this.specialShotTimer =
          this.specialShotInterval;
      }
    } else if (
      active &&
      firing &&
      this.fireTimer <= 0
    ) {
      const aim =
        this.getAim(
          player,
          pointerWorld,
        );

      this.fireDart(
        player,
        aim.angle,
        artPixelSize,
      );

      this.fireTimer =
        this.fireCooldown;
    }

    this.updateDarts(
      dt,
      world,
      target,
      player,
      resolveHit,
    );
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

  drawDarts(
    ctx,
    cameraX,
  ) {
    for (
      const dart
      of this.darts
    ) {
      const ratio =
        clamp(
          dart.life /
            dart.maxLife,
          0,
          1,
        );

      ctx.save();
      ctx.globalAlpha =
        0.45 +
        ratio *
        0.55;

      ctx.translate(
        Math.round(
          dart.x -
          cameraX,
        ),
        Math.round(
          dart.y,
        ),
      );

      ctx.rotate(
        dart.angle,
      );

      ctx.fillStyle =
        dart.special
          ? '#b7df73'
          : '#91b85b';

      if (dart.special) {
        ctx.shadowColor =
          '#91b85b';
        ctx.shadowBlur = 10;
      }

      ctx.fillRect(
        -5,
        -1,
        10,
        2,
      );

      ctx.fillStyle =
        '#d7dbe2';

      ctx.fillRect(
        3,
        -1,
        3,
        2,
      );

      ctx.restore();
    }
  }

  draw(
    ctx,
    player,
    pointerWorld,
    cameraX,
    artPixelSize,
    active = true,
  ) {
    this.drawDarts(
      ctx,
      cameraX,
    );

    if (!active) {
      return;
    }

    const aim =
      this.getAim(
        player,
        pointerWorld,
      );

    this.sprite.draw(
      ctx,
      aim.x -
        cameraX,
      aim.y,
      aim.angle,
      artPixelSize,
      {
        glowStrength: 0,
      },
    );
  }
}
