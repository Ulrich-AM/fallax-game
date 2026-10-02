export function resolveCombatHit(
  target,
  packet = {},
  {
    addStagger = null,
  } = {},
) {
  if (
    !target ||
    target.dead
  ) {
    return {
      hit: false,
      damageApplied: 0,
      staggerApplied: 0,
      buildup: {},
    };
  }

  const damage =
    Math.max(
      0,
      Number(
        packet.damage ??
        0,
      ) || 0,
    );

  const beforeHealth =
    Number.isFinite(
      target.health,
    )
      ? target.health
      : null;

  let damageAccepted = true;

  if (damage > 0) {
    damageAccepted =
      typeof target.takeDamage ===
        'function'
        ? (
            target.takeDamage(
              damage,
              packet.damageOptions ??
                undefined,
            ) !== false
          )
        : false;
  }

  if (!damageAccepted) {
    return {
      hit: false,
      damageApplied: 0,
      staggerApplied: 0,
      buildup: {},
    };
  }

  const buildupResults = {};

  for (
    const [
      effectId,
      amount,
    ]
    of Object.entries(
      packet.buildup ?? {},
    )
  ) {
    if (
      !target.status
        ?.addBuildup
    ) {
      break;
    }

    buildupResults[
      effectId
    ] =
      target.status
        .addBuildup(
          effectId,
          amount,
          {
            source:
              packet.source ??
              'unknown',
          },
        );
  }

  const stagger =
    Math.max(
      0,
      Number(
        packet.stagger ??
        0,
      ) || 0,
    );

  if (
    stagger > 0 &&
    typeof addStagger ===
      'function'
  ) {
    addStagger(
      stagger,
      packet.source ??
        'unknown',
    );
  }

  const afterHealth =
    Number.isFinite(
      target.health,
    )
      ? target.health
      : null;

  return {
    hit: true,
    damageApplied:
      beforeHealth != null &&
      afterHealth != null
        ? Math.max(
            0,
            beforeHealth -
              afterHealth,
          )
        : damage,
    staggerApplied:
      stagger,
    buildup:
      buildupResults,
  };
}
