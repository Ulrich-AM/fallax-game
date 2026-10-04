import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=63a';

const KISMET_SPRITE_ASSET =
  {
  "version": 2,
  "name": "kismet",
  "displayName": "kismet",
  "type": "weapon",
  "scale": 1.4,
  "pivot": [
    0,
    0
  ],
  "parts": [
    {
      "id": "polygon-4",
      "name": "polygon-4",
      "type": "polygon",
      "material": "dark-gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          -1,
          1
        ],
        [
          3,
          1
        ],
        [
          3,
          0
        ],
        [
          -1,
          0
        ]
      ]
    },
    {
      "id": "polygon-1",
      "name": "polygon-1",
      "type": "polygon",
      "material": "gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          0,
          -2
        ],
        [
          2,
          -1
        ],
        [
          3,
          2
        ],
        [
          5,
          2
        ],
        [
          5,
          -2
        ]
      ]
    },
    {
      "id": "polygon-2",
      "name": "polygon-2",
      "type": "polygon",
      "material": "gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          0,
          2
        ],
        [
          -1,
          0
        ],
        [
          -8,
          0
        ],
        [
          -8,
          -2
        ],
        [
          -11,
          -2
        ],
        [
          -11,
          2
        ]
      ]
    },
    {
      "id": "polygon-3",
      "name": "polygon-3",
      "type": "polygon",
      "material": "glow-white",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          -7,
          -1
        ],
        [
          -1,
          -1
        ],
        [
          -1,
          -2
        ],
        [
          -7,
          -2
        ]
      ]
    },
    {
      "id": "polygon-5",
      "name": "polygon-5",
      "type": "polygon",
      "material": "dark-gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          -5,
          2
        ],
        [
          -6,
          3
        ],
        [
          -9,
          3
        ],
        [
          -10,
          2
        ]
      ]
    },
    {
      "id": "polygon-7",
      "name": "polygon-7",
      "type": "polygon",
      "material": "glow-white",
      "groupId": "group-1",
      "x": 3,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          15,
          3
        ],
        [
          17,
          -1
        ],
        [
          17,
          -3
        ],
        [
          18,
          -3
        ],
        [
          18,
          -1
        ],
        [
          16,
          3
        ]
      ]
    },
    {
      "id": "polygon-8",
      "name": "polygon-8",
      "type": "polygon",
      "material": "gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          6,
          3
        ],
        [
          6,
          -2
        ],
        [
          7,
          -2
        ],
        [
          7,
          3
        ]
      ]
    },
    {
      "id": "polygon-9",
      "name": "polygon-9",
      "type": "polygon",
      "material": "gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          8,
          3
        ],
        [
          8,
          -2
        ],
        [
          9,
          -2
        ],
        [
          9,
          3
        ]
      ]
    },
    {
      "id": "polygon-10",
      "name": "polygon-10",
      "type": "polygon",
      "material": "glow-white",
      "groupId": "group-1",
      "x": 4,
      "y": 1,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          12,
          -1
        ],
        [
          12,
          0
        ],
        [
          13,
          0
        ],
        [
          13,
          -1
        ]
      ]
    },
    {
      "id": "polygon-11",
      "name": "polygon-11",
      "type": "polygon",
      "material": "gray",
      "groupId": "group-1",
      "x": 4,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          10,
          3
        ],
        [
          10,
          0
        ],
        [
          14,
          0
        ],
        [
          14,
          -3
        ],
        [
          15,
          -4
        ],
        [
          15,
          -1
        ],
        [
          13,
          3
        ]
      ]
    },
    {
      "id": "polygon-12",
      "name": "polygon-12",
      "type": "polygon",
      "material": "gray",
      "groupId": "group-1",
      "x": 3,
      "y": 2,
      "rotation": 0,
      "outline": null,
      "points": [
        [
          -11,
          -2
        ],
        [
          -17,
          -2
        ],
        [
          -17,
          5
        ],
        [
          -16,
          5
        ],
        [
          -13,
          5
        ],
        [
          -12,
          4
        ],
        [
          -12,
          -1
        ],
        [
          -11,
          -1
        ]
      ]
    }
  ],
  "groups": [
    {
      "id": "group-1",
      "name": "group-1",
      "pivot": [
        4,
        2
      ]
    }
  ],
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
      "x": 21,
      "y": 0,
      "rotation": 0
    }
  },
  "render": {
    "mergeOutlines": true,
    "flipOnReverse": true,
    "artPixelSize": 3,
    "outline": {
      "enabled": true,
      "color": "#35383e",
      "thickness": 1
    },
    "padding": 2
  },
  "metadata": {
    "createdAt": "2026-10-03T09:32:50.004Z",
    "updatedAt": "2026-10-04T06:46:03.879Z"
  }
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

