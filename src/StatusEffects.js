export const STATUS_EFFECTS =
  Object.freeze({
    fracture:
      Object.freeze({
        id: 'fracture',
        label: 'FRACTURE',
        activeLabel:
          'FRACTURED',
        tags:
          Object.freeze([
            'physical',
            'structural',
          ]),
        threshold: 100,
        buildupDecayDelay: 2.4,
        buildupDecayPerSecond: 14,
        activeDuration: 7.0,
        roles:
          Object.freeze({
            player:
              Object.freeze({
                modifiers:
                  Object.freeze({
                    staggerTakenMultiplier:
                      1.20,
                  }),
              }),
            boss:
              Object.freeze({
                modifiers:
                  Object.freeze({
                    staggerTakenMultiplier:
                      1.35,
                  }),
              }),
          }),
      }),

    bleed:
      Object.freeze({
        id: 'bleed',
        label: 'BLEED',
        activeLabel:
          'BLEEDING',
        tags:
          Object.freeze([
            'physical',
            'biological',
          ]),
        threshold: 100,
        buildupDecayDelay: 2.0,
        buildupDecayPerSecond: 18,
        activeDuration: 6.0,
        tickInterval: 0.5,
        roles:
          Object.freeze({
            player:
              Object.freeze({
                damagePerSecond: 3.5,
                movementDamageMultiplier:
                  1.65,
                movementReferenceSpeed:
                  610,
              }),
            boss:
              Object.freeze({
                damagePerSecond: 6.0,
              }),
          }),
      }),

    burn:
      Object.freeze({
        id: 'burn',
        label: 'BURN',
        activeLabel:
          'BURNING',
        tags:
          Object.freeze([
            'thermal',
          ]),
        threshold: 100,
        buildupDecayDelay: 1.8,
        buildupDecayPerSecond: 20,
        activeDuration: 5.5,
        tickInterval: 0.5,
        roles:
          Object.freeze({
            player:
              Object.freeze({
                damagePerSecond: 5.0,
                modifiers:
                  Object.freeze({
                    staminaRegenMultiplier:
                      0.65,
                  }),
              }),
            boss:
              Object.freeze({
                damagePerSecond: 7.0,
                modifiers:
                  Object.freeze({
                    staggerDecayMultiplier:
                      0.25,
                  }),
              }),
          }),
      }),

    poison:
      Object.freeze({
        id: 'poison',
        label: 'POISON',
        activeLabel:
          'POISONED',
        tags:
          Object.freeze([
            'chemical',
            'biological',
          ]),
        threshold: 100,
        buildupDecayDelay: 3.0,
        buildupDecayPerSecond: 10,
        activeDuration: 10.0,
        tickInterval: 1.0,
        roles:
          Object.freeze({
            player:
              Object.freeze({
                damagePerSecond: 3.0,
                modifiers:
                  Object.freeze({
                    staminaRegenMultiplier:
                      0.82,
                  }),
              }),
            boss:
              Object.freeze({
                damagePerSecond: 4.5,
              }),
          }),
      }),

    fatigue:
      Object.freeze({
        id: 'fatigue',
        label: 'FATIGUE',
        activeLabel:
          'EXHAUSTED',
        tags:
          Object.freeze([
            'physical',
            'fatigue',
          ]),
        threshold: 100,
        buildupDecayDelay: 1.5,
        buildupDecayPerSecond: 24,
        activeDuration: 8.0,
        roles:
          Object.freeze({
            player:
              Object.freeze({
                modifiers:
                  Object.freeze({
                    maxStaminaMultiplier:
                      0.72,
                    staminaRegenMultiplier:
                      0.60,
                  }),
              }),
            boss:
              Object.freeze({
                modifiers:
                  Object.freeze({
                    staggerDecayMultiplier:
                      0.55,
                    attackDelayMultiplier:
                      1.22,
                  }),
              }),
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
