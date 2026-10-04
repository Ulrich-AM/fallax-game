import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=63a';

const MAGNITUDE_SPRITE_ASSET =
  {
  "version": 2,
  "name": "magnitude",
  "displayName": "magnitude",
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
      "x": -2,
      "y": 0,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          1,
          0
        ],
        [
          -1,
          3
        ],
        [
          -6,
          3
        ],
        [
          -6,
          -2
        ],
        [
          11,
          -2
        ],
        [
          11,
          0
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
      "x": 9,
      "y": -1,
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
    "createdAt": "2026-10-04T05:54:02.713Z",
    "updatedAt": "2026-10-04T05:57:07.421Z"
  }
};

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function randomSpread(radians) {
  return (
    (Math.random() * 2 - 1) *
    radians
  );
}

export class MagnitudeWeapon {
  constructor() {
    this.name = 'Magnitude';

    this.damage = 4;
    this.orbitRadius = 42;
    this.bulletSpeed = 1360;
    this.bulletLife = 1.45;
    this.bulletSize = 15;

    this.burstSize = 3;
    this.burstInterval = 0.045;
    this.burstCooldown = 0.30;
    this.inaccuracy = degToRad(2.5);

    this.specialCooldown = 12;
    this.specialCooldownTimer =
      this.specialCooldown;
    this.specialDuration = 3;
    this.specialActiveTimer = 0;
    this.specialShotInterval = 0.035;
    this.specialShotTimer = 0;
    this.specialInaccuracy =
      degToRad(7);
    this.specialRecoilPerShot = 32;

    this.cooldownTimer = 0;
    this.burstShotsRemaining = 0;
    this.burstShotTimer = 0;
    this.bullets = [];
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        MAGNITUDE_SPRITE_ASSET,
      );