function approachAngle(
  current,
  target,
  maxDelta,
) {
  const delta =
    (
      (
        target -
        current +
        Math.PI * 3
      ) %
      (Math.PI * 2)
    ) -
    Math.PI;

  if (
    Math.abs(delta) <=
    maxDelta
  ) {
    return target;
  }

  return (
    current +
    Math.sign(delta) *
    maxDelta
  );
}

function easeOutCubic(t) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function easeInCubic(t) {
  return t * t * t;
}

export class KismetWeapon {
  constructor() {
    this.name = 'Kismet';

    this.orbitRadius = 54;

    this.volleyCount = 4;
    this.damage = 7;
    this.fatigueBuildup = 8;
    this.burnBuildup = 3;
    this.fireCooldown = 0.82;
    this.fireTimer = 0;
    this.recoil = 820;

    this.bulletSpeed = 780;
    this.bulletLife = 3.4;
    this.bulletTurnRate =
      Math.PI * 1.85;
    this.bulletSize = 12;
    this.volleySpread =
      Math.PI / 180 * 6;

    this.orbitSpecialCooldown = 6.5;
    this.orbitSpecialCooldownTimer =
      this.orbitSpecialCooldown;
    this.orbitAddCount = 3;
    this.maxOrbiters = 15;
    this.orbiters = [];
    this.orbiterRadius = 92;
    this.orbiterSpeed = 1.35;
    this.orbiterSize = 18;

    this.convergenceCooldown = 10.5;
    this.convergenceCooldownTimer =
      this.convergenceCooldown;
    this.convergenceDuration = 1.1;
    this.convergenceTimer = 0;
    this.convergenceDamageApplied = false;
    this.convergenceBaseDamage = 50;
    this.convergenceDamagePerOrb = 4.5;
    this.convergenceBaseBurn = 10;
    this.convergenceBurnPerOrb = 1.5;

    this.bullets = [];
    this.orbitTarget = null;
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        KISMET_SPRITE_ASSET,
      );

