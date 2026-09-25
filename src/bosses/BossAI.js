// Reusable boss AI/state-machine foundation.
//
// Boss-specific files should mostly define:
// - states such as idle, chase, slam, recover
// - phase rules
// - attack cooldowns
// - any unique movement/attack code
//
// Shared timing, targeting, movement helpers, and transitions live here.

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

export function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function directionTo(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

export class BossAI {
  constructor(owner, {
    initialState = null,
    phases = [],
  } = {}) {
    this.owner = owner;
    this.states = new Map();
    this.stateName = null;
    this.stateTime = 0;
    this.initialState = initialState;

    this.cooldowns = new Map();
    this.timers = new Map();

    this.phases = [...phases]
      .map(phase => ({
        id: phase.id,
        atOrBelow: clamp(phase.atOrBelow ?? 1, 0, 1),
        onEnter: phase.onEnter ?? null,
      }))
      .sort((a, b) => b.atOrBelow - a.atOrBelow);

    this.phaseId = null;
  }

  addState(name, definition = {}) {
    this.states.set(name, {
      enter: definition.enter ?? null,
      update: definition.update ?? null,
      exit: definition.exit ?? null,
    });

    if (!this.stateName && (!this.initialState || this.initialState === name)) {
      this.changeState(name);
    }

    return this;
  }

  changeState(name, context = {}) {
    if (this.stateName === name) return false;

    const next = this.states.get(name);
    if (!next) {
      throw new Error(`Unknown boss AI state: ${name}`);
    }

    const current = this.states.get(this.stateName);
    current?.exit?.(this.owner, this, context);

    this.stateName = name;
    this.stateTime = 0;
    next.enter?.(this.owner, this, context);
    return true;
  }

  update(dt, context = {}) {
    this.stateTime += dt;
    this.tickMap(this.cooldowns, dt);
    this.tickMap(this.timers, dt);
    this.updatePhase(context);

    const state = this.states.get(this.stateName);
    state?.update?.(this.owner, this, dt, context);
  }

  tickMap(map, dt) {
    for (const [key, value] of map) {
      map.set(key, Math.max(0, value - dt));
    }
  }

  setCooldown(name, seconds) {
    this.cooldowns.set(name, Math.max(0, seconds));
  }

  cooldownReady(name) {
    return (this.cooldowns.get(name) ?? 0) <= 0;
  }

  useCooldown(name, seconds) {
    if (!this.cooldownReady(name)) return false;
    this.setCooldown(name, seconds);
    return true;
  }

  getCooldown(name) {
    return this.cooldowns.get(name) ?? 0;
  }

  setTimer(name, seconds) {
    this.timers.set(name, Math.max(0, seconds));
  }

  timerDone(name) {
    return (this.timers.get(name) ?? 0) <= 0;
  }

  getTimer(name) {
    return this.timers.get(name) ?? 0;
  }

  get healthRatio() {
    const max = Math.max(1, this.owner.maxHealth ?? 1);
    return clamp((this.owner.health ?? max) / max, 0, 1);
  }

  updatePhase(context = {}) {
    if (!this.phases.length) return;

    // Pick the lowest-health threshold currently satisfied.
    let selected = this.phases[0];
    for (const phase of this.phases) {
      if (this.healthRatio <= phase.atOrBelow) {
        selected = phase;
      }
    }

    if (selected.id !== this.phaseId) {
      this.phaseId = selected.id;
      selected.onEnter?.(this.owner, this, context);
    }
  }

  targetPlayer(context) {
    return context.player ?? null;
  }

  distanceTo(target) {
    return target ? distanceBetween(this.owner, target) : Infinity;
  }

  directionTo(target) {
    return target ? directionTo(this.owner, target) : { x: 0, y: 0 };
  }

  faceTarget(target) {
    if (!target) return;
    const dx = target.x - this.owner.x;
    if (Math.abs(dx) > 0.001) this.owner.facing = Math.sign(dx);
  }

  accelerateToward(target, speed, acceleration, dt) {
    if (!target) return;

    const direction = this.directionTo(target);
    this.owner.vx = approach(
      this.owner.vx ?? 0,
      direction.x * speed,
      acceleration * dt,
    );
    this.owner.vy = approach(
      this.owner.vy ?? 0,
      direction.y * speed,
      acceleration * dt,
    );
  }

  accelerateHorizontalToward(target, speed, acceleration, dt) {
    if (!target) return;

    const direction = Math.sign(target.x - this.owner.x);
    this.owner.vx = approach(
      this.owner.vx ?? 0,
      direction * speed,
      acceleration * dt,
    );
  }

  brakeHorizontal(deceleration, dt) {
    this.owner.vx = approach(this.owner.vx ?? 0, 0, deceleration * dt);
  }

  choose(options) {
    if (!options.length) return null;
    return options[Math.floor(Math.random() * options.length)];
  }

  chooseWeighted(options) {
    if (!options.length) return null;

    const total = options.reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 1), 0);
    if (total <= 0) return options[0]?.value ?? null;

    let roll = Math.random() * total;

    for (const entry of options) {
      roll -= Math.max(0, entry.weight ?? 1);
      if (roll <= 0) return entry.value;
    }

    return options[options.length - 1]?.value ?? null;
  }
}

/*
Example boss setup:

const boss = {
  x: 1000, y: 300,
  vx: 0, vy: 0,
  health: 1000,
  maxHealth: 1000,
};

boss.ai = new BossAI(boss, {
  initialState: 'idle',
  phases: [
    { id: 'phase1', atOrBelow: 1.0 },
    { id: 'phase2', atOrBelow: 0.5 },
  ],
});

boss.ai
  .addState('idle', {
    update(owner, ai, dt, ctx) {
      const player = ai.targetPlayer(ctx);
      ai.faceTarget(player);

      if (ai.stateTime > 0.5) {
        ai.changeState('chase', ctx);
      }
    },
  })
  .addState('chase', {
    update(owner, ai, dt, ctx) {
      const player = ai.targetPlayer(ctx);
      ai.accelerateHorizontalToward(player, 240, 1200, dt);

      if (ai.distanceTo(player) < 180 && ai.useCooldown('slam', 1.5)) {
        ai.changeState('slam', ctx);
      }
    },
  });
*/
