import {
  compileSpriteAsset,
} from './SpriteAssets.js?v=63a';
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

function shiftedShape(shape, offsetX, offsetY) {
  return {
    ...shape,
    parts:
      shape.parts.map(
        part => ({
          ...part,
          x:
            (part.x ?? 0) -
            offsetX,
          y:
            (part.y ?? 0) -
            offsetY,
        }),
      ),
  };
}

export function shouldFlipWeaponSprite(
  asset,
  angleRadians,
) {
  return (
    asset?.type === 'weapon' &&
    asset?.render?.flipOnReverse === true &&
    Math.cos(angleRadians) < -0.000001
  );
}

export function mirrorShapeAcrossLocalX(
  shape,
) {
  return {
    ...shape,
    parts:
      shape.parts.map(part => {
        const mirrored = {
          ...part,
          y: -(part.y ?? 0),
          rotation:
            -(part.rotation ?? 0),
        };

        if (
          part.type === 'polygon'
        ) {
          mirrored.points =
            part.points
              .map(
                ([x, y]) =>
                  [x, -y],
              )
              .reverse();
        }

        return mirrored;
      }),
  };
}

export class WeaponSpriteRenderer {
  constructor(asset) {
    this.compiled =
      compileSpriteAsset(asset);

    this.rasterCache =
      new Map();

    this.centeredRasterCache =
      new Map();

    const base =
      rasterize(
        this.compiled.shape,
        0,
      );

    const bounds =
      base.shapeBounds ?? {
        minX:
          -base.width / 2,
        minY:
          -base.height / 2,
        maxX:
          base.width / 2,
        maxY:
          base.height / 2,
      };

    this.visualCenter = {
      x:
        (bounds.minX +
        bounds.maxX) / 2,
      y:
        (bounds.minY +
        bounds.maxY) / 2,
    };

    this.centeredShape =
      shiftedShape(
        this.compiled.shape,
        this.visualCenter.x,
        this.visualCenter.y,
      );

    this.centeredGlowShapes =
      this.compiled.glowParts
        .map(part => ({
          ...part,
          shape:
            shiftedShape(
              part.shape,
              this.visualCenter.x,
              this.visualCenter.y,
            ),
        }));

    this.flippedShape =
      mirrorShapeAcrossLocalX(
        this.compiled.shape,
      );

    this.flippedGlowParts =
      this.compiled.glowParts
        .map(part => ({
          ...part,
          shape:
            mirrorShapeAcrossLocalX(
              part.shape,
            ),
        }));

    this.flippedCenteredShape =
      mirrorShapeAcrossLocalX(
        this.centeredShape,
      );

    this.flippedCenteredGlowShapes =
      this.centeredGlowShapes
        .map(part => ({
          ...part,
          shape:
            mirrorShapeAcrossLocalX(
              part.shape,
            ),
        }));
  }

  getEntry(angleRadians = 0) {
    const angle =
      angleKey(angleRadians);

    const flipped =
      shouldFlipWeaponSprite(
        this.compiled.asset,
        angleRadians,
      );

    const key =
      `${angle}:${flipped ? 1 : 0}`;

    if (
      this.rasterCache.has(key)
    ) {
      return this.rasterCache.get(
        key,
      );
    }

    const shape =
      flipped
        ? this.flippedShape
        : this.compiled.shape;

    const glowParts =
      flipped
        ? this.flippedGlowParts
        : this.compiled.glowParts;

    const base =
      rasterize(
        shape,
        angle,
      );

    const glows =
      glowParts
        .map(part => ({
          color:
            part.glow.color,
          radius:
            part.glow.radius,
          raster:
            rasterize(
              part.shape,
              angle,
            ),
        }));

    const entry = {
      angle,
      flipped,
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

  getCenteredEntry(angleRadians = 0) {
    const angle =
      angleKey(angleRadians);

    const flipped =
      shouldFlipWeaponSprite(
        this.compiled.asset,
        angleRadians,
      );

    const key =
      `${angle}:${flipped ? 1 : 0}`;

    if (
      this.centeredRasterCache
        .has(key)
    ) {
      return this.centeredRasterCache
        .get(key);
    }

    const shape =
      flipped
        ? this.flippedCenteredShape
        : this.centeredShape;

    const glowShapes =
      flipped
        ? this.flippedCenteredGlowShapes
        : this.centeredGlowShapes;

    const base =
      rasterize(
        shape,
        angle,
      );

    const glows =
      glowShapes
        .map(part => ({
          color:
            part.glow.color,
          radius:
            part.glow.radius,
          raster:
            rasterize(
              part.shape,
              angle,
            ),
        }));

    const entry = {
      angle,
      flipped,
      base,
      glows,
      compiled:
        this.compiled,
      centered: true,
    };

    this.centeredRasterCache.set(
      key,
      entry,
    );

    return entry;
  }

  getMarkerWorldPosition(
    name,
    pivotX,
    pivotY,
    angleRadians,
    artPixelSize = 4,
  ) {
    const marker =
      this.compiled
        .markers[name];

    if (!marker) {
      return {
        x: pivotX,
        y: pivotY,
      };
    }

    const c =
      Math.cos(angleRadians);

    const s =
      Math.sin(angleRadians);

    const localX =
      marker.x *
      artPixelSize;

    const flipped =
      shouldFlipWeaponSprite(
        this.compiled.asset,
        angleRadians,
      );

    const localY =
      (
        flipped
          ? -marker.y
          : marker.y
      ) *
      artPixelSize;

    return {
      x:
        pivotX +
        localX * c -
        localY * s,
      y:
        pivotY +
        localX * s +
        localY * c,
    };
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
