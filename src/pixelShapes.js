// Reusable procedural pixel-shape renderer.
//
// Shapes are defined in LOCAL ART-PIXEL units, not screen pixels.
// World/physics coordinates remain completely independent from this grid.
// A group can either merge its children into one silhouette/out­line or keep
// an outline around each child separately.

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
    type: 'rectangle', width, height, x, y, rotation, color,
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
    x, y, rotation, color,
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
    const xi = points[i][0], yi = points[i][1];
    const xj = points[j][0], yj = points[j][1];
    const intersects = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function partContains(part, groupRotation, gx, gy) {
  // Transform the sampled group-space point back into the primitive's local space.
  let [x, y] = rotatePoint(gx, gy, -groupRotation);
  x -= part.x ?? 0;
  y -= part.y ?? 0;
  [x, y] = rotatePoint(x, y, -(part.rotation ?? 0));

  if (part.type === 'rectangle') {
    return Math.abs(x) <= part.width / 2 && Math.abs(y) <= part.height / 2;
  }
  if (part.type === 'polygon') return pointInPolygon(x, y, part.points);
  return false;
}

function makeMap(width, height, initial = null) {
  return Array.from({ length: height }, () => Array(width).fill(initial));
}

function drawOutline(ctx, occupied, style) {
  if (!style.enabled) return;
  const h = occupied.length;
  const w = occupied[0]?.length ?? 0;
  const t = style.thickness;
  ctx.fillStyle = style.color;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (occupied[y][x]) continue;
      let neighbor = false;
      for (let oy = -t; oy <= t && !neighbor; oy++) {
        for (let ox = -t; ox <= t; ox++) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox, ny = y + oy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && occupied[ny][nx]) {
            neighbor = true;
            break;
          }
        }
      }
      if (neighbor) ctx.fillRect(x, y, 1, 1);
    }
  }
}

function samplePartMap(part, groupRotation, width, height, minX, minY) {
  const occupied = makeMap(width, height, false);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = minX + x + 0.5;
      const gy = minY + y + 0.5;
      if (partContains(part, groupRotation, gx, gy)) occupied[y][x] = true;
    }
  }
  return occupied;
}

/**
 * Rasterize a group into a tiny canvas whose pixels are "art pixels".
 * Pass a different rotation override for rotating bosses. Player currently uses 0.
 */
export function rasterize(shapeGroup, rotationOverride = null) {
  if (!shapeGroup || shapeGroup.type !== 'group') {
    throw new Error('rasterize() expects a group() shape.');
  }
  if (!shapeGroup.parts.length) {
    const empty = document.createElement('canvas');
    empty.width = empty.height = 1;
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
  const pad = shapeGroup.padding + outlinePad;
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

    // Later parts visually sit on top of earlier parts.
    for (const part of shapeGroup.parts) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const gx = minX + x + 0.5;
          const gy = minY + y + 0.5;
          if (partContains(part, rotation, gx, gy)) {
            occupied[y][x] = true;
            fill[y][x] = part.color;
          }
        }
      }
    }

    drawOutline(ctx, occupied, shapeGroup.outline);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!occupied[y][x]) continue;
        ctx.fillStyle = fill[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  } else {
    // Each piece gets its own outline. Drawing in order means later pieces can
    // naturally cover earlier outlines where shapes overlap.
    for (const part of shapeGroup.parts) {
      const occupied = samplePartMap(part, rotation, width, height, minX, minY);
      const style = outlineStyle(part.outline, shapeGroup.outline);
      drawOutline(ctx, occupied, style);
      ctx.fillStyle = part.color;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (occupied[y][x]) ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  // Kept as metadata so callers can inspect/debug the local raster if needed.
  canvas.shapeBounds = { minX, minY, maxX, maxY };
  return canvas;
}

export function drawPixelShape(ctx, raster, screenX, screenY, artPixelSize, alpha = 1) {
  const dw = raster.width * artPixelSize;
  const dh = raster.height * artPixelSize;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  // Screen-pixel rounding prevents filtered-looking edges. It does NOT snap
  // physics/world coordinates to the larger art-pixel grid.
  const x = Math.round(screenX - dw / 2);
  const y = Math.round(screenY - dh / 2);
  ctx.drawImage(raster, x, y, dw, dh);
  ctx.restore();
}
