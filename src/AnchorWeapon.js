import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=60a';

const ANCHOR_TIP_PARTS = [
  {
    id: 'polygon-1',
    name: 'polygon-1',
    type: 'polygon',
    material: 'glow-red',
    groupId: null,
    x: 0,
    y: 0,
    rotation: 0,
    outline: null,
    points: [
      [0, 0],
      [1, -2],
      [10, 0],
    ],
  },
  {
    id: 'polygon-mirror-2',
    name: 'polygon-1 mirror',
    type: 'polygon',
    material: 'glow-red',
    groupId: null,
    x: 0,
    y: 0,
    rotation: 0,
    outline: null,
    points: [
      [10, 0],
      [1, 2],
      [0, 0],
    ],
  },
];

const ANCHOR_BODY_PARTS = [
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
      [-2, 0],
      [-1, -2],
      [-5, -2],
      [-6, -1],
      [-6, 0],
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
      [-6, 0],
      [-6, 1],
      [-5, 2],
      [-1, 2],
      [-2, 0],
    ],
  },
];

function makeAsset(
  name,
  parts,
) {
  return {
    version: 2,
    name,
    displayName: name,
    type: 'weapon',
    scale: 1,
    pivot: [0, 0],
    parts:
      JSON.parse(
        JSON.stringify(parts),
      ),
    groups: [],
    hitboxes: [],
    animations: {
      clips: {
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
        x: 10,
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
}

const ANCHOR_SPRITE_ASSET =
  makeAsset(
    'anchor',
    [
      ...ANCHOR_TIP_PARTS,
      ...ANCHOR_BODY_PARTS,
    ],
  );

const ANCHOR_BODY_ASSET =
  makeAsset(
    'anchor-body',
    ANCHOR_BODY_PARTS,
  );

const ANCHOR_TIP_ASSET =
  makeAsset(
    'anchor-tip',
    ANCHOR_TIP_PARTS,
  );

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

function segmentRectIntersection(
  x0,
  y0,
  x1,
  y1,
  rect,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;

  let t0 = 0;
  let t1 = 1;

  const checks = [
    [-dx, x0 - rect.x],
    [dx, rect.x + rect.w - x0],
    [-dy, y0 - rect.y],
    [dy, rect.y + rect.h - y0],
  ];

  for (
    const [p, q]
    of checks
  ) {
    if (
      Math.abs(p) <
      0.000001
    ) {
      if (q < 0) {
        return null;
      }

      continue;
    }

    const t = q / p;

    if (p < 0) {
      t0 =
        Math.max(t0, t);
    } else {
      t1 =
        Math.min(t1, t);
    }

    if (t0 > t1) {
      return null;
    }
  }

  return {
    t: t0,
    x:
      x0 +
      dx * t0,
    y:
      y0 +
      dy * t0,
  };
}

export class AnchorWeapon {
  constructor() {
    this.name = 'Anchor';

    this.orbitRadius = 44;

    this.projectileSpeed = 920;
    this.projectileLife = 2.6;
    this.projectileDamage = 8;
    this.fireCooldown = 0.78;
    this.fireTimer = 0;

    this.tetherSlack = 310;
    this.tetherSnapDistance = 820;
    this.tetherBaseDps = 4;
    this.tetherStretchDps = 0.05;
    this.tetherMaxDps = 28;
    this.snapBaseDamage = 18;

    this.surfacePull = 3100;
    this.surfaceArrivalDistance = 54;

    this.returnSpeed = 1450;
    this.returnArrivalDistance = 24;

    this.specialCooldown = 8;
    this.specialCooldownTimer =
      this.specialCooldown;

    this.reelDuration = 0.65;
    this.reelTimer = 0;

    this.projectile = null;
    this.anchor = null;
    this.returningTip = null;
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        ANCHOR_SPRITE_ASSET,
      );

    this.bodySprite =
      new WeaponSpriteRenderer(
        ANCHOR_BODY_ASSET,
      );

    this.tipSprite =
      new WeaponSpriteRenderer(
        ANCHOR_TIP_ASSET,
      );
  }

  reset() {
    this.fireTimer = 0;

    this.specialCooldownTimer =
      this.specialCooldown;

    this.reelTimer = 0;

    this.projectile = null;
    this.anchor = null;
    this.returningTip = null;

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

  getGunMuzzle(
    player,
    pointerWorld,
    artPixelSize,
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
          artPixelSize,
        );

    return {
      aim,
      muzzle,
    };
  }

  tipDetached() {
    return !!(
      this.projectile ||
      this.anchor ||
      this.returningTip
    );
  }

  fire(
    player,
    pointerWorld,
    artPixelSize,
  ) {
    if (
      this.tipDetached()
    ) {
      return false;
    }

    const {
      aim,
      muzzle,
    } =
      this.getGunMuzzle(
        player,
        pointerWorld,
        artPixelSize,
      );

    this.projectile = {
      x: muzzle.x,
      y: muzzle.y,
      prevX: muzzle.x,
      prevY: muzzle.y,
      vx:
        Math.cos(
          aim.angle,
        ) *
        this.projectileSpeed,
      vy:
        Math.sin(
          aim.angle,
        ) *
        this.projectileSpeed,
      angle:
        aim.angle,
      life:
        this.projectileLife,
      maxLife:
        this.projectileLife,
    };

    this.shotSerial++;
    return true;
  }

  surfaceHit(
    projectile,
    world,
  ) {
    const x0 =
      projectile.prevX;

    const y0 =
      projectile.prevY;

    const x1 =
      projectile.x;

    const y1 =
      projectile.y;

    let best = null;

    const consider = hit => {
      if (
        !hit ||
        hit.t < 0 ||
        hit.t > 1
      ) {
        return;
      }

      if (
        !best ||
        hit.t <
          best.t
      ) {
        best = hit;
      }
    };

    if (
      x1 <= 0 &&
      x0 > 0
    ) {
      const t =
        (0 - x0) /
        (x1 - x0);

      consider({
        t,
        x: 1,
        y:
          y0 +
          (y1 - y0) *
          t,
      });
    }

    if (
      x1 >= world.width &&
      x0 < world.width
    ) {
      const t =
        (
          world.width -
          x0
        ) /
        (x1 - x0);

      consider({
        t,
        x:
          world.width -
          1,
        y:
          y0 +
          (y1 - y0) *
          t,
      });
    }

    if (
      Number.isFinite(
        world.roofY,
      ) &&
      y1 <=
        world.roofY &&
      y0 >
        world.roofY
    ) {
      const t =
        (
          world.roofY -
          y0
        ) /
        (y1 - y0);

      consider({
        t,
        x:
          x0 +
          (x1 - x0) *
          t,
        y:
          world.roofY +
          1,
      });
    }

    if (
      y1 >=
        world.floorY &&
      y0 <
        world.floorY
    ) {
      const t =
        (
          world.floorY -
          y0
        ) /
        (y1 - y0);

      consider({
        t,
        x:
          x0 +
          (x1 - x0) *
          t,
        y:
          world.floorY -
          1,
      });
    }

    for (
      const rect
      of world.platforms ??
      []
    ) {
      consider(
        segmentRectIntersection(
          x0,
          y0,
          x1,
          y1,
          rect,
        ),
      );
    }

    return best;
  }

  attachBoss(
    target,
    x,
    y,
    angle,
  ) {
    this.anchor = {
      mode: 'boss',
      target,
      offsetX:
        x - target.x,
      offsetY:
        y - target.y,
      x,
      y,
      angle,
    };

    this.projectile = null;
  }

  attachSurface(
    x,
    y,
    angle,
  ) {
    this.anchor = {
      mode: 'surface',
      x,
      y,
      angle,
      target: null,
    };

    this.projectile = null;
  }

  anchorPosition() {
    if (!this.anchor) {
      return null;
    }

    if (
      this.anchor.mode ===
        'boss' &&
      this.anchor.target
    ) {
      this.anchor.x =
        this.anchor.target.x +
        this.anchor.offsetX;

      this.anchor.y =
        this.anchor.target.y +
        this.anchor.offsetY;
    }

    return this.anchor;
  }

  tension(
    player,
  ) {
    const anchor =
      this.anchorPosition();

    if (!anchor) {
      return {
        distance: 0,
        excess: 0,
        ratio: 0,
      };
    }

    const distance =
      Math.hypot(
        anchor.x -
          player.x,
        anchor.y -
          player.y,
      );

    const excess =
      Math.max(
        0,
        distance -
          this.tetherSlack,
      );

    return {
      distance,
      excess,
      ratio:
        clamp(
          excess /
            (
              this.tetherSnapDistance -
              this.tetherSlack
            ),
          0,
          1,
        ),
    };
  }

  beginReturn(
    x,
    y,
    angle = 0,
  ) {
    this.returningTip = {
      x,
      y,
      angle,
    };

    this.anchor = null;
    this.projectile = null;
    this.reelTimer = 0;
  }

  beginReturnFromCurrentTip() {
    if (this.anchor) {
      const anchor =
        this.anchorPosition();

      this.beginReturn(
        anchor.x,
        anchor.y,
        anchor.angle ?? 0,
      );

      return;
    }

    if (this.projectile) {
      this.beginReturn(
        this.projectile.x,
        this.projectile.y,
        this.projectile.angle,
      );
    }
  }

  triggerSpecial({
    player,
  } = {}) {
    if (
      this.specialCooldownTimer >
        0 ||
      !this.anchor ||
      !player ||
      this.anchor.mode !==
        'boss'
    ) {
      return false;
    }

    this.specialCooldownTimer =
      this.specialCooldown;

    this.reelTimer =
      this.reelDuration;

    if (
      this.anchor.target &&
      !this.anchor.target.dead
    ) {
      const tension =
        this.tension(
          player,
        );

      this.anchor.target
        .takeDamage?.(
          8 +
          tension.ratio *
            24,
        );
    }

    return true;
  }

  get specialAbilities() {
    return [{
      id: 'anchor-reel',
      name: 'tension reel',
      cooldown:
        this.specialCooldown,
      remaining:
        this.specialCooldownTimer,
      active:
        this.reelTimer > 0,
    }];
  }

  updateReturningTip(
    dt,
    player,
    pointerWorld,
    artPixelSize,
  ) {
    if (
      !this.returningTip
    ) {
      return;
    }

    const {
      muzzle,
    } =
      this.getGunMuzzle(
        player,
        pointerWorld,
        artPixelSize,
      );

    const dx =
      muzzle.x -
      this.returningTip.x;

    const dy =
      muzzle.y -
      this.returningTip.y;

    const distance =
      Math.max(
        0.0001,
        Math.hypot(
          dx,
          dy,
        ),
      );

    this.returningTip.angle =
      Math.atan2(
        dy,
        dx,
      );

    if (
      distance <=
        this.returnArrivalDistance
    ) {
      this.returningTip =
        null;

      return;
    }

    const step =
      Math.min(
        distance,
        this.returnSpeed *
          dt,
      );

    this.returningTip.x +=
      dx /
      distance *
      step;

    this.returningTip.y +=
      dy /
      distance *
      step;
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
  ) {
    this.fireTimer =
      Math.max(
        0,
        this.fireTimer -
        dt,
      );

    if (active) {
      this.specialCooldownTimer =
        Math.max(
          0,
          this.specialCooldownTimer -
            dt,
        );
    }

    this.reelTimer =
      Math.max(
        0,
        this.reelTimer -
          dt,
      );

    this.updateReturningTip(
      dt,
      player,
      pointerWorld,
      artPixelSize,
    );

    if (
      active &&
      firing &&
      this.fireTimer <=
        0 &&
      !this.tipDetached()
    ) {
      if (
        this.fire(
          player,
          pointerWorld,
          artPixelSize,
        )
      ) {
        this.fireTimer =
          this.fireCooldown;
      }
    }

    if (this.projectile) {
      const projectile =
        this.projectile;

      projectile.prevX =
        projectile.x;

      projectile.prevY =
        projectile.y;

      projectile.x +=
        projectile.vx *
        dt;

      projectile.y +=
        projectile.vy *
        dt;

      projectile.life -= dt;

      if (
        projectile.life >
          0 &&
        target &&
        !target.dead &&
        target.hitTest?.(
          projectile.x,
          projectile.y,
          6,
        )
      ) {
        target.takeDamage?.(
          this.projectileDamage,
        );

        this.attachBoss(
          target,
          projectile.x,
          projectile.y,
          projectile.angle,
        );
      } else if (
        projectile.life >
        0
      ) {
        const hit =
          this.surfaceHit(
            projectile,
            world,
          );

        if (hit) {
          this.attachSurface(
            hit.x,
            hit.y,
            projectile.angle,
          );
        }
      }

      if (
        this.projectile &&
        (
          projectile.life <=
            0 ||
          projectile.x <
            -120 ||
          projectile.x >
            world.width +
              120 ||
          projectile.y <
            -120 ||
          projectile.y >
            world.floorY +
              180
        )
      ) {
        this.beginReturn(
          projectile.x,
          projectile.y,
          projectile.angle,
        );
      }
    }

    const anchor =
      this.anchorPosition();

    if (
      anchor &&
      anchor.mode ===
        'surface'
    ) {
      const dx =
        anchor.x -
        player.x;

      const dy =
        anchor.y -
        player.y;

      const distance =
        Math.max(
          0.0001,
          Math.hypot(
            dx,
            dy,
          ),
        );

      if (
        distance <=
        this.surfaceArrivalDistance
      ) {
        this.beginReturn(
          anchor.x,
          anchor.y,
          anchor.angle,
        );
      } else {
        player.vx +=
          dx /
          distance *
          this.surfacePull *
          dt;

        player.vy +=
          dy /
          distance *
          this.surfacePull *
          dt;
      }
    }

    if (
      anchor &&
      anchor.mode ===
        'boss'
    ) {
      if (
        !anchor.target ||
        anchor.target.dead
      ) {
        this.beginReturn(
          anchor.x,
          anchor.y,
          anchor.angle,
        );
      } else {
        const tension =
          this.tension(
            player,
          );

        if (
          tension.excess >
          0
        ) {
          const dps =
            Math.min(
              this.tetherMaxDps,
              this.tetherBaseDps +
                tension.excess *
                  this.tetherStretchDps,
            );

          anchor.target
            .takeDamage?.(
              dps *
              dt,
            );
        }

        if (
          tension.distance >=
          this.tetherSnapDistance
        ) {
          anchor.target
            .takeDamage?.(
              this.snapBaseDamage +
              tension.ratio *
                12,
            );

          this.beginReturn(
            anchor.x,
            anchor.y,
            anchor.angle,
          );
        }
      }
    }

    if (
      this.reelTimer > 0 &&
      this.anchor?.mode ===
        'boss'
    ) {
      const position =
        this.anchorPosition();

      const dx =
        position.x -
        player.x;

      const dy =
        position.y -
        player.y;

      const distance =
        Math.max(
          1,
          Math.hypot(
            dx,
            dy,
          ),
        );

      player.vx +=
        dx /
        distance *
        1500 *
        dt;

      player.vy +=
        dy /
        distance *
        1500 *
        dt;
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

  drawTip(
    ctx,
    x,
    y,
    angle,
    cameraX,
    artPixelSize,
    glowStrength = 1.2,
  ) {
    this.tipSprite.draw(
      ctx,
      x -
        cameraX,
      y,
      angle,
      artPixelSize,
      {
        glowStrength,
      },
    );
  }

  draw(
    ctx,
    player,
    pointerWorld,
    cameraX,
    artPixelSize,
    active = true,
  ) {
    const anchor =
      this.anchorPosition();

    const tip =
      this.projectile ??
      anchor ??
      this.returningTip;

    if (tip) {
      ctx.save();

      const tension =
        anchor
          ? this.tension(
              player,
            )
          : {
              ratio: 0,
            };

      ctx.globalAlpha =
        0.52 +
        0.4 *
        tension.ratio;

      ctx.strokeStyle =
        tension.ratio >
        0.7
          ? '#ff6b6b'
          : '#d7dbe2';

      ctx.lineWidth =
        2 +
        3 *
        tension.ratio;

      ctx.beginPath();

      ctx.moveTo(
        player.x -
          cameraX,
        player.y,
      );

      ctx.lineTo(
        tip.x -
          cameraX,
        tip.y,
      );

      ctx.stroke();
      ctx.restore();

      this.drawTip(
        ctx,
        tip.x,
        tip.y,
        tip.angle ?? 0,
        cameraX,
        artPixelSize,
        anchor?.mode ===
          'boss'
          ? 1.45
          : 1.2,
      );
    }

    if (!active) {
      return;
    }

    const aim =
      this.getAim(
        player,
        pointerWorld,
      );

    if (
      this.tipDetached()
    ) {
      this.bodySprite.draw(
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
    } else {
      this.sprite.draw(
        ctx,
        aim.x -
          cameraX,
        aim.y,
        aim.angle,
        artPixelSize,
        {
          glowStrength:
            this.reelTimer >
            0
              ? 1.35
              : 1,
        },
      );
    }
  }
}
