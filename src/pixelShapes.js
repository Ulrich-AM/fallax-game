// Reusable procedural pixel-shape renderer.
//
// Shapes are defined in LOCAL ART-PIXEL units, not screen pixels.
// World/physics coordinates remain completely independent from this grid.
//
// Rendering pipeline:
// 1. transform the mathematical primitives,
// 2. conservatively rasterize the FILL silhouette,
// 3. derive a separate OUTSIDE-only outline mask from that silhouette,
// 4. draw outline first and fill second.
//
// The outline never replaces or consumes a filled art pixel.

function outlineStyle(value, fallback = null) {
  if (value === false) return { enabled: false, color: '#000000', thickness: 1 };
  if (value === true) return { enabled: true, color: '#000000', thickness: 1 };
  if (value && typeof value === 'object') {
    return {
      enabled: value.enabled !== false,
      color: value.color ?? fallback?.color ?? '#000000',
      thickness: Math.max(1, Math.round(value.thickness ?? fallback?.thickness ?? 1)),
    };
  }
  if (fallback) return { ...fallback };
  return { enabled: true, color: '#000000', thickness: 1 };
}

export function rectangle({
  width,
  height,
  x = 0,
  y = 0,
  rotation = 0,
  color = '#ffffff',
  outline = null,
}) {
  return {
    type: 'rectangle',
    width,
    height,
    x,
    y,
    rotation,
    color,
    outline,
  };
}

export function polygon({
  points,
  x = 0,
  y = 0,
  rotation = 0,
  color = '#ffffff',
  outline = null,
}) {
  return {
    type: 'polygon',
    points: points.map(([px, py]) => [px, py]),
    x,
    y,
    rotation,
    color,
    outline,
  };
}

export function group(parts, {
  rotation = 0,
  mergeOutlines = true,
  outline = { enabled: true, color: '#000000', thickness: 1 },
  padding = 2,
} = {}) {
  return {
    type: 'group',
    parts: [...parts],
    rotation,
    mergeOutlines,
    outline: outlineStyle(outline),
    padding: Math.max(0, Math.ceil(padding)),
  };
}

function rotatePoint(x, y, degrees) {
  const r = degrees * Math.PI / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
}

function toGroupPoint(px, py, part, groupRotation) {
  let [x, y] = rotatePoint(px, py, part.rotation ?? 0);
  x += part.x ?? 0;
  y += part.y ?? 0;
  return rotatePoint(x, y, groupRotation);
}

function partVertices(part, groupRotation) {
  if (part.type === 'rectangle') {
    const hw = part.width / 2;
    const hh = part.height / 2;
    return [
      toGroupPoint(-hw, -hh, part, groupRotation),
      toGroupPoint(hw, -hh, part, groupRotation),
      toGroupPoint(hw, hh, part, groupRotation),
      toGroupPoint(-hw, hh, part, groupRotation),
    ];
  }

  return part.points.map(([x, y]) => toGroupPoint(x, y, part, groupRotation));
}

function pointInPolygon(x, y, points) {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];

    const intersects = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function partContains(part, groupRotation, gx, gy) {
  // Bring the sampled point from group space back into the primitive's local space.
  let [x, y] = rotatePoint(gx, gy, -groupRotation);
  x -= part.x ?? 0;
  y -= part.y ?? 0;
  [x, y] = rotatePoint(x, y, -(part.rotation ?? 0));

  if (part.type === 'rectangle') {
    return Math.abs(x) <= part.width / 2 && Math.abs(y) <= part.height / 2;
  }

  if (part.type === 'polygon') {
    return pointInPolygon(x, y, part.points);
  }

  return false;
}

function makeMap(width, height, initial = null) {
  return Array.from({ length: height }, () => Array(width).fill(initial));
}

// Center-only sampling made thin diagonal edges disappear at some angles.
// Sample a 4x4 grid inside each art pixel and retain the pixel once at least
// 25% of it is covered. This is deliberately conservative so rotating shapes
// keep a much more stable apparent size.
const COVERAGE_SAMPLES = 4;
const COVERAGE_THRESHOLD = 0.25;

function pixelCoveredByPart(part, groupRotation, cellX, cellY) {
  let covered = 0;
  const total = COVERAGE_SAMPLES * COVERAGE_SAMPLES;

  for (let sy = 0; sy < COVERAGE_SAMPLES; sy++) {
    for (let sx = 0; sx < COVERAGE_SAMPLES; sx++) {
      const gx = cellX + (sx + 0.5) / COVERAGE_SAMPLES;
      const gy = cellY + (sy + 0.5) / COVERAGE_SAMPLES;

      if (partContains(part, groupRotation, gx, gy)) {
        covered++;
        if (covered / total >= COVERAGE_THRESHOLD) return true;
      }
    }
  }

  return false;
}

