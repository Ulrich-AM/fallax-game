function multiplyInto(
  target,
  source,
) {
  if (
    !source ||
    typeof source !== 'object'
  ) {
    return;
  }

  for (
    const [
      key,
      rawValue,
    ]
    of Object.entries(source)
  ) {
    const value =
      Number(rawValue);

    if (
      !Number.isFinite(value)
    ) {
      continue;
    }

    target[key] =
      (
        target[key] ??
        1
      ) *
      value;
  }
}

export function buildCombatModifiers(
  items = [],
) {
  const modifiers = {
    outgoingBuildup: {},
    incomingBuildup: {},
    statusDamageTaken: {},
  };

  for (
    const item
    of items
  ) {
    const source =
      item?.combatModifiers;

    if (!source) {
      continue;
    }

    multiplyInto(
      modifiers.outgoingBuildup,
      source.outgoingBuildup,
    );

    multiplyInto(
      modifiers.incomingBuildup,
      source.incomingBuildup,
    );

    multiplyInto(
      modifiers.statusDamageTaken,
      source.statusDamageTaken,
    );
  }

  return modifiers;
}

export function getCombatModifier(
  modifiers,
  group,
  key,
  fallback = 1,
) {
  const value =
    Number(
      modifiers
        ?.[group]
        ?.[key] ??
      fallback,
    );

  return Number.isFinite(value)
    ? value
    : fallback;
}
