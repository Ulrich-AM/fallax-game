function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return {
    x: x / length,
    y: y / length,
  };
}

export class GuardSystem {
  constructor() {
    this.maxStability = 100;
    this.stability = this.maxStability;

    this.guardDamageReduction = 0.82;
    this.stabilityPerDamage = 2.0;
    this.stabilityRegenPerSecond = 26;
    this.stabilityRegenDelay = 0.75;
    this.stabilityRegenTimer = 0;

    this.parryWindow = 0.14;
    this.parryTimer = 0;

    this.breakDuration = 0.7;
    this.breakTimer = 0;

    this.guardArc = Math.PI * 0.72;
    this.guardHeld = false;
    this.guardPressed = false;

    this.pointerWorld = { x: 0, y: 0 };
    this.player = null;

    this.parryFlashTimer = 0;
    this.blockFlashTimer = 0;

    this.reflectedProjectiles = 0;
    this.blockedHits = 0;

    this.parrySerial = 0;
    this.lastParry = null;

    const system = this;

    this.proxy = {
      get x() {
        return system.player?.x ?? 0;
      },
      set x(value) {
        if (system.player) system.player.x = value;
      },

      get y() {
        return system.player?.y ?? 0;
      },
      set y(value) {
        if (system.player) system.player.y = value;
      },

      get prevY() {
        return system.player?.prevY ?? 0;
      },
      set prevY(value) {
        if (system.player) system.player.prevY = value;
      },

      get vx() {
        return system.player?.vx ?? 0;
      },
      set vx(value) {
        if (system.player) system.player.vx = value;
      },

      get vy() {
        return system.player?.vy ?? 0;
      },
      set vy(value) {
        if (system.player) system.player.vy = value;
      },

      get w() {
        return system.player?.w ?? 0;
      },

      get h() {
        return system.player?.h ?? 0;
      },

      get grounded() {
        return !!system.player?.grounded;
      },
      set grounded(value) {
        if (system.player) system.player.grounded = value;
      },

      get dashSerial() {
        return system.player?.dashSerial ?? 0;
      },

      get health() {
        return system.player?.health ?? 0;
      },

      get dead() {
        return (system.player?.health ?? 0) <= 0;
      },

      takeDamage:
        amount =>
          system.handleDirectDamage(
            amount,
          ),

      takeContinuousDamage:
        amount =>
          system.handleDirectDamage(
            amount,
            true,
          ),

      handleIncomingProjectile:
        (bullet, meta) =>
          system.handleIncomingProjectile(
            bullet,
            meta,
          ),

      handleIncomingRush:
        (attacker, meta) =>
          system.handleIncomingRush(
            attacker,
            meta,
          ),

      grantAbilityInvulnerability:
        duration =>
          system.player
            ?.grantAbilityInvulnerability
            ?.(duration),

      spawnGrabEscapeTrail:
        (...args) =>
          system.player
            ?.spawnGrabEscapeTrail
            ?.(...args),
    };
  }

  reset(player = this.player) {
    this.player = player ?? null;
    this.stability = this.maxStability;
    this.stabilityRegenTimer = 0;
    this.parryTimer = 0;
    this.breakTimer = 0;
    this.guardHeld = false;
    this.guardPressed = false;
    this.parryFlashTimer = 0;
    this.blockFlashTimer = 0;
    this.reflectedProjectiles = 0;
    this.blockedHits = 0;
    this.parrySerial = 0;
    this.lastParry = null;
    this.syncProxy();
  }

  syncProxy() {
    // The proxy forwards live properties directly to PlayerController.
    // Kept as a compatibility no-op for callers that already invoke it.
  }

