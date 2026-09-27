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
  scale: 1,
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

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
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
    this.hitRadius = 118;

    this.hurtFlash = 0;
    this.fxEvents = [];
    this.shotSerial = 0;

    this.animationName = 'idle';
    this.animationTime = 0;
    this.animationDuration = 2.4;
    this.animationFrameRate = 24;
    this.animationRasterCache =
      new Map();

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

  animationFrame() {
    const step =
      1 /
      this.animationFrameRate;

    const frameIndex =
      Math.floor(
        this.animationTime /
        step,
      );

    const key =
      String(frameIndex);

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

    const posed =
      applyAnimationPose(
        MONOLITH_SPRITE,
        evaluation,
      );

    const compiled =
      compileSpriteAsset(
        posed,
      );

    const frame = {
      base:
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

    this.drawRasterAtPivot(
      ctx,
      frame.base,
      cameraX,
      artPixelSize,
      1,
    );

    if (
      this.hurtFlash > 0
    ) {
      ctx.save();
      ctx.globalCompositeOperation =
        'screen';

      this.drawRasterAtPivot(
        ctx,
        frame.base,
        cameraX,
        artPixelSize,
        this.hurtFlash * 0.72,
      );

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
