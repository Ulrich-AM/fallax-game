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

function lerpValue(
  from,
  to,
  t,
) {
  return (
    from +
    (to - from) * t
  );
}

function easeOutCubic(value) {
  const t =
    clamp(
      value,
      0,
      1,
    );

  return (
    1 -
    Math.pow(
      1 - t,
      3,
    )
  );
}

function easeInCubic(value) {
  const t =
    clamp(
      value,
      0,
      1,
    );

  return t * t * t;
}

function easeInOutSine(value) {
  const t =
    clamp(
      value,
      0,
      1,
    );

  return (
    -(Math.cos(Math.PI * t) - 1) /
    2
  );
}

function smoothStep01(value) {
  const t =
    clamp(
      value,
      0,
      1,
    );

  return (
    t *
    t *
    (3 - 2 * t)
  );
}

function createGroupAsset(
  asset,
  groupId,
) {
  return {
    ...asset,
    parts:
      (asset.parts ?? [])
        .filter(
          part =>
            part.groupId ===
            groupId,
        ),
    groups:
      (asset.groups ?? [])
        .filter(
          group =>
            group.id ===
            groupId,
        ),
    hitboxes: [],
    markers: {},
  };
}

const MONOLITH_GROUP_ASSETS =
  new Map(
    [
      'group-3',
      'group-4',
      'group-5',
    ].map(
      groupId => [
        groupId,
        createGroupAsset(
          MONOLITH_SPRITE,
          groupId,
        ),
      ],
    ),
  );

export class MonolithBoss {
  constructor(world) {
    this.name = 'monolith';
    this.maxHealth = 1500;
    this.health = this.maxHealth;
    this.dead = false;

    this.x = 900;
    this.y = 255;
    this.spawnX = this.x;
    this.spawnY = this.y;

    this.patrolSpeed = 125;
    this.patrolDirection = 1;
    this.patrolMinX = 260;
    this.patrolMaxX =
      Math.max(
        this.patrolMinX,
        world.width - 260,
      );

    this.artPixelSize = 4;

    // Only the head is damageable. hitRadius remains as a compatibility hint
    // for systems that inspect it, while hitTest uses the offset head circle.
    this.headHitOffsetX = 0;
    this.headHitOffsetY = -30;
    this.headHitRadius = 82;
    this.hitRadius =
      this.headHitRadius;

    this.leftArmNeutral = -45;
    this.rightArmNeutral = 45;
    this.leftArmRaised = -45;
    this.rightArmRaised = 45;

    this.leftArmAngle =
      this.leftArmRaised;
    this.rightArmAngle =
      this.rightArmRaised;
    this.leftArmAngularVelocity = 0;
    this.rightArmAngularVelocity = 0;
    this.leftArmOverride = null;
    this.rightArmOverride = null;

    // Procedural pose channels are kept outside the raster cache. Translation
    // can therefore animate every simulation frame without forcing a new
    // sprite compile. Arm rotation still uses the quantized raster cache.
    this.headOffsetX = 0;
    this.headOffsetY = 0;
    this.leftArmOffsetX = 0;
    this.leftArmOffsetY = 0;
    this.rightArmOffsetX = 0;
    this.rightArmOffsetY = 0;

    this.armAimStrength = 0.72;
    this.armAimClamp = 86;
    this.armSpring = 18;
    this.armDamping = 7.5;

    this.activeArmSide = 'right';
    this.armSwitchHysteresis = 26;

    this.hurtFlash = 0;
    this.fxEvents = [];
    this.shotSerial = 0;

    this.animationName = 'idle';
    this.animationTime = 0;
    this.animationDuration = 2.4;
    this.animationFrameRate = 12;
    this.armRasterAngleStep = 8;

    // Monolith used to cache the entire combined pose. A single arm angle
    // change therefore invalidated and rebuilt the head plus both arms.
    // Independent caches let unchanged pieces reuse their already rasterized
    // frames, and each compile only receives the relevant small group asset.
    this.animationEvaluationCache =
      new Map();

    this.headRasterCache =
      new Map();

    this.leftArmRasterCache =
      new Map();

    this.rightArmRasterCache =
      new Map();

    this.maxHeadRasterCache = 36;
    this.maxArmRasterCache = 96;

    this.lastAttack = null;
    this.attackArmSide = 'right';

    this.lariatDirection = 1;
    this.lariatStartX = this.x;
    this.lariatStartY = this.y;
    this.lariatEndX = this.x;
    this.lariatTargetY = this.y;
    this.lariatPredictedX = this.x;
    this.lariatPredictedY = this.y;
    this.lariatHit = false;

    this.grabbedTarget = null;
    this.grabDashSerial = 0;
    this.grabSide = 1;
    this.grabAimX = this.x;
    this.grabAimY = this.y;
    this.grabHandX = this.x;
    this.grabHandY = this.y;
    this.grabWindStartX = this.x;
    this.grabWindStartY = this.y;

    this.throwState = null;

    this.draglineLockedX = this.x;
    this.draglineLockedY = this.y;
    this.draglineHookX = this.x;
    this.draglineHookY = this.y;
    this.draglineVX = 0;
    this.draglineVY = 0;
    this.draglineLife = 0;
    this.draglineTarget = null;
    this.draglineDashSerial = 0;
    this.draglineActive = false;
    this.draglineAttached = false;
    this.draglineInitialDistance = 1;
    this.draglineSqueezeTimer = 0;
    this.draglineSqueezeCount = 0;
    this.draglineSqueezeFlash = 0;

    this.recoverStartY = this.y;
    this.recoverHeadOffsetX = 0;
    this.recoverHeadOffsetY = 0;
    this.recoverLeftArmOffsetX = 0;
    this.recoverLeftArmOffsetY = 0;
    this.recoverRightArmOffsetX = 0;
    this.recoverRightArmOffsetY = 0;

    this.sweepDirection = 1;
    this.sweepHit = false;
    this.sweepX = this.x;

    this.ai = new BossAI(this, {
      initialState: 'idle',
      phases: [
        {
          id: 'phase1',
          atOrBelow: 1,
        },
        {
          id: 'phase2',
          atOrBelow: 2 / 3,
        },
        {
          id: 'phase3',
          atOrBelow: 1 / 3,
        },
      ],
    });

    this.installStates(world);
  }

