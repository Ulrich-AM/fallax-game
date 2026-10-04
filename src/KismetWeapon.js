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

function findDamagePoint(target) {
  if (
    !target ||
    target.dead ||
    typeof target.hitTest !==
      'function'
  ) {
    return null;
  }

  if (
    target.hitTest(
      target.x,
      target.y,
      4,
    )
  ) {
    return {
      x: target.x,
      y: target.y,
    };
  }

  const maxRadius = 280;
  const ringStep = 28;
  const samples = 24;

  for (
    let radius = ringStep;
    radius <= maxRadius;
    radius += ringStep
  ) {
    for (
      let i = 0;
      i < samples;
      i++
    ) {
      const angle =
        Math.PI * 2 *
        i /
        samples;

      const x =
        target.x +
        Math.cos(angle) *
        radius;

      const y =
        target.y +
        Math.sin(angle) *
        radius;

      if (
        target.hitTest(
          x,
          y,
          4,
        )
      ) {
        return { x, y };
      }
    }
  }

  return null;
}

export class KismetWeapon {
  constructor(
    effects = null,
  ) {
    this.effects = effects;
    this.name = 'Kismet';

    this.damage = 5;
    this.fatigueBuildup = 3;
    this.burnBuildup = 1;
    this.fireCooldown = 0.11;
    this.fireTimer = 0;
    this.recoil = 72;

    this.bulletSpeed = 820;
    this.bulletLife = 3.2;
    this.bulletTurnRate =
      Math.PI * 2.4;
    this.bulletHomingDuration = 1;
    this.bulletSize = 15;
    this.bulletTrailLife = 0.14;
    this.bulletTrailInterval = 0.018;
    this.bulletTrailMaxGhosts = 7;
    this.fireInaccuracy =
      Math.PI / 180 * 34;

    this.orbitSpecialCooldown = 6.5;
    this.orbitSpecialCooldownTimer =
      this.orbitSpecialCooldown;
    this.orbitAddCount = 3;
    this.maxOrbiters = 15;
    this.orbiters = [];
    this.orbiterRadius = 185;
    this.orbiterOuterRadius = 340;
    this.orbiterSpeed = 1.2;
    this.orbiterRearrangeRate =
      Math.PI * 1.6;
    this.orbiterLaunchSpeed = 920;
    this.orbiterEntryDuration = 0.30;
    this.orbiterSize = 18;
    this.formationPhase = 0;

    this.convergenceCooldown = 10.5;
    this.convergenceCooldownTimer =
      this.convergenceCooldown;
    this.convergenceDuration = 1.1;
    this.convergenceTimer = 0;
    this.convergenceDamageApplied = false;
    this.convergenceTargetOffsetX = 0;
    this.convergenceTargetOffsetY = 0;
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
    this.convergenceTargetOffsetX = 0;
    this.convergenceTargetOffsetY = 0;
    this.bullets.length = 0;
    this.orbiters.length = 0;
    this.formationPhase = 0;
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
      x: player.x,
      y: player.y,
    };
  }

  fireOne(
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

    const angle =
      aim.angle +
      (
        Math.random() * 2 - 1
      ) *
      this.fireInaccuracy;

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
      age: 0,
      trailTimer: 0,
      trail: [],
    });

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
      player,
      target,
    } = {},
  ) {
    const boss =
      target ??
      this.orbitTarget;

    if (
      this.orbitSpecialCooldownTimer >
        0 ||
      !player ||
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

    const aim =
      this.getAim(
        player,
        {
          x: boss.x,
          y: boss.y,
        },
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
      i < count;
      i++
    ) {
      const spread =
        (
          i -
          (
            count - 1
          ) /
          2
        ) *
        (
          Math.PI /
          180 *
          8
        );

      this.orbiters.push({
        angle:
          aim.angle +
          spread,
        launching: true,
        entryBlend: 0,
        entryX: muzzle.x,
        entryY: muzzle.y,
        x: muzzle.x,
        y: muzzle.y,
        flightAngle:
          aim.angle +
          spread,
      });
    }

    this.orbitSpecialCooldownTimer =
      this.orbitSpecialCooldown;

    this.shotSerial += count;
    return true;
  }

  triggerSecondarySpecial(
    {
      target,
    } = {},
  ) {
    const boss =
      target ??
      this.orbitTarget;

    if (
      this.convergenceCooldownTimer >
        0 ||
      this.convergenceTimer > 0 ||
      this.orbiters.length <= 0 ||
      this.orbiters.some(
        orbiter =>
          orbiter.launching ||
          (
            orbiter.entryBlend ??
            1
          ) < 0.95,
      ) ||
      !boss ||
      boss.dead
    ) {
      return false;
    }

    const point =
      findDamagePoint(boss);

    if (!point) {
      return false;
    }

    this.orbitTarget = boss;
    this.convergenceTargetOffsetX =
      point.x - boss.x;
    this.convergenceTargetOffsetY =
      point.y - boss.y;

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
      bullet.age += dt;
      bullet.trailTimer -= dt;

      if (
        bullet.trailTimer <= 0
      ) {
        bullet.trail.push({
          x: bullet.x,
          y: bullet.y,
          life:
            this.bulletTrailLife,
          maxLife:
            this.bulletTrailLife,
        });

        if (
          bullet.trail.length >
          this.bulletTrailMaxGhosts
        ) {
          bullet.trail.shift();
        }

        bullet.trailTimer =
          this.bulletTrailInterval;
      }

      for (
        const ghost
        of bullet.trail
      ) {
        ghost.life -= dt;
      }

      bullet.trail =
        bullet.trail.filter(
          ghost =>
            ghost.life > 0,
        );

      if (
        bullet.age <=
          this.bulletHomingDuration &&
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
        this.effects?.spawn?.(
          'impact-ring',
          {
            x: bullet.x,
            y: bullet.y,
          },
        );

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

        this.effects?.spawn?.(
          'impact-ring',
          {
            x: bullet.x,
            y: bullet.y,
          },
        );

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
          this.orbiterOuterRadius -
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
      this.orbiterOuterRadius +
      (
        12 -
        this.orbiterOuterRadius
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

    const point =
      findDamagePoint(target);

    if (!point) {
      return;
    }

    this.convergenceTargetOffsetX =
      point.x - target.x;
    this.convergenceTargetOffsetY =
      point.y - target.y;

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

    this.effects?.spawn?.(
      'impact-ring',
      {
        x: point.x,
        y: point.y,
        scale: 1.8,
        glow: 30,
      },
    );

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

    this.formationPhase +=
      this.orbiterSpeed *
      dt;

    const count =
      this.orbiters.length;

    const normalRadius =
      this.orbiterRadius;

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const orbiter =
        this.orbiters[i];

      const targetAngle =
        this.formationPhase +
        Math.PI * 2 *
        i /
        count;

      if (orbiter.launching) {
        const targetX =
          target.x +
          Math.cos(
            targetAngle,
          ) *
          normalRadius;

        const targetY =
          target.y +
          Math.sin(
            targetAngle,
          ) *
          normalRadius;

        const desired =
          Math.atan2(
            targetY -
              orbiter.y,
            targetX -
              orbiter.x,
          );

        orbiter.flightAngle =
          approachAngle(
            orbiter.flightAngle,
            desired,
            Math.PI * 4.8 *
              dt,
          );

        orbiter.x +=
          Math.cos(
            orbiter.flightAngle,
          ) *
          this.orbiterLaunchSpeed *
          dt;

        orbiter.y +=
          Math.sin(
            orbiter.flightAngle,
          ) *
          this.orbiterLaunchSpeed *
          dt;

        if (
          Math.hypot(
            targetX -
              orbiter.x,
            targetY -
              orbiter.y,
          ) <= 22
        ) {
          orbiter.launching =
            false;

          orbiter.entryBlend = 0;
          orbiter.entryX =
            orbiter.x;
          orbiter.entryY =
            orbiter.y;

          orbiter.angle =
            Math.atan2(
              orbiter.y -
                target.y,
              orbiter.x -
                target.x,
            );
        }

        continue;
      }

      orbiter.angle =
        approachAngle(
          orbiter.angle,
          targetAngle,
          this.orbiterRearrangeRate *
            dt,
        );

      if (
        (
          orbiter.entryBlend ??
          1
        ) < 1
      ) {
        orbiter.entryBlend =
          Math.min(
            1,
            (
              orbiter.entryBlend ??
              0
            ) +
            dt /
            this.orbiterEntryDuration,
          );
      }
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
      this.fireOne(
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
        clamp(
          bullet.life /
          Math.min(
            0.25,
            bullet.maxLife,
          ),
          0.25,
          1,
        );

      for (
        const ghost
        of bullet.trail
      ) {
        const ageAlpha =
          Math.max(
            0,
            ghost.life /
            ghost.maxLife,
          );

        ctx.globalAlpha =
          ageAlpha *
          alpha *
          0.30;

        ctx.fillStyle =
          '#ffffff';

        ctx.shadowColor =
          '#ffffff';
        ctx.shadowBlur = 8;

        ctx.fillRect(
          Math.round(
            ghost.x -
            cameraX -
            half,
          ),
          Math.round(
            ghost.y -
            half,
          ),
          size,
          size,
        );
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor =
        '#ffffff';
      ctx.shadowBlur = 12;

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

    let centerX =
      this.orbitTarget.x;

    let centerY =
      this.orbitTarget.y;

    if (converging) {
      const elapsed =
        this.convergenceDuration -
        this.convergenceTimer;

      const centerBlend =
        easeOutCubic(
          clamp(
            elapsed / 0.40,
            0,
            1,
          ),
        );

      centerX +=
        this.convergenceTargetOffsetX *
        centerBlend;

      centerY +=
        this.convergenceTargetOffsetY *
        centerBlend;
    }

    for (
      const orbiter
      of this.orbiters
    ) {
      let x;
      let y;

      if (orbiter.launching) {
        x = orbiter.x;
        y = orbiter.y;
      } else {
        const orbitX =
          centerX +
          Math.cos(
            orbiter.angle,
          ) *
          radius;

        const orbitY =
          centerY +
          Math.sin(
            orbiter.angle,
          ) *
          radius;

        const blend =
          clamp(
            orbiter.entryBlend ??
            1,
            0,
            1,
          );

        const smoothBlend =
          blend *
          blend *
          (
            3 -
            2 * blend
          );

        x =
          (
            orbiter.entryX ??
            orbitX
          ) +
          (
            orbitX -
            (
              orbiter.entryX ??
              orbitX
            )
          ) *
          smoothBlend;

        y =
          (
            orbiter.entryY ??
            orbitY
          ) +
          (
            orbitY -
            (
              orbiter.entryY ??
              orbitY
            )
          ) *
          smoothBlend;
      }

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
