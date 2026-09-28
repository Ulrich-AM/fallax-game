import {
  WeaponSpriteRenderer,
  drawRasterAtPivot,
} from './WeaponSpriteRenderer.js?v=59';

const PARALLAX_PARTS = {
  bottom: {
    id: 'polygon-3',
    name: 'polygon-3',
    type: 'polygon',
    material: 'glow-white',
    groupId: null,
    x: 3,
    y: -1,
    rotation: 0,
    outline: null,
    points: [
      [0, 4],
      [1, 3],
      [3, 3],
      [4, 4],
      [12, 4],
      [12, 6],
      [4, 6],
      [3, 7],
      [1, 7],
      [0, 6],
    ],
  },
  top: {
    id: 'polygon-mirror-4',
    name: 'polygon-3 mirror',
    type: 'polygon',
    material: 'glow-white',
    groupId: null,
    x: 3,
    y: 1,
    rotation: 0,
    outline: null,
    points: [
      [0, -6],
      [1, -7],
      [3, -7],
      [4, -6],
      [12, -6],
      [12, -4],
      [4, -4],
      [3, -3],
      [1, -3],
      [0, -4],
    ],
  },
  base: {
    id: 'part-3',
    name: 'polygon-3 copy',
    type: 'polygon',
    material: 'gray',
    groupId: null,
    x: 0,
    y: -5,
    rotation: 0,
    outline: null,
    points: [
      [0, 4],
      [1, 3],
      [3, 3],
      [4, 4],
      [12, 4],
      [12, 6],
      [4, 6],
      [3, 7],
      [1, 7],
      [0, 6],
    ],
  },
};

function clone(value) {
  return JSON.parse(
    JSON.stringify(value),
  );
}

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
      parts.map(clone),
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
    markers: {},
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

const PARALLAX_SPRITE_ASSET =
  makeAsset(
    'parallax',
    [
      PARALLAX_PARTS.bottom,
      PARALLAX_PARTS.top,
      PARALLAX_PARTS.base,
    ],
  );

const PARALLAX_BASE_ASSET =
  makeAsset(
    'parallax-base',
    [
      PARALLAX_PARTS.base,
    ],
  );

const PARALLAX_TOP_ASSET =
  makeAsset(
    'parallax-top',
    [
      PARALLAX_PARTS.top,
    ],
  );