function samplePartMap(part, groupRotation, width, height, minX, minY) {
  const occupied = makeMap(width, height, false);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixelCoveredByPart(part, groupRotation, minX + x, minY + y)) {
        occupied[y][x] = true;
      }
    }
  }

  return occupied;
}

// Produces ONLY the pixels outside the fill silhouette.
// Filled pixels can never become outline pixels.
function buildOuterOutlineMask(occupied, thickness) {
  const h = occupied.length;
  const w = occupied[0]?.length ?? 0;
  const outline = makeMap(w, h, false);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!occupied[y][x]) continue;

      for (let oy = -thickness; oy <= thickness; oy++) {
        for (let ox = -thickness; ox <= thickness; ox++) {
          if (ox === 0 && oy === 0) continue;

          const nx = x + ox;
          const ny = y + oy;

          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          if (occupied[ny][nx]) continue;

          outline[ny][nx] = true;
        }
      }
    }
  }

  return outline;
}

function drawMask(ctx, mask, color) {
  ctx.fillStyle = color;

  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < mask[y].length; x++) {
      if (mask[y][x]) ctx.fillRect(x, y, 1, 1);
    }
  }
}

function drawOuterOutline(ctx, occupied, style) {
  if (!style.enabled) return;
  const outlineMask = buildOuterOutlineMask(occupied, style.thickness);
  drawMask(ctx, outlineMask, style.color);
}

/**
 * Rasterize a group into a tiny canvas whose pixels are art pixels.
 * A rotation override is useful for bosses or other rotating procedural shapes.
 */
export function rasterize(shapeGroup, rotationOverride = null) {
  if (!shapeGroup || shapeGroup.type !== 'group') {
    throw new Error('rasterize() expects a group() shape.');
  }

  if (!shapeGroup.parts.length) {
    const empty = document.createElement('canvas');
    empty.width = 1;
    empty.height = 1;
    return empty;
  }

  const rotation = rotationOverride ?? shapeGroup.rotation ?? 0;
  const allVertices = shapeGroup.parts.flatMap(part => partVertices(part, rotation));

  const outlinePad = shapeGroup.mergeOutlines
    ? (shapeGroup.outline.enabled ? shapeGroup.outline.thickness : 0)
    : Math.max(0, ...shapeGroup.parts.map(part => {
        const style = outlineStyle(part.outline, shapeGroup.outline);
        return style.enabled ? style.thickness : 0;
      }));

  // One extra cell protects conservative coverage along the mathematical edge.
  const pad = shapeGroup.padding + outlinePad + 1;

  const minX = Math.floor(Math.min(...allVertices.map(p => p[0]))) - pad;
  const maxX = Math.ceil(Math.max(...allVertices.map(p => p[0]))) + pad;
  const minY = Math.floor(Math.min(...allVertices.map(p => p[1]))) - pad;
  const maxY = Math.ceil(Math.max(...allVertices.map(p => p[1]))) + pad;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  if (shapeGroup.mergeOutlines) {
    const occupied = makeMap(width, height, false);
    const fill = makeMap(width, height, null);

    // Later pieces sit visually on top of earlier pieces, while all child
    // silhouettes are merged before the single outside outline is generated.
    for (const part of shapeGroup.parts) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (pixelCoveredByPart(part, rotation, minX + x, minY + y)) {
            occupied[y][x] = true;
            fill[y][x] = part.color;
          }
        }
      }
    }

    drawOuterOutline(ctx, occupied, shapeGroup.outline);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!occupied[y][x]) continue;
        ctx.fillStyle = fill[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  } else {
    // Independent pieces receive independent outside outlines.
    // Drawing in order lets later pieces naturally cover earlier ones.
    for (const part of shapeGroup.parts) {
      const occupied = samplePartMap(part, rotation, width, height, minX, minY);
      const style = outlineStyle(part.outline, shapeGroup.outline);

      drawOuterOutline(ctx, occupied, style);

      ctx.fillStyle = part.color;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (occupied[y][x]) ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  canvas.shapeBounds = { minX, minY, maxX, maxY };
  return canvas;
}

export function drawPixelShape(ctx, raster, screenX, screenY, artPixelSize, alpha = 1) {
  const dw = raster.width * artPixelSize;
  const dh = raster.height * artPixelSize;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  // Screen-pixel rounding keeps hard edges crisp but never snaps the underlying
  // world/physics coordinates to the larger art-pixel grid.
  const x = Math.round(screenX - dw / 2);
  const y = Math.round(screenY - dh / 2);

  ctx.drawImage(raster, x, y, dw, dh);
  ctx.restore();
}
