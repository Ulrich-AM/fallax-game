import {
  rectangle,
  polygon,
  group,
} from './pixelShapes.js?v=44';

export const SPRITE_ASSET_VERSION = 1;
export const SPRITE_DRAFT_STORAGE_KEY = 'bossfights.sprite-drafts.v1';

export const SPRITE_MATERIALS = Object.freeze({
  'dark-gray': Object.freeze({
    id: 'dark-gray',
    label: 'dark gray',
    color: '#3f434a',
    glow: null,
  }),
  gray: Object.freeze({
    id: 'gray',
    label: 'gray',
    color: '#737880',
    glow: null,
  }),
  'light-gray': Object.freeze({
    id: 'light-gray',
    label: 'light gray',
    color: '#a8adb5',
    glow: null,
  }),
  white: Object.freeze({
    id: 'white',
    label: 'white',
    color: '#f4f5f7',
    glow: null,
  }),
  'glow-white': Object.freeze({
    id: 'glow-white',
    label: 'glow white',
    color: '#ffffff',
    glow: Object.freeze({
      color: '#ffffff',
      intensity: 1,
      radius: 22,
    }),
  }),
  'glow-red': Object.freeze({
    id: 'glow-red',
    label: 'glow red',
    color: '#ff7777',
    glow: Object.freeze({
      color: '#ff3d3d',
      intensity: 1,
      radius: 24,
    }),
  }),
  'glow-blue': Object.freeze({
    id: 'glow-blue',
    label: 'glow blue',
    color: '#83b9ff',
    glow: Object.freeze({
      color: '#4b91ff',
      intensity: 1,
      radius: 24,
    }),
  }),
});

const VALID_ASSET_TYPES = new Set([
  'boss',
  'weapon',
  'generic',
]);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeName(value, fallback = 'untitled') {
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return text || fallback;
}

function normalizeOutline(value) {
  if (value === false) {
    return {
      enabled: false,
      color: '#000000',
      thickness: 1,
    };
  }

  const source =
    value && typeof value === 'object'
      ? value
      : {};

  return {
    enabled: source.enabled !== false,
    color:
      typeof source.color === 'string'
        ? source.color
        : '#000000',
    thickness: Math.max(
      1,
      Math.round(
        finite(source.thickness, 1),
      ),
    ),
  };
}

function normalizePoint(value) {
  if (!Array.isArray(value)) return [0, 0];

  return [
    finite(Number(value[0]), 0),
    finite(Number(value[1]), 0),
  ];
}

function normalizeMarker(marker) {
  if (!marker || typeof marker !== 'object') {
    return null;
  }

  return {
    x: finite(Number(marker.x), 0),
    y: finite(Number(marker.y), 0),
    rotation: finite(
      Number(marker.rotation),
      0,
    ),
  };
}

function normalizePart(part, index) {
  if (!part || typeof part !== 'object') {
    throw new Error(
      `Sprite part ${index} is not an object.`,
    );
  }

  const type = part.type;

  if (
    type !== 'polygon' &&
    type !== 'rectangle'
  ) {
    throw new Error(
      `Sprite part ${index} has unsupported type "${type}".`,
    );
  }

  const material =
    SPRITE_MATERIALS[part.material]
      ? part.material
      : 'gray';

  const normalized = {
    id: sanitizeName(
      part.id,
      `part-${index + 1}`,
    ),
    name:
      String(
        part.name ??
        part.id ??
        `part ${index + 1}`,
      ).trim() ||
      `part ${index + 1}`,
    type,
    material,
    groupId:
      part.groupId == null
        ? null
        : sanitizeName(part.groupId, null),
    x: finite(Number(part.x), 0),
    y: finite(Number(part.y), 0),
    rotation: finite(
      Number(part.rotation),
      0,
    ),
    outline:
      part.outline == null
        ? null
        : normalizeOutline(part.outline),
  };

  if (type === 'polygon') {
    const points = Array.isArray(part.points)
      ? part.points.map(normalizePoint)
      : [];

    if (points.length < 3) {
      throw new Error(
        `Polygon "${normalized.name}" needs at least 3 points.`,
      );
    }

    normalized.points = points;
  } else {
    normalized.width = Math.max(
      0.25,
      finite(Number(part.width), 1),
    );

    normalized.height = Math.max(
      0.25,
      finite(Number(part.height), 1),
    );
  }

  return normalized;
}

export function createSpriteAsset({
  name = 'untitled',
  type = 'generic',
} = {}) {
  return {
    version: SPRITE_ASSET_VERSION,
    name: sanitizeName(name),
    displayName:
      String(name ?? 'untitled').trim() ||
      'untitled',
    type: VALID_ASSET_TYPES.has(type)
      ? type
      : 'generic',
    scale: 1,
    pivot: [0, 0],
    parts: [],
    groups: [],
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
    metadata: {
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    },
  };
}

