export const STATUS_EFFECTS =
  Object.freeze({
    fracture:
      Object.freeze({
        id: 'fracture',
        label: 'FRACTURE',
        tags:
          Object.freeze([
            'physical',
            'structural',
          ]),
        threshold: 100,
        buildupDecayDelay: 2.4,
        buildupDecayPerSecond: 14,
        activeDuration: 7.0,
        modifiers:
          Object.freeze({
            staggerTakenMultiplier:
              1.35,
          }),
      }),
  });

export function getStatusEffectDefinition(
  effectId,
) {
  return (
    STATUS_EFFECTS[
      String(
        effectId ?? '',
      ).toLowerCase()
    ] ??
    null
  );
}

export function listStatusEffectDefinitions() {
  return Object.values(
    STATUS_EFFECTS,
  );
}
