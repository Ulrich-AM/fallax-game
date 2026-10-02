import {
  getStatusEffectDefinition,
} from './StatusEffects.js?v=70';

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export class StatusController {
  constructor(
    owner,
    {
      profile = {},
    } = {},
  ) {
    this.owner = owner ?? null;
    this.profile = profile ?? {};
    this.states = new Map();
    this.activationSerial = 0;
    this.lastActivation = null;
    this.lastBuildup = null;
  }

  reset() {
    this.states.clear();
    this.activationSerial = 0;
    this.lastActivation = null;
    this.lastBuildup = null;
  }

  setProfile(profile = {}) {
    this.profile = profile ?? {};
  }

  getProfileEntry(effectId) {
    return (
      this.profile?.[
        effectId
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

    const value =
      Number(
        entry
          ?.susceptibility ??
        1,
      );

    return Number.isFinite(value)
      ? Math.max(0, value)
      : 1;
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

      state.activeTimer =
        Math.max(
          0,
          state.activeTimer -
            step,
        );

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
      Number(fallback);

    if (
      !Number.isFinite(value)
    ) {
      value = 1;
    }

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

      const modifier =
        getStatusEffectDefinition(
          effectId,
        )
          ?.modifiers?.[
            modifierName
          ];

      if (
        Number.isFinite(
          modifier,
        )
      ) {
        value *= modifier;
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