  installStates(world) {
    this.ai
      .addState('idle', {
        enter: (owner, ai) => {
          owner.clearAttackPose();
          owner.resetPoseOffsets();
          owner.clearDragline();

          ai.setTimer(
            'attackDelay',
            1.0 +
              Math.random() *
                0.72,
          );
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
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

          owner.y = owner.spawnY;

          if (
            !ai.timerDone(
              'attackDelay',
            )
          ) {
            return;
          }

          const target =
            ai.targetPlayer(ctx);

          if (!target) {
            ai.setTimer(
              'attackDelay',
              0.5,
            );
            return;
          }

          const distance =
            Math.abs(
              target.x -
              owner.x,
            );

          const options = [
            {
              value: 'lariatSwoop',
              weight:
                distance > 260
                  ? 1.55
                  : 0.75,
            },
            {
              value: 'commandGrab',
              weight:
                distance < 470
                  ? 1.65
                  : 0.16,
            },
            {
              value: 'draglineWindup',
              weight:
                distance > 380
                  ? 1.58
                  : 0.48,
            },
            {
              value: 'groundSweepWindup',
              weight:
                distance < 720
                  ? 0.72
                  : 0.28,
            },
          ];

          for (const option of options) {
            if (
              option.value ===
              owner.lastAttack
            ) {
              option.weight *= 0.24;
            }
          }

          const next =
            ai.chooseWeighted(
              options,
            );

          owner.lastAttack = next;

          ai.changeState(
            next,
            ctx,
          );
        },
      })

      // LARIAT
      // The body moves first, the heavy arms lag and oscillate, then the pose
      // settles before a large anticipation pullback and a fast committed rush.
      .addState('lariatSwoop', {
        enter: (
          owner,
          ai,
          ctx,
        ) => {
          const target =
            ai.targetPlayer(ctx);

          const predicted =
            owner.predictTarget(
              target,
              0.36,
              world,
            );

          owner.lariatPredictedX =
            predicted.x;

          owner.lariatPredictedY =
            predicted.y;

          owner.lariatDirection =
            predicted.x >= owner.x
              ? 1
              : -1;

          owner.attackArmSide =
            owner.lariatDirection > 0
              ? 'right'
              : 'left';

          owner.lariatStartX =
            owner.x;

          owner.lariatStartY =
            owner.y;

          owner.lariatEndX =
            clamp(
              predicted.x -
                owner.lariatDirection *
                  500,
              180,
              world.width - 180,
            );

          // Put the leading fist at roughly the target's predicted vertical
          // center rather than leaving Monolith high above the fight.
          owner.lariatTargetY =
            clamp(
              predicted.y - 190,
              world.roofY + 145,
              world.floorY - 185,
            );

          owner.lariatHit = false;
          owner.resetPoseOffsets();
        },

        update: (
          owner,
          ai,
        ) => {
          const duration = 0.62;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeInOutSine(t);

          const arc =
            Math.sin(
              t * Math.PI,
            );

          owner.x =
            lerpValue(
              owner.lariatStartX,
              owner.lariatEndX,
              eased,
            );

          owner.y =
            lerpValue(
              owner.lariatStartY,
              owner.lariatTargetY,
              eased,
            ) +
            arc * 54;

          const decay =
            1 - t;

          const flail =
            Math.sin(
              t *
              Math.PI *
              4.1,
            ) *
            34 *
            decay;

          owner.leftArmOverride =
            owner.leftArmNeutral -
            flail;

          owner.rightArmOverride =
            owner.rightArmNeutral +
            flail * 0.88;

          owner.leftArmOffsetX =
            -owner.lariatDirection *
            arc *
            18;

          owner.rightArmOffsetX =
            owner.lariatDirection *
            arc *
            18;

          owner.leftArmOffsetY =
            -arc * 12;

          owner.rightArmOffsetY =
            arc * 10;

          owner.headOffsetX =
            -owner.lariatDirection *
            arc *
            8;

          owner.headOffsetY =
            arc * 7;

          if (t >= 1) {
            ai.changeState(
              'lariatStabilize',
            );
          }
        },
      })

      .addState('lariatStabilize', {
        update: (
          owner,
          ai,
        ) => {
          const duration = 0.28;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const decay =
            1 - smoothStep01(t);

          const settle =
            Math.sin(
              t *
              Math.PI *
              3,
            ) *
            11 *
            decay;

          owner.leftArmOverride =
            owner.leftArmNeutral -
            settle;

          owner.rightArmOverride =
            owner.rightArmNeutral +
            settle;

          owner.leftArmOffsetX *=
            0.86;

          owner.rightArmOffsetX *=
            0.86;

          owner.leftArmOffsetY *=
            0.86;

          owner.rightArmOffsetY *=
            0.86;

          owner.headOffsetX *=
            0.82;

          owner.headOffsetY *=
            0.82;

          owner.y =
            owner.lariatTargetY +
            Math.sin(
              t * Math.PI,
            ) *
            7;

          if (t >= 1) {
            ai.changeState(
              'lariatWindup',
            );
          }
        },
      })

      .addState('lariatWindup', {
        enter: owner => {
          owner.lariatStartX =
            owner.x;

          owner.lariatStartY =
            owner.y;
        },

        update: (
          owner,
          ai,
        ) => {
          const duration = 0.46;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeInOutSine(t);

          const direction =
            owner.lariatDirection;

          owner.x =
            owner.lariatStartX -
            direction *
            118 *
            eased;

          owner.y =
            owner.lariatStartY +
            Math.sin(
              t * Math.PI,
            ) *
            12;

          if (direction > 0) {
            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                128,
                eased,
              );

            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -18,
                eased,
              );

            owner.rightArmOffsetX =
              -58 * eased;

            owner.leftArmOffsetX =
              26 * eased;
          } else {
            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -128,
                eased,
              );

            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                18,
                eased,
              );

            owner.leftArmOffsetX =
              58 * eased;

            owner.rightArmOffsetX =
              -26 * eased;
          }

          owner.leftArmOffsetY =
            -16 * eased;

          owner.rightArmOffsetY =
            -16 * eased;

          owner.headOffsetX =
            -direction *
            14 *
            eased;

          owner.headOffsetY =
            -7 *
            Math.sin(
              t * Math.PI,
            );

