function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function fillPolygon(
  ctx,
  points,
  offsetX,
  offsetY,
  scale,
) {
  if (!points?.length) return;

  ctx.beginPath();

  ctx.moveTo(
    Math.round(
      offsetX +
      points[0][0] *
      scale,
    ),
    Math.round(
      offsetY +
      points[0][1] *
      scale,
    ),
  );

  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    ctx.lineTo(
      Math.round(
        offsetX +
        points[i][0] *
        scale,
      ),
      Math.round(
        offsetY +
        points[i][1] *
        scale,
      ),
    );
  }

  ctx.closePath();
  ctx.fill();
}

const EXCLAMATION_BODY = [
  [-2, -13],
  [2, -13],
  [3, -11],
  [2, -3],
  [1, 2],
  [-1, 2],
  [-2, -3],
  [-3, -11],
];

const EXCLAMATION_DOT = [
  [-2, 5],
  [2, 5],
  [2, 9],
  [-2, 9],
];

const EXCLAMATION_POINTER = [
  [-2, 12],
  [2, 12],
  [0, 16],
];

const TARGET_DIAMOND = [
  [0, -3],
  [3, 0],
  [0, 3],
  [-3, 0],
];

export class AttackTelegraphSystem {
  constructor() {
    this.telegraphs = [];
    this.serial = 0;

    // Future upgrades can increase this without changing boss attack code.
    // The bosses ask getLeadTime() before committing a warned attack.
    this.leadBonus = 0;
  }

  getLeadTime(
    baseSeconds = 0.34,
  ) {
    return Math.max(
      0.06,
      baseSeconds +
      this.leadBonus,
    );
  }

  setLeadBonus(seconds = 0) {
    const value =
      Number(seconds);

    this.leadBonus =
      Number.isFinite(value)
        ? Math.max(0, value)
        : 0;

    return this.leadBonus;
  }

  spawn({
    x,
    y,
    duration = 0.34,
    scale = 1,
  } = {}) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      return null;
    }

    const life =
      Math.max(
        0.12,
        duration,
      );

    const telegraph = {
      id:
        ++this.serial,
      x,
      y,
      age: 0,
      duration: life,
      scale:
        Math.max(
          0.65,
          scale,
        ),
    };

    this.telegraphs.push(
      telegraph,
    );

    return telegraph.id;
  }

  clear() {
    this.telegraphs.length = 0;
  }

  update(dt) {
    for (
      let i =
        this.telegraphs.length - 1;
      i >= 0;
      i--
    ) {
      const telegraph =
        this.telegraphs[i];

      telegraph.age += dt;

      if (
        telegraph.age >=
        telegraph.duration
      ) {
        this.telegraphs.splice(
          i,
          1,
        );
      }
    }
  }

  draw(
    ctx,
    cameraX = 0,
  ) {
    for (
      const telegraph
      of this.telegraphs
    ) {
      this.drawOne(
        ctx,
        telegraph,
        cameraX,
      );
    }
  }

  drawOne(
    ctx,
    telegraph,
    cameraX,
  ) {
    const progress =
      clamp(
        telegraph.age /
        telegraph.duration,
        0,
        1,
      );

    const flashRate =
      4 +
      progress * 6;

    const flash =
      0.68 +
      Math.abs(
        Math.sin(
          telegraph.age *
          Math.PI *
          flashRate,
        ),
      ) *
      0.32;

    const pop =
      clamp(
        progress /
        0.14,
        0,
        1,
      );

    const fade =
      progress < 0.58
        ? 1
        : (
            1 -
            clamp(
              (
                progress - 0.58
              ) /
              0.42,
              0,
              1,
            )
          );

    const pulse =
      1 +
      Math.sin(
        progress *
        Math.PI *
        3,
      ) *
      0.05;

    const pixel =
      4 *
      telegraph.scale *
      pulse *
      (
        0.78 +
        pop * 0.22
      );

    const x =
      Math.round(
        telegraph.x -
        cameraX,
      );

    const targetY =
      Math.round(
        telegraph.y,
      );

    const iconY =
      Math.round(
        targetY -
        82 -
        (1 - pop) * 18,
      );

    ctx.save();

    ctx.globalAlpha =
      0.58 *
      flash *
      pop *
      fade;

    // Draw the dark backing concentrically, not offset. The old offset
    // became visible as a second translucent exclamation mark.
    ctx.fillStyle =
      '#4a0909';

    fillPolygon(
      ctx,
      EXCLAMATION_BODY,
      x,
      iconY,
      pixel * 1.10,
    );

    fillPolygon(
      ctx,
      EXCLAMATION_DOT,
      x,
      iconY,
      pixel * 1.10,
    );

    fillPolygon(
      ctx,
      EXCLAMATION_POINTER,
      x,
      iconY,
      pixel * 1.10,
    );

    ctx.fillStyle =
      '#ff3b3b';

    fillPolygon(
      ctx,
      EXCLAMATION_BODY,
      x,
      iconY,
      pixel,
    );

    fillPolygon(
      ctx,
      EXCLAMATION_DOT,
      x,
      iconY,
      pixel,
    );

    fillPolygon(
      ctx,
      EXCLAMATION_POINTER,
      x,
      iconY,
      pixel,
    );

    // A small polygon exactly on the locked attack point prevents the
    // floating icon from making the actual danger position ambiguous.
    const targetPulse =
      3.2 +
      Math.sin(
        progress *
        Math.PI *
        6,
      ) *
      0.7;

    ctx.fillStyle =
      '#8e1515';

    fillPolygon(
      ctx,
      TARGET_DIAMOND,
      x,
      targetY,
      targetPulse * 1.35,
    );

    ctx.fillStyle =
      '#ff3b3b';

    fillPolygon(
      ctx,
      TARGET_DIAMOND,
      x,
      targetY,
      targetPulse,
    );

    ctx.restore();
  }
}