    this.artPixelSize =
      this.sprite.compiled.asset
        .render.artPixelSize;
  }

  reset() {
    this.fireTimer = 0;
    this.orbitSpecialCooldownTimer =
      this.orbitSpecialCooldown;
    this.convergenceCooldownTimer =
      this.convergenceCooldown;
    this.convergenceTimer = 0;
    this.convergenceDamageApplied =
      false;
    this.bullets.length = 0;
    this.orbiters.length = 0;
    this.orbitTarget = null;
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

  fireVolley(
    player,
    pointerWorld,
  ) {
    const aim =
      this.getAim(
        player,
        pointerWorld,
      );

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          aim.angle,
          this.artPixelSize,
        );

    for (
      let i = 0;
      i < this.volleyCount;
      i++
    ) {
      const centered =
        i -
        (
          this.volleyCount -
          1
        ) /
        2;

      const angle =
        aim.angle +
        centered *
        this.volleySpread;

      this.bullets.push({
        x: muzzle.x,
        y: muzzle.y,
        vx:
          Math.cos(angle) *
          this.bulletSpeed,
        vy:
          Math.sin(angle) *
          this.bulletSpeed,
        angle,
        life:
          this.bulletLife,
        maxLife:
          this.bulletLife,
      });
    }

    player.vx -=
      aim.dirX *
      this.recoil;

    player.vy -=
      aim.dirY *
      this.recoil;

    player.grounded = false;

    this.shotSerial++;
  }

  triggerSpecial(
    {
      target,
    } = {},
  ) {
    const boss =
      target ??
      this.orbitTarget;

    if (
      this.orbitSpecialCooldownTimer >
        0 ||
      !boss ||
      boss.dead ||
      this.orbiters.length >=
        this.maxOrbiters
    ) {
      return false;
    }

    this.orbitTarget = boss;

    const remaining =
      this.maxOrbiters -
      this.orbiters.length;

    const count =
      Math.min(
        this.orbitAddCount,
        remaining,
      );

    const baseAngle =
      this.orbiters.length > 0
        ? this.orbiters[
            this.orbiters.length - 1
          ].angle +
          Math.PI * 0.72
        : 0;

    for (
      let i = 0;
      i < count;
      i++
    ) {
      this.orbiters.push({
        angle:
          baseAngle +
          (
            Math.PI * 2 *
            i /
            Math.max(
              1,
              count,
            )
          ),
      });
    }

    this.orbitSpecialCooldownTimer =
      this.orbitSpecialCooldown;

    this.shotSerial++;
    return true;
  }

  triggerSecondarySpecial() {
    if (
      this.convergenceCooldownTimer >
        0 ||
      this.convergenceTimer > 0 ||
      this.orbiters.length <= 0
    ) {
      return false;
    }

    this.convergenceCooldownTimer =
      this.convergenceCooldown;
    this.convergenceTimer =
      this.convergenceDuration;
    this.convergenceDamageApplied =
      false;

    return true;
  }

  get specialAbilities() {
    return [
      {
        id: 'kismet-fated-orbit',
        name: 'fated orbit',
        hudLabel: 'FATED ORBIT',
        binding: 'special',
        cooldown:
          this.orbitSpecialCooldown,
        remaining:
          this.orbitSpecialCooldownTimer,
        active:
          this.orbiters.length >=
          this.maxOrbiters,
        activeText:
          this.orbiters.length >=
          this.maxOrbiters
            ? 'MAX 15'
            : 'ACTIVE',
      },
      {
        id: 'kismet-convergence',
        name: 'convergence',
        hudLabel: 'CONVERGENCE',
        binding: 'special2',
        cooldown:
          this.convergenceCooldown,
        remaining:
          this.convergenceCooldownTimer,
        active:
          this.convergenceTimer > 0,
        activeText: 'CLOSING',
      },
    ];
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
      if (
        target &&
        !target.dead
      ) {
        const desired =
          Math.atan2(
            target.y -
              bullet.y,
            target.x -
              bullet.x,
          );

        bullet.angle =
          approachAngle(
            bullet.angle,
            desired,
            this.bulletTurnRate *
              dt,
          );

        bullet.vx =
          Math.cos(
            bullet.angle,
          ) *
          this.bulletSpeed;

        bullet.vy =
          Math.sin(
            bullet.angle,
          ) *
          this.bulletSpeed;
      }

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
            this.damage,
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
                this.damage,
              buildup: {
                fatigue:
                  this.fatigueBuildup,
                burn:
                  this.burnBuildup,
              },
              source: 'kismet',
              attacker: player,
            },
          );
        } else {
          target.takeDamage?.(
            this.damage,
          );

          target.status
            ?.addBuildup
            ?.(
              'fatigue',
              this.fatigueBuildup,
              {
                source: 'kismet',
              },
            );

          target.status
            ?.addBuildup
            ?.(
              'burn',
              this.burnBuildup,
              {
                source: 'kismet',
              },
            );
        }

        bullet.life = 0;
      }

      if (
        bullet.x < -180 ||
        bullet.x >
          world.width + 180 ||
        bullet.y <
          world.roofY - 220 ||
        bullet.y >
          world.floorY + 220
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

  getConvergenceRadius() {
    if (
      this.convergenceTimer <= 0
    ) {
      return this.orbiterRadius;
    }

    const elapsed =
      this.convergenceDuration -
      this.convergenceTimer;

    if (elapsed < 0.40) {
      const t =
        clamp(
          elapsed / 0.40,
          0,
          1,
        );

      return (
        this.orbiterRadius +
        (
          190 -
          this.orbiterRadius
        ) *
        easeOutCubic(t)
      );
    }

    const t =
      clamp(
        (
          elapsed -
          0.40
        ) /
        0.70,
        0,
        1,
      );

    return (
      190 +
      (
        12 -
        190
      ) *
      easeInCubic(t)
    );
  }

  applyConvergenceHit(
    player,
    target,
    resolveHit,
  ) {
    if (
      this.convergenceDamageApplied ||
      !target ||
      target.dead ||
      this.orbiters.length <= 0
    ) {
      return;
    }

    this.convergenceDamageApplied =
      true;

    const count =
      this.orbiters.length;

    const damage =
      this.convergenceBaseDamage +
      this.convergenceDamagePerOrb *
      count;

    const burn =
      this.convergenceBaseBurn +
      this.convergenceBurnPerOrb *
      count;

    if (
      typeof resolveHit ===
      'function'
    ) {
      resolveHit(
        target,
        {
          damage,
          buildup: {
            burn,
          },
          source:
            'kismet-convergence',
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
          'burn',
          burn,
          {
            source:
              'kismet-convergence',
          },
        );
    }
  }

  updateOrbiters(
    dt,
    player,
    target,
    resolveHit,
  ) {
    if (
      this.orbiters.length <= 0
    ) {
      return;
    }

    if (
      !target ||
      target.dead
    ) {
      this.orbiters.length = 0;
      this.orbitTarget = null;
      this.convergenceTimer = 0;
      return;
    }

    this.orbitTarget = target;

    for (
      const orbiter
      of this.orbiters
    ) {
      orbiter.angle +=
        this.orbiterSpeed *
        dt;
    }

    if (
      this.convergenceTimer > 0
    ) {
      this.convergenceTimer =
        Math.max(
          0,
          this.convergenceTimer -
            dt,
        );

      const elapsed =
        this.convergenceDuration -
        this.convergenceTimer;

      if (
        elapsed >= 0.98 &&
        !this.convergenceDamageApplied
      ) {
        this.applyConvergenceHit(
          player,
          target,
          resolveHit,
        );
      }
    }
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
    this.fireTimer =
      Math.max(
        0,
        this.fireTimer - dt,
      );

    if (active) {
      this.orbitSpecialCooldownTimer =
        Math.max(
          0,
          this.orbitSpecialCooldownTimer -
            dt,
        );

      this.convergenceCooldownTimer =
        Math.max(
          0,
          this.convergenceCooldownTimer -
            dt,
        );
    }

    if (
      active &&
      firing &&
      this.fireTimer <= 0
    ) {
      this.fireVolley(
        player,
        pointerWorld,
      );

      this.fireTimer =
        this.fireCooldown;
    }

    this.updateBullets(
      dt,
      world,
      target,
      player,
      resolveHit,
    );

    this.updateOrbiters(
      dt,
      player,
      target,
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

  drawSquare(
    ctx,
    x,
    y,
    size,
    alpha,
    glow,
  ) {
    const half =
      size * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = glow;

    ctx.fillRect(
      Math.round(
        x - half,
      ),
      Math.round(
        y - half,
      ),
      size,
      size,
    );

    ctx.restore();
  }

  drawBullets(
    ctx,
    cameraX,
  ) {
    for (
      const bullet
      of this.bullets
    ) {
      const alpha =
        clamp(
          bullet.life /
          Math.min(
            0.25,
            bullet.maxLife,
          ),
          0.25,
          1,
        );

      this.drawSquare(
        ctx,
        bullet.x - cameraX,
        bullet.y,
        this.bulletSize,
        alpha,
        12,
      );
    }
  }

  drawOrbiters(
    ctx,
    cameraX,
  ) {
    if (
      this.orbiters.length <= 0 ||
      !this.orbitTarget
    ) {
      return;
    }

    const radius =
      this.getConvergenceRadius();

    const converging =
      this.convergenceTimer > 0;

    for (
      const orbiter
      of this.orbiters
    ) {
      const x =
        this.orbitTarget.x +
        Math.cos(
          orbiter.angle,
        ) *
        radius;

      const y =
        this.orbitTarget.y +
        Math.sin(
          orbiter.angle,
        ) *
        radius;

      this.drawSquare(
        ctx,
        x - cameraX,
        y,
        converging
          ? this.orbiterSize + 4
          : this.orbiterSize,
        0.94,
        converging
          ? 26
          : 18,
      );
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
    this.drawBullets(
      ctx,
      cameraX,
    );

    this.drawOrbiters(
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
      {
        glowStrength: 1.25,
      },
    );
  }
}
