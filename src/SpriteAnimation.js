const EASINGS = Object.freeze({
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeInOut: t =>
    t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInOutSine: t =>
    -(Math.cos(Math.PI * t) - 1) / 2,
  bounceOut: t => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    }

    if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    }

    if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    }

    t -= 2.625 / d1;
    return n1 * t * t + 0.984375;
  },
});

export const SPRITE_EASING_NAMES =
  Object.freeze(
    Object.keys(EASINGS),
  );

export function createDefaultAnimations() {
  return {
    clips: {
      idle: {
        name: 'idle',
        duration: 1,
        loop: true,
        tracks: [],
      },
      fire: {
        name: 'fire',
        duration: 0.25,
        loop: false,
        tracks: [],
      },
      special: {
        name: 'special',
        duration: 0.6,
        loop: false,
        tracks: [],
      },
    },
  };
}

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value),
  );
}

function normalizeKeyframe(
  keyframe,
  duration,
) {
  const easing =
    SPRITE_EASING_NAMES.includes(
      keyframe?.easing,
    )
      ? keyframe.easing
      : 'linear';

  return {
    time: clamp(
      Number(keyframe?.time) || 0,
      0,
      duration,
    ),
    value:
      Number(keyframe?.value) || 0,
    easing,
  };
}

function normalizeTrack(
  track,
  duration,
) {
  const targetType =
    track?.targetType === 'group'
      ? 'group'
      : 'part';

  const property =
    ['x', 'y', 'rotation'].includes(
      track?.property,
    )
      ? track.property
      : 'x';

  const targetId =
    String(
      track?.targetId ?? '',
    );

  const keyframes =
    Array.isArray(track?.keyframes)
      ? track.keyframes
          .map(key =>
            normalizeKeyframe(
              key,
              duration,
            ),
          )
          .sort(
            (a, b) =>
              a.time - b.time,
          )
      : [];

  return {
    id:
      String(
        track?.id ??
        `${targetType}:${targetId}:${property}`,
      ),
    targetType,
    targetId,
    property,
    keyframes,
  };
}

function normalizeClip(
  clip,
  fallbackName,
) {
  const duration = clamp(
    Number(clip?.duration) || 1,
    0.05,
    60,
  );

  return {
    name:
      String(
        clip?.name ??
        fallbackName,
      ),
    duration,
    loop:
      clip?.loop !== false,
    tracks:
      Array.isArray(clip?.tracks)
        ? clip.tracks.map(track =>
            normalizeTrack(
              track,
              duration,
            ),
          )
        : [],
  };
}

export function normalizeAnimations(
  input,
) {
  const result =
    createDefaultAnimations();

  if (
    !input ||
    typeof input !== 'object'
  ) {
    return result;
  }

  const clips =
    input.clips &&
    typeof input.clips === 'object'
      ? input.clips
      : {};

  for (
    const [name, clip]
    of Object.entries(clips)
  ) {
    result.clips[name] =
      normalizeClip(
        clip,
        name,
      );
  }

  return result;
}

export function getAnimationClip(
  animations,
  clipName,
) {
  return (
    normalizeAnimations(
      animations,
    ).clips[clipName] ??
    null
  );
}

function evaluateTrack(
  track,
  time,
  clip,
) {
  const keys =
    track.keyframes ?? [];

  if (!keys.length) return null;
  if (keys.length === 1) {
    return keys[0].value;
  }

  let localTime = time;

  if (
    clip.loop &&
    clip.duration > 0
  ) {
    localTime =
      (
        (
          time %
          clip.duration
        ) +
        clip.duration
      ) %
      clip.duration;
  } else {
    localTime = clamp(
      time,
      0,
      clip.duration,
    );
  }

  if (
    localTime <=
    keys[0].time
  ) {
    return keys[0].value;
  }

  for (
    let i = 0;
    i < keys.length - 1;
    i++
  ) {
    const a = keys[i];
    const b = keys[i + 1];

    if (
      localTime >= a.time &&
      localTime <= b.time
    ) {
      const span = Math.max(
        0.000001,
        b.time - a.time,
      );

      const rawT =
        (
          localTime -
          a.time
        ) /
        span;

      const easing =
        EASINGS[
          b.easing
        ] ??
        EASINGS.linear;

      const t = easing(rawT);

      return (
        a.value +
        (
          b.value -
          a.value
        ) *
        t
      );
    }
  }

  return keys[
    keys.length - 1
  ].value;
}