          if (t >= 1) {
            owner.lariatStartX =
              owner.x;

            owner.lariatStartY =
              owner.y;

            owner.lariatEndX =
              clamp(
                owner.lariatPredictedX +
                  direction *
                  270,
                165,
                world.width - 165,
              );

            ai.changeState(
              'lariatRush',
            );
          }
        },
      })

      .addState('lariatRush', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.30;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const snap =
            easeOutCubic(t);

          const direction =
            owner.lariatDirection;

          owner.x =
            lerpValue(
              owner.lariatStartX,
              owner.lariatEndX,
              snap,
            );

          owner.y =
            lerpValue(
              owner.lariatStartY,
              owner.lariatTargetY,
              easeInOutSine(t),
            );

          if (direction > 0) {
            owner.rightArmOverride =
              lerpValue(
                128,
                5,
                snap,
              );

            owner.leftArmOverride =
              lerpValue(
                -18,
                -108,
                snap,
              );

            owner.rightArmOffsetX =
              lerpValue(
                -58,
                94,
                snap,
              );

            owner.leftArmOffsetX =
              lerpValue(
                26,
                -42,
                snap,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -128,
                -5,
                snap,
              );

            owner.rightArmOverride =
              lerpValue(
                18,
                108,
                snap,
              );

            owner.leftArmOffsetX =
              lerpValue(
                58,
                -94,
                snap,
              );

            owner.rightArmOffsetX =
              lerpValue(
                -26,
                42,
                snap,
              );
          }

          owner.leftArmOffsetY =
            lerpValue(
              -16,
              5,
              snap,
            );

          owner.rightArmOffsetY =
            lerpValue(
              -16,
              5,
              snap,
            );

          owner.headOffsetX =
            direction *
            11 *
            snap;

          owner.headOffsetY =
            -5 *
            Math.sin(
              t * Math.PI,
            );

          const target =
            ai.targetPlayer(ctx);

          if (
            target &&
            !owner.lariatHit
          ) {
            const contactX =
              owner.x +
              direction *
              215;

            const contactY =
              owner.y +
              190;

            if (
              owner.circleHitsTarget(
                contactX,
                contactY,
                96,
                target,
              )
            ) {
              const result =
                owner.tryRushHit(
                  target,
                  {
                    x: contactX,
                    y: contactY,
                  },
                  {
                    damage: 24,
                    stabilityCost: 17,
                    knockbackX:
                      direction *
                      760,
                    knockbackY: -230,
                  },
                );

              owner.lariatHit =
                result !== 'miss';

              if (
                result ===
                'parried'
              ) {
                ai.changeState(
                  'recover',
                  ctx,
                );
                return;
              }
            }
          }

          if (t >= 1) {
            owner.lariatStartX =
              owner.x;

            owner.lariatStartY =
              owner.y;

            ai.changeState(
              'lariatFollowThrough',
              ctx,
            );
          }
        },
      })

      .addState('lariatFollowThrough', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.26;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeOutCubic(t);

          const direction =
            owner.lariatDirection;

          owner.x =
            owner.lariatStartX +
            direction *
            74 *
            eased;

          owner.y =
            owner.lariatStartY +
            Math.sin(
              t * Math.PI,
            ) *
            9;

          if (direction > 0) {
            owner.rightArmOverride =
              lerpValue(
                5,
                -24,
                eased,
              );

            owner.leftArmOverride =
              lerpValue(
                -108,
                -66,
                eased,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -5,
                24,
                eased,
              );

            owner.rightArmOverride =
              lerpValue(
                108,
                66,
                eased,
              );
          }

          owner.headOffsetX =
            direction *
            lerpValue(
              11,
              3,
              eased,
            );

          if (t >= 1) {
            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      // COMMAND GRAB
      // A close-range, dodgeable reach. The chosen hand retracts, snaps to the
      // predicted player position, then carries the captured target through a
      // visible turn/wind before the same hand releases the wall throw.
      .addState('commandGrab', {
        enter: (
          owner,
          ai,
          ctx,
        ) => {
          const target =
            owner.resolveGrabTarget(
              ctx,
            );

          const predicted =
            owner.predictTarget(
              target,
              0.18,
              world,
            );

          owner.grabSide =
            predicted.x <
            owner.x
              ? -1
              : 1;

          owner.attackArmSide =
            owner.grabSide > 0
              ? 'right'
              : 'left';

          owner.grabAimX =
            predicted.x;

          owner.grabAimY =
            predicted.y;

          owner.grabWindStartX =
            owner.x;

          owner.grabWindStartY =
            owner.y;

          owner.grabBodyTargetY =
            clamp(
              predicted.y - 245,
              owner.spawnY - 15,
              world.floorY - 205,
            );

          owner.grabHandX =
            owner.x +
            owner.grabSide *
              125;

          owner.grabHandY =
            owner.y +
            185;

          owner.grabbedTarget =
            null;

          owner.resetPoseOffsets();
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const totalDuration = 0.62;
          const windDuration = 0.34;
          const time =
            Math.min(
              ai.stateTime,
              totalDuration,
            );

          const side =
            owner.grabSide;

          if (
            time <
            windDuration
          ) {
            const t =
              time /
              windDuration;

            const eased =
              easeInOutSine(t);

            owner.y =
              lerpValue(
                owner.grabWindStartY,
                owner.grabBodyTargetY,
                eased * 0.48,
              );

            if (side > 0) {
              owner.rightArmOverride =
                lerpValue(
                  owner.rightArmNeutral,
                  126,
                  eased,
                );

              owner.leftArmOverride =
                lerpValue(
                  owner.leftArmNeutral,
                  -20,
                  eased,
                );

              owner.rightArmOffsetX =
                -52 * eased;

              owner.leftArmOffsetX =
                24 * eased;
            } else {
              owner.leftArmOverride =
                lerpValue(
                  owner.leftArmNeutral,
                  -126,
                  eased,
                );

              owner.rightArmOverride =
                lerpValue(
                  owner.rightArmNeutral,
                  20,
                  eased,
                );

              owner.leftArmOffsetX =
                52 * eased;

              owner.rightArmOffsetX =
                -24 * eased;
            }

            owner.leftArmOffsetY =
              -18 * eased;

            owner.rightArmOffsetY =
              -18 * eased;

            owner.headOffsetX =
              -side *
              15 *
              eased;

            owner.headOffsetY =
              -6 *
              Math.sin(
                t * Math.PI,
              );

            return;
          }

          const t =
            clamp(
              (
                time -
                windDuration
              ) /
              (
                totalDuration -
                windDuration
              ),
              0,
              1,
            );

          const snap =
            easeOutCubic(t);

          owner.y =
            lerpValue(
              owner.grabWindStartY,
              owner.grabBodyTargetY,
              0.48 +
                snap * 0.32,
            );

          const handStartX =
            owner.grabWindStartX +
            side * 105;

          const handStartY =
            owner.grabWindStartY +
            175;

          owner.grabHandX =
            lerpValue(
              handStartX,
              owner.grabAimX,
              snap,
            );

          owner.grabHandY =
            lerpValue(
              handStartY,
              owner.grabAimY,
              snap,
            );

          const reachX =
            clamp(
              (
                owner.grabAimX -
                owner.x
              ) *
              0.42,
              -170,
              170,
            );

          const reachY =
            clamp(
              (
                owner.grabAimY -
                (
                  owner.y +
                  175
                )
              ) *
              0.34,
              -80,
              125,
            );

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                126,
                10,
                snap,
              );

            owner.leftArmOverride =
              lerpValue(
                -20,
                -68,
                snap,
              );

            owner.rightArmOffsetX =
              lerpValue(
                -52,
                reachX,
                snap,
              );

            owner.rightArmOffsetY =
              lerpValue(
                -18,
                reachY,
                snap,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -126,
                -10,
                snap,
              );

            owner.rightArmOverride =
              lerpValue(
                20,
                68,
                snap,
              );

            owner.leftArmOffsetX =
              lerpValue(
                52,
                reachX,
                snap,
              );

            owner.leftArmOffsetY =
              lerpValue(
                -18,
                reachY,
                snap,
              );
          }

          owner.headOffsetX =
            lerpValue(
              -side * 15,
              side * 6,
              snap,
            );

          const target =
            owner.resolveGrabTarget(
              ctx,
            );

          if (
            target &&
            !(
              target
                .dashInvulnerabilityTimer >
              0
            ) &&
            owner.circleHitsTarget(
              owner.grabHandX,
              owner.grabHandY,
              74,
              target,
            )
          ) {
            owner.grabbedTarget =
              target;

            owner.grabDashSerial =
              target.dashSerial ?? 0;

            owner.grabCaptureX =
              target.x;

            owner.grabCaptureY =
              target.y;

            target.takeDamage?.(4);

            ai.changeState(
              'commandGrabTurn',
              ctx,
            );

            return;
          }

          if (t >= 1) {
            ai.changeState(
              'commandGrabWhiff',
              ctx,
            );
          }
        },
      })

      .addState('commandGrabWhiff', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.24;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeOutCubic(t);

          const side =
            owner.grabSide;

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                10,
                -18,
                eased,
              );

            owner.rightArmOffsetX +=
              0.7;
          } else {
            owner.leftArmOverride =
              lerpValue(
                -10,
                18,
                eased,
              );

            owner.leftArmOffsetX -=
              0.7;
          }

          owner.headOffsetX =
            side *
            5 *
            (1 - t);

          if (t >= 1) {
            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      .addState('commandGrabTurn', {
        enter: owner => {
          owner.grabWindStartX =
            owner.x;

          owner.grabWindStartY =
            owner.y;
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const target =
            owner.grabbedTarget;

          if (
            !target ||
            target.dead ||
            target.health <= 0
          ) {
            owner.grabbedTarget =
              null;

            ai.changeState(
              'recover',
              ctx,
            );
            return;
          }

          if (
            (
              target.dashSerial ?? 0
            ) !==
            owner.grabDashSerial
          ) {
            owner.releaseGrabEscape(
              target,
            );

            ai.changeState(
              'recover',
              ctx,
            );
            return;
          }

          const duration = 0.72;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeInOutSine(t);

          const side =
            owner.grabSide;

          owner.x =
            owner.grabWindStartX -
            side *
            Math.sin(
              t * Math.PI,
            ) *
            38;

          owner.y =
            owner.grabWindStartY +
            Math.sin(
              t * Math.PI,
            ) *
            12;

          const holdX =
            owner.x +
            side *
            lerpValue(
              150,
              -96,
              eased,
            );

          const holdY =
            owner.y +
            198 -
            Math.sin(
              eased *
              Math.PI,
            ) *
            108;

          owner.pinTargetAt(
            target,
            holdX,
            holdY,
            world,
          );

          owner.grabHandX =
            holdX;

          owner.grabHandY =
            holdY;

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                10,
                138,
                eased,
              );

            owner.leftArmOverride =
              lerpValue(
                -68,
                -24,
                eased,
              );

            owner.rightArmOffsetX =
              lerpValue(
                70,
                -44,
                eased,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -10,
                -138,
                eased,
              );

            owner.rightArmOverride =
              lerpValue(
                68,
                24,
                eased,
              );

            owner.leftArmOffsetX =
              lerpValue(
                -70,
                44,
                eased,
              );
          }

          owner.headOffsetX =
            -side *
            Math.sin(
              t * Math.PI,
            ) *
            20;

          owner.headOffsetY =
            -Math.sin(
              t * Math.PI,
            ) *
            8;

          if (t >= 1) {
            ai.changeState(
              'commandGrabRelease',
              ctx,
            );
          }
        },
      })

      .addState('commandGrabRelease', {
        enter: (
          owner,
          ai,
          ctx,
        ) => {
          const target =
            owner.grabbedTarget;

          if (target) {
            owner.startWallThrow(
              target,
              world,
              owner.grabSide,
            );
          }

          owner.grabbedTarget =
            null;
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.25;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const snap =
            easeOutCubic(t);

          const side =
            owner.grabSide;

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                138,
                3,
                snap,
              );

            owner.leftArmOverride =
              lerpValue(
                -24,
                -82,
                snap,
              );

            owner.rightArmOffsetX =
              lerpValue(
                -44,
                104,
                snap,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -138,
                -3,
                snap,
              );

            owner.rightArmOverride =
              lerpValue(
                24,
                82,
                snap,
              );

            owner.leftArmOffsetX =
              lerpValue(
                44,
                -104,
                snap,
              );
          }

          owner.headOffsetX =
            side *
            14 *
            snap;

          if (t >= 1) {
            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      // DRAGLINE SQUEEZE
      // This is now a long-range grab instead of a harmless reposition tool.
      // The hand reaches out like Command Grab, drags the target inward, then
      // visibly clenches in damage bursts that grow as the distance closes.
      .addState('draglineWindup', {
        enter: (
          owner,
          ai,
          ctx,
        ) => {
          const target =
            owner.resolveGrabTarget(
              ctx,
            );

          const predicted =
            owner.predictTarget(
              target,
              0.24,
              world,
            );

          owner.attackArmSide =
            predicted.x <
            owner.x
              ? 'left'
              : 'right';

          owner.grabSide =
            owner.attackArmSide ===
            'left'
              ? -1
              : 1;

          owner.draglineLockedX =
            predicted.x;

          owner.draglineLockedY =
            predicted.y;

          owner.draglineActive =
            false;

          owner.draglineAttached =
            false;

          owner.draglineTarget =
            null;

          owner.resetPoseOffsets();
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.50;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeInOutSine(t);

          const side =
            owner.grabSide;

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                148,
                eased,
              );

            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -18,
                eased,
              );

            owner.rightArmOffsetX =
              -68 * eased;

            owner.leftArmOffsetX =
              28 * eased;
          } else {
            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -148,
                eased,
              );

            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                18,
                eased,
              );

            owner.leftArmOffsetX =
              68 * eased;

            owner.rightArmOffsetX =
              -28 * eased;
          }

          owner.leftArmOffsetY =
            -22 * eased;

          owner.rightArmOffsetY =
            -22 * eased;

          owner.headOffsetX =
            -side *
            18 *
            eased;

          owner.headOffsetY =
            -8 *
            Math.sin(
              t * Math.PI,
            );

          if (t >= 1) {
            ai.changeState(
              'draglineCast',
              ctx,
            );
          }
        },
      })

      .addState('draglineCast', {
        enter: owner => {
          const groupId =
            owner.attackArmSide ===
            'left'
              ? 'group-3'
              : 'group-4';

          const start =
            owner.armPivotWorld(
              groupId,
            );

          owner.draglineCastStartX =
            start.x;

          owner.draglineCastStartY =
            start.y;

          owner.draglineHookX =
            start.x;

          owner.draglineHookY =
            start.y;

          owner.draglineActive = true;
          owner.draglineAttached = false;
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.38;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const snap =
            easeOutCubic(t);

          const side =
            owner.grabSide;

          owner.draglineHookX =
            lerpValue(
              owner.draglineCastStartX,
              owner.draglineLockedX,
              snap,
            );

          owner.draglineHookY =
            lerpValue(
              owner.draglineCastStartY,
              owner.draglineLockedY,
              snap,
            );

          const reachX =
            clamp(
              (
                owner.draglineLockedX -
                owner.x
              ) *
              0.28,
              -210,
              210,
            );

          const reachY =
            clamp(
              (
                owner.draglineLockedY -
                (
                  owner.y +
                  170
                )
              ) *
              0.22,
              -100,
              125,
            );

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                148,
                8,
                snap,
              );

            owner.leftArmOverride =
              lerpValue(
                -18,
                -78,
                snap,
              );

            owner.rightArmOffsetX =
              lerpValue(
                -68,
                reachX,
                snap,
              );

            owner.rightArmOffsetY =
              lerpValue(
                -22,
                reachY,
                snap,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -148,
                -8,
                snap,
              );

            owner.rightArmOverride =
              lerpValue(
                18,
                78,
                snap,
              );

            owner.leftArmOffsetX =
              lerpValue(
                68,
                reachX,
                snap,
              );

            owner.leftArmOffsetY =
              lerpValue(
                -22,
                reachY,
                snap,
              );
          }

          owner.headOffsetX =
            lerpValue(
              -side * 18,
              side * 8,
              snap,
            );

          const target =
            owner.resolveGrabTarget(
              ctx,
            );

          if (
            target &&
            !(
              target
                .dashInvulnerabilityTimer >
              0
            ) &&
            owner.circleHitsTarget(
              owner.draglineHookX,
              owner.draglineHookY,
              76,
              target,
            )
          ) {
            owner.draglineTarget =
              target;

            owner.draglineDashSerial =
              target.dashSerial ?? 0;

            owner.draglineAttached =
              true;

            const catchPoint =
              owner.draglineCatchPoint();

            owner.draglineInitialDistance =
              Math.max(
                1,
                Math.hypot(
                  target.x -
                    catchPoint.x,
                  target.y -
                    catchPoint.y,
                ),
              );

            owner.draglineSqueezeTimer =
              0.22;

            owner.draglineSqueezeCount =
              0;

            owner.draglineSqueezeFlash =
              0;

            ai.changeState(
              'draglineSqueeze',
              ctx,
            );

            return;
          }

          if (t >= 1) {
            owner.clearDragline();

            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      .addState('draglineSqueeze', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const target =
            owner.draglineTarget;

          if (
            !target ||
            target.dead ||
            target.health <= 0
          ) {
            owner.clearDragline();

            ai.changeState(
              'recover',
              ctx,
            );
            return;
          }

          if (
            (
              target.dashSerial ?? 0
            ) !==
            owner.draglineDashSerial
          ) {
            target
              .spawnGrabEscapeTrail
              ?.(target.x, target.y);

            owner.clearDragline();

            ai.changeState(
              'recover',
              ctx,
            );
            return;
          }

          const catchPoint =
            owner.draglineCatchPoint();

          const dx =
            catchPoint.x -
            target.x;

          const dy =
            catchPoint.y -
            target.y;

          const distance =
            Math.hypot(
              dx,
              dy,
            );

          const progress =
            1 -
            clamp(
              distance /
                owner.draglineInitialDistance,
              0,
              1,
            );

          const pullSpeed =
            235 +
            progress * 190;

          if (
            distance >
            0.001
          ) {
            const step =
              Math.min(
                distance,
                pullSpeed * dt,
              );

            owner.pinTargetAt(
              target,
              target.x +
                dx /
                distance *
                step,
              target.y +
                dy /
                distance *
                step,
              world,
            );

            target.vx =
              dx /
              distance *
              pullSpeed;

            target.vy =
              dy /
              distance *
              pullSpeed;

            target.grounded = false;
          }

          owner.draglineHookX =
            target.x;

          owner.draglineHookY =
            target.y;

          owner.draglineSqueezeFlash =
            Math.max(
              0,
              owner.draglineSqueezeFlash -
              dt * 5.4,
            );

          owner.draglineSqueezeTimer -=
            dt;

          if (
            owner.draglineSqueezeTimer <=
            0
          ) {
            let damage = 4;

            if (progress >= 0.72) {
              damage = 14;
            } else if (
              progress >= 0.48
            ) {
              damage = 10;
            } else if (
              progress >= 0.24
            ) {
              damage = 7;
            }

            target.takeDamage?.(
              damage,
            );

            owner.draglineSqueezeCount++;
            owner.draglineSqueezeFlash = 1;
            owner.draglineSqueezeTimer =
              0.43;

            ctx
              .shakeCamera
              ?.(2.1 + damage * 0.13, 0.07);
          }

          const side =
            owner.grabSide;

          const pulse =
            Math.sin(
              owner.draglineSqueezeFlash *
              Math.PI,
            );

          const groupId =
            owner.attackArmSide ===
            'left'
              ? 'group-3'
              : 'group-4';

          const pivot =
            owner.armPivotWorld(
              groupId,
            );

          const stretchX =
            clamp(
              (
                target.x -
                pivot.x
              ) *
              0.18,
              -190,
              190,
            );

          const stretchY =
            clamp(
              (
                target.y -
                pivot.y
              ) *
              0.16,
              -100,
              120,
            );

          if (side > 0) {
            owner.rightArmOverride =
              12 -
              pulse * 18;

            owner.leftArmOverride =
              -72 +
              pulse * 12;

            owner.rightArmOffsetX =
              stretchX -
              pulse * 20;

            owner.rightArmOffsetY =
              stretchY +
              pulse * 9;
          } else {
            owner.leftArmOverride =
              -12 +
              pulse * 18;

            owner.rightArmOverride =
              72 -
              pulse * 12;

            owner.leftArmOffsetX =
              stretchX +
              pulse * 20;

            owner.leftArmOffsetY =
              stretchY +
              pulse * 9;
          }

          owner.headOffsetX =
            -side *
            pulse *
            7;

          owner.headOffsetY =
            pulse * 5;

          const closeEnough =
            distance <= 220 &&
            owner.draglineSqueezeCount >= 3;

          const timedOut =
            ai.stateTime >= 3.2 &&
            owner.draglineSqueezeCount >= 2;

          if (
            closeEnough ||
            timedOut
          ) {
            target.vx =
              side * 145;

            target.vy = 70;
            target.grounded = false;

            owner.clearDragline();

            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      .addState('groundSweepWindup', {
        enter: (
          owner,
          ai,
          ctx,
        ) => {
          const target =
            ai.targetPlayer(ctx);

          owner.sweepDirection =
            target &&
            target.x < owner.x
              ? -1
              : 1;

          owner.attackArmSide =
            owner.sweepDirection > 0
              ? 'right'
              : 'left';

          owner.setAttackArmPose(
            owner.attackArmSide,
            86,
          );

          owner.sweepHit = false;
          owner.sweepX = owner.x;
        },

        update: (
          owner,
          ai,
        ) => {
          if (
            ai.stateTime >=
            0.50
          ) {
            ai.changeState(
              'groundSweep',
            );
          }
        },
      })

      .addState('groundSweep', {
        enter: owner => {
          owner.setAttackArmPose(
            owner.attackArmSide,
            0,
          );
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.36;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          owner.sweepX =
            owner.x +
            owner.sweepDirection *
              lerpValue(
                75,
                650,
                easeOutCubic(t),
              );

          const target =
            ai.targetPlayer(ctx);

          if (
            target &&
            !owner.sweepHit &&
            owner.circleHitsTarget(
              owner.sweepX,
              world.floorY - 58,
              104,
              target,
            )
          ) {
            const result =
              owner.tryRushHit(
                target,
                {
                  x: owner.sweepX,
                  y:
                    world.floorY -
                    58,
                },
                {
                  damage: 18,
                  stabilityCost: 13,
                  knockbackX:
                    owner.sweepDirection *
                    560,
                  knockbackY: -430,
                },
              );

            owner.sweepHit =
              result !== 'miss';

            if (
              result ===
              'parried'
            ) {
              ai.changeState(
                'recover',
                ctx,
              );
              return;
            }
          }

          if (t >= 1) {
            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      .addState('recover', {
        enter: owner => {
          owner.recoverStartY =
            owner.y;

          owner.recoverHeadOffsetX =
            owner.headOffsetX;

          owner.recoverHeadOffsetY =
            owner.headOffsetY;

          owner.recoverLeftArmOffsetX =
            owner.leftArmOffsetX;

          owner.recoverLeftArmOffsetY =
            owner.leftArmOffsetY;

          owner.recoverRightArmOffsetX =
            owner.rightArmOffsetX;

          owner.recoverRightArmOffsetY =
            owner.rightArmOffsetY;

          owner.leftArmOverride =
            owner.leftArmNeutral;

          owner.rightArmOverride =
            owner.rightArmNeutral;
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.64;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeInOutSine(t);

          owner.y =
            lerpValue(
              owner.recoverStartY,
              owner.spawnY,
              eased,
            ) -
            Math.sin(
              t * Math.PI,
            ) *
            7;

          owner.headOffsetX =
            lerpValue(
              owner.recoverHeadOffsetX,
              0,
              eased,
            );

          owner.headOffsetY =
            lerpValue(
              owner.recoverHeadOffsetY,
              0,
              eased,
            );

          owner.leftArmOffsetX =
            lerpValue(
              owner.recoverLeftArmOffsetX,
              0,
              eased,
            );

          owner.leftArmOffsetY =
            lerpValue(
              owner.recoverLeftArmOffsetY,
              0,
              eased,
            );

          owner.rightArmOffsetX =
            lerpValue(
              owner.recoverRightArmOffsetX,
              0,
              eased,
            );

          owner.rightArmOffsetY =
            lerpValue(
              owner.recoverRightArmOffsetY,
              0,
              eased,
            );

          if (t >= 1) {
            owner.clearAttackPose();
            owner.resetPoseOffsets();

            ai.changeState(
              'idle',
              ctx,
            );
          }
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
    if (
      this.ai?.phaseId ===
      'phase3'
    ) {
      return 'phase 3';
    }

    if (
      this.ai?.phaseId ===
      'phase2'
    ) {
      return 'phase 2';
    }

    return 'phase 1';
  }

  setAttackArmPose(
    side,
    magnitude,
  ) {
    const value =
      Math.abs(
        magnitude,
      );

    if (side === 'left') {
      this.activeArmSide = 'left';
      this.leftArmOverride =
        -value;
      this.rightArmOverride =
        null;
    } else {
      this.activeArmSide = 'right';
      this.rightArmOverride =
        value;
      this.leftArmOverride =
        null;
    }
  }

  clearAttackPose() {
    this.leftArmOverride = null;
    this.rightArmOverride = null;
  }

  resetPoseOffsets() {
    this.headOffsetX = 0;
    this.headOffsetY = 0;
    this.leftArmOffsetX = 0;
    this.leftArmOffsetY = 0;
    this.rightArmOffsetX = 0;
    this.rightArmOffsetY = 0;
  }

  predictTarget(
    target,
    seconds,
    world,
  ) {
    if (!target) {
      return {
        x: this.x,
        y: this.y + 190,
      };
    }

    const halfW =
      (target.w ?? 32) / 2;

    const halfH =
      (target.h ?? 56) / 2;

    return {
      x:
        clamp(
          target.x +
            (target.vx ?? 0) *
            seconds,
          halfW,
          world.width - halfW,
        ),
      y:
        clamp(
          target.y +
            (target.vy ?? 0) *
            seconds,
          world.roofY + halfH,
          world.floorY - halfH,
        ),
    };
  }

  pinTargetAt(
    target,
    x,
    y,
    world,
  ) {
    if (!target) return;

    const halfW =
      (target.w ?? 32) / 2;

    const halfH =
      (target.h ?? 56) / 2;

    target.x =
      clamp(
        x,
        halfW,
        world.width - halfW,
      );

    target.y =
      clamp(
        y,
        world.roofY + halfH,
        world.floorY - halfH,
      );

    target.prevY =
      target.y;

    target.grounded = false;
  }

  draglineCatchPoint() {
    return {
      x:
        this.x +
        this.grabSide *
          118,
      y:
        this.y +
        188,
    };
  }

  resolveGrabTarget(context) {
    const target =
      context?.player ?? null;

    if (
      target?.handleIncomingRush &&
      context?.realPlayer
    ) {
      return context.realPlayer;
    }

    return target;
  }

  circleHitsTarget(
    x,
    y,
    radius,
    target,
  ) {
    if (!target) return false;

    const halfW =
      Math.max(
        1,
        (target.w ?? 32) / 2,
      );

    const halfH =
      Math.max(
        1,
        (target.h ?? 56) / 2,
      );

    const dx =
      Math.max(
        Math.abs(
          target.x - x,
        ) -
          halfW,
        0,
      );

    const dy =
      Math.max(
        Math.abs(
          target.y - y,
        ) -
          halfH,
        0,
      );

    return (
      dx * dx +
      dy * dy <=
      radius * radius
    );
  }

  canCommandGrab(target) {
    if (!target) return false;

    const dx =
      Math.abs(
        target.x -
        this.x,
      );

    const dy =
      target.y -
      this.y;

    return (
      dx <= 275 &&
      dy >= 65 &&
      dy <= 455
    );
  }

  tryRushHit(
    target,
    attacker,
    {
      damage,
      stabilityCost,
      knockbackX,
      knockbackY,
    },
  ) {
    if (!target) return 'miss';

    const defense =
      target
        .handleIncomingRush
        ?.(attacker, {
          stabilityCost,
        });

    if (defense?.parried) {
      return 'parried';
    }

    const damaged =
      target.takeDamage?.(
        damage,
      );

    if (!damaged) {
      return 'miss';
    }

    if (
      Number.isFinite(
        knockbackX,
      )
    ) {
      target.vx = knockbackX;
    }

    if (
      Number.isFinite(
        knockbackY,
      )
    ) {
      target.vy = knockbackY;
      target.grounded = false;
    }

    return 'hit';
  }

  pinGrabbedTarget(
    target,
    world,
  ) {
    const halfW =
      (target.w ?? 32) / 2;

    const halfH =
      (target.h ?? 56) / 2;

    const holdX =
      this.x +
      this.grabSide *
        138;

    const holdY =
      this.y +
      210;

    target.x =
      clamp(
        holdX,
        halfW,
        world.width -
          halfW,
      );

    target.y =
      clamp(
        holdY,
        world.roofY +
          halfH,
        world.floorY -
          halfH,
      );

    target.prevY =
      target.y;

    target.vx = 0;
    target.vy = 0;
    target.grounded = false;
  }

  releaseGrabEscape(target) {
    const startX =
      Number.isFinite(
        this.grabHandX,
      )
        ? this.grabHandX
        : (
            this.x +
            this.grabSide *
              138
          );

    const startY =
      Number.isFinite(
        this.grabHandY,
      )
        ? this.grabHandY
        : (
            this.y +
            210
          );

    target
      ?.spawnGrabEscapeTrail
      ?.(startX, startY);

    this.grabbedTarget = null;
  }

  startWallThrow(
    target,
    world,
    preferredDirection = 0,
  ) {
    if (!target) return;

    const halfW =
      (target.w ?? 32) / 2;

    const direction =
      preferredDirection === -1 ||
      preferredDirection === 1
        ? preferredDirection
        : (
            target.x <
            world.width / 2
              ? -1
              : 1
          );

    const wallX =
      direction < 0
        ? halfW
        : world.width -
          halfW;

    const speed = 1250;
    const distance =
      Math.abs(
        wallX -
        target.x,
      );

    this.throwState = {
      target,
      direction,
      startX: target.x,
      startY: target.y,
      wallX,
      elapsed: 0,
      duration:
        Math.max(
          0.16,
          distance /
            speed,
        ),
      dashSerial:
        target.dashSerial ?? 0,
      impactDamage: 26,
    };
  }

  updateThrownTarget(
    dt,
    context,
  ) {
    const state =
      this.throwState;

    if (!state) return;

    const target =
      state.target;

    if (
      !target ||
      target.dead ||
      target.health <= 0
    ) {
      this.throwState = null;
      return;
    }

    if (
      (
        target.dashSerial ?? 0
      ) !==
      state.dashSerial
    ) {
      target
        .spawnGrabEscapeTrail
        ?.(target.x, target.y);

      this.throwState = null;
      return;
    }

    state.elapsed += dt;

    const t =
      clamp(
        state.elapsed /
          state.duration,
        0,
        1,
      );

    target.x =
      lerpValue(
        state.startX,
        state.wallX,
        easeOutCubic(t),
      );

    target.y =
      state.startY -
      Math.sin(
        t *
        Math.PI,
      ) *
        88;

    target.prevY =
      target.y;

    target.vx =
      state.direction *
      1250;

    target.vy = 0;
    target.grounded = false;

    if (t < 1) return;

    target.takeDamage?.(
      state.impactDamage,
    );

    target.vx =
      -state.direction *
      310;

    target.vy = -285;

    context
      ?.shakeCamera
      ?.(7.5, 0.14);

    this.throwState = null;
  }

  clearDragline() {
    this.draglineActive = false;
    this.draglineAttached = false;
    this.draglineTarget = null;
    this.draglineLife = 0;
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
    this.clearAttackPose();
    this.resetPoseOffsets();

    this.animationEvaluationCache
      .clear();

    this.headRasterCache.clear();
    this.leftArmRasterCache.clear();
    this.rightArmRasterCache.clear();

    this.fxEvents.length = 0;
    this.shotSerial = 0;

    this.lastAttack = null;
    this.grabbedTarget = null;
    this.throwState = null;
    this.clearDragline();

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

    if (!context.broken) {
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
    }

    this.updateThrownTarget(
      dt,
      context,
    );

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

    const offsetX =
      groupId === 'group-3'
        ? this.leftArmOffsetX
        : (
            groupId === 'group-4'
              ? this.rightArmOffsetX
              : 0
          );

    const offsetY =
      groupId === 'group-3'
        ? this.leftArmOffsetY
        : (
            groupId === 'group-4'
              ? this.rightArmOffsetY
              : 0
          );

    return {
      x:
        this.x +
        pivot[0] * scale +
        offsetX,
      y:
        this.y +
        pivot[1] * scale +
        offsetY,
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
    if (
      this.leftArmOverride == null &&
      this.rightArmOverride == null &&
      player
    ) {
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
      this.leftArmOverride ??
      (
        this.activeArmSide ===
        'left'
          ? this.desiredArmAngle(
              'group-3',
              player,
              this.leftArmNeutral,
            )
          : this.leftArmRaised
      );

    const rightTarget =
      this.rightArmOverride ??
      (
        this.activeArmSide ===
        'right'
          ? this.desiredArmAngle(
              'group-4',
              player,
              this.rightArmNeutral,
            )
          : this.rightArmRaised
      );

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

  getAnimationEvaluation(
    frameIndex,
  ) {
    if (
      this.animationEvaluationCache
        .has(frameIndex)
    ) {
      return this
        .animationEvaluationCache
        .get(frameIndex);
    }

    const step =
      1 /
      this.animationFrameRate;

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

    this.animationEvaluationCache
      .set(
        frameIndex,
        evaluation,
      );

    return evaluation;
  }

  trimRasterCache(
    cache,
    maxSize,
  ) {
    while (
      cache.size >=
      maxSize
    ) {
      const oldestKey =
        cache.keys()
          .next()
          .value;

      if (
        oldestKey ===
        undefined
      ) {
        break;
      }

      cache.delete(
        oldestKey,
      );
    }
  }

  compileGroupFrame(
    groupId,
    evaluation,
    rotationOverride = null,
    neutralRotation = 0,
  ) {
    const template =
      MONOLITH_GROUP_ASSETS
        .get(groupId);

    const localEvaluation = {
      clip: evaluation.clip,
      parts: evaluation.parts,
      groups:
        new Map(
          evaluation.groups,
        ),
    };

    if (
      rotationOverride != null
    ) {
      const authored =
        evaluation.groups.get(
          groupId,
        );

      const pose = {
        x:
          authored?.x ?? null,
        y:
          authored?.y ?? null,
        rotation:
          authored?.rotation ??
          neutralRotation,
      };

      const idleOffset =
        (
          pose.rotation ??
          neutralRotation
        ) -
        neutralRotation;

      pose.rotation =
        rotationOverride +
        idleOffset;

      localEvaluation.groups.set(
        groupId,
        pose,
      );
    }

    const posed =
      applyAnimationPose(
        template,
        localEvaluation,
      );

    const compiled =
      compileSpriteAsset(
        posed,
      );

    return {
      raster:
        rasterize(
          compiled.shape,
        ),
      glows:
        compiled.glowParts
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
  }

  getCachedGroupFrame(
    cache,
    key,
    maxSize,
    builder,
  ) {
    if (cache.has(key)) {
      return cache.get(key);
    }

    const frame =
      builder();

    this.trimRasterCache(
      cache,
      maxSize,
    );

    cache.set(
      key,
      frame,
    );

    return frame;
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

    const armStep =
      this.armRasterAngleStep;

    const leftAimKey =
      Math.round(
        this.leftArmAngle /
        armStep,
      ) * armStep;

    const rightAimKey =
      Math.round(
        this.rightArmAngle /
        armStep,
      ) * armStep;

    const evaluation =
      this.getAnimationEvaluation(
        frameIndex,
      );

    const head =
      this.getCachedGroupFrame(
        this.headRasterCache,
        frameIndex,
        this.maxHeadRasterCache,
        () =>
          this.compileGroupFrame(
            'group-5',
            evaluation,
          ),
      );

    const leftKey =
      frameIndex +
      ':' +
      leftAimKey;

    const leftArm =
      this.getCachedGroupFrame(
        this.leftArmRasterCache,
        leftKey,
        this.maxArmRasterCache,
        () =>
          this.compileGroupFrame(
            'group-3',
            evaluation,
            leftAimKey,
            this.leftArmNeutral,
          ),
      );

    const rightKey =
      frameIndex +
      ':' +
      rightAimKey;

    const rightArm =
      this.getCachedGroupFrame(
        this.rightArmRasterCache,
        rightKey,
        this.maxArmRasterCache,
        () =>
          this.compileGroupFrame(
            'group-4',
            evaluation,
            rightAimKey,
            this.rightArmNeutral,
          ),
      );

    return {
      layers: [
        {
          id: 'head',
          raster:
            head.raster,
        },
        {
          id: 'left-arm',
          raster:
            leftArm.raster,
        },
        {
          id: 'right-arm',
          raster:
            rightArm.raster,
        },
      ],
      glows: [
        ...head.glows,
        ...leftArm.glows,
        ...rightArm.glows,
      ],
    };
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

  drawPixelLine(
    ctx,
    x1,
    y1,
    x2,
    y2,
    {
      alpha = 1,
      size = 10,
      spacing = 24,
      color = '#9aa0a9',
    } = {},
  ) {
    const dx =
      x2 - x1;

    const dy =
      y2 - y1;

    const distance =
      Math.hypot(
        dx,
        dy,
      );

    const count =
      Math.max(
        1,
        Math.floor(
          distance /
          spacing,
        ),
      );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    for (
      let i = 0;
      i <= count;
      i++
    ) {
      const t =
        i /
        count;

      const x =
        lerpValue(
          x1,
          x2,
          t,
        );

      const y =
        lerpValue(
          y1,
          y2,
          t,
        );

      ctx.fillRect(
        Math.round(
          x -
          size / 2,
        ),
        Math.round(
          y -
          size / 2,
        ),
        size,
        size,
      );
    }

    ctx.restore();
  }

  drawAttackFx(
    ctx,
    cameraX,
  ) {
    const state =
      this.ai.stateName;

    if (
      state ===
      'draglineWindup'
    ) {
      const groupId =
        this.attackArmSide ===
        'left'
          ? 'group-3'
          : 'group-4';

      const start =
        this.armPivotWorld(
          groupId,
        );

      this.drawPixelLine(
        ctx,
        start.x -
          cameraX,
        start.y,
        this.draglineLockedX -
          cameraX,
        this.draglineLockedY,
        {
          alpha: 0.18,
          size: 7,
          spacing: 30,
          color: '#d4d7dc',
        },
      );
    }

    if (
      this.draglineActive
    ) {
      const groupId =
        this.attackArmSide ===
        'left'
          ? 'group-3'
          : 'group-4';

      const start =
        this.armPivotWorld(
          groupId,
        );

      this.drawPixelLine(
        ctx,
        start.x -
          cameraX,
        start.y,
        this.draglineHookX -
          cameraX,
        this.draglineHookY,
        {
          alpha: 0.82,
          size: 10,
          spacing: 22,
          color:
            this.draglineAttached
              ? '#f1f2f4'
              : '#a4a9b1',
        },
      );

      ctx.save();
      ctx.fillStyle =
        '#f1f2f4';

      ctx.fillRect(
        Math.round(
          this.draglineHookX -
          cameraX -
          12,
        ),
        Math.round(
          this.draglineHookY -
          12,
        ),
        24,
        24,
      );

      ctx.restore();
    }

    if (
      state ===
      'groundSweepWindup'
    ) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#d4d7dc';

      const left =
        this.sweepDirection > 0
          ? this.x
          : this.x - 650;

      ctx.fillRect(
        Math.round(
          left -
          cameraX,
        ),
        Math.round(
          this.spawnY +
          332,
        ),
        650,
        8,
      );

      ctx.restore();
    }

    if (
      state ===
      'groundSweep'
    ) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#aeb4bd';

      ctx.fillRect(
        Math.round(
          this.sweepX -
          cameraX -
          44,
        ),
        Math.round(
          this.spawnY +
          328,
        ),
        88,
        16,
      );

      ctx.restore();
    }

    if (
      state ===
      'commandGrab' &&
      this.ai.stateTime >
        0.18
    ) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = '#ffffff';

      ctx.fillRect(
        Math.round(
          this.x +
          this.grabSide *
            138 -
          cameraX -
          15,
        ),
        Math.round(
          this.y +
          195,
        ),
        30,
        30,
      );

      ctx.restore();
    }
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

    this.drawAttackFx(
      ctx,
      cameraX,
    );

    if (
      this.hurtFlash > 0
    ) {
      ctx.save();
      ctx.globalCompositeOperation =
        'screen';

      const head =
        frame.layers.find(
          layer =>
            layer.id ===
            'head',
        );

      if (head) {
        this.drawRasterAtPivot(
          ctx,
          head.raster,
          cameraX,
          artPixelSize,
          this.hurtFlash * 0.78,
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
    if (this.dead) return false;

    const headX =
      this.x +
      this.headHitOffsetX +
      this.headOffsetX;

    const headY =
      this.y +
      this.headHitOffsetY +
      this.headOffsetY;

    return (
      Math.hypot(
        x - headX,
        y - headY,
      ) <=
      this.headHitRadius +
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

    const applied =
      amount *
      (
        this.damageTakenMultiplier ??
        1
      );

    this.health =
      Math.max(
        0,
        this.health - applied,
      );

    this.hurtFlash = 1;

    if (
      this.health <= 0
    ) {
      this.dead = true;
      this.grabbedTarget = null;
      this.throwState = null;
      this.clearDragline();
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
