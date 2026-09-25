import { MOVEMENT as CFG } from './movementConfig.js?v=5';

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class PlayerController {
  constructor({ x = 220, y = 500, width = 32, height = 56 } = {}) {
    this.spawn = { x, y };
    this.w = width;
    this.h = height;
    this.reset();
  }

  reset() {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.wasGrounded = false;

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    this.stamina = CFG.staminaMax;
    this.staminaRegenDelayTimer = 0;
    this.sprintExhausted = false;
    this.isSprinting = false;

    this.dashCooldownTimer = 0;
    this.dashInvulnerabilityTimer = 0;
    this.dashVisualTimer = 0;
    this.dashDirection = 1;

    this.landingSquashTimer = 0;
    this.dashStretchTimer = 0;
    this.afterimages = [];
    this.afterimageTimer = 0;
  }

  queueJump() {
    this.jumpBufferTimer = CFG.jumpBufferTime;
  }

  spendStamina(amount) {
    if (this.stamina + 1e-6 < amount) return false;
    this.stamina = Math.max(0, this.stamina - amount);
    this.staminaRegenDelayTimer = CFG.staminaRegenDelay;
    return true;
  }

  tryDash(moveInput) {
    if (this.dashCooldownTimer > 0) return false;
    if (!this.spendStamina(CFG.dashStaminaCost)) return false;

    this.dashDirection = moveInput !== 0 ? Math.sign(moveInput) : this.facing;
    this.facing = this.dashDirection;

    // Retain only part of the existing horizontal momentum, then add the dash
    // impulse. Vertical momentum is still preserved completely.
    this.vx = clamp(
      this.vx * CFG.dashMomentumRetention + this.dashDirection * CFG.dashImpulse,
      -CFG.dashMaxHorizontalSpeed,
      CFG.dashMaxHorizontalSpeed,
    );

    this.dashCooldownTimer = CFG.dashCooldown;
    this.dashInvulnerabilityTimer = CFG.dashInvulnerability;
    this.dashVisualTimer = CFG.dashVisualTime;
    this.dashStretchTimer = CFG.dashStretchTime;
    this.afterimageTimer = 0;
    this.spawnAfterimage(true);
    return true;
  }

  releaseJump() {
    if (this.vy < 0) {
      this.vy *= CFG.jumpReleaseVelocityMultiplier;
    }
  }

  update(dt, input, world) {
    const move = input.move;
    if (move !== 0) this.facing = Math.sign(move);

    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    this.dashInvulnerabilityTimer = Math.max(0, this.dashInvulnerabilityTimer - dt);
    this.dashVisualTimer = Math.max(0, this.dashVisualTimer - dt);
    this.landingSquashTimer = Math.max(0, this.landingSquashTimer - dt);
    this.dashStretchTimer = Math.max(0, this.dashStretchTimer - dt);
    this.staminaRegenDelayTimer = Math.max(0, this.staminaRegenDelayTimer - dt);

    if (input.jumpPressed) this.queueJump();
    if (input.jumpReleased) this.releaseJump();
    if (input.dashPressed) this.tryDash(move);

    this.updateStamina(dt, input, move);

    this.wasGrounded = this.grounded;
    this.updateHorizontal(dt, move, this.isSprinting);
    this.tryBufferedJump();
    this.updateGravity(dt, input.jumpHeld);

    this.moveAndCollide(dt, world);

    // Consume a buffered jump on the exact physics tick that landing occurs.
    this.tryBufferedJump();

    this.updateDashVisuals(dt);
    this.updateAfterimages(dt);
  }

  updateStamina(dt, input, move) {
    if (this.sprintExhausted && this.stamina >= CFG.sprintRecoverThreshold) {
      this.sprintExhausted = false;
    }

    const wantsSprint = input.sprintHeld && move !== 0;
    const canSprint = !this.sprintExhausted && this.stamina > 0;
    this.isSprinting = wantsSprint && canSprint;

    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - CFG.sprintDrainPerSecond * dt);
      this.staminaRegenDelayTimer = CFG.staminaRegenDelay;
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.sprintExhausted = true;
        this.isSprinting = false;
      }
    } else if (this.staminaRegenDelayTimer <= 0) {
      this.stamina = Math.min(
        CFG.staminaMax,
        this.stamina + CFG.staminaRegenPerSecond * dt,
      );
    }
  }

  updateDashVisuals(dt) {
    if (this.dashVisualTimer <= 0) return;

    this.afterimageTimer -= dt;
    if (this.afterimageTimer <= 0) {
      this.spawnAfterimage(false);
      this.afterimageTimer = CFG.dashAfterimageInterval;
    }
  }

  updateHorizontal(dt, move, sprinting) {
    const grounded = this.grounded;
    const targetSpeed = sprinting ? CFG.sprintSpeed : CFG.runSpeed;

    if (move !== 0) {
      const direction = Math.sign(move);
      const reversing = this.vx !== 0 && Math.sign(this.vx) !== direction;
      const speed = Math.abs(this.vx);

      if (reversing) {
        const accel = grounded ? CFG.groundTurnAcceleration : CFG.airTurnAcceleration;
        this.vx = approach(this.vx, direction * targetSpeed, accel * dt);
        return;
      }

      if (speed < targetSpeed) {
        const accel = grounded
          ? (sprinting ? CFG.groundSprintAcceleration : CFG.groundAcceleration)
          : CFG.airAcceleration;
        this.vx = approach(this.vx, direction * targetSpeed, accel * dt);
      } else if (speed > targetSpeed) {
        // Preserve dash / downhill-style momentum and bleed it off gently.
        const coast = grounded
          ? CFG.groundOverspeedDeceleration
          : CFG.airOverspeedDeceleration;
        this.vx = approach(this.vx, direction * targetSpeed, coast * dt);
      }
    } else {
      const decel = grounded ? CFG.groundDeceleration : CFG.airDeceleration;
      this.vx = approach(this.vx, 0, decel * dt);
    }
  }

  tryBufferedJump() {
    if (this.jumpBufferTimer <= 0) return false;
    if (!(this.grounded || this.coyoteTimer > 0)) return false;

    this.vy = -CFG.jumpSpeed;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    return true;
  }

  updateGravity(dt, jumpHeld) {
    let gravity;

    if (this.vy < 0) {
      const nearApex = Math.abs(this.vy) <= CFG.apexVelocityWindow;
      gravity = nearApex && jumpHeld ? CFG.apexGravity : CFG.riseGravity;
    } else {
      gravity = CFG.fallGravity;
    }

    this.vy = Math.min(CFG.maxFallSpeed, this.vy + gravity * dt);
  }

  moveAndCollide(dt, world) {
    // Physics coordinates remain continuous. Only artwork is rasterized.
    this.x += this.vx * dt;

    const halfW = this.w / 2;
    if (this.x < halfW) {
      this.x = halfW;
      this.vx = Math.max(0, this.vx);
    } else if (this.x > world.width - halfW) {
      this.x = world.width - halfW;
      this.vx = Math.min(0, this.vx);
    }

    this.prevY = this.y;
    const previousBottom = this.prevY + this.h / 2;
    this.y += this.vy * dt;

    let landed = false;
    let landingY = Infinity;

    if (this.vy >= 0) {
      const currentBottom = this.y + this.h / 2;

      for (const p of world.platforms) {
        const overlapsX = this.x + halfW > p.x && this.x - halfW < p.x + p.w;
        const crossedTop = previousBottom <= p.y && currentBottom >= p.y;
        if (overlapsX && crossedTop && p.y < landingY) {
          landingY = p.y;
          landed = true;
        }
      }

      if (previousBottom <= world.floorY && currentBottom >= world.floorY && world.floorY < landingY) {
        landingY = world.floorY;
        landed = true;
      }

      if (landed) {
        const impactSpeed = this.vy;
        this.y = landingY - this.h / 2;
        this.vy = 0;
        this.grounded = true;
        this.coyoteTimer = CFG.coyoteTime;

        if (!this.wasGrounded && impactSpeed > 250) {
          this.landingSquashTimer = CFG.landingSquashTime;
        }
      } else {
        if (this.wasGrounded) this.coyoteTimer = CFG.coyoteTime;
        this.grounded = false;
      }
    } else {
      if (this.wasGrounded) this.coyoteTimer = CFG.coyoteTime;
      this.grounded = false;
    }
  }

  spawnAfterimage(force = false) {
    if (!force && this.afterimages.length >= 12) this.afterimages.shift();
    this.afterimages.push({
      x: this.x,
      y: this.y,
      life: 0.15,
      maxLife: 0.15,
      facing: this.facing,
    });
  }

  updateAfterimages(dt) {
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter(a => a.life > 0);
  }

  get dashReady() {
    return this.dashCooldownTimer <= 0 && this.stamina >= CFG.dashStaminaCost;
  }

  get dashCooldownRatio() {
    return 1 - Math.min(1, this.dashCooldownTimer / CFG.dashCooldown);
  }

  get staminaRatio() {
    return this.stamina / CFG.staminaMax;
  }

  get visualScale() {
    if (this.dashStretchTimer > 0) {
      const t = this.dashStretchTimer / CFG.dashStretchTime;
      return { x: 1 + 0.20 * t, y: 1 - 0.10 * t };
    }

    if (this.landingSquashTimer > 0) {
      const t = this.landingSquashTimer / CFG.landingSquashTime;
      return { x: 1 + 0.12 * t, y: 1 - 0.12 * t };
    }

    return { x: 1, y: 1 };
  }
}