    this.artPixelSize =
      this.sprite.compiled.asset
        .render.artPixelSize;
  }

  reset() {
    this.specialCooldownTimer =
      this.specialCooldown;
    this.specialActiveTimer = 0;
    this.specialShotTimer = 0;
    this.cooldownTimer = 0;
    this.burstShotsRemaining = 0;
    this.burstShotTimer = 0;
    this.bullets.length = 0;
    this.shotSerial = 0;
  }

  getAim(player, pointerWorld) {
    const angle =
      Math.atan2(
        pointerWorld.y - player.y,
        pointerWorld.x - player.x,
      );

    return {
      angle,
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

  fireOne(
    player,
    pointerWorld,
    {
      spread = this.inaccuracy,
      recoil = 0,
    } = {},
  ) {
    const aim =
      this.getAim(
        player,
        pointerWorld,
      );

    const shotAngle =
      aim.angle +
      randomSpread(spread);

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          aim.angle,
          this.artPixelSize,
        );

    this.bullets.push({
      x: muzzle.x,
      y: muzzle.y,
      vx:
        Math.cos(shotAngle) *
        this.bulletSpeed,
      vy:
        Math.sin(shotAngle) *
        this.bulletSpeed,
      damage: this.damage,
      life: this.bulletLife,
      maxLife: this.bulletLife,
    });

    if (recoil > 0) {
      player.vx -=
        Math.cos(aim.angle) *
        recoil;

      player.vy -=
        Math.sin(aim.angle) *
        recoil;

      player.grounded = false;
    }

    this.shotSerial++;
  }

  triggerSpecial() {
    if (
      this.specialCooldownTimer > 0 ||
      this.specialActiveTimer > 0
    ) {
      return false;
    }

    this.specialCooldownTimer =
      this.specialCooldown;
    this.specialActiveTimer =
      this.specialDuration;
    this.specialShotTimer = 0;
    this.burstShotsRemaining = 0;
    return true;
  }

  get specialAbilities() {
    return [{
      id: 'magnitude-machine-gun',
      name: 'machine gun',
      hudLabel: 'MACHINE GUN',
      cooldown:
        this.specialCooldown,
      remaining:
        this.specialCooldownTimer,
      active:
        this.specialActiveTimer > 0,
    }];
  }

  updateBullets(
    dt,
    world,
    target,
    player,
    resolveHit,
  ) {
    const radius =
      this.bulletSize * 0.5;

    for (
      const bullet
      of this.bullets
    ) {
      bullet.x +=
        bullet.vx * dt;

      bullet.y +=
        bullet.vy * dt;

      bullet.life =
        Math.max(
          0,
          bullet.life - dt,
        );

      if (
        bullet.life <= 0
      ) {
        continue;
      }

      const projectileHit =
        target
          ?.damageProjectileAt
          ?.(
            bullet.x,
            bullet.y,
            radius,
            bullet.damage,
          );

      if (projectileHit) {
        bullet.life = 0;
        continue;
      }

      if (
        target &&
        !target.dead &&
        target.hitTest?.(
          bullet.x,
          bullet.y,
          radius,
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
                bullet.damage,
              source: 'magnitude',
              attacker: player,
            },
          );
        } else {
          target.takeDamage?.(
            bullet.damage,
          );
        }

        bullet.life = 0;
      }

      if (
        bullet.x < -120 ||
        bullet.x >
          world.width + 120 ||
        bullet.y <
          world.roofY - 160 ||
        bullet.y >
          world.floorY + 160
      ) {
        bullet.life = 0;
      }
    }

    this.bullets =
      this.bullets.filter(
        bullet =>
          bullet.life > 0,
      );
  }

  update(
    dt,
    player,
    pointerWorld,
    firing,
    world,
    target,
    _artPixelSize,
    active = true,
    {
      resolveHit = null,
    } = {},
  ) {
    this.cooldownTimer =
      Math.max(
        0,
        this.cooldownTimer - dt,
      );

    this.burstShotTimer =
      Math.max(
        0,
        this.burstShotTimer - dt,
      );

    if (active) {
      this.specialCooldownTimer =
        Math.max(
          0,
          this.specialCooldownTimer -
            dt,
        );
    }

    this.specialActiveTimer =
      Math.max(
        0,
        this.specialActiveTimer - dt,
      );

    this.specialShotTimer =
      Math.max(
        0,
        this.specialShotTimer - dt,
      );

    if (
      active &&
      this.specialActiveTimer > 0
    ) {
      if (
        this.specialShotTimer <= 0
      ) {
        this.fireOne(
          player,
          pointerWorld,
          {
            spread:
              this.specialInaccuracy,
            recoil:
              this.specialRecoilPerShot,
          },
        );

        this.specialShotTimer =
          this.specialShotInterval;
      }
    } else if (
      active &&
      firing
    ) {
      if (
        this.cooldownTimer <= 0 &&
        this.burstShotsRemaining <= 0
      ) {
        this.burstShotsRemaining =
          this.burstSize;

        this.burstShotTimer = 0;
        this.cooldownTimer =
          this.burstCooldown;
      }

      if (
        this.burstShotsRemaining > 0 &&
        this.burstShotTimer <= 0
      ) {
        this.fireOne(
          player,
          pointerWorld,
        );

        this.burstShotsRemaining--;

        this.burstShotTimer =
          this.burstInterval;
      }
    } else if (
      this.burstShotsRemaining > 0 &&
      this.burstShotTimer <= 0
    ) {
      this.fireOne(
        player,
        pointerWorld,
      );

      this.burstShotsRemaining--;

      this.burstShotTimer =
        this.burstInterval;
    }

    this.updateBullets(
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

  drawBullets(
    ctx,
    cameraX,
  ) {
    const size =
      this.bulletSize;

    const half =
      size * 0.5;

    ctx.save();

    for (
      const bullet
      of this.bullets
    ) {
      const alpha =
        Math.min(
          1,
          bullet.life /
            0.18,
        );

      ctx.globalAlpha =
        0.45 +
        alpha * 0.55;

      ctx.fillStyle =
        '#e5e7eb';

      ctx.fillRect(
        Math.round(
          bullet.x -
          cameraX -
          half,
        ),
        Math.round(
          bullet.y -
          half,
        ),
        size,
        size,
      );
    }

    ctx.restore();
  }

  draw(
    ctx,
    player,
    pointerWorld,
    cameraX,
    _artPixelSize,
    active = true,
  ) {
    this.drawBullets(
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
      aim.x - cameraX,
      aim.y,
      aim.angle,
      this.artPixelSize,
    );
  }
}