  update(
    dt,
    {
      player,
      pointerWorld,
      guardHeld = false,
      guardPressed = false,
    } = {},
  ) {
    this.player = player ?? this.player;

    if (pointerWorld) {
      this.pointerWorld = {
        x: pointerWorld.x,
        y: pointerWorld.y,
      };
    }

    this.guardPressed = !!guardPressed;
    this.guardHeld =
      !!guardHeld &&
      this.breakTimer <= 0 &&
      this.stability > 0;

    if (this.guardPressed && this.guardHeld) {
      this.parryTimer = this.parryWindow;
    }

    this.parryTimer =
      Math.max(
        0,
        this.parryTimer - dt,
      );

    this.breakTimer =
      Math.max(
        0,
        this.breakTimer - dt,
      );

    this.parryFlashTimer =
      Math.max(
        0,
        this.parryFlashTimer - dt,
      );

    this.blockFlashTimer =
      Math.max(
        0,
        this.blockFlashTimer - dt,
      );

    this.stabilityRegenTimer =
      Math.max(
        0,
        this.stabilityRegenTimer - dt,
      );

    if (
      !this.guardHeld &&
      this.breakTimer <= 0 &&
      this.stabilityRegenTimer <= 0
    ) {
      this.stability =
        Math.min(
          this.maxStability,
          this.stability +
            this.stabilityRegenPerSecond * dt,
        );
    }

    this.syncProxy();
  }

  isGuarding() {
    return (
      this.guardHeld &&
      this.breakTimer <= 0 &&
      this.stability > 0
    );
  }

  isParrying() {
    return (
      this.isGuarding() &&
      this.parryTimer > 0
    );
  }

  aimDirection() {
    const player = this.player;

    if (!player) {
      return { x: 1, y: 0 };
    }

    return normalize(
      this.pointerWorld.x - player.x,
      this.pointerWorld.y - player.y,
    );
  }

  isInGuardArc(x, y) {
    const player = this.player;

    if (!player) return false;

    const incoming =
      normalize(
        x - player.x,
        y - player.y,
      );

    const aim =
      this.aimDirection();

    const dot =
      incoming.x * aim.x +
      incoming.y * aim.y;

    return (
      dot >=
      Math.cos(
        this.guardArc * 0.5,
      )
    );
  }

  spendStability(amount) {
    this.stability =
      Math.max(
        0,
        this.stability - amount,
      );

    this.stabilityRegenTimer =
      this.stabilityRegenDelay;

    if (this.stability <= 0) {
      this.breakTimer =
        this.breakDuration;

      this.guardHeld = false;
      this.parryTimer = 0;
    }
  }

  handleDirectDamage(
    amount,
    continuous = false,
  ) {
    if (
      !this.player ||
      amount <= 0
    ) {
      return false;
    }

    if (!this.isGuarding()) {
      return continuous
        ? this.player.takeContinuousDamage?.(amount)
        : this.player.takeDamage?.(amount);
    }

    const stabilityCost =
      amount *
      this.stabilityPerDamage *
      (
        continuous
          ? 0.55
          : 1
      );

    this.spendStability(
      stabilityCost,
    );

    const reduced =
      amount *
      (
        1 -
        this.guardDamageReduction
      );

    this.blockFlashTimer = 0.12;
    this.blockedHits++;

    if (reduced <= 0.01) {
      return true;
    }

    return continuous
      ? this.player.takeContinuousDamage?.(reduced)
      : this.player.takeDamage?.(reduced);
  }

