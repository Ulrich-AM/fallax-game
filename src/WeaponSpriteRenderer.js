import {
  compileSpriteAsset,
} from './SpriteAssets.js?v=49';
import {
  rasterize,
} from './pixelShapes.js?v=49';

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function angleKey(angleRadians) {
  const degrees =
    angleRadians *
    180 /
    Math.PI;

  const quantized =
    Math.round(degrees / 2) * 2;

  return (
    (quantized % 360) +
    360
  ) % 360;
}

export function drawRasterAtPivot(
  ctx,
  raster,
  pivotX,
  pivotY,
  artPixelSize = 4,
  {
    alpha = 1,
    shadowColor = null,
    shadowBlur = 0,
  } = {},
) {
  const bounds =
    raster.shapeBounds ?? {
      minX:
        -raster.width / 2,
      minY:
        -raster.height / 2,
    };

  const left =
    pivotX +
    bounds.minX *
      artPixelSize;

  const top =
    pivotY +
    bounds.minY *
      artPixelSize;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  if (shadowColor) {
    ctx.shadowColor =
      shadowColor;

    ctx.shadowBlur =
      shadowBlur;
  }

  ctx.drawImage(
    raster,
    Math.round(left),
    Math.round(top),
    raster.width *
      artPixelSize,
    raster.height *
      artPixelSize,
  );

  ctx.restore();
}

export class WeaponSpriteRenderer {
  constructor(asset) {
    this.compiled =
      compileSpriteAsset(asset);

    this.rasterCache =
      new Map();
  }

  getEntry(angleRadians = 0) {
    const key =
      angleKey(angleRadians);

    if (
      this.rasterCache.has(key)
    ) {
      return this.rasterCache.get(
        key,
      );
    }

    const base =
      rasterize(
        this.compiled.shape,
        key,
      );

    const glows =
      this.compiled.glowParts
        .map(part => ({
          color:
            part.glow.color,
          radius:
            part.glow.radius,
          raster:
            rasterize(
              part.shape,
              key,
            ),
        }));

    const entry = {
      angle: key,
      base,
      glows,
      compiled:
        this.compiled,
    };

    this.rasterCache.set(
      key,
      entry,
    );

    return entry;
  }

  draw(
    ctx,
    pivotX,
    pivotY,
    angleRadians,
    artPixelSize = 4,
    {
      glowStrength = 1,
    } = {},
  ) {
    const entry =
      this.getEntry(
        angleRadians,
      );

    if (glowStrength > 0) {
      for (
        const glow
        of entry.glows
      ) {
        drawRasterAtPivot(
          ctx,
          glow.raster,
          pivotX,
          pivotY,
          artPixelSize,
          {
            alpha:
              0.72 *
              glowStrength,
            shadowColor:
              glow.color,
            shadowBlur:
              clamp(
                glow.radius *
                  glowStrength,
                4,
                46,
              ),
          },
        );
      }
    }

    drawRasterAtPivot(
      ctx,
      entry.base,
      pivotX,
      pivotY,
      artPixelSize,
    );

    return entry;
  }
}
