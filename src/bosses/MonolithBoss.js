import { BossAI } from './BossAI.js?v=36';
import {
  compileSpriteAsset,
} from '../SpriteAssets.js?v=55';
import {
  evaluateAnimation,
  applyAnimationPose,
} from '../SpriteAnimation.js?v=55';
import {
  rasterize,
} from '../pixelShapes.js?v=36';

const MONOLITH_SPRITE = {
  version: 2,
  name: 'monolith',
  displayName: 'monolith',
  type: 'boss',
  scale: 2,
  pivot: [0, 0],
  parts: [
    {
      id: 'polygon-1',
      name: 'polygon-1',
      type: 'polygon',
      material: 'gray',
      groupId: 'group-5',
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [0, -16],
        [-9, -19],
        [-10, 0],
        [0, 10],
      ],
    },
    {
      id: 'polygon-mirror-2',
      name: 'polygon-1 mirror',
      type: 'polygon',
      material: 'gray',
      groupId: 'group-5',
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [0, 10],
        [10, 0],
        [9, -19],
        [0, -16],
      ],
    },
    {
      id: 'polygon-3',
      name: 'polygon-3',
      type: 'polygon',
      material: 'glow-white',
      groupId: 'group-5',
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [0, -10],
        [-5, 0],
        [0, 6],
      ],
    },
    {
      id: 'polygon-mirror-4',
      name: 'polygon-3 mirror',
      type: 'polygon',
      material: 'glow-white',
      groupId: 'group-5',
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [0, 6],
        [5, 0],
        [0, -10],
      ],
    },
    {
      id: 'polygon-5',
      name: 'polygon-5',
      type: 'polygon',
      material: 'dark-gray',
      groupId: 'group-4',
      x: 2,
      y: 3,
      rotation: 0,
      outline: null,
      points: [
        [11, 3],
        [20, 3],
        [20, 12],
        [11, 12],
      ],
    },
    {
      id: 'polygon-mirror-6',
      name: 'polygon-5 mirror',
      type: 'polygon',
      material: 'dark-gray',
      groupId: 'group-3',
      x: -2,
      y: 3,
      rotation: 0,
      outline: null,
      points: [
        [-11, 12],
        [-20, 12],
        [-20, 3],
        [-11, 3],
      ],
    },
    {
      id: 'polygon-7',
      name: 'polygon-7',
      type: 'polygon',
      material: 'gray',
      groupId: 'group-3',
      x: -3,
      y: 23,
      rotation: 90,
      outline: null,
      points: [
        [-8, 10],
        [-5, 9],
        [-5, 7],
        [-20, 7],
        [-20, 9],
        [-17, 10],
      ],
    },
    {
      id: 'polygon-mirror-8',
      name: 'polygon-7 mirror',
      type: 'polygon',
      material: 'gray',
      groupId: 'group-4',
      x: 32,
      y: -2,
      rotation: 90,
      outline: null,
      points: [
        [17, 10],
        [20, 9],
        [20, 7],
        [5, 7],
        [5, 9],
        [8, 10],
      ],
    },
    {
      id: 'polygon-9',
      name: 'polygon-9',
      type: 'polygon',
      material: 'gray',
      groupId: 'group-3',
      x: -3,
      y: 23,
      rotation: 90,
      outline: null,
      points: [
        [-17, 19],
        [-20, 20],
        [-20, 20],
        [-20, 22],
        [-5, 22],
        [-5, 22],
        [-5, 20],
        [-8, 19],
      ],
    },
    {
      id: 'polygon-mirror-10',
      name: 'polygon-9 mirror',
      type: 'polygon',
      material: 'gray',
      groupId: 'group-4',
      x: 32,
      y: -2,
      rotation: 90,
      outline: null,
      points: [
        [8, 19],
        [5, 20],
        [5, 22],
        [5, 22],
        [20, 22],
        [20, 20],
        [20, 20],
        [17, 19],
      ],
    },
  ],
  groups: [
    {
      id: 'group-3',
      name: 'left-arm',
      pivot: [
        -2.6666666666666665,
        16.333333333333332,
      ],
    },
    {
      id: 'group-4',
      name: 'right-arm',
      pivot: [22, -0.3333333333333333],
    },
    {
      id: 'group-5',
      name: 'head',
      pivot: [0, 0],
    },
  ],
  hitboxes: [],
  animations: {
    clips: {
      idle: {
        name: 'idle',
        duration: 2.4,
        loop: true,
        tracks: [
          {
            id: 'group:group-3:y',
            targetType: 'group',
            targetId: 'group-3',
            property: 'y',
            keyframes: [
              { time: 0, value: 0, easing: 'easeInOutSine' },
              { time: 0.6, value: -1.5, easing: 'easeInOutSine' },
              { time: 1.2, value: 1, easing: 'easeInOutSine' },
              { time: 1.8, value: -0.5, easing: 'easeInOutSine' },
              { time: 2.4, value: 0, easing: 'easeInOutSine' },
            ],
          },
          {
            id: 'group:group-4:y',
            targetType: 'group',
            targetId: 'group-4',
            property: 'y',
            keyframes: [
              { time: 0, value: 0, easing: 'easeInOutSine' },
              { time: 0.6, value: 1, easing: 'easeInOutSine' },
              { time: 1.2, value: -1.5, easing: 'easeInOutSine' },
              { time: 1.8, value: 0.5, easing: 'easeInOutSine' },
              { time: 2.4, value: 0, easing: 'easeInOutSine' },
            ],
          },
          {
            id: 'group:group-3:rotation',
            targetType: 'group',
            targetId: 'group-3',
            property: 'rotation',
            keyframes: [
              { time: 0, value: -42, easing: 'easeInOutSine' },
              { time: 0.6, value: -47.5, easing: 'easeInOutSine' },
              { time: 1.2, value: -39, easing: 'easeInOutSine' },
              { time: 1.8, value: -45, easing: 'easeInOutSine' },
              { time: 2.4, value: -42, easing: 'easeInOutSine' },
            ],
          },
          {
            id: 'group:group-4:rotation',
            targetType: 'group',
            targetId: 'group-4',
            property: 'rotation',
            keyframes: [
              { time: 0, value: 42, easing: 'easeInOutSine' },
              { time: 0.6, value: 39, easing: 'easeInOutSine' },
              { time: 1.2, value: 47.5, easing: 'easeInOutSine' },
              { time: 1.8, value: 43.5, easing: 'easeInOutSine' },
              { time: 2.4, value: 42, easing: 'easeInOutSine' },
            ],
          },
          {
            id: 'group:group-5:y',
            targetType: 'group',
            targetId: 'group-5',
            property: 'y',
            keyframes: [
              { time: 0, value: 0, easing: 'easeInOutSine' },
              { time: 0.6, value: -1, easing: 'easeInOutSine' },
              { time: 1.2, value: 0.75, easing: 'easeInOutSine' },
              { time: 1.8, value: -0.5, easing: 'easeInOutSine' },
              { time: 2.4, value: 0, easing: 'easeInOutSine' },
            ],
          },
          {
            id: 'group:group-5:rotation',
            targetType: 'group',
            targetId: 'group-5',
            property: 'rotation',
            keyframes: [
              { time: 0, value: -2, easing: 'easeInOutSine' },
              { time: 0.6, value: 1.75, easing: 'easeInOutSine' },
              { time: 1.2, value: -1.25, easing: 'easeInOutSine' },
              { time: 1.8, value: 2.25, easing: 'easeInOutSine' },
              { time: 2.4, value: -2, easing: 'easeInOutSine' },
            ],
          },
        ],
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

function rotateLocalPoint(
  x,
  y,
  degrees,
) {
  const radians =
    degrees *
    Math.PI /
    180;

  const cos =
    Math.cos(radians);

  const sin =
    Math.sin(radians);

  return [
    x * cos - y * sin,
    x * sin + y * cos,
  ];
}

function polygonMassCentroid(
  points,
) {
  let twiceArea = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (
    let i = 0;
    i < points.length;
    i++
  ) {
    const a =
      points[i];

    const b =
      points[
        (i + 1) %
        points.length
      ];

    const cross =
      a[0] * b[1] -
      b[0] * a[1];

    twiceArea += cross;

    weightedX +=
      (a[0] + b[0]) *
      cross;

    weightedY +=
      (a[1] + b[1]) *
      cross;
  }

  const signedArea =
    twiceArea * 0.5;

  if (
    Math.abs(signedArea) <
    0.00001
  ) {
    return null;
  }

  return {
    mass:
      Math.abs(signedArea),
    x:
      weightedX /
      (6 * signedArea),
    y:
      weightedY /
      (6 * signedArea),
  };
}

function partMassCentroid(part) {
  if (
    part.type === 'rectangle'
  ) {
    return {
      mass:
        Math.abs(
          part.width *
          part.height,
        ),
      x: part.x,
      y: part.y,
    };
  }

  if (
    part.type !== 'polygon' ||
    !Array.isArray(part.points) ||
    part.points.length < 3
  ) {
    return null;
  }

  const transformed =
    part.points.map(
      ([x, y]) => {
        const [rx, ry] =
          rotateLocalPoint(
            x,
            y,
            part.rotation ?? 0,
          );

        return [
          rx + (part.x ?? 0),
          ry + (part.y ?? 0),
        ];
      },
    );

  return polygonMassCentroid(
    transformed,
  );
}

function groupCenterOfMass(
  asset,
  groupId,
) {
  let totalMass = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (
    const part
    of asset.parts ?? []
  ) {
    if (
      part.groupId !==
      groupId
    ) {
      continue;
    }

    const centroid =
      partMassCentroid(part);

    if (
      !centroid ||
      centroid.mass <= 0
    ) {
      continue;
    }

    totalMass +=
      centroid.mass;

    weightedX +=
      centroid.x *
      centroid.mass;

    weightedY +=
      centroid.y *
      centroid.mass;
  }

  if (totalMass <= 0) {
    return null;
  }

  return [
    weightedX /
      totalMass,
    weightedY /
      totalMass,
  ];
}

function centerArmPivotsAtMass(
  asset,
) {
  for (
    const groupId
    of ['group-3', 'group-4']
  ) {
    const group =
      asset.groups?.find(
        entry =>
          entry.id === groupId,
      );

    const center =
      groupCenterOfMass(
        asset,
        groupId,
      );

    if (
      group &&
      center
    ) {
      group.pivot = center;
    }
  }
}

// Recalculate from the actual arm polygons instead of trusting the old editor
// pivots. For the current sprite this resolves to about (-17.5, 10.5) and
// (17.5, 10.5), which are the true area-weighted centers of the hammer arms.
centerArmPivotsAtMass(
  MONOLITH_SPRITE,
);

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function wrapDegrees(value) {
  let result =
    value % 360;

  if (result > 180) {
    result -= 360;
  } else if (result < -180) {
    result += 360;
  }

  return result;
}

function shortestAngleDelta(
  from,
  to,
) {
  return wrapDegrees(
    to - from,
  );
}

function cloneAsset(asset) {
  return JSON.parse(
    JSON.stringify(asset),
  );
}

export class MonolithBoss {
  constructor(world) {
    this.name = 'monolith';
    this.maxHealth = 1000;
    this.health = this.maxHealth;
    this.dead = false;

    this.x = 900;
    this.y = 255;
    this.spawnX = this.x;
    this.spawnY = this.y;

    // Match Matrix's stateful horizontal patrol for the first visual test.
    this.patrolDistance = 360;
    this.patrolSpeed = 125;
    this.patrolDirection = 1;
    this.patrolMinX =
      this.spawnX -
      this.patrolDistance;
    this.patrolMaxX =
      this.spawnX +
      this.patrolDistance;

    this.artPixelSize = 4;
    this.hitRadius = 224;

    // The hammer arms keep a heavy roughly 45 degree neutral incline, then
    // smoothly lag toward the player's direction using a damped angular
    // spring. This avoids snapping when the player crosses the centerline.
    this.leftArmNeutral = -45;
    this.rightArmNeutral = 45;

    // Raised/resting poses are explicit so the inactive hammer visibly lifts
    // away while the opposite hammer is doing the aiming.
    this.leftArmRaised = -45;
    this.rightArmRaised = 45;

    this.leftArmAngle =
      this.leftArmRaised;
    this.rightArmAngle =
      this.rightArmRaised;
    this.leftArmAngularVelocity = 0;
    this.rightArmAngularVelocity = 0;
    this.armAimStrength = 0.72;
    this.armAimClamp = 86;
    this.armSpring = 18;
    this.armDamping = 7.5;

    // Only the hammer closest to the player's horizontal position actively
    // tracks. The comparison uses the real saved arm pivots rather than the
    // boss center, which matters now that Monolith is 2x scale and asymmetrical.
    // Hysteresis keeps the currently selected arm from flickering near the
    // midpoint between both pivots.
    this.activeArmSide = 'right';
    this.armSwitchHysteresis = 26;

    this.hurtFlash = 0;
    this.fxEvents = [];
    this.shotSerial = 0;

    this.animationName = 'idle';
    this.animationTime = 0;
    this.animationDuration = 2.4;
    this.animationFrameRate = 24;
    this.animationRasterCache =
      new Map();

    this.maxAnimationRasterCache =
      220;

    this.ai = new BossAI(this, {
      initialState: 'idle',
      phases: [
        {
          id: 'phase1',
          atOrBelow: 1,
        },
      ],
    });

    this.ai.addState('idle', {
      update: (owner, ai, dt) => {
        owner.x +=
          owner.patrolDirection *
          owner.patrolSpeed *
          dt;

        if (
          owner.x >=
          owner.patrolMaxX
        ) {
          owner.x =
            owner.patrolMaxX;

          owner.patrolDirection = -1;
        } else if (
          owner.x <=
          owner.patrolMinX
        ) {
          owner.x =
            owner.patrolMinX;

          owner.patrolDirection = 1;
        }

        // Keep the body anchor stable like Matrix phase 1. The visible motion
        // comes from the grouped idle animation instead.
        owner.y = owner.spawnY;
      },
    });
  }

  get healthRatio() {
    return (
      this.health /
      this.maxHealth
    );
  }

  get phaseLabel() {
    return 'phase 1';
  }

  reset(world) {
    this.health = this.maxHealth;
    this.dead = false;
    this.hurtFlash = 0;

    this.x = this.spawnX;
    this.y = this.spawnY;
    this.patrolDirection = 1;

    this.animationTime = 0;

    this.leftArmAngle =
      this.leftArmRaised;
    this.rightArmAngle =
      this.rightArmRaised;
    this.leftArmAngularVelocity = 0;
    this.rightArmAngularVelocity = 0;
    this.activeArmSide = 'right';

    this.animationRasterCache.clear();
    this.fxEvents.length = 0;
    this.shotSerial = 0;

    this.ai.stateName = null;
    this.ai.stateTime = 0;
    this.ai.cooldowns.clear();
    this.ai.timers.clear();
    this.ai.phaseId = null;
    this.ai.changeState(
      'idle',
      { world },
    );
  }

  update(dt, context) {
    if (this.dead) return;

    this.ai.update(
      dt,
      context,
    );

    this.updateArmTracking(
      dt,
      context.player,
    );

    this.animationTime =
      (
        this.animationTime +
        dt
      ) %
      this.animationDuration;

    this.hurtFlash =
      Math.max(
        0,
        this.hurtFlash -
        dt * 7.5,
      );
  }

  armPivotWorld(groupId) {
    const group =
      MONOLITH_SPRITE.groups
        .find(
          entry =>
            entry.id === groupId,
        );

    const pivot =
      group?.pivot ?? [0, 0];

    const scale =
      MONOLITH_SPRITE.scale *
      this.artPixelSize;

    return {
      x:
        this.x +
        pivot[0] * scale,
      y:
        this.y +
        pivot[1] * scale,
    };
  }

  desiredArmAngle(
    groupId,
    player,
    neutral,
  ) {
    if (!player) {
      return neutral;
    }

    const pivot =
      this.armPivotWorld(groupId);

    const angle =
      Math.atan2(
        player.y - pivot.y,
        player.x - pivot.x,
      ) *
      180 /
      Math.PI;

    // Screen-space 90 degrees is straight down. Use that as the neutral
    // reference so both hammers retain their heavy inward/downward stance.
    const deviation =
      clamp(
        wrapDegrees(
          angle - 90,
        ),
        -this.armAimClamp,
        this.armAimClamp,
      );

    return (
      neutral +
      deviation *
      this.armAimStrength
    );
  }

  springArmAngle(
    angle,
    velocity,
    target,
    dt,
  ) {
    const delta =
      shortestAngleDelta(
        angle,
        target,
      );

    const acceleration =
      delta *
        this.armSpring -
      velocity *
        this.armDamping;

    velocity +=
      acceleration * dt;

    angle +=
      velocity * dt;

    return {
      angle:
        wrapDegrees(angle),
      velocity,
    };
  }

  updateArmTracking(
    dt,
    player,
  ) {
    if (player) {
      const leftPivot =
        this.armPivotWorld(
          'group-3',
        );

      const rightPivot =
        this.armPivotWorld(
          'group-4',
        );

      const leftDistance =
        Math.abs(
          player.x -
          leftPivot.x,
        );

      const rightDistance =
        Math.abs(
          player.x -
          rightPivot.x,
        );

      if (
        leftDistance +
          this.armSwitchHysteresis <
        rightDistance
      ) {
        this.activeArmSide =
          'left';
      } else if (
        rightDistance +
          this.armSwitchHysteresis <
        leftDistance
      ) {
        this.activeArmSide =
          'right';
      }
    }

    const leftTarget =
      this.activeArmSide === 'left'
        ? this.desiredArmAngle(
            'group-3',
            player,
            this.leftArmNeutral,
          )
        : this.leftArmRaised;

    const rightTarget =
      this.activeArmSide === 'right'
        ? this.desiredArmAngle(
            'group-4',
            player,
            this.rightArmNeutral,
          )
        : this.rightArmRaised;

    const left =
      this.springArmAngle(
        this.leftArmAngle,
        this.leftArmAngularVelocity,
        leftTarget,
        dt,
      );

    const right =
      this.springArmAngle(
        this.rightArmAngle,
        this.rightArmAngularVelocity,
        rightTarget,
        dt,
      );

    this.leftArmAngle =
      left.angle;

    this.leftArmAngularVelocity =
      left.velocity;

    this.rightArmAngle =
      right.angle;

    this.rightArmAngularVelocity =
      right.velocity;
  }

  compilePosedGroup(
    posed,
    groupId,
  ) {
    const groupAsset =
      cloneAsset(posed);

    groupAsset.parts =
      groupAsset.parts.filter(
        part =>
          part.groupId ===
          groupId,
      );

    groupAsset.groups =
      groupAsset.groups.filter(
        group =>
          group.id ===
          groupId,
      );

    // Each major body group is rasterized independently so the two hammer
    // arms keep their own outside outline instead of merging into the head.
    groupAsset.render = {
      ...groupAsset.render,
      mergeOutlines: true,
      outline: {
        enabled: true,
        color: '#35383e',
        thickness: 1,
      },
    };

    return compileSpriteAsset(
      groupAsset,
    );
  }

  animationFrame() {
    const step =
      1 /
      this.animationFrameRate;

    const frameIndex =
      Math.floor(
        this.animationTime /
        step,
      );

    const leftAimKey =
      Math.round(
        this.leftArmAngle /
        2,
      ) * 2;

    const rightAimKey =
      Math.round(
        this.rightArmAngle /
        2,
      ) * 2;

    const key =
      `${frameIndex}:${leftAimKey}:${rightAimKey}`;

    if (
      this.animationRasterCache
        .has(key)
    ) {
      return this.animationRasterCache
        .get(key);
    }

    const sampleTime =
      clamp(
        frameIndex *
        step,
        0,
        this.animationDuration,
      );

    const evaluation =
      evaluateAnimation(
        MONOLITH_SPRITE.animations,
        this.animationName,
        sampleTime,
      );

    const leftPose =
      evaluation.groups.get(
        'group-3',
      );

    const rightPose =
      evaluation.groups.get(
        'group-4',
      );

    // Keep the small authored idle sway, but center it around the procedural
    // aim angle instead of the old fixed neutral rotation.
    if (leftPose) {
      const idleOffset =
        (leftPose.rotation ??
          this.leftArmNeutral) -
        this.leftArmNeutral;

      leftPose.rotation =
        this.leftArmAngle +
        idleOffset;
    }

    if (rightPose) {
      const idleOffset =
        (rightPose.rotation ??
          this.rightArmNeutral) -
        this.rightArmNeutral;

      rightPose.rotation =
        this.rightArmAngle +
        idleOffset;
    }

    const posed =
      applyAnimationPose(
        MONOLITH_SPRITE,
        evaluation,
      );

    const head =
      this.compilePosedGroup(
        posed,
        'group-5',
      );

    const leftArm =
      this.compilePosedGroup(
        posed,
        'group-3',
      );

    const rightArm =
      this.compilePosedGroup(
        posed,
        'group-4',
      );

    const frame = {
      layers: [
        {
          id: 'head',
          raster:
            rasterize(
              head.shape,
            ),
        },
        {
          id: 'left-arm',
          raster:
            rasterize(
              leftArm.shape,
            ),
        },
        {
          id: 'right-arm',
          raster:
            rasterize(
              rightArm.shape,
            ),
        },
      ],
      glows:
        head.glowParts
          .map(part => ({
            color:
              part.glow.color,
            radius:
              part.glow.radius,
            raster:
              rasterize(
                part.shape,
              ),
          })),
    };

    if (
      this.animationRasterCache.size >=
      this.maxAnimationRasterCache
    ) {
      this.animationRasterCache.clear();
    }

    this.animationRasterCache.set(
      key,
      frame,
    );

    return frame;
  }

  drawRasterAtPivot(
    ctx,
    raster,
    cameraX,
    artPixelSize,
    alpha = 1,
  ) {
    const bounds =
      raster.shapeBounds ?? {
        minX:
          -raster.width / 2,
        minY:
          -raster.height / 2,
      };

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      raster,
      Math.round(
        this.x -
        cameraX +
        bounds.minX *
        artPixelSize,
      ),
      Math.round(
        this.y +
        bounds.minY *
        artPixelSize,
      ),
      raster.width *
        artPixelSize,
      raster.height *
        artPixelSize,
    );

    ctx.restore();
  }

  draw(
    ctx,
    cameraX,
    artPixelSize = 4,
  ) {
    if (this.dead) return;

    const frame =
      this.animationFrame();

    for (
      const glow
      of frame.glows
    ) {
      ctx.save();
      ctx.globalAlpha = 0.76;
      ctx.shadowColor =
        glow.color;
      ctx.shadowBlur =
        glow.radius * 1.4;

      this.drawRasterAtPivot(
        ctx,
        glow.raster,
        cameraX,
        artPixelSize,
        0.76,
      );

      ctx.restore();
    }

    for (
      const layer
      of frame.layers
    ) {
      this.drawRasterAtPivot(
        ctx,
        layer.raster,
        cameraX,
        artPixelSize,
        1,
      );
    }

    if (
      this.hurtFlash > 0
    ) {
      ctx.save();
      ctx.globalCompositeOperation =
        'screen';

      for (
        const layer
        of frame.layers
      ) {
        this.drawRasterAtPivot(
          ctx,
          layer.raster,
          cameraX,
          artPixelSize,
          this.hurtFlash * 0.72,
        );
      }

      ctx.restore();
    }
  }

  hitTest(
    x,
    y,
    radius = 0,
  ) {
    return (
      Math.hypot(
        x - this.x,
        y - this.y,
      ) <=
      this.hitRadius +
      radius
    );
  }

  takeDamage(amount) {
    if (
      this.dead ||
      amount <= 0
    ) {
      return false;
    }

    this.health =
      Math.max(
        0,
        this.health - amount,
      );

    this.hurtFlash = 1;

    if (this.health <= 0) {
      this.dead = true;
    }

    return true;
  }

  damageProjectileAt() {
    return false;
  }

  damageProjectilesAlongRay() {
    return 0;
  }
}