const PARALLAX_BOTTOM_ASSET =
  makeAsset(
    'parallax-bottom',
    [
      PARALLAX_PARTS.bottom,
    ],
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

function localToWorld(
  pivotX,
  pivotY,
  localX,
  localY,
  angle,
  artPixelSize,
) {
  const c =
    Math.cos(angle);

  const s =
    Math.sin(angle);

  const x =
    localX *
    artPixelSize;

  const y =
    localY *
    artPixelSize;

  return {
    x:
      pivotX +
      x * c -
      y * s,
    y:
      pivotY +
      x * s +
      y * c,
  };
}

export class ParallaxWeapon {
  constructor() {
    this.name = 'Parallax';

    this.orbitRadius = 44;
    this.damage = 5.2;
    this.bulletSpeed = 940;
    this.bulletLife = 2.2;
    this.bulletSize = 10;

    this.fireCooldown = 0.46;
    this.fireTimer = 0;

    this.specialCooldown = 13;
    this.specialCooldownTimer =
      this.specialCooldown;

    this.specialDuration = 4;
    this.specialActiveTimer = 0;

    this.visualTime = 0;
    this.ghostFloatDistance = 1.15;
    this.ghostAlpha = 0.36;
    this.specialGhostAlpha = 0.58;

    this.bullets = [];
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        PARALLAX_SPRITE_ASSET,
      );

    this.baseSprite =
      new WeaponSpriteRenderer(
        PARALLAX_BASE_ASSET,
      );

    this.topSprite =
      new WeaponSpriteRenderer(
        PARALLAX_TOP_ASSET,
      );

    this.bottomSprite =
      new WeaponSpriteRenderer(
        PARALLAX_BOTTOM_ASSET,
      );
  }

  reset() {
    this.fireTimer = 0;
    this.specialCooldownTimer =
      this.specialCooldown;

    this.specialActiveTimer = 0;
    this.visualTime = 0;
    this.bullets.length = 0;
    this.shotSerial = 0;
  }

  getAim(
    player,
    pointerWorld,
  ) {
    const dx =
      pointerWorld.x - player.x;

    const dy =
      pointerWorld.y - player.y;

    const angle =
      Math.atan2(dy, dx);

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

  ghostOffsetUnits() {
    const wave =
      (
        Math.sin(
          this.visualTime *
          Math.PI *
          2 /
          1.9,
        ) +
        1
      ) *
      0.5;

    return (
      wave *
      this.ghostFloatDistance
    );
  }

  getGunPivots(
    aim,
    artPixelSize,
  ) {
    const extra =
      this.ghostOffsetUnits();

    const localShift =
      extra *
      artPixelSize;

    const nx =
      -Math.sin(
        aim.angle,
      );

    const ny =
      Math.cos(
        aim.angle,
      );

    return {
      base: {
        x: aim.x,
        y: aim.y,
      },
      top: {
        x:
          aim.x -
          nx *
          localShift,
        y:
          aim.y -
          ny *
          localShift,
      },
      bottom: {
        x:
          aim.x +
          nx *
          localShift,
        y:
          aim.y +
          ny *
          localShift,
      },
      extra,
    };
  }

  triggerSpecial() {
    if (
      this.specialCooldownTimer > 0
    ) {
      return false;
    }

    this.specialCooldownTimer =
      this.specialCooldown;

    this.specialActiveTimer =
      this.specialDuration;

    return true;
  }

  get specialAbilities() {
    return [{
      id: 'parallax-convergence',
      name: 'convergence',
      cooldown:
        this.specialCooldown,
      remaining:
        this.specialCooldownTimer,
      active:
        this.specialActiveTimer > 0,
    }];
  }

  fire(
    player,
    pointerWorld,
    artPixelSize,
  ) {
    const aim =
      this.getAim(
        player,
        pointerWorld,
      );

    const pivots =
      this.getGunPivots(
        aim,
        artPixelSize,
      );

    // The source file has no markers. These are estimated from the visible
    // front edges of each polygon: base x=12, side copies x=15.
    const muzzles = [
      {
        id: 'top',
        alpha: 0.68,
        point:
          localToWorld(
            pivots.top.x,
            pivots.top.y,
            15,
            -4,
            aim.angle,
            artPixelSize,
          ),
      },
      {
        id: 'base',
        alpha: 1,
        point:
          localToWorld(
            pivots.base.x,
            pivots.base.y,
            12,
            0,
            aim.angle,
            artPixelSize,
          ),
      },
      {
        id: 'bottom',
        alpha: 0.68,
        point:
          localToWorld(
            pivots.bottom.x,
            pivots.bottom.y,
            15,
            4,
            aim.angle,
            artPixelSize,
          ),
      },
    ];

    const converging =
      this.specialActiveTimer > 0;

    for (
      const muzzle
      of muzzles
    ) {
      let shotAngle =
        aim.angle;

      if (
        converging &&
        muzzle.id !== 'base'
      ) {
        shotAngle =
          Math.atan2(
            pointerWorld.y -
              muzzle.point.y,
            pointerWorld.x -
              muzzle.point.x,
          );
      }

      this.bullets.push({
        x:
          muzzle.point.x,
        y:
          muzzle.point.y,
        vx:
          Math.cos(
            shotAngle,
          ) *
          this.bulletSpeed,
        vy:
          Math.sin(
            shotAngle,
          ) *
          this.bulletSpeed,
        life:
          this.bulletLife,
        maxLife:
          this.bulletLife,
        damage:
          this.damage,
        alpha:
          muzzle.alpha,
      });
    }

    this.shotSerial++;
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

    this.specialActiveTimer =
      Math.max(
        0,
        this.specialActiveTimer -
        dt,
      );

    this.visualTime += dt;

    if (
      active &&
      firing &&
      this.fireTimer <= 0
    ) {
      this.fire(
        player,
        pointerWorld,
        artPixelSize,
      );

      this.fireTimer =
        this.fireCooldown;
    }

    for (
      const bullet
      of this.bullets
    ) {
      bullet.x +=
        bullet.vx * dt;

      bullet.y +=
        bullet.vy * dt;

      bullet.life -= dt;

      if (
        bullet.life <= 0
      ) {
        continue;
      }

      const hitProjectile =
        target
          ?.damageProjectileAt?.(
            bullet.x,
            bullet.y,
            this.bulletSize *
              0.5,
            bullet.damage,
          );

      if (hitProjectile) {
        bullet.life = 0;
        continue;
      }

      if (
        target &&
        !target.dead &&
        target.hitTest?.(
          bullet.x,
          bullet.y,
          this.bulletSize *
            0.5,
        )
      ) {
        target.takeDamage?.(
          bullet.damage,
        );

        bullet.life = 0;
      }
    }

    this.bullets =
      this.bullets.filter(
        bullet =>
          bullet.life > 0 &&
          bullet.x > -120 &&
          bullet.x <
            world.width + 120 &&
          bullet.y > -120 &&
          bullet.y <
            world.floorY + 180,
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

  drawRenderer(
    renderer,
    ctx,
    pivot,
    angle,
    artPixelSize,
    alpha,
    glowStrength,
  ) {
    const entry =
      renderer.getEntry(
        angle,
      );

    for (
      const glow
      of entry.glows ?? []
    ) {
      drawRasterAtPivot(
        ctx,
        glow.raster,
        pivot.x,
        pivot.y,
        artPixelSize,
        {
          alpha:
            alpha *
            0.62 *
            glowStrength,
          shadowColor:
            glow.color,
          shadowBlur:
            clamp(
              glow.radius *
              glowStrength,
              4,
              36,
            ),
        },
      );
    }

    drawRasterAtPivot(
      ctx,
      entry.base,
      pivot.x,
      pivot.y,
      artPixelSize,
      {
        alpha,
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
    for (
      const bullet
      of this.bullets
    ) {
      const fade =
        clamp(
          bullet.life /
          bullet.maxLife,
          0,
          1,
        );

      ctx.save();
      ctx.globalAlpha =
        fade *
        bullet.alpha;

      ctx.fillStyle =
        '#e5e7eb';

      ctx.fillRect(
        Math.round(
          bullet.x -
          cameraX -
          this.bulletSize /
          2,
        ),
        Math.round(
          bullet.y -
          this.bulletSize /
          2,
        ),
        this.bulletSize,
        this.bulletSize,
      );

      ctx.restore();
    }

    if (!active) return;

    const aim =
      this.getAim(
        player,
        pointerWorld,
      );

    const pivots =
      this.getGunPivots(
        aim,
        artPixelSize,
      );

    const special =
      this.specialActiveTimer > 0;

    const ghostAlpha =
      special
        ? this.specialGhostAlpha
        : this.ghostAlpha;

    const topPivot = {
      x:
        pivots.top.x -
        cameraX,
      y:
        pivots.top.y,
    };

    const bottomPivot = {
      x:
        pivots.bottom.x -
        cameraX,
      y:
        pivots.bottom.y,
    };

    const basePivot = {
      x:
        pivots.base.x -
        cameraX,
      y:
        pivots.base.y,
    };

    this.drawRenderer(
      this.topSprite,
      ctx,
      topPivot,
      aim.angle,
      artPixelSize,
      ghostAlpha,
      special ? 1.25 : 0.85,
    );

    this.drawRenderer(
      this.bottomSprite,
      ctx,
      bottomPivot,
      aim.angle,
      artPixelSize,
      ghostAlpha,
      special ? 1.25 : 0.85,
    );

    this.drawRenderer(
      this.baseSprite,
      ctx,
      basePivot,
      aim.angle,
      artPixelSize,
      1,
      0.25,
    );
  }
}
