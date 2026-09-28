import {
  WeaponSpriteRenderer,
  drawRasterAtPivot,
} from './WeaponSpriteRenderer.js?v=59';

const RELAY_SPRITE_ASSET = {
  version: 2,
  name: 'relay',
  displayName: 'relay',
  type: 'weapon',
  scale: 1,
  pivot: [0, 0],
  parts: [
    {
      id: 'polygon-3',
      name: 'polygon-3',
      type: 'polygon',
      material: 'glow-white',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [3, 0],
        [4, -1],
        [8, -1],
        [9, 0],
      ],
    },
    {
      id: 'polygon-mirror-4',
      name: 'polygon-3 mirror',
      type: 'polygon',
      material: 'glow-white',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [9, 0],
        [8, 1],
        [4, 1],
        [3, 0],
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
        [2, 0],
        [2, -2],
        [4, -3],
        [13, -3],
        [13, -4],
        [3, -4],
        [1, -3],
        [0, 0],
      ],
    },
    {
      id: 'polygon-mirror-5',
      name: 'polygon-4 mirror',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [0, 0],
        [1, 3],
        [3, 4],
        [13, 4],
        [13, 3],
        [4, 3],
        [2, 2],
        [2, 0],
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

function clamp(value, min, max) {
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

  let tMin = 0;
  let tMax = 1;

  const checks = [
    [-dx, x0 - rect.x],
    [dx, rect.x + rect.w - x0],
    [-dy, y0 - rect.y],
    [dy, rect.y + rect.h - y0],
  ];

  for (const [p, q] of checks) {
    if (Math.abs(p) < 0.000001) {
      if (q < 0) return null;
      continue;
    }

    const t = q / p;

    if (p < 0) {
      tMin = Math.max(tMin, t);
    } else {
      tMax = Math.min(tMax, t);
    }

    if (tMin > tMax) {
      return null;
    }
  }

  return {
    t: tMin,
    x: x0 + dx * tMin,
    y: y0 + dy * tMin,
  };
}

function pointSegmentDistance(
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

  if (lengthSq <= 0.000001) {
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
        (px - ax) * dx +
        (py - ay) * dy
      ) /
      lengthSq,
      0,
      1,
    );

  const x = ax + dx * t;
  const y = ay + dy * t;

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

export class RelayWeapon {
  constructor() {
    this.name = 'Relay';

    this.orbitRadius = 43;
    this.projectileSpeed = 980;
    this.projectileLife = 2.8;
    this.projectileDamage = 7;
    this.fireCooldown = 0.34;
    this.fireTimer = 0;

    this.maxNodes = 7;
    this.nodeLifetime = 18;
    this.nodeSize = 12;
    this.nextNodeId = 1;

    this.linkDamagePerSecond = 13;
    this.linkRadius = 6;

    this.specialCooldown = 14;
    this.specialCooldownTimer =
      this.specialCooldown;

    this.overloadDuration = 3;
    this.overloadTimer = 0;
    this.overloadMultiplier = 3;

    this.projectiles = [];
    this.nodes = [];
    this.links = [];
    this.shotSerial = 0;

    this.sprite =
      new WeaponSpriteRenderer(
        RELAY_SPRITE_ASSET,
      );
  }

  reset() {
    this.fireTimer = 0;
    this.specialCooldownTimer =
      this.specialCooldown;

    this.overloadTimer = 0;
    this.projectiles.length = 0;
    this.nodes.length = 0;
    this.links.length = 0;
    this.nextNodeId = 1;
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

  triggerSpecial() {
    if (
      this.specialCooldownTimer > 0 ||
      this.links.length === 0
    ) {
      return false;
    }

    this.specialCooldownTimer =
      this.specialCooldown;

    this.overloadTimer =
      this.overloadDuration;

    return true;
  }

  get specialAbilities() {
    return [{
      id: 'relay-overload',
      name: 'overload',
      cooldown:
        this.specialCooldown,
      remaining:
        this.specialCooldownTimer,
      active:
        this.overloadTimer > 0,
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

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          aim.angle,
          artPixelSize,
        );

    this.projectiles.push({
      x: muzzle.x,
      y: muzzle.y,
      prevX: muzzle.x,
      prevY: muzzle.y,
      vx:
        Math.cos(aim.angle) *
        this.projectileSpeed,
      vy:
        Math.sin(aim.angle) *
        this.projectileSpeed,
      life:
        this.projectileLife,
      maxLife:
        this.projectileLife,
    });

    this.shotSerial++;
  }

  findSurfaceHit(
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
        hit.t < best.t
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
          (y1 - y0) * t,
      });
    }

    if (
      x1 >= world.width &&
      x0 < world.width
    ) {
      const t =
        (
          world.width - x0
        ) /
        (x1 - x0);

      consider({
        t,
        x:
          world.width - 1,
        y:
          y0 +
          (y1 - y0) * t,
      });
    }

    if (
      y1 >= world.floorY &&
      y0 < world.floorY
    ) {
      const t =
        (
          world.floorY - y0
        ) /
        (y1 - y0);

      consider({
        t,
        x:
          x0 +
          (x1 - x0) * t,
        y:
          world.floorY - 1,
      });
    }

    for (
      const platform
      of world.platforms ?? []
    ) {
      const hit =
        segmentRectIntersection(
          x0,
          y0,
          x1,
          y1,
          platform,
        );

      if (!hit) continue;

      const epsilon = 1.5;
      const distances = [
        {
          d:
            Math.abs(
              hit.x -
              platform.x,
            ),
          x:
            platform.x -
            epsilon,
          y: hit.y,
        },
        {
          d:
            Math.abs(
              hit.x -
              (
                platform.x +
                platform.w
              ),
            ),
          x:
            platform.x +
            platform.w +
            epsilon,
          y: hit.y,
        },
        {
          d:
            Math.abs(
              hit.y -
              platform.y,
            ),
          x: hit.x,
          y:
            platform.y -
            epsilon,
        },
        {
          d:
            Math.abs(
              hit.y -
              (
                platform.y +
                platform.h
              ),
            ),
          x: hit.x,
          y:
            platform.y +
            platform.h +
            epsilon,
        },
      ];

      distances.sort(
        (a, b) =>
          a.d - b.d,
      );

      consider({
        t: hit.t,
        x: distances[0].x,
        y: distances[0].y,
      });
    }

    return best;
  }

  placeNode(
    x,
    y,
  ) {
    const previous =
      this.nodes[
        this.nodes.length - 1
      ] ?? null;

    const node = {
      id:
        this.nextNodeId++,
      x,
      y,
      life:
        this.nodeLifetime,
      maxLife:
        this.nodeLifetime,
    };

    this.nodes.push(node);

    if (previous) {
      this.links.push({
        aId:
          previous.id,
        bId:
          node.id,
      });
    }

    while (
      this.nodes.length >
      this.maxNodes
    ) {
      const removed =
        this.nodes.shift();

      this.links =
        this.links.filter(
          link =>
            link.aId !==
              removed.id &&
            link.bId !==
              removed.id,
        );
    }
  }

  getNodeById(id) {
    return (
      this.nodes.find(
        node =>
          node.id === id,
      ) ??
      null
    );
  }

  updateProjectiles(
    dt,
    world,
    target,
  ) {
    for (
      const projectile
      of this.projectiles
    ) {
      projectile.prevX =
        projectile.x;

      projectile.prevY =
        projectile.y;

      projectile.x +=
        projectile.vx * dt;

      projectile.y +=
        projectile.vy * dt;

      projectile.life -= dt;

      if (
        projectile.life <= 0
      ) {
        continue;
      }

      if (
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

        projectile.life = 0;
        continue;
      }

      const surface =
        this.findSurfaceHit(
          projectile,
          world,
        );

      if (surface) {
        this.placeNode(
          surface.x,
          surface.y,
        );

        projectile.life = 0;
      }
    }

    this.projectiles =
      this.projectiles.filter(
        projectile =>
          projectile.life > 0 &&
          projectile.x > -120 &&
          projectile.x <
            world.width + 120 &&
          projectile.y > -120 &&
          projectile.y <
            world.floorY + 180,
      );
  }

  updateNodes(dt) {
    for (
      const node
      of this.nodes
    ) {
      node.life -= dt;
    }

    const aliveIds =
      new Set(
        this.nodes
          .filter(
            node =>
              node.life > 0,
          )
          .map(
            node =>
              node.id,
          ),
      );

    this.nodes =
      this.nodes.filter(
        node =>
          node.life > 0,
      );

    this.links =
      this.links.filter(
        link =>
          aliveIds.has(
            link.aId,
          ) &&
          aliveIds.has(
            link.bId,
          ),
      );
  }

  damageTargetWithLinks(
    dt,
    target,
  ) {
    if (
      !target ||
      target.dead ||
      this.links.length === 0
    ) {
      return;
    }

    const damageMultiplier =
      this.overloadTimer > 0
        ? this.overloadMultiplier
        : 1;

    for (
      const link
      of this.links
    ) {
      const a =
        this.getNodeById(
          link.aId,
        );

      const b =
        this.getNodeById(
          link.bId,
        );

      if (!a || !b) continue;

      const closest =
        pointSegmentDistance(
          target.x,
          target.y,
          a.x,
          a.y,
          b.x,
          b.y,
        );

      const bodyRadius =
        target.halfSize ??
        target.hitRadius ??
        Math.max(
          20,
          Math.max(
            target.w ?? 0,
            target.h ?? 0,
          ) *
          0.5,
        );

      const hitRadius =
        bodyRadius +
        this.linkRadius;

      if (
        closest.distance <=
        hitRadius
      ) {
        target.takeDamage?.(
          this.linkDamagePerSecond *
          damageMultiplier *
          dt,
        );
      }

      target.damageProjectilesAlongRay?.(
        a.x,
        a.y,
        (
          b.x - a.x
        ) /
        Math.max(
          1,
          Math.hypot(
            b.x - a.x,
            b.y - a.y,
          ),
        ),
        (
          b.y - a.y
        ) /
        Math.max(
          1,
          Math.hypot(
            b.x - a.x,
            b.y - a.y,
          ),
        ),
        Math.hypot(
          b.x - a.x,
          b.y - a.y,
        ),
        this.linkRadius,
        this.linkDamagePerSecond *
          damageMultiplier *
          dt,
      );
    }
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

    this.overloadTimer =
      Math.max(
        0,
        this.overloadTimer -
        dt,
      );

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

    this.updateProjectiles(
      dt,
      world,
      target,
    );

    this.updateNodes(dt);

    this.damageTargetWithLinks(
      dt,
      target,
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

  draw(
    ctx,
    player,
    pointerWorld,
    cameraX,
    artPixelSize,
    active = true,
  ) {
    const overloaded =
      this.overloadTimer > 0;

    ctx.save();

    for (
      const link
      of this.links
    ) {
      const a =
        this.getNodeById(
          link.aId,
        );

      const b =
        this.getNodeById(
          link.bId,
        );

      if (!a || !b) continue;

      ctx.globalAlpha =
        overloaded
          ? 0.95
          : 0.42;

      ctx.strokeStyle =
        '#ffffff';

      ctx.lineWidth =
        overloaded
          ? 6
          : 3;

      ctx.shadowColor =
        '#ffffff';

      ctx.shadowBlur =
        overloaded
          ? 22
          : 7;

      ctx.beginPath();
      ctx.moveTo(
        Math.round(
          a.x - cameraX,
        ),
        Math.round(a.y),
      );

      ctx.lineTo(
        Math.round(
          b.x - cameraX,
        ),
        Math.round(b.y),
      );

      ctx.stroke();
    }

    ctx.restore();

    for (
      const node
      of this.nodes
    ) {
      const alpha =
        clamp(
          Math.min(
            1,
            node.life / 0.4,
          ),
          0,
          1,
        );

      ctx.save();
      ctx.globalAlpha =
        alpha;
      ctx.fillStyle =
        '#f4f5f7';

      ctx.shadowColor =
        '#ffffff';

      ctx.shadowBlur =
        overloaded
          ? 18
          : 8;

      ctx.fillRect(
        Math.round(
          node.x -
          cameraX -
          this.nodeSize / 2,
        ),
        Math.round(
          node.y -
          this.nodeSize / 2,
        ),
        this.nodeSize,
        this.nodeSize,
      );

      ctx.restore();
    }

    for (
      const projectile
      of this.projectiles
    ) {
      const alpha =
        clamp(
          projectile.life /
          projectile.maxLife,
          0,
          1,
        );

      ctx.save();
      ctx.globalAlpha =
        alpha;
      ctx.fillStyle =
        '#e5e7eb';

      ctx.fillRect(
        Math.round(
          projectile.x -
          cameraX -
          5,
        ),
        Math.round(
          projectile.y -
          5,
        ),
        10,
        10,
      );

      ctx.restore();
    }

    if (!active) return;

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
      artPixelSize,
      {
        glowStrength:
          overloaded
            ? 1.3
            : 1,
      },
    );
  }
}
