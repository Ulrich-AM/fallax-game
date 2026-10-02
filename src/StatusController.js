import {
  getStatusEffectDefinition,
} from './StatusEffects.js?v=71';

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function finiteMultiplier(
  value,
  fallback = 1,
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

export class StatusController {
  constructor(
    owner,
    {
      profile = {},
      role = 'boss',
    } = {},
  ) {
    this.owner = owner ?? null;
    this.profile = profile ?? {};
    this.role = role;
    this.states = new Map();
    this.activationSerial = 0;
    this.lastActivation = null;
    this.lastBuildup = null;
    this.lastTick = null;
  }

  reset() {
    this.states.clear();
    this.activationSerial = 0;
    this.lastActivation = null;
    this.lastBuildup = null;
    this.lastTick = null;
  }

  setProfile(profile = {}) {
    this.profile = profile ?? {};
  }

  setRole(role = 'boss') {
    this.role = role;
  }

  getProfileEntry(effectId) {
    return (
      this.profile?.[
        effectId
      ] ??
      null
    );
  }

  getRoleDefinition(
    definition,
  ) {
    return (
      definition
        ?.roles?.[
          this.role
        ] ??
      null
    );
  }

  getSusceptibility(effectId) {
    const entry =
      this.getProfileEntry(
        effectId,
      );

    if (
      entry?.immune === true
    ) {
      return 0;
    }

    const base =
      finiteMultiplier(
        entry
          ?.susceptibility ??
        1,
      );

    const equipment =
      finiteMultiplier(
        this.owner
          ?.combatModifiers
          ?.incomingBuildup
          ?.[effectId] ??
        1,
      );

    return Math.max(
      0,
      base *
        equipment,
    );
  }

  ensureState(effectId) {
    const definition =
      getStatusEffectDefinition(
        effectId,
      );

    if (!definition) {
      return null;
    }

    let state =
      this.states.get(
        definition.id,
      );

    if (!state) {
      state = {
        id:
          definition.id,
        buildup: 0,
        decayDelay: 0,
        activeTimer: 0,
        tickAccumulator: 0,
        activationSerial: 0,
        lastSource: null,
        lastAdded: 0,
      };

      this.states.set(
        definition.id,
        state,
      );
    }

    return state;
  }

  addBuildup(
    effectId,
    amount,
    {
      source = 'unknown',
    } = {},
  ) {
    const definition =
      getStatusEffectDefinition(
        effectId,
      );

    const rawAmount =
      Number(amount);

    if (
      !definition ||
      !Number.isFinite(
        rawAmount,
      ) ||
      rawAmount <= 0
    ) {
      return {
        accepted: false,
        triggered: false,
        added: 0,
        immune: false,
      };
    }

    const susceptibility =
      this.getSusceptibility(
        definition.id,
      );

    if (
      susceptibility <= 0
    ) {
      return {
        accepted: false,
        triggered: false,
        added: 0,
        immune: true,
      };
    }

    const state =
      this.ensureState(
        definition.id,
      );

    const added =
      Math.max(
        0,
        rawAmount *
          susceptibility,
      );

    state.buildup =
      Math.min(
        definition.threshold,
        state.buildup +
          added,
      );

    state.decayDelay =
      definition
        .buildupDecayDelay;

    state.lastSource = source;
    state.lastAdded = added;

    this.lastBuildup = {
      effectId:
        definition.id,
      source,
      added,
      susceptibility,
      buildup:
        state.buildup,
      threshold:
        definition.threshold,
    };

    let triggered = false;

    if (
      state.buildup >=
      definition.threshold
    ) {
      state.buildup = 0;
      state.decayDelay = 0;
      state.activeTimer =
        definition
          .activeDuration;
      state.tickAccumulator = 0;
      state.activationSerial++;
      this.activationSerial++;

      this.lastActivation = {
        effectId:
          definition.id,
        source,
        serial:
          this.activationSerial,
        duration:
          state.activeTimer,
      };

      triggered = true;
    }

    return {
      accepted: true,
      triggered,
      added,
      immune: false,
      buildup:
        state.buildup,
      threshold:
        definition.threshold,
      activeTimer:
        state.activeTimer,
    };
  }

  applyStatusDamage(
    definition,
    amount,
  ) {
    if (
      !this.owner ||
      this.owner.dead ||
      amount <= 0
    ) {
      return false;
    }

    const multiplier =
      finiteMultiplier(
        this.owner
          ?.combatModifiers
          ?.statusDamageTaken
          ?.[definition.id] ??
        1,
      );

    const applied =
      amount *
      Math.max(
        0,
        multiplier,
      );

    if (applied <= 0) {
      return false;
    }

    let accepted = false;

    if (
      typeof this.owner
        .takeContinuousDamage ===
      'function'
    ) {
      accepted =
        this.owner
          .takeContinuousDamage(
            applied,
          ) !== false;
    } else if (
      typeof this.owner
        .takeDamage ===
      'function'
    ) {
      accepted =
        this.owner
          .takeDamage(
            applied,
          ) !== false;
    }

    if (accepted) {
      this.lastTick = {
        effectId:
          definition.id,
        damage:
          applied,
      };
    }

    return accepted;
  }

  applyActiveTick(
    definition,
    interval,
  ) {
    const roleDefinition =
      this.getRoleDefinition(
        definition,
      );

    const dps =
      Number(
        roleDefinition
          ?.damagePerSecond ??
        0,
      );

    if (
      !Number.isFinite(dps) ||
      dps <= 0
    ) {
      return;
    }

    let multiplier = 1;

    const movementMultiplier =
      Number(
        roleDefinition
          ?.movementDamageMultiplier,
      );

    if (
      Number.isFinite(
        movementMultiplier,
      ) &&
      movementMultiplier > 1
    ) {
      const referenceSpeed =
        Math.max(
          1,
          Number(
            roleDefinition
              ?.movementReferenceSpeed ??
            600,
          ) || 600,
        );

      const speed =
        Math.hypot(
          Number(
            this.owner?.vx ??
            0,
          ) || 0,
          Number(
            this.owner?.vy ??
            0,
          ) || 0,
        );

      const movementRatio =
        clamp(
          speed /
            referenceSpeed,
          0,
          1,
        );

      multiplier *=
        1 +
        (
          movementMultiplier -
          1
        ) *
        movementRatio;
    }

    this.applyStatusDamage(
      definition,
      dps *
        interval *
        multiplier,
    );
  }

  update(dt) {
    const step =
      Math.max(
        0,
        Number(dt) || 0,
      );

    if (step <= 0) {
      return;
    }

    for (
      const [
        effectId,
        state,
      ]
      of this.states
    ) {
      const definition =
        getStatusEffectDefinition(
          effectId,
        );

      if (!definition) {
        continue;
      }

      const activeStep =
        Math.min(
          step,
          state.activeTimer,
        );

      if (
        activeStep > 0 &&
        definition.tickInterval >
          0
      ) {
        state.tickAccumulator +=
          activeStep;

        while (
          state.tickAccumulator +
            1e-9 >=
          definition.tickInterval
        ) {
          state.tickAccumulator -=
            definition.tickInterval;

          this.applyActiveTick(
            definition,
            definition
              .tickInterval,
          );
        }
      }

      state.activeTimer =
        Math.max(
          0,
          state.activeTimer -
            step,
        );

      if (
        state.activeTimer <= 0
      ) {
        state.tickAccumulator = 0;
      }

      state.decayDelay =
        Math.max(
          0,
          state.decayDelay -
            step,
        );

      if (
        state.activeTimer <= 0 &&
        state.decayDelay <= 0 &&
        state.buildup > 0
      ) {
        state.buildup =
          Math.max(
            0,
            state.buildup -
              definition
                .buildupDecayPerSecond *
                step,
          );
      }

      if (
        state.activeTimer <= 0 &&
        state.buildup <=
          0.0001
      ) {
        state.buildup = 0;
      }
    }
  }

  isActive(effectId) {
    return (
      this.states.get(
        effectId,
      )
        ?.activeTimer >
      0
    );
  }

  getState(effectId) {
    const definition =
      getStatusEffectDefinition(
        effectId,
      );

    if (!definition) {
      return null;
    }

    const state =
      this.states.get(
        definition.id,
      );

    const buildup =
      state?.buildup ??
      0;

    return {
      id:
        definition.id,
      label:
        definition.label,
      activeLabel:
        definition.activeLabel ??
        definition.label,
      threshold:
        definition.threshold,
      buildup,
      buildupRatio:
        clamp(
          buildup /
            definition.threshold,
          0,
          1,
        ),
      activeTimer:
        state?.activeTimer ??
        0,
      active:
        (
          state?.activeTimer ??
          0
        ) > 0,
      susceptibility:
        this.getSusceptibility(
          definition.id,
        ),
      activationSerial:
        state
          ?.activationSerial ??
        0,
    };
  }

  getModifier(
    modifierName,
    fallback = 1,
  ) {
    let value =
      finiteMultiplier(
        fallback,
      );

    for (
      const [
        effectId,
        state,
      ]
      of this.states
    ) {
      if (
        state.activeTimer <=
        0
      ) {
        continue;
      }

      const definition =
        getStatusEffectDefinition(
          effectId,
        );

      const modifier =
        this.getRoleDefinition(
          definition,
        )
          ?.modifiers?.[
            modifierName
          ] ??
        definition
          ?.modifiers?.[
            modifierName
          ];

      if (
        Number.isFinite(
          Number(modifier),
        )
      ) {
        value *=
          Number(modifier);
      }
    }

    return value;
  }

  getHudEntries() {
    const entries = [];

    for (
      const [
        effectId,
        state,
      ]
      of this.states
    ) {
      const definition =
        getStatusEffectDefinition(
          effectId,
        );

      if (!definition) {
        continue;
      }

      const active =
        state.activeTimer >
        0;

      if (
        !active &&
        state.buildup <=
          0.01
      ) {
        continue;
      }

      entries.push({
        id:
          effectId,
        label:
          definition.label,
        activeLabel:
          definition.activeLabel ??
          definition.label,
        active,
        activeTimer:
          state.activeTimer,
        activeDuration:
          definition.activeDuration,
        buildup:
          state.buildup,
        threshold:
          definition.threshold,
        buildupRatio:
          clamp(
            state.buildup /
              definition.threshold,
            0,
            1,
          ),
      });
    }

    return entries;
  }
}
