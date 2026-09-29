import {
  WeaponSpriteRenderer,
  drawRasterAtPivot,
} from './WeaponSpriteRenderer.js?v=63a';

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
    this.focusBonusDamage = 9;
    this.specialFocusBonusDamage = 16;
    this.focusRadius = 115;
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
    this.specialVisual = 0;

    this.specialBeamDps = 4;
    this.specialBeamRadius = 8;
    this.specialFocusDps = 60;
    this.specialFocusRadius = 48;

    this.visualTime = 0;
    this.baseGhostFloatDistance = 7;
    this.specialGhostSpread = 28;
    this.ghostAlpha = 0.36;
    this.specialGhostAlpha = 0.72;

    this.bullets = [];
    this.volleys = new Map();
    this.focusFlashes = [];
    this.nextVolleyId = 1;
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
    this.specialVisual = 0;
    this.visualTime = 0;
    this.bullets.length = 0;
    this.volleys.clear();
    this.focusFlashes.length = 0;
    this.nextVolleyId = 1;
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

  ghostOffsetUnits(
    player,
    pointerWorld,
  ) {
    const distance =
      Math.hypot(
        pointerWorld.x -
          player.x,
        pointerWorld.y -
          player.y,
      );

    const distanceFactor =
      clamp(
        (
          distance - 220
        ) /
        1180,
        0,
        1,
      );

    return (
      distanceFactor *
        this.baseGhostFloatDistance +
      this.specialVisual *
        this.specialGhostSpread
    );
  }

  getGunPivots(
    aim,
    artPixelSize,
    player,
    pointerWorld,
  ) {
    const extra =
      this.ghostOffsetUnits(
        player,
        pointerWorld,
      );

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

  getMuzzles(
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
        player,
        pointerWorld,
      );

    return {
      aim,
      pivots,
      muzzles: [
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
      ],
    };
  }

  pointSegmentDistance(
    px,
    py,
    ax,
    ay,
    bx,
    by,
  ) {
    const dx = bx - ax;
    const dy = by - ay;

    const lengthSq =
      dx * dx +
      dy * dy;

    if (
      lengthSq <=
      0.000001
    ) {
      return {
        x: ax,
        y: ay,
        distance:
          Math.hypot(
            px - ax,
            py - ay,
          ),
      };
    }

    const t =
      clamp(
        (
          (px - ax) *
            dx +
          (py - ay) *
            dy
        ) /
        lengthSq,
        0,
        1,
      );

    const x =
      ax + dx * t;

    const y =
      ay + dy * t;

    return {
      x,
      y,
      distance:
        Math.hypot(
          px - x,
          py - y,
        ),
    };
  }

  applySpecialLaserDamage(
    dt,
    player,
    pointerWorld,
    target,
    artPixelSize,
  ) {
    if (
      this.specialActiveTimer <=
        0 ||
      !target ||
      target.dead
    ) {
      return;
    }

    const {
      muzzles,
    } =
      this.getMuzzles(
        player,
        pointerWorld,
        artPixelSize,
      );

    for (
      const muzzle
      of muzzles
    ) {
      const nearest =
        this.pointSegmentDistance(
          target.x,
          target.y,
          muzzle.point.x,
          muzzle.point.y,
          pointerWorld.x,
          pointerWorld.y,
        );

      if (
        target.hitTest?.(
          nearest.x,
          nearest.y,
          this.specialBeamRadius,
        )
      ) {
        target.takeDamage?.(
          this.specialBeamDps *
          dt,
        );
      }

      const length =
        Math.max(
          1,
          Math.hypot(
            pointerWorld.x -
              muzzle.point.x,
            pointerWorld.y -
              muzzle.point.y,
          ),
        );

      target.damageProjectilesAlongRay?.(
        muzzle.point.x,
        muzzle.point.y,
        (
          pointerWorld.x -
          muzzle.point.x
        ) /
        length,
        (
          pointerWorld.y -
          muzzle.point.y
        ) /
        length,
        length,
        this.specialBeamRadius,
        this.specialBeamDps *
          dt,
      );
    }

    if (
      target.hitTest?.(
        pointerWorld.x,
        pointerWorld.y,
        this.specialFocusRadius,
      )
    ) {
      target.takeDamage?.(
        this.specialFocusDps *
        dt,
      );
    }
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
      id: 'parallax-perspective-collapse',
      name: 'focal collapse',
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
    const {
      aim,
      muzzles,
    } =
      this.getMuzzles(
        player,
        pointerWorld,
        artPixelSize,
      );

    const volleyId =
      this.nextVolleyId++;

    this.volleys.set(
      volleyId,
      {
        hits: 0,
        focusHits: 0,
        special: false,
        life: 2.8,
      },
    );

    for (
      const muzzle
      of muzzles
    ) {
      const shotAngle =
        Math.atan2(
          pointerWorld.y -
            muzzle.point.y,
          pointerWorld.x -
            muzzle.point.x,
        );

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
        volleyId,
        focusX:
          pointerWorld.x,
        focusY:
          pointerWorld.y,
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

    const specialTarget =
      this.specialActiveTimer > 0
        ? 1
        : 0;

    const specialBlend =
      1 -
      Math.exp(
        -8 * dt,
      );

    this.specialVisual +=
      (
        specialTarget -
        this.specialVisual
      ) *
      specialBlend;

    this.visualTime += dt;

    for (
      const volley
      of this.volleys.values()
    ) {
      volley.life -= dt;
    }

    for (
      const [id, volley]
      of this.volleys
    ) {
      if (volley.life <= 0) {
        this.volleys.delete(id);
      }
    }

    for (
      const flash
      of this.focusFlashes
    ) {
      flash.life -= dt;
    }

    this.focusFlashes =
      this.focusFlashes.filter(
        flash =>
          flash.life > 0,
      );

    if (
      active &&
      firing &&
      this.fireTimer <= 0 &&
      this.specialActiveTimer <= 0
    ) {
      this.fire(
        player,
        pointerWorld,
        artPixelSize,
      );

      this.fireTimer =
        this.fireCooldown;
    }

    if (active) {
      this.applySpecialLaserDamage(
        dt,
        player,
        pointerWorld,
        target,
        artPixelSize,
      );
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

        const volley =
          this.volleys.get(
            bullet.volleyId,
          );

        if (volley) {
          volley.hits++;

          const focusDistance =
            Math.hypot(
              bullet.x -
                bullet.focusX,
              bullet.y -
                bullet.focusY,
            );

          if (
            focusDistance <=
            this.focusRadius
          ) {
            volley.focusHits++;
          }

          if (
            volley.focusHits >= 3 &&
            !volley.focusAwarded
          ) {
            volley.focusAwarded =
              true;

            target.takeDamage?.(
              this.focusBonusDamage,
            );

            this.focusFlashes.push({
              x:
                bullet.focusX,
              y:
                bullet.focusY,
              life: 0.18,
              maxLife: 0.18,
              special: false,
            });
          }
        }

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
          bullet.y > world.roofY - 180 &&
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
        player,
        pointerWorld,
      );

    const special =
      this.specialVisual > 0.02;

    const ghostAlpha =
      this.ghostAlpha +
      (
        this.specialGhostAlpha -
        this.ghostAlpha
      ) *
      this.specialVisual;

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

    if (
      this.specialVisual > 0.02
    ) {
      const {
        muzzles,
      } =
        this.getMuzzles(
          player,
          pointerWorld,
          artPixelSize,
        );

      ctx.save();

      for (
        const muzzle
        of muzzles
      ) {
        const sx =
          muzzle.point.x -
          cameraX;

        const sy =
          muzzle.point.y;

        const fx =
          pointerWorld.x -
          cameraX;

        const fy =
          pointerWorld.y;

        ctx.globalAlpha =
          0.22 *
          this.specialVisual;

        ctx.strokeStyle =
          '#ffffff';

        ctx.lineWidth =
          12 *
          this.specialVisual;

        ctx.shadowColor =
          '#ffffff';

        ctx.shadowBlur =
          18 *
          this.specialVisual;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        ctx.globalAlpha =
          0.88 *
          this.specialVisual;

        ctx.lineWidth =
          3 +
          2 *
          this.specialVisual;

        ctx.shadowBlur =
          8 *
          this.specialVisual;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(fx, fy);
        ctx.stroke();
      }

      const pulse =
        1 +
        0.16 *
        Math.sin(
          this.visualTime *
          13,
        );

      const radius =
        (
          22 +
          10 *
          this.specialVisual
        ) *
        pulse;

      const fx =
        pointerWorld.x -
        cameraX;

      const fy =
        pointerWorld.y;

      ctx.globalAlpha =
        0.2 *
        this.specialVisual;

      ctx.fillStyle =
        '#ffffff';

      ctx.shadowColor =
        '#ffffff';

      ctx.shadowBlur =
        36 *
        this.specialVisual;

      ctx.beginPath();
      ctx.arc(
        fx,
        fy,
        radius * 1.65,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.globalAlpha =
        0.95 *
        this.specialVisual;

      ctx.shadowBlur =
        24 *
        this.specialVisual;

      ctx.beginPath();
      ctx.arc(
        fx,
        fy,
        radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.globalAlpha =
        this.specialVisual;

      ctx.shadowBlur = 0;
      ctx.fillStyle =
        '#ffffff';

      ctx.fillRect(
        Math.round(fx - 4),
        Math.round(fy - 4),
        8,
        8,
      );

      ctx.restore();
    }

    for (
      const flash
      of this.focusFlashes
    ) {
      const t =
        clamp(
          flash.life /
          flash.maxLife,
          0,
          1,
        );

      const size =
        (
          flash.special
            ? 34
            : 24
        ) *
        (
          1 +
          (1 - t) * 0.7
        );

      ctx.save();
      ctx.globalAlpha = t;
      ctx.strokeStyle =
        '#ffffff';
      ctx.lineWidth =
        flash.special
          ? 6
          : 4;

      ctx.strokeRect(
        flash.x -
          cameraX -
          size / 2,
        flash.y -
          size / 2,
        size,
        size,
      );

      ctx.restore();
    }

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