export function normalizeSpriteAsset(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Sprite asset must be an object.');
  }

  const type =
    VALID_ASSET_TYPES.has(input.type)
      ? input.type
      : 'generic';

  const asset = {
    version: SPRITE_ASSET_VERSION,
    name: sanitizeName(input.name),
    displayName:
      String(
        input.displayName ??
        input.name ??
        'untitled',
      ).trim() ||
      'untitled',
    type,
    scale: Math.max(
      0.1,
      Math.min(
        8,
        finite(
          Number(input.scale),
          1,
        ),
      ),
    ),
    pivot: normalizePoint(input.pivot),
    parts: [],
    groups:
      Array.isArray(input.groups)
        ? deepClone(input.groups)
        : [],
    markers: {},
    render: {
      mergeOutlines:
        input.render?.mergeOutlines !== false,
      outline: normalizeOutline(
        input.render?.outline,
      ),
      padding: Math.max(
        0,
        Math.ceil(
          finite(
            Number(input.render?.padding),
            2,
          ),
        ),
      ),
    },
    metadata: {
      createdAt:
        typeof input.metadata?.createdAt === 'string'
          ? input.metadata.createdAt
          : new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    },
  };

  const ids = new Set();

  const parts =
    Array.isArray(input.parts)
      ? input.parts
      : [];

  for (let i = 0; i < parts.length; i++) {
    const part = normalizePart(parts[i], i);

    let id = part.id;
    let suffix = 2;

    while (ids.has(id)) {
      id = `${part.id}-${suffix++}`;
    }

    part.id = id;
    ids.add(id);
    asset.parts.push(part);
  }

  if (
    input.markers &&
    typeof input.markers === 'object'
  ) {
    for (
      const [name, marker]
      of Object.entries(input.markers)
    ) {
      const normalized = normalizeMarker(marker);

      if (normalized) {
        asset.markers[
          sanitizeName(name, 'marker')
        ] = normalized;
      }
    }
  }

  return asset;
}

function primitiveFromPart(
  part,
  pivot,
  scale = 1,
) {
  const material =
    SPRITE_MATERIALS[part.material] ??
    SPRITE_MATERIALS.gray;

  const common = {
    x:
      (part.x - pivot[0]) *
      scale,
    y:
      (part.y - pivot[1]) *
      scale,
    rotation: part.rotation,
    color: material.color,
    outline: part.outline,
  };

  if (part.type === 'rectangle') {
    return rectangle({
      ...common,
      width:
        part.width * scale,
      height:
        part.height * scale,
    });
  }

  return polygon({
    ...common,
    points:
      part.points.map(
        ([x, y]) => [
          x * scale,
          y * scale,
        ],
      ),
  });
}

export function compileSpriteAsset(input) {
  const asset = normalizeSpriteAsset(input);
  const pivot = asset.pivot;
  const scale = asset.scale;

  const parts =
    asset.parts.map(
      part =>
        primitiveFromPart(
          part,
          pivot,
          scale,
        ),
    );

  const shape = group(parts, {
    mergeOutlines:
      asset.render.mergeOutlines,
    outline:
      asset.render.outline,
    padding:
      asset.render.padding,
  });

  const glowParts = asset.parts
    .filter(
      part =>
        !!SPRITE_MATERIALS[
          part.material
        ]?.glow,
    )
    .map(part => {
      const material =
        SPRITE_MATERIALS[part.material];

      return {
        partId: part.id,
        materialId: material.id,
        glow: {
          ...deepClone(material.glow),
          radius:
            material.glow.radius *
            scale,
        },
        shape: group(
          [
            primitiveFromPart(
              part,
              pivot,
              scale,
            ),
          ],
          {
            mergeOutlines: false,
            outline: false,
            padding:
              asset.render.padding,
          },
        ),
      };
    });

  const markers = {};

  for (
    const [name, marker]
    of Object.entries(asset.markers)
  ) {
    markers[name] = {
      x:
        (marker.x - pivot[0]) *
        scale,
      y:
        (marker.y - pivot[1]) *
        scale,
      rotation:
        marker.rotation,
    };
  }

  return {
    asset,
    shape,
    glowParts,
    markers,
    scale,
  };
}

export function serializeSpriteAsset(input, {
  pretty = true,
} = {}) {
  const asset = normalizeSpriteAsset(input);

  return JSON.stringify(
    asset,
    null,
    pretty ? 2 : 0,
  );
}

export function parseSpriteAsset(text) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Invalid sprite JSON: ${error.message}`,
    );
  }

  return normalizeSpriteAsset(parsed);
}

export class SpriteAssetStore {
  constructor(
    storageKey = SPRITE_DRAFT_STORAGE_KEY,
  ) {
    this.storageKey = storageKey;
  }

  readAll() {
    try {
      const raw =
        localStorage.getItem(
          this.storageKey,
        );

      if (!raw) return {};

      const parsed = JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        return {};
      }

      return parsed;
    } catch {
      return {};
    }
  }

  writeAll(value) {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(value),
    );
  }

  list() {
    const drafts = this.readAll();

    return Object.values(drafts)
      .map(asset => {
        try {
          return normalizeSpriteAsset(asset);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name),
      );
  }

  get(name) {
    const key = sanitizeName(name);
    const raw = this.readAll()[key];

    return raw
      ? normalizeSpriteAsset(raw)
      : null;
  }

  save(input) {
    const asset =
      normalizeSpriteAsset(input);

    asset.metadata.updatedAt =
      new Date().toISOString();

    const drafts = this.readAll();
    drafts[asset.name] = asset;
    this.writeAll(drafts);

    return deepClone(asset);
  }

  create(name, type = 'generic') {
    const asset =
      createSpriteAsset({
        name,
        type,
      });

    return this.save(asset);
  }

  delete(name) {
    const key = sanitizeName(name);
    const drafts = this.readAll();

    if (!Object.hasOwn(drafts, key)) {
      return false;
    }

    delete drafts[key];
    this.writeAll(drafts);
    return true;
  }

  has(name) {
    return !!this.get(name);
  }
}

export function getSpriteMaterial(id) {
  return SPRITE_MATERIALS[id] ?? null;
}

export function listSpriteMaterials() {
  return Object.values(
    SPRITE_MATERIALS,
  ).map(material => deepClone(material));
}