export function evaluateAnimation(
  animations,
  clipName,
  time,
) {
  const clip =
    getAnimationClip(
      animations,
      clipName,
    );

  const result = {
    clip,
    parts: new Map(),
    groups: new Map(),
  };

  if (!clip) return result;

  for (
    const track
    of clip.tracks
  ) {
    if (!track.targetId) continue;

    const value =
      evaluateTrack(
        track,
        time,
        clip,
      );

    if (value == null) continue;

    const collection =
      track.targetType === 'group'
        ? result.groups
        : result.parts;

    if (
      !collection.has(
        track.targetId,
      )
    ) {
      collection.set(
        track.targetId,
        {
          x: null,
          y: null,
          rotation: null,
        },
      );
    }

    collection.get(
      track.targetId,
    )[track.property] = value;
  }

  return result;
}

function rotatePoint(
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

export function applyAnimationPose(
  inputAsset,
  evaluation,
) {
  const asset =
    clone(inputAsset);

  const groups =
    new Map(
      (
        asset.groups ?? []
      ).map(group => [
        group.id,
        group,
      ]),
    );

  for (
    const part
    of asset.parts ?? []
  ) {
    const partPose =
      evaluation?.parts?.get(
        part.id,
      );

    if (partPose) {
      if (
        partPose.x != null
      ) {
        part.x = partPose.x;
      }

      if (
        partPose.y != null
      ) {
        part.y = partPose.y;
      }

      if (
        partPose.rotation != null
      ) {
        part.rotation =
          partPose.rotation;
      }
    }

    if (
      !part.groupId ||
      !evaluation?.groups?.has(
        part.groupId,
      )
    ) {
      continue;
    }

    const group =
      groups.get(
        part.groupId,
      ) ?? {
        pivot: [0, 0],
      };

    const pose =
      evaluation.groups.get(
        part.groupId,
      );

    const pivot =
      Array.isArray(
        group.pivot,
      )
        ? group.pivot
        : [0, 0];

    const rotation =
      pose.rotation ?? 0;

    const [rx, ry] =
      rotatePoint(
        part.x - pivot[0],
        part.y - pivot[1],
        rotation,
      );

    part.x =
      pivot[0] +
      rx +
      (pose.x ?? 0);

    part.y =
      pivot[1] +
      ry +
      (pose.y ?? 0);

    part.rotation =
      (part.rotation ?? 0) +
      rotation;
  }

  return asset;
}

export function upsertKeyframe(
  clip,
  {
    targetType,
    targetId,
    property,
    time,
    value,
    easing = 'easeInOutSine',
  },
) {
  if (!clip) return null;

  let track =
    clip.tracks.find(
      item =>
        item.targetType ===
          targetType &&
        item.targetId ===
          targetId &&
        item.property ===
          property,
    );

  if (!track) {
    track = {
      id:
        `${targetType}:${targetId}:${property}`,
      targetType,
      targetId,
      property,
      keyframes: [],
    };

    clip.tracks.push(track);
  }

  const normalizedTime =
    clamp(
      Number(time) || 0,
      0,
      clip.duration,
    );

  const existing =
    track.keyframes.find(
      key =>
        Math.abs(
          key.time -
          normalizedTime,
        ) <
        0.0005,
    );

  const safeEasing =
    SPRITE_EASING_NAMES.includes(
      easing,
    )
      ? easing
      : 'linear';

  if (existing) {
    existing.value =
      Number(value) || 0;

    existing.easing =
      safeEasing;
  } else {
    track.keyframes.push({
      time:
        normalizedTime,
      value:
        Number(value) || 0,
      easing:
        safeEasing,
    });

    track.keyframes.sort(
      (a, b) =>
        a.time - b.time,
    );
  }

  return track;
}
