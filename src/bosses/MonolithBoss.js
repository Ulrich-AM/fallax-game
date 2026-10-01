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
    this.bodyRotation = 0;

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
    this.lariatAimRotation = 0;
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
    this.commandGrabWarningLead = 0.36;
    this.commandGrabTelegraphSpawned = false;
    this.grabHoldLocalX = 150;
    this.grabHoldLocalY = 198;
    this.throwHandPrevX = this.x;
    this.throwHandPrevY = this.y;

    this.throwState = null;

    this.piledriverStartX = this.x;
    this.piledriverStartY = this.y;
    this.piledriverTargetX = this.x;
    this.piledriverApexY = this.y;
    this.piledriverImpactY = this.y;
    this.piledriverImpactDone = false;
    this.piledriverWarningLead = 0.52;

    this.dropCatchSide = 1;
    this.dropCatchAimX = this.x;
    this.dropCatchAimY = this.y;
    this.dropCatchHandX = this.x;
    this.dropCatchHandY = this.y;
    this.dropCatchGrabbedTarget = null;
    this.dropCatchDashSerial = 0;
    this.dropCatchStartX = this.x;
    this.dropCatchStartY = this.y;
    this.dropCatchHandPrevX = this.x;
    this.dropCatchHandPrevY = this.y;
    this.groundThrowState = null;

    this.recoverStartY = this.y;
    this.recoverHeadOffsetX = 0;
    this.recoverHeadOffsetY = 0;
    this.recoverLeftArmOffsetX = 0;
    this.recoverLeftArmOffsetY = 0;
    this.recoverRightArmOffsetX = 0;
    this.recoverRightArmOffsetY = 0;
    this.recoverBodyRotation = 0;

    this.sweepDirection = 1;
    this.sweepArmSide = 'right';
    this.sweepHit = false;
    this.sweepX = this.x;
    this.sweepPredictedX = this.x;
    this.sweepTravelDistance = 650;
    this.sweepLowerStartY = this.y;
    this.sweepLowerY = this.y;
    this.sweepDropOffsetY = 0;
    this.sweepDropStartOffsetX = 0;
    this.sweepDropStartOffsetY = 0;

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

          const phaseTwoOrLater =
            ai.phaseId === 'phase2' ||
            ai.phaseId === 'phase3';

          const airborne =
            !target.grounded &&
            target.y <
              world.floorY - 95;

          const options = [
            {
              value: 'lariatSwoop',
              weight:
                distance > 260
                  ? 1.48
                  : 0.72,
            },
            {
              value: 'commandGrab',
              weight:
                distance >= 220 &&
                distance <= 520
                  ? 1.62
                  : 0,
            },
            {
              value: 'groundSweepWindup',
              weight:
                distance < 760
                  ? 0.82
                  : 0.34,
            },
          ];

          if (phaseTwoOrLater) {
            options.push(
              {
                value:
                  'piledriverClasp',
                weight:
                  airborne
                    ? 0.55
                    : 1.25,
              },
              {
                value:
                  'dropCatchWindup',
                weight:
                  airborne
                    ? 1.75
                    : 0,
              },
            );
          }


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

          const aimDx =
            Math.max(
              150,
              Math.abs(
                predicted.x -
                owner.lariatEndX,
              ),
            );

          const aimDy =
            predicted.y -
            owner.lariatTargetY;

          owner.lariatAimRotation =
            clamp(
              Math.atan2(
                aimDy,
                aimDx,
              ) *
              180 /
              Math.PI *
              owner.lariatDirection,
              -28,
              28,
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

          owner.bodyRotation =
            lerpValue(
              0,
              owner.lariatAimRotation *
                0.72,
              eased,
            );

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

          owner.bodyRotation =
            lerpValue(
              owner.lariatAimRotation *
                0.72,
              owner.lariatAimRotation *
                0.78,
              smoothStep01(t),
            );

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

          owner.bodyRotation =
            lerpValue(
              owner.lariatAimRotation *
                0.78,
              owner.lariatAimRotation *
                0.92,
              eased,
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

          owner.bodyRotation =
            lerpValue(
              owner.lariatAimRotation *
                0.92,
              owner.lariatAimRotation,
              snap,
            );

          const target =
            ai.targetPlayer(ctx);

          if (
            target &&
            !owner.lariatHit
          ) {
            const [contactOffsetX, contactOffsetY] =
              rotateLocalPoint(
                direction * 215,
                190,
                owner.bodyRotation,
              );

            const contactX =
              owner.x +
              contactOffsetX;

            const contactY =
              owner.y +
              contactOffsetY;

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

          owner.bodyRotation =
            lerpValue(
              owner.lariatAimRotation,
              clamp(
                owner.lariatAimRotation *
                  1.08,
                -28,
                28,
              ),
              Math.sin(
                t * Math.PI,
              ),
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

          owner.commandGrabWarningLead =
            ctx
              .getAttackWarningLead
              ?.(0.36) ??
            0.36;

          owner.commandGrabTelegraphSpawned =
            false;

          owner.resetPoseOffsets();
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const trackingDuration = 0.38;

          const windDuration =
            trackingDuration +
            owner.commandGrabWarningLead;

          const reachDuration = 0.30;

          const totalDuration =
            windDuration +
            reachDuration;

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

            if (
              time <
              trackingDuration
            ) {
              const liveTarget =
                owner.resolveGrabTarget(
                  ctx,
                );

              const livePrediction =
                owner.predictTarget(
                  liveTarget,
                  0.16,
                  world,
                );

              owner.grabAimX =
                livePrediction.x;

              owner.grabAimY =
                livePrediction.y;
            } else if (
              !owner
                .commandGrabTelegraphSpawned
            ) {
              const liveTarget =
                owner.resolveGrabTarget(
                  ctx,
                );

              const lockedPrediction =
                owner.predictTarget(
                  liveTarget,
                  0.16,
                  world,
                );

              owner.grabAimX =
                lockedPrediction.x;

              owner.grabAimY =
                lockedPrediction.y;

              owner
                .commandGrabTelegraphSpawned =
                true;

              ctx
                .spawnAttackTelegraph
                ?.({
                  x:
                    owner.grabAimX,
                  y:
                    owner.grabAimY,
                  duration:
                    owner
                      .commandGrabWarningLead,
                  scale: 1.02,
                });
            }

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
                  158,
                  eased,
                );

              owner.leftArmOverride =
                lerpValue(
                  owner.leftArmNeutral,
                  -8,
                  eased,
                );

              owner.rightArmOffsetX =
                -104 * eased;

              owner.leftArmOffsetX =
                36 * eased;
            } else {
              owner.leftArmOverride =
                lerpValue(
                  owner.leftArmNeutral,
                  -158,
                  eased,
                );

              owner.rightArmOverride =
                lerpValue(
                  owner.rightArmNeutral,
                  8,
                  eased,
                );

              owner.leftArmOffsetX =
                104 * eased;

              owner.rightArmOffsetX =
                -36 * eased;
            }

            owner.leftArmOffsetY =
              -18 * eased;

            owner.rightArmOffsetY =
              -18 * eased;

            const warningHold =
              clamp(
                (
                  time -
                  trackingDuration
                ) /
                Math.max(
                  0.001,
                  owner
                    .commandGrabWarningLead,
                ),
                0,
                1,
              );

            const tremble =
              Math.sin(
                warningHold *
                Math.PI *
                8,
              ) *
              warningHold *
              4;

            owner.headOffsetX =
              -side *
              (
                22 * eased +
                tremble
              );

            owner.headOffsetY =
              -10 *
              Math.sin(
                t * Math.PI,
              );

            if (side > 0) {
              owner.rightArmOffsetX -=
                tremble * 1.8;
            } else {
              owner.leftArmOffsetX +=
                tremble * 1.8;
            }

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
                158,
                10,
                snap,
              );

            owner.leftArmOverride =
              lerpValue(
                -8,
                -68,
                snap,
              );

            owner.rightArmOffsetX =
              lerpValue(
                -104,
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
                -158,
                -10,
                snap,
              );

            owner.rightArmOverride =
              lerpValue(
                8,
                68,
                snap,
              );

            owner.leftArmOffsetX =
              lerpValue(
                104,
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
            owner.canCommandGrab(
              target,
            ) &&
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

            owner.grabHoldLocalX =
              owner.grabSide * 150;

            owner.grabHoldLocalY =
              198;

            owner.grabHandX =
              owner.x +
              owner.grabHoldLocalX;

            owner.grabHandY =
              owner.y +
              owner.grabHoldLocalY;

            owner.pinTargetAt(
              target,
              owner.grabHandX,
              owner.grabHandY,
              world,
            );

            target.takeDamage?.(4);
            target.vx = 0;
            target.vy = 0;
            target.grounded = false;

            ctx
              .shakeCamera
              ?.(3.6, 0.09);

            ai.changeState(
              'commandGrabLatch',
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

      .addState('commandGrabLatch', {
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

          const t =
            clamp(
              ai.stateTime /
                0.16,
              0,
              1,
            );

          const squeeze =
            Math.sin(
              t * Math.PI,
            );

          owner.grabHandX =
            owner.x +
            owner.grabHoldLocalX;

          owner.grabHandY =
            owner.y +
            owner.grabHoldLocalY;

          owner.pinTargetAt(
            target,
            owner.grabHandX,
            owner.grabHandY,
            world,
          );

          target.vx = 0;
          target.vy = 0;

          if (
            owner.grabSide > 0
          ) {
            owner.rightArmOverride =
              10 -
              squeeze * 16;
          } else {
            owner.leftArmOverride =
              -10 +
              squeeze * 16;
          }

          owner.headOffsetX =
            owner.grabSide *
            squeeze *
            7;

          if (t >= 1) {
            ai.changeState(
              'commandGrabTurn',
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

          owner.grabHandX =
            owner.x +
            owner.grabHoldLocalX;

          owner.grabHandY =
            owner.y +
            owner.grabHoldLocalY;

          owner.pinTargetAt(
            target,
            owner.grabHandX,
            owner.grabHandY,
            world,
          );

          target.vx = 0;
          target.vy = 0;

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
        enter: owner => {
          owner.throwHandPrevX =
            owner.grabHandX;

          owner.throwHandPrevY =
            owner.grabHandY;

          owner.throwReleased =
            false;
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const target =
            owner.grabbedTarget;

          const duration = 0.36;
          const releaseAt = 0.72;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const swingT =
            clamp(
              t /
                releaseAt,
              0,
              1,
            );

          const swing =
            easeInCubic(
              swingT,
            );

          const side =
            owner.grabSide;

          const startAngle =
            side > 0
              ? 2.82
              : 0.32;

          const endAngle =
            side > 0
              ? -0.28
              : Math.PI + 0.28;

          const angle =
            lerpValue(
              startAngle,
              endAngle,
              swing,
            );

          const radius =
            lerpValue(
              108,
              248,
              easeInOutSine(
                swingT,
              ),
            );

          const centerX =
            owner.x;

          const centerY =
            owner.y + 162;

          owner.grabHandX =
            centerX +
            Math.cos(
              angle,
            ) *
            radius;

          owner.grabHandY =
            centerY +
            Math.sin(
              angle,
            ) *
            radius;

          const handVX =
            (
              owner.grabHandX -
              owner.throwHandPrevX
            ) /
            Math.max(
              dt,
              1 / 240,
            );

          const handVY =
            (
              owner.grabHandY -
              owner.throwHandPrevY
            ) /
            Math.max(
              dt,
              1 / 240,
            );

          owner.throwHandPrevX =
            owner.grabHandX;

          owner.throwHandPrevY =
            owner.grabHandY;

          const base =
            owner.baseArmPivotWorld(
              side > 0
                ? 'group-4'
                : 'group-3',
            );

          const armOffsetX =
            clamp(
              (
                owner.grabHandX -
                base.x
              ) *
              0.72,
              -230,
              230,
            );

          const armOffsetY =
            clamp(
              (
                owner.grabHandY -
                base.y
              ) *
              0.52,
              -150,
              150,
            );

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                138,
                -8,
                swing,
              );

            owner.leftArmOverride =
              lerpValue(
                -24,
                -88,
                swing,
              );

            owner.rightArmOffsetX =
              armOffsetX;

            owner.rightArmOffsetY =
              armOffsetY;
          } else {
            owner.leftArmOverride =
              lerpValue(
                -138,
                8,
                swing,
              );

            owner.rightArmOverride =
              lerpValue(
                24,
                88,
                swing,
              );

            owner.leftArmOffsetX =
              armOffsetX;

            owner.leftArmOffsetY =
              armOffsetY;
          }

          owner.headOffsetX =
            side *
            Math.sin(
              swingT *
              Math.PI,
            ) *
            16;

          owner.headOffsetY =
            -Math.sin(
              swingT *
              Math.PI,
            ) *
            9;

          if (
            target &&
            !owner.throwReleased
          ) {
            if (
              (
                target.dashSerial ?? 0
              ) !==
              owner.grabDashSerial
            ) {
              owner.releaseGrabEscape(
                target,
              );

              owner.throwReleased =
                true;

              ai.changeState(
                'recover',
                ctx,
              );
              return;
            }

            owner.pinTargetAt(
              target,
              owner.grabHandX,
              owner.grabHandY,
              world,
            );

            target.vx = 0;
            target.vy = 0;

            if (swingT >= 1) {
              owner.startWallThrow(
                target,
                world,
                side,
                handVX,
                handVY,
              );

              owner.grabbedTarget =
                null;

              owner.throwReleased =
                true;
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

      // PHASE 2: PILEDRIVER
      // Clasp both fists, rise with the arms lagging from inertia, then predict
      // the target and dive into the floor. The hands whip upward during the
      // fall before both plant hard at impact.
      .addState('piledriverClasp', {
        enter: owner => {
          owner.piledriverStartX =
            owner.x;

          owner.piledriverStartY =
            owner.y;

          owner.piledriverImpactDone =
            false;

          owner.resetPoseOffsets();
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

          owner.leftArmOverride =
            lerpValue(
              owner.leftArmNeutral,
              -8,
              eased,
            );

          owner.rightArmOverride =
            lerpValue(
              owner.rightArmNeutral,
              8,
              eased,
            );

          owner.leftArmOffsetX =
            112 * eased;

          owner.rightArmOffsetX =
            -112 * eased;

          owner.leftArmOffsetY =
            30 * eased;

          owner.rightArmOffsetY =
            30 * eased;

          owner.headOffsetY =
            9 *
            Math.sin(
              t * Math.PI,
            );

          if (t >= 1) {
            ai.changeState(
              'piledriverRise',
            );
          }
        },
      })

      .addState('piledriverRise', {
        enter: owner => {
          owner.piledriverStartX =
            owner.x;

          owner.piledriverStartY =
            owner.y;

          owner.piledriverApexY =
            clamp(
              owner.y - 285,
              world.roofY + 150,
              world.floorY - 360,
            );
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.68;
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
              owner.piledriverStartY,
              owner.piledriverApexY,
              eased,
            );

          // The body rises first; the clasped fists trail downward from inertia.
          const lag =
            Math.sin(
              t * Math.PI,
            );

          owner.leftArmOverride =
            -8 -
            lag * 16;

          owner.rightArmOverride =
            8 +
            lag * 16;

          owner.leftArmOffsetX =
            112 -
            lag * 18;

          owner.rightArmOffsetX =
            -112 +
            lag * 18;

          owner.leftArmOffsetY =
            30 +
            lag * 92;

          owner.rightArmOffsetY =
            30 +
            lag * 92;

          owner.headOffsetY =
            lag * 6;

          if (t >= 1) {
            const target =
              ai.targetPlayer(ctx);

            const predicted =
              owner.predictTarget(
                target,
                0.42,
                world,
              );

            owner.piledriverTargetX =
              clamp(
                predicted.x,
                190,
                world.width - 190,
              );

            owner.piledriverStartX =
              owner.x;

            owner.piledriverStartY =
              owner.y;

            owner.piledriverImpactY =
              world.floorY - 250;

            owner.piledriverWarningLead =
              ctx
                .getAttackWarningLead
                ?.(0.52) ??
              0.52;

            ctx
              .spawnAttackTelegraph
              ?.({
                x:
                  owner.piledriverTargetX,
                y:
                  world.floorY - 46,
                duration:
                  owner.piledriverWarningLead,
                scale: 1.16,
              });

            ai.changeState(
              'piledriverAimHold',
              ctx,
            );
          }
        },
      })

      .addState('piledriverAimHold', {
        update: (
          owner,
          ai,
        ) => {
          const t =
            clamp(
              ai.stateTime /
                Math.max(
                  0.001,
                  owner.piledriverWarningLead,
                ),
              0,
              1,
            );

          const tension =
            Math.sin(
              t *
              Math.PI *
              4,
            ) *
            (1 - t);

          owner.y =
            owner.piledriverApexY +
            Math.sin(
              t * Math.PI,
            ) *
            4;

          owner.leftArmOverride =
            -8 -
            tension * 7;

          owner.rightArmOverride =
            8 +
            tension * 7;

          owner.leftArmOffsetX =
            112 -
            tension * 8;

          owner.rightArmOffsetX =
            -112 +
            tension * 8;

          owner.leftArmOffsetY =
            30 +
            tension * 16;

          owner.rightArmOffsetY =
            30 +
            tension * 16;

          owner.headOffsetY =
            -Math.abs(
              tension,
            ) *
            3;

          if (t >= 1) {
            owner.piledriverStartX =
              owner.x;

            owner.piledriverStartY =
              owner.y;

            ai.changeState(
              'piledriverDive',
            );
          }
        },
      })

      .addState('piledriverDive', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.52;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const dive =
            easeInCubic(t);

          owner.x =
            lerpValue(
              owner.piledriverStartX,
              owner.piledriverTargetX,
              easeInOutSine(t),
            );

          owner.y =
            lerpValue(
              owner.piledriverStartY,
              owner.piledriverImpactY,
              dive,
            );

          const leftBase =
            owner.baseArmPivotWorld(
              'group-3',
            );

          const rightBase =
            owner.baseArmPivotWorld(
              'group-4',
            );

          const leftPlantY =
            clamp(
              world.floorY -
                68 -
                leftBase.y,
              -80,
              310,
            );

          const rightPlantY =
            clamp(
              world.floorY -
                68 -
                rightBase.y,
              -80,
              310,
            );

          // As the body reverses into a dive, the heavy clasped hands lag upward.
          // During the final third they whip down into a two-fist plant.
          const upwardLag =
            t < 0.62
              ? (
                  Math.sin(
                    t /
                    0.62 *
                    Math.PI,
                  ) *
                  -112
                )
              : 0;

          const plantT =
            clamp(
              (
                t - 0.62
              ) /
              0.38,
              0,
              1,
            );

          const plant =
            easeInCubic(
              plantT,
            );

          owner.leftArmOverride =
            lerpValue(
              -12,
              -2,
              plant,
            );

          owner.rightArmOverride =
            lerpValue(
              12,
              2,
              plant,
            );

          owner.leftArmOffsetX =
            lerpValue(
              104,
              78,
              plant,
            );

          owner.rightArmOffsetX =
            lerpValue(
              -104,
              -78,
              plant,
            );

          owner.leftArmOffsetY =
            lerpValue(
              36 + upwardLag,
              leftPlantY,
              plant,
            );

          owner.rightArmOffsetY =
            lerpValue(
              36 + upwardLag,
              rightPlantY,
              plant,
            );

          owner.headOffsetY =
            -Math.sin(
              t * Math.PI,
            ) *
            8;

          if (
            t >= 1 &&
            !owner.piledriverImpactDone
          ) {
            owner.piledriverImpactDone =
              true;

            const target =
              ai.targetPlayer(ctx);

            if (
              target &&
              owner.circleHitsTarget(
                owner.piledriverTargetX,
                world.floorY - 46,
                220,
                target,
              )
            ) {
              target.takeDamage?.(
                32,
              );

              const direction =
                target.x <
                owner.piledriverTargetX
                  ? -1
                  : 1;

              target.vx =
                direction * 610;

              target.vy = -520;
              target.grounded = false;
            }

            ctx
              ?.shakeCamera
              ?.(9.2, 0.18);

            ai.changeState(
              'piledriverImpact',
              ctx,
            );
          }
        },
      })

      .addState('piledriverImpact', {
        update: (
          owner,
          ai,
        ) => {
          const duration = 0.26;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const compress =
            Math.sin(
              t * Math.PI,
            );

          owner.y =
            owner.piledriverImpactY +
            compress * 9;

          const leftBase =
            owner.baseArmPivotWorld(
              'group-3',
            );

          const rightBase =
            owner.baseArmPivotWorld(
              'group-4',
            );

          owner.leftArmOffsetX = 78;
          owner.rightArmOffsetX = -78;

          owner.leftArmOffsetY =
            world.floorY -
            68 -
            leftBase.y;

          owner.rightArmOffsetY =
            world.floorY -
            68 -
            rightBase.y;

          owner.leftArmOverride = -2;
          owner.rightArmOverride = 2;

          owner.headOffsetY =
            compress * 7;

          if (t >= 1) {
            owner.piledriverStartY =
              owner.y;

            ai.changeState(
              'piledriverRiseRecover',
            );
          }
        },
      })

      .addState('piledriverRiseRecover', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.86;
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
              owner.piledriverStartY,
              owner.spawnY,
              eased,
            );

          const handRelease =
            smoothStep01(
              clamp(
                (
                  t - 0.12
                ) /
                0.72,
                0,
                1,
              ),
            );

          const leftBase =
            owner.baseArmPivotWorld(
              'group-3',
            );

          const rightBase =
            owner.baseArmPivotWorld(
              'group-4',
            );

          const leftFloorY =
            world.floorY -
            68 -
            leftBase.y;

          const rightFloorY =
            world.floorY -
            68 -
            rightBase.y;

          owner.leftArmOffsetX =
            lerpValue(
              78,
              0,
              handRelease,
            );

          owner.rightArmOffsetX =
            lerpValue(
              -78,
              0,
              handRelease,
            );

          owner.leftArmOffsetY =
            lerpValue(
              leftFloorY,
              0,
              handRelease,
            );

          owner.rightArmOffsetY =
            lerpValue(
              rightFloorY,
              0,
              handRelease,
            );

          owner.leftArmOverride =
            lerpValue(
              -2,
              owner.leftArmNeutral,
              handRelease,
            );

          owner.rightArmOverride =
            lerpValue(
              2,
              owner.rightArmNeutral,
              handRelease,
            );

          owner.headOffsetY =
            Math.sin(
              t * Math.PI,
            ) *
            5;

          if (t >= 1) {
            owner.clearAttackPose();
            owner.resetPoseOffsets();

            ai.changeState(
              'idle',
              ctx,
            );
          }
        },
      })

      // PHASE 2: DROP CATCH
      // Anti-air command grab. The arm winds low/back, predicts the airborne
      // target, reaches upward, locks them to the hand, then whips them down.
      .addState('dropCatchWindup', {
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
              0.30,
              world,
            );

          owner.dropCatchSide =
            predicted.x <
            owner.x
              ? -1
              : 1;

          owner.attackArmSide =
            owner.dropCatchSide > 0
              ? 'right'
              : 'left';

          owner.dropCatchAimX =
            predicted.x;

          owner.dropCatchAimY =
            predicted.y;

          owner.dropCatchStartX =
            owner.x;

          owner.dropCatchStartY =
            owner.y;

          owner.dropCatchGrabbedTarget =
            null;

          owner.resetPoseOffsets();
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.40;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const eased =
            easeInOutSine(t);

          if (t < 0.66) {
            const target =
              owner.resolveGrabTarget(
                ctx,
              );

            const predicted =
              owner.predictTarget(
                target,
                0.26,
                world,
              );

            owner.dropCatchAimX =
              predicted.x;

            owner.dropCatchAimY =
              predicted.y;
          }

          owner.y =
            owner.dropCatchStartY +
            38 * eased;

          const side =
            owner.dropCatchSide;

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                154,
                eased,
              );

            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -10,
                eased,
              );

            owner.rightArmOffsetX =
              -92 * eased;

            owner.rightArmOffsetY =
              72 * eased;

            owner.leftArmOffsetX =
              28 * eased;
          } else {
            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -154,
                eased,
              );

            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                10,
                eased,
              );

            owner.leftArmOffsetX =
              92 * eased;

            owner.leftArmOffsetY =
              72 * eased;

            owner.rightArmOffsetX =
              -28 * eased;
          }

          owner.headOffsetX =
            -side *
            18 *
            eased;

          owner.headOffsetY =
            8 *
            Math.sin(
              t * Math.PI,
            );

          if (t >= 1) {
            const target =
              owner.resolveGrabTarget(
                ctx,
              );

            const predicted =
              owner.predictTarget(
                target,
                0.22,
                world,
              );

            owner.dropCatchAimX =
              predicted.x;

            owner.dropCatchAimY =
              predicted.y;

            ai.changeState(
              'dropCatchReach',
              ctx,
            );
          }
        },
      })

      .addState('dropCatchReach', {
        enter: owner => {
          const groupId =
            owner.dropCatchSide > 0
              ? 'group-4'
              : 'group-3';

          const start =
            owner.baseArmPivotWorld(
              groupId,
            );

          owner.dropCatchHandX =
            start.x;

          owner.dropCatchHandY =
            start.y + 72;
        },

        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.28;
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
            owner.dropCatchSide;

          const groupId =
            side > 0
              ? 'group-4'
              : 'group-3';

          const base =
            owner.baseArmPivotWorld(
              groupId,
            );

          owner.dropCatchHandX =
            lerpValue(
              base.x -
                side * 72,
              owner.dropCatchAimX,
              snap,
            );

          owner.dropCatchHandY =
            lerpValue(
              base.y + 92,
              owner.dropCatchAimY,
              snap,
            );

          const reachX =
            clamp(
              (
                owner.dropCatchHandX -
                base.x
              ) *
              0.80,
              -430,
              430,
            );

          const reachY =
            clamp(
              (
                owner.dropCatchHandY -
                base.y
              ) *
              0.80,
              -420,
              220,
            );

          const aimTarget = {
            x:
              owner.dropCatchHandX,
            y:
              owner.dropCatchHandY,
          };

          const aimAngle =
            owner.desiredArmAngle(
              groupId,
              aimTarget,
              side > 0
                ? owner.rightArmNeutral
                : owner.leftArmNeutral,
            );

          if (side > 0) {
            owner.rightArmOverride =
              lerpValue(
                154,
                aimAngle,
                snap,
              );

            owner.rightArmOffsetX =
              reachX;

            owner.rightArmOffsetY =
              reachY;

            owner.leftArmOverride =
              lerpValue(
                -10,
                -72,
                snap,
              );
          } else {
            owner.leftArmOverride =
              lerpValue(
                -154,
                aimAngle,
                snap,
              );

            owner.leftArmOffsetX =
              reachX;

            owner.leftArmOffsetY =
              reachY;

            owner.rightArmOverride =
              lerpValue(
                10,
                72,
                snap,
              );
          }

          owner.headOffsetX =
            lerpValue(
              -side * 18,
              side * 7,
              snap,
            );

          const target =
            owner.resolveGrabTarget(
              ctx,
            );

          if (
            target &&
            !target.grounded &&
            !(
              target
                .dashInvulnerabilityTimer >
              0
            ) &&
            owner.circleHitsTarget(
              owner.dropCatchHandX,
              owner.dropCatchHandY,
              94,
              target,
            )
          ) {
            owner.dropCatchGrabbedTarget =
              target;

            owner.dropCatchDashSerial =
              target.dashSerial ?? 0;

            owner.pinTargetAt(
              target,
              owner.dropCatchHandX,
              owner.dropCatchHandY,
              world,
            );

            target.takeDamage?.(4);
            target.vx = 0;
            target.vy = 0;
            target.grounded = false;

            ctx
              ?.shakeCamera
              ?.(3.8, 0.09);

            ai.changeState(
              'dropCatchLatch',
              ctx,
            );
            return;
          }

          if (t >= 1) {
            ai.changeState(
              'recover',
              ctx,
            );
          }
        },
      })

      .addState('dropCatchLatch', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const target =
            owner.dropCatchGrabbedTarget;

          if (
            !target ||
            target.dead ||
            target.health <= 0
          ) {
            owner.dropCatchGrabbedTarget =
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
            owner.dropCatchDashSerial
          ) {
            target
              .spawnGrabEscapeTrail
              ?.(owner.dropCatchHandX, owner.dropCatchHandY);

            owner.dropCatchGrabbedTarget =
              null;

            ai.changeState(
              'recover',
              ctx,
            );
            return;
          }

          const t =
            clamp(
              ai.stateTime /
                0.16,
              0,
              1,
            );

          const pulse =
            Math.sin(
              t * Math.PI,
            );

          owner.pinTargetAt(
            target,
            owner.dropCatchHandX,
            owner.dropCatchHandY,
            world,
          );

          target.vx = 0;
          target.vy = 0;

          if (
            owner.dropCatchSide > 0
          ) {
            owner.rightArmOverride -=
              pulse * 14;
          } else {
            owner.leftArmOverride +=
              pulse * 14;
          }

          owner.headOffsetY =
            -pulse * 6;

          if (t >= 1) {
            owner.dropCatchHandPrevX =
              owner.dropCatchHandX;

            owner.dropCatchHandPrevY =
              owner.dropCatchHandY;

            ai.changeState(
              'dropCatchThrow',
              ctx,
            );
          }
        },
      })

      .addState('dropCatchThrow', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const target =
            owner.dropCatchGrabbedTarget;

          if (!target) {
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
            owner.dropCatchDashSerial
          ) {
            target
              .spawnGrabEscapeTrail
              ?.(owner.dropCatchHandX, owner.dropCatchHandY);

            owner.dropCatchGrabbedTarget =
              null;

            ai.changeState(
              'recover',
              ctx,
            );
            return;
          }

          const duration = 0.38;
          const releaseAt = 0.78;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const swingT =
            clamp(
              t /
                releaseAt,
              0,
              1,
            );

          const swing =
            easeInCubic(
              swingT,
            );

          const side =
            owner.dropCatchSide;

          const startX =
            owner.dropCatchAimX;

          const startY =
            owner.dropCatchAimY;

          const endX =
            owner.x +
            side * 165;

          const endY =
            owner.y + 330;

          owner.dropCatchHandX =
            lerpValue(
              startX,
              endX,
              swing,
            ) +
            side *
            Math.sin(
              swingT * Math.PI,
            ) *
            74;

          owner.dropCatchHandY =
            lerpValue(
              startY,
              endY,
              swing,
            );

          const handVX =
            (
              owner.dropCatchHandX -
              owner.dropCatchHandPrevX
            ) /
            Math.max(
              dt,
              1 / 240,
            );

          const handVY =
            (
              owner.dropCatchHandY -
              owner.dropCatchHandPrevY
            ) /
            Math.max(
              dt,
              1 / 240,
            );

          owner.dropCatchHandPrevX =
            owner.dropCatchHandX;

          owner.dropCatchHandPrevY =
            owner.dropCatchHandY;

          const groupId =
            side > 0
              ? 'group-4'
              : 'group-3';

          const base =
            owner.baseArmPivotWorld(
              groupId,
            );

          const reachX =
            clamp(
              (
                owner.dropCatchHandX -
                base.x
              ) *
              0.76,
              -390,
              390,
            );

          const reachY =
            clamp(
              (
                owner.dropCatchHandY -
                base.y
              ) *
              0.72,
              -300,
              330,
            );

          if (side > 0) {
            owner.rightArmOffsetX =
              reachX;

            owner.rightArmOffsetY =
              reachY;

            owner.rightArmOverride =
              lerpValue(
                owner.rightArmAngle,
                6,
                swing,
              );

            owner.leftArmOverride =
              -80;
          } else {
            owner.leftArmOffsetX =
              reachX;

            owner.leftArmOffsetY =
              reachY;

            owner.leftArmOverride =
              lerpValue(
                owner.leftArmAngle,
                -6,
                swing,
              );

            owner.rightArmOverride =
              80;
          }

          owner.pinTargetAt(
            target,
            owner.dropCatchHandX,
            owner.dropCatchHandY,
            world,
          );

          target.vx = 0;
          target.vy = 0;

          if (swingT >= 1) {
            owner.startGroundThrow(
              target,
              handVX,
              handVY,
            );

            owner.dropCatchGrabbedTarget =
              null;

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

          const predicted =
            owner.predictTarget(
              target,
              0.68,
              world,
            );

          owner.sweepPredictedX =
            predicted.x;

          owner.sweepDirection =
            predicted.x <
            owner.x
              ? -1
              : 1;

          owner.sweepTravelDistance =
            clamp(
              Math.abs(
                predicted.x -
                owner.x,
              ) +
                120,
              390,
              760,
            );

          owner.sweepArmSide =
            Math.random() < 0.5
              ? 'left'
              : 'right';

          owner.attackArmSide =
            owner.sweepArmSide;

          owner.sweepLowerStartY =
            owner.y;

          owner.sweepLowerY =
            clamp(
              owner.y + 108,
              world.roofY + 180,
              world.floorY - 255,
            );

          owner.sweepHit = false;
          owner.sweepX = owner.x;

          owner.resetPoseOffsets();
        },

        update: (
          owner,
          ai,
        ) => {
          const duration = 0.44;
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
              owner.sweepLowerStartY,
              owner.sweepLowerY,
              eased,
            );

          owner.headOffsetY =
            Math.sin(
              t * Math.PI,
            ) *
            8;

          owner.headOffsetX =
            -owner.sweepDirection *
            Math.sin(
              t * Math.PI,
            ) *
            5;

          const liftX =
            -owner.sweepDirection *
            52 *
            eased;

          const liftY =
            -132 *
            eased;

          if (
            owner.sweepArmSide ===
            'left'
          ) {
            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -128,
                eased,
              );

            owner.leftArmOffsetX =
              liftX;

            owner.leftArmOffsetY =
              liftY;

            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                30,
                eased,
              );

            owner.rightArmOffsetY =
              18 * eased;
          } else {
            owner.rightArmOverride =
              lerpValue(
                owner.rightArmNeutral,
                128,
                eased,
              );

            owner.rightArmOffsetX =
              liftX;

            owner.rightArmOffsetY =
              liftY;

            owner.leftArmOverride =
              lerpValue(
                owner.leftArmNeutral,
                -30,
                eased,
              );

            owner.leftArmOffsetY =
              18 * eased;
          }

          if (t >= 1) {
            ai.changeState(
              'groundSweepDrop',
            );
          }
        },
      })

      .addState('groundSweepDrop', {
        enter: owner => {
          const groupId =
            owner.sweepArmSide ===
            'left'
              ? 'group-3'
              : 'group-4';

          const pivot =
            owner.baseArmPivotWorld(
              groupId,
            );

          owner.sweepDropStartOffsetX =
            owner.sweepArmSide ===
            'left'
              ? owner.leftArmOffsetX
              : owner.rightArmOffsetX;

          owner.sweepDropStartOffsetY =
            owner.sweepArmSide ===
            'left'
              ? owner.leftArmOffsetY
              : owner.rightArmOffsetY;

          owner.sweepDropOffsetY =
            clamp(
              world.floorY -
                72 -
                pivot.y,
              72,
              300,
            );
        },

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

          // Accelerate the fist into the floor instead of easing gently down.
          const slam =
            easeInCubic(t);

          const targetOffsetX =
            owner.sweepDirection *
            38;

          const offsetX =
            lerpValue(
              owner.sweepDropStartOffsetX,
              targetOffsetX,
              slam,
            );

          const offsetY =
            lerpValue(
              owner.sweepDropStartOffsetY,
              owner.sweepDropOffsetY,
              slam,
            ) +
            Math.sin(
              t * Math.PI,
            ) *
              6;

          if (
            owner.sweepArmSide ===
            'left'
          ) {
            owner.leftArmOverride =
              lerpValue(
                -128,
                -2,
                slam,
              );

            owner.leftArmOffsetX =
              offsetX;

            owner.leftArmOffsetY =
              offsetY;

            owner.rightArmOverride =
              lerpValue(
                28,
                62,
                slam,
              );
          } else {
            owner.rightArmOverride =
              lerpValue(
                128,
                2,
                slam,
              );

            owner.rightArmOffsetX =
              offsetX;

            owner.rightArmOffsetY =
              offsetY;

            owner.leftArmOverride =
              lerpValue(
                -28,
                -62,
                slam,
              );
          }

          owner.headOffsetY =
            -Math.sin(
              t * Math.PI,
            ) *
            7;

          if (t >= 1) {
            ctx
              ?.shakeCamera
              ?.(5.2, 0.10);

            ai.changeState(
              'groundSweepPlant',
              ctx,
            );
          }
        },
      })

      .addState('groundSweepPlant', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.16;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const settle =
            Math.sin(
              t * Math.PI,
            );

          if (
            owner.sweepArmSide ===
            'left'
          ) {
            owner.leftArmOverride =
              -2 -
              settle * 3;

            owner.leftArmOffsetY =
              owner.sweepDropOffsetY +
              settle * 7;

            owner.rightArmOverride =
              62 -
              settle * 5;
          } else {
            owner.rightArmOverride =
              2 +
              settle * 3;

            owner.rightArmOffsetY =
              owner.sweepDropOffsetY +
              settle * 7;

            owner.leftArmOverride =
              -62 +
              settle * 5;
          }

          owner.headOffsetY =
            settle * 5;

          if (t >= 1) {
            ai.changeState(
              'groundSweep',
              ctx,
            );
          }
        },
      })

      .addState('groundSweep', {
        update: (
          owner,
          ai,
          dt,
          ctx,
        ) => {
          const duration = 0.52;
          const t =
            clamp(
              ai.stateTime /
                duration,
              0,
              1,
            );

          const slide =
            easeInOutSine(t);

          const slideOffsetX =
            owner.sweepDirection *
            lerpValue(
              34,
              Math.max(
                320,
                owner.sweepTravelDistance -
                  70,
              ),
              slide,
            );

          const slideOffsetY =
            owner.sweepDropOffsetY +
            Math.sin(
              t * Math.PI,
            ) *
            5;

          if (
            owner.sweepArmSide ===
            'left'
          ) {
            owner.leftArmOverride =
              -4 +
              Math.sin(
                t * Math.PI,
              ) *
              5;

            owner.leftArmOffsetX =
              slideOffsetX;

            owner.leftArmOffsetY =
              slideOffsetY;

            owner.rightArmOverride =
              58 -
              Math.sin(
                t * Math.PI,
              ) *
              8;
          } else {
            owner.rightArmOverride =
              4 -
              Math.sin(
                t * Math.PI,
              ) *
              5;

            owner.rightArmOffsetX =
              slideOffsetX;

            owner.rightArmOffsetY =
              slideOffsetY;

            owner.leftArmOverride =
              -58 +
              Math.sin(
                t * Math.PI,
              ) *
              8;
          }

          owner.headOffsetX =
            -owner.sweepDirection *
            Math.sin(
              t * Math.PI,
            ) *
            8;

          owner.sweepX =
            owner.x +
            owner.sweepDirection *
            lerpValue(
              105,
              owner.sweepTravelDistance,
              slide,
            );

          const target =
            ai.targetPlayer(ctx);

          if (
            target &&
            !owner.sweepHit &&
            owner.circleHitsTarget(
              owner.sweepX,
              world.floorY - 52,
              96,
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
                    52,
                },
                {
                  damage: 18,
                  stabilityCost: 13,
                  knockbackX:
                    owner.sweepDirection *
                    570,
                  knockbackY: -420,
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

          owner.recoverBodyRotation =
            owner.bodyRotation;

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

          owner.bodyRotation =
            lerpValue(
              owner.recoverBodyRotation,
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

  get debugAttackName() {
    const state =
      this.ai?.stateName ?? '';

    if (
      state.startsWith(
        'lariat',
      )
    ) {
      return 'LARIAT';
    }

    if (
      state ===
        'commandGrab' ||
      state ===
        'commandGrabLatch' ||
      state ===
        'commandGrabWhiff'
    ) {
      return 'COMMAND GRAB';
    }

    if (
      state ===
        'commandGrabTurn' ||
      state ===
        'commandGrabRelease'
    ) {
      return 'WALL TOSS';
    }

    if (
      state.startsWith(
        'piledriver',
      )
    ) {
      return 'PILEDRIVER';
    }

    if (
      state.startsWith(
        'dropCatch',
      )
    ) {
      return 'DROP CATCH';
    }

    if (
      state ===
        'groundSweepWindup' ||
      state ===
        'groundSweepDrop' ||
      state ===
        'groundSweepPlant' ||
      state ===
        'groundSweep'
    ) {
      return 'GROUND SWEEP';
    }

    if (state === 'recover') {
      return 'RECOVER';
    }

    if (state === 'idle') {
      return 'IDLE';
    }

    return state;
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
    this.bodyRotation = 0;
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
      dx >= 205 &&
      dx <= 525 &&
      dy >= 35 &&
      dy <= 520
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

  startGroundThrow(
    target,
    handVX = 0,
    handVY = 0,
  ) {
    if (!target) return;

    target.vx =
      clamp(
        handVX * 0.55,
        -720,
        720,
      );

    target.vy =
      clamp(
        Math.max(
          handVY * 1.18,
          980,
        ),
        980,
        1480,
      );

    target.grounded = false;

    this.groundThrowState = {
      target,
      dashSerial:
        target.dashSerial ?? 0,
      impactDamage: 24,
      age: 0,
    };
  }

  updateGroundThrownTarget(
    dt,
    context,
  ) {
    const state =
      this.groundThrowState;

    if (!state) return;

    const target =
      state.target;

    if (
      !target ||
      target.dead ||
      target.health <= 0
    ) {
      this.groundThrowState =
        null;
      return;
    }

    state.age += dt;

    if (
      (
        target.dashSerial ?? 0
      ) !==
      state.dashSerial
    ) {
      target
        .spawnGrabEscapeTrail
        ?.(target.x, target.y);

      this.groundThrowState =
        null;
      return;
    }

    if (
      target.grounded &&
      state.age > 0.06
    ) {
      target.takeDamage?.(
        state.impactDamage,
      );

      target.vy = -330;

      context
        ?.shakeCamera
        ?.(7.0, 0.13);

      this.groundThrowState =
        null;
      return;
    }

    if (state.age > 1.8) {
      this.groundThrowState =
        null;
    }
  }

  startWallThrow(
    target,
    world,
    preferredDirection = 0,
    handVX = 0,
    handVY = 0,
  ) {
    if (!target) return;

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

    const horizontalSpeed =
      clamp(
        Math.abs(
          handVX,
        ) *
        1.35,
        1900,
        2400,
      );

    let verticalSpeed =
      clamp(
        handVY *
        1.03,
        -860,
        360,
      );

    // A grappling throw should leave the player airborne even if the sampled
    // release frame happens to be near the flat end of the hand arc.
    if (
      verticalSpeed >
      -180
    ) {
      verticalSpeed = -260;
    }

    target.vx =
      direction *
      horizontalSpeed;

    target.vy =
      verticalSpeed;

    target.grounded = false;

    this.throwState = {
      target,
      direction,
      dashSerial:
        target.dashSerial ?? 0,
      impactDamage: 26,
      age: 0,
      releaseVX:
        target.vx,
      releaseVY:
        target.vy,
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

    state.age += dt;

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

    const world =
      context?.world;

    if (!world) {
      this.throwState = null;
      return;
    }

    const halfW =
      (target.w ?? 32) / 2;

    const hitWall =
      state.direction < 0
        ? (
            target.x <=
            halfW + 1.5
          )
        : (
            target.x >=
            world.width -
              halfW -
              1.5
          );

    if (
      state.age > 0.05 &&
      hitWall
    ) {
      target.takeDamage?.(
        state.impactDamage,
      );

      target.vx =
        -state.direction *
        Math.max(
          260,
          Math.abs(
            state.releaseVX,
          ) *
          0.22,
        );

      target.vy =
        Math.min(
          -220,
          target.vy ?? 0,
        );

      context
        ?.shakeCamera
        ?.(7.5, 0.14);

      this.throwState = null;
      return;
    }

    if (
      (
        target.grounded &&
        state.age > 0.32
      ) ||
      state.age > 2.2
    ) {
      this.throwState = null;
    }
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
    this.groundThrowState = null;
    this.dropCatchGrabbedTarget =
      null;
    this.piledriverImpactDone =
      false;

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

    this.updateGroundThrownTarget(
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

  baseArmPivotWorld(groupId) {
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

    const [rx, ry] =
      rotateLocalPoint(
        pivot[0] * scale,
        pivot[1] * scale,
        this.bodyRotation,
      );

    return {
      x: this.x + rx,
      y: this.y + ry,
    };
  }

  armPivotWorld(groupId) {
    const base =
      this.baseArmPivotWorld(
        groupId,
      );

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

    const [rx, ry] =
      rotateLocalPoint(
        offsetX,
        offsetY,
        this.bodyRotation,
      );

    return {
      x: base.x + rx,
      y: base.y + ry,
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
          offsetX:
            this.headOffsetX,
          offsetY:
            this.headOffsetY,
        },
        {
          id: 'left-arm',
          raster:
            leftArm.raster,
          offsetX:
            this.leftArmOffsetX,
          offsetY:
            this.leftArmOffsetY,
        },
        {
          id: 'right-arm',
          raster:
            rightArm.raster,
          offsetX:
            this.rightArmOffsetX,
          offsetY:
            this.rightArmOffsetY,
        },
      ],
      glows: [
        ...head.glows.map(
          glow => ({
            ...glow,
            offsetX:
              this.headOffsetX,
            offsetY:
              this.headOffsetY,
          }),
        ),
        ...leftArm.glows.map(
          glow => ({
            ...glow,
            offsetX:
              this.leftArmOffsetX,
            offsetY:
              this.leftArmOffsetY,
          }),
        ),
        ...rightArm.glows.map(
          glow => ({
            ...glow,
            offsetX:
              this.rightArmOffsetX,
            offsetY:
              this.rightArmOffsetY,
          }),
        ),
      ],
    };
  }

  drawRasterAtPivot(
    ctx,
    raster,
    cameraX,
    artPixelSize,
    alpha = 1,
    offsetX = 0,
    offsetY = 0,
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

    ctx.translate(
      Math.round(
        this.x -
        cameraX,
      ),
      Math.round(
        this.y,
      ),
    );

    ctx.rotate(
      this.bodyRotation *
      Math.PI /
      180,
    );

    ctx.drawImage(
      raster,
      Math.round(
        offsetX +
        bounds.minX *
        artPixelSize,
      ),
      Math.round(
        offsetY +
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
    // Grappler attacks are represented by Monolith's actual animated arms.
    // Keep this hook for future dust/impact effects, but avoid surrogate
    // tether lines or floor guide rectangles that disconnect visuals from hitboxes.
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
        glow.offsetX ?? 0,
        glow.offsetY ?? 0,
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
        layer.offsetX ?? 0,
        layer.offsetY ?? 0,
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
          head.offsetX ?? 0,
          head.offsetY ?? 0,
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

    const [headOffsetX, headOffsetY] =
      rotateLocalPoint(
        this.headHitOffsetX +
          this.headOffsetX,
        this.headHitOffsetY +
          this.headOffsetY,
        this.bodyRotation,
      );

    const headX =
      this.x +
      headOffsetX;

    const headY =
      this.y +
      headOffsetY;

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
      this.dropCatchGrabbedTarget =
        null;
      this.throwState = null;
      this.groundThrowState = null;
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