  handleIncomingProjectile(
    bullet,
    {
      damage = 0,
      owner = null,
    } = {},
  ) {
    if (
      !bullet ||
      !this.player ||
      !this.isGuarding()
    ) {
      return {
        handled: false,
      };
    }

    if (
      !this.isInGuardArc(
        bullet.x,
        bullet.y,
      )
    ) {
      return {
        handled: false,
      };
    }

    if (this.isParrying()) {
      const aim =
        this.aimDirection();

      const speed =
        Math.max(
          420,
          Math.hypot(
            bullet.vx ?? 0,
            bullet.vy ?? 0,
          ) *
          1.15,
        );

      bullet.vx =
        aim.x * speed;

      bullet.vy =
        aim.y * speed;

      bullet.reflected = true;
      bullet.reflectedOwner =
        this.player;

      bullet.reflectedDamage =
        Math.max(
          10,
          damage * 1.65,
        );

      bullet.hitPlayer = false;
      bullet.life =
        Math.max(
          bullet.life ?? 0,
          1.8,
        );

      this.parryTimer = 0;
      this.parryFlashTimer = 0.18;
      this.reflectedProjectiles++;
      this.parrySerial++;

      this.lastParry = {
        serial:
          this.parrySerial,
        type: 'projectile',
        x: bullet.x,
        y: bullet.y,
      };

      this.spendStability(
        Math.max(
          4,
          damage * 0.45,
        ),
      );

      return {
        handled: true,
        parried: true,
        reflected: true,
      };
    }

    this.spendStability(
      damage *
      this.stabilityPerDamage,
    );

    this.blockFlashTimer = 0.14;
    this.blockedHits++;

    const chip =
      damage *
      (
        1 -
        this.guardDamageReduction
      );

    if (chip > 0.01) {
      this.player.takeDamage?.(
        chip,
      );
    }

    return {
      handled: true,
      blocked: true,
      reflected: false,
      destroyProjectile: true,
    };
  }

  handleIncomingRush(
    attacker,
    {
      stabilityCost = 14,
    } = {},
  ) {
    if (
      !attacker ||
      !this.player ||
      !this.isGuarding()
    ) {
      return {
        handled: false,
      };
    }

    if (
      !this.isInGuardArc(
        attacker.x,
        attacker.y,
      )
    ) {
      return {
        handled: false,
      };
    }

    if (!this.isParrying()) {
      return {
        handled: false,
      };
    }

    this.parryTimer = 0;
    this.parryFlashTimer = 0.22;
    this.parrySerial++;

    this.lastParry = {
      serial:
        this.parrySerial,
      type: 'rush',
      x: attacker.x,
      y: attacker.y,
    };

    this.spendStability(
      stabilityCost,
    );

    return {
      handled: true,
      parried: true,
      cancelAttack: true,
    };
  }

  getDamageTarget(player) {
    if (player !== this.player) {
      this.player = player;
    }

    this.syncProxy();
    return this.proxy;
  }

  get stabilityRatio() {
    return (
      this.maxStability > 0
        ? clamp(
            this.stability /
              this.maxStability,
            0,
            1,
          )
        : 0
    );
  }

  draw(
    ctx,
    cameraX = 0,
  ) {
    const player = this.player;

    if (
      !player ||
      (
        !this.isGuarding() &&
        this.parryFlashTimer <= 0 &&
        this.blockFlashTimer <= 0 &&
        this.breakTimer <= 0
      )
    ) {
      return;
    }

    const aim =
      this.aimDirection();

    const angle =
      Math.atan2(
        aim.y,
        aim.x,
      );

    const radius =
      52;

    const start =
      angle -
      this.guardArc * 0.5;

    const end =
      angle +
      this.guardArc * 0.5;

    const parryGlow =
      this.parryFlashTimer > 0 ||
      this.isParrying();

    ctx.save();

    ctx.translate(
      player.x - cameraX,
      player.y,
    );

    ctx.globalAlpha =
      this.breakTimer > 0
        ? 0.24
        : (
            parryGlow
              ? 0.95
              : 0.55
          );

    ctx.strokeStyle =
      this.breakTimer > 0
        ? '#8a5757'
        : '#f2f3f5';

    ctx.lineWidth =
      parryGlow
        ? 7
        : 4;

    ctx.shadowColor =
      '#ffffff';

    ctx.shadowBlur =
      parryGlow
        ? 24
        : 8;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      radius,
      start,
      end,
    );

    ctx.stroke();

    if (parryGlow) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle =
        '#ffffff';

      ctx.fillRect(
        Math.round(
          aim.x * radius - 4,
        ),
        Math.round(
          aim.y * radius - 4,
        ),
        8,
        8,
      );
    }

    ctx.restore();
  }
}
