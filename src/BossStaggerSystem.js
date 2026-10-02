function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export class BossStaggerSystem {
  constructor() {
    this.maxStagger = 100;
    this.stagger = 0;

    this.decayDelay = 2.0;
    this.decayPerSecond = 9;
    this.decayTimer = 0;

    this.breakDuration = 2.2;
    this.breakTimer = 0;

    this.breakDamageMultiplier = 1.35;

    this.breakSerial = 0;
    this.lastSource = null;
    this.lastAdded = 0;

    this.boss = null;
  }

  reset(
    boss = this.boss,
  ) {
    const previous =
      this.boss;

    if (
      previous &&
      previous !== boss
    ) {
      previous.damageTakenMultiplier = 1;
      previous.combatBroken = false;
    }

    this.boss = boss ?? null;

    this.stagger = 0;
    this.decayTimer = 0;
    this.breakTimer = 0;

    this.lastSource = null;
    this.lastAdded = 0;

    if (this.boss) {
      this.boss.damageTakenMultiplier = 1;
      this.boss.combatBroken = false;
    }
  }

  setBoss(boss) {
    if (boss === this.boss) {
      return;
    }

    if (this.boss) {
      this.boss.damageTakenMultiplier = 1;
      this.boss.combatBroken = false;
    }

    this.reset(boss);
  }

  addStagger(
    amount,
    source = 'unknown',
  ) {
    if (
      !this.boss ||
      this.boss.dead ||
      amount <= 0 ||
      this.breakTimer > 0
    ) {
      return false;
    }

    const statusMultiplier =
      this.boss
        ?.status
        ?.getModifier
        ?.(
          'staggerTakenMultiplier',
          1,
        ) ??
      1;

    const added =
      Math.max(
        0,
        amount *
          statusMultiplier,
      );

    this.stagger =
      Math.min(
        this.maxStagger,
        this.stagger +
          added,
      );

    this.decayTimer =
      this.decayDelay;

    this.lastSource = source;
    this.lastAdded = added;

    if (
      this.stagger >=
      this.maxStagger
    ) {
      this.triggerBreak();
      return true;
    }

    return false;
  }

  triggerBreak() {
    if (
      !this.boss ||
      this.boss.dead
    ) {
      return false;
    }

    this.stagger =
      this.maxStagger;

    this.breakTimer =
      this.breakDuration;

    this.breakSerial++;

    this.boss.damageTakenMultiplier =
      this.breakDamageMultiplier;

    this.boss.combatBroken = true;

    return true;
  }

  update(
    dt,
    boss = this.boss,
  ) {
    this.setBoss(boss);

    if (!this.boss) {
      return;
    }

    if (
      this.boss.dead
    ) {
      this.boss.damageTakenMultiplier = 1;
      this.boss.combatBroken = false;
      return;
    }

    this.decayTimer =
      Math.max(
        0,
        this.decayTimer -
        dt,
      );

    if (
      this.breakTimer > 0
    ) {
      this.breakTimer =
        Math.max(
          0,
          this.breakTimer -
          dt,
        );

      this.boss.damageTakenMultiplier =
        this.breakDamageMultiplier;

      this.boss.combatBroken = true;

      if (
        this.breakTimer <= 0
      ) {
        this.stagger = 0;
        this.decayTimer =
          this.decayDelay;

        this.boss.damageTakenMultiplier = 1;
        this.boss.combatBroken = false;
      }

      return;
    }

    this.boss.damageTakenMultiplier = 1;
    this.boss.combatBroken = false;

    if (
      this.decayTimer <= 0 &&
      this.stagger > 0
    ) {
      this.stagger =
        Math.max(
          0,
          this.stagger -
            this.decayPerSecond *
            dt,
        );
    }
  }

  get isBroken() {
    return this.breakTimer > 0;
  }

  get ratio() {
    return (
      this.maxStagger > 0
        ? clamp(
            this.stagger /
              this.maxStagger,
            0,
            1,
          )
        : 0
    );
  }
}
