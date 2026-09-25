import { MOVEMENT as CFG } from './movementConfig.js?v=28';

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
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

    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.hurtInvulnerabilityTimer = 0;
    this.abilityInvulnerabilityTimer = 0;
    this.hurtFlashTimer = 0;
    this.dashSerial = 0;
    this.lastDash = null;

    this.stamina = CFG.staminaMax;
    this.staminaRegenDelayTimer = 0;
    this.sprintExhausted = false;
    this.isSprinting = false;

    this.dashCooldownTimer = 0;
    this.dashCooldownDuration = CFG.dashCooldown;
    this.dashInvulnerabilityTimer = 0;
    this.dashVisualTimer = 0;

    this.landingSquashTimer = 0;
    this.afterimages = [];
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

  isDashBoundaryValid(x, y, world) {
    const halfW = this.w / 2;
    const halfH = this.h / 2;

    // Platforms are intentionally ignored here. Dash can phase through them.
    // Only hard world boundaries stop the blink.
    if (x - halfW < 0) return false;
    if (x + halfW > world.width) return false;
    if (y - halfH < 0) return false;
    if (y + halfH > world.floorY) return false;

    return true;
  }

  overlapsPlatform(x, y, world) {
    const halfW = this.w / 2;
    const halfH = this.h / 2;

    return world.platforms.some(p =>
      x + halfW > p.x &&
      x - halfW < p.x + p.w &&
      y + halfH > p.y &&
      y - halfH < p.y + p.h
    );
  }

  resolvePlatformEndpoint(x, y, nx, ny, world) {
    if (!this.overlapsPlatform(x, y, world)) {
      return { x, y };
    }

    // If the intended endpoint lands inside a platform, keep moving a little
    // farther in the dash direction until the player is fully through it.
    // This preserves the phase-through feel without leaving the player embedded.
    const step = 4;
    const maxExtra = 180;

    for (let extra = step; extra <= maxExtra; extra += step) {
      const tx = x + nx * extra;
      const ty = y + ny * extra;

      if (!this.isDashBoundaryValid(tx, ty, world)) break;
      if (!this.overlapsPlatform(tx, ty, world)) {
        return { x: tx, y: ty };
      }
    }

    // If there is no safe point ahead before a hard boundary, retreat from the
    // endpoint until we find a non-overlapping position.
    for (let back = step; back <= maxExtra; back += step) {
      const tx = x - nx * back;
      const ty = y - ny * back;

      if (!this.isDashBoundaryValid(tx, ty, world)) continue;
      if (!this.overlapsPlatform(tx, ty, world)) {
        return { x: tx, y: ty };
      }
    }

    return null;
  }

  resolveDashDestination(target, world) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;
    let length = Math.hypot(dx, dy);

    if (length < 0.001) {
      dx = this.facing;
      dy = 0;
      length = 1;
    }

    const nx = dx / length;
    const ny = dy / length;
    const startX = this.x;
    const startY = this.y;
    const steps = Math.max(1, Math.ceil(CFG.dashDistance / CFG.dashSweepStep));

    let lastSafeT = 0;
    let blocked = false;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const testX = startX + nx * CFG.dashDistance * t;
      const testY = startY + ny * CFG.dashDistance * t;

      if (!this.isDashBoundaryValid(testX, testY, world)) {
        blocked = true;

        // Refine the final safe point so the blink stops close to the surface
        // instead of visibly several pixels away from it.
        let lo = lastSafeT;
        let hi = t;

        for (let j = 0; j < 8; j++) {
          const mid = (lo + hi) * 0.5;
          const mx = startX + nx * CFG.dashDistance * mid;
          const my = startY + ny * CFG.dashDistance * mid;

          if (this.isDashBoundaryValid(mx, my, world)) lo = mid;
          else hi = mid;
        }

        lastSafeT = lo;
        break;
      }

      lastSafeT = t;
    }

    let endX = startX + nx * CFG.dashDistance * lastSafeT;
    let endY = startY + ny * CFG.dashDistance * lastSafeT;

    const corrected = this.resolvePlatformEndpoint(endX, endY, nx, ny, world);
    if (!corrected) {
      return {
        x: startX,
        y: startY,
        nx,
        ny,
        blocked: true,
        distance: 0,
      };
    }

    endX = corrected.x;
    endY = corrected.y;

    return {
      x: endX,
      y: endY,
      nx,
      ny,
      blocked,
      distance: Math.hypot(endX - startX, endY - startY),
    };
  }

  spawnGrabEscapeTrail(startX, startY) {
    const endX = this.x;
    const endY = this.y;
    const distance = Math.hypot(endX - startX, endY - startY);
    const count = Math.max(
      8,
      Math.min(22, Math.ceil(distance / 18)),
    );

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);

      this.afterimages.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
        life: 0.22 - t * 0.05,
        maxLife: 0.22,
      });
    }

    if (this.afterimages.length > 30) {
      this.afterimages.splice(
        0,
        this.afterimages.length - 30,
      );
    }
  }

  spawnDashTrail(startX, startY, endX, endY) {
    const distance = Math.hypot(endX - startX, endY - startY);
    const count = Math.max(2, Math.min(12, Math.ceil(distance / 34)));

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      this.afterimages.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
        life: 0.17 - t * 0.035,
        maxLife: 0.17,
      });
    }

    if (this.afterimages.length > 20) {
      this.afterimages.splice(0, this.afterimages.length - 20);
    }
  }

  tryDash(target, world, cooldownMultiplier = 1) {
    if (this.dashCooldownTimer > 0) return false;
    if (this.stamina < CFG.dashStaminaCost) return false;

    const result = this.resolveDashDestination(target, world);
    if (result.distance < CFG.dashMinimumDistance) return false;
    if (!this.spendStamina(CFG.dashStaminaCost)) return false;

    const startX = this.x;
    const startY = this.y;

    this.x = result.x;
    this.y = result.y;
    this.prevY = this.y;

    if (Math.abs(result.nx) > 0.08) {
      this.facing = Math.sign(result.nx);
    }

    // Blink first, then keep 70% of the player's previous momentum.
    // If a hard boundary stopped the blink, kill momentum so the next frame
    // cannot immediately shove the player into the wall or floor.
    if (result.blocked) {
      this.vx = 0;
      this.vy = 0;
    } else {
      this.vx *= CFG.dashMomentumRetention;
      this.vy *= CFG.dashMomentumRetention;
    }

    this.grounded = this.isStandingOnSurface(world);
    if (this.grounded && this.vy > 0) this.vy = 0;

    this.dashCooldownDuration =
      CFG.dashCooldown * Math.max(1, cooldownMultiplier);

    this.dashCooldownTimer = this.dashCooldownDuration;
    this.dashInvulnerabilityTimer = CFG.dashInvulnerability;
    this.dashSerial++;

    this.lastDash = {
      startX,
      startY,
      endX: this.x,
      endY: this.y,
      nx: result.nx,
      ny: result.ny,
      serial: this.dashSerial,
    };
    this.dashVisualTimer = CFG.dashVisualTime;

    this.spawnDashTrail(startX, startY, this.x, this.y);
    return true;
  }

  isStandingOnSurface(world) {
    const halfW = this.w / 2;
    const halfH = this.h / 2;
    const bottom = this.y + halfH;
    const tolerance = 1.5;

    if (Math.abs(bottom - world.floorY) <= tolerance) return true;

    for (const p of world.platforms) {
      const overlapsX = this.x + halfW > p.x && this.x - halfW < p.x + p.w;
      if (overlapsX && Math.abs(bottom - p.y) <= tolerance) return true;
    }

    return false;
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
    this.hurtInvulnerabilityTimer = Math.max(0, this.hurtInvulnerabilityTimer - dt);
    this.abilityInvulnerabilityTimer = Math.max(
      0,
      this.abilityInvulnerabilityTimer - dt,
    );
    this.hurtFlashTimer = Math.max(0, this.hurtFlashTimer - dt);
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    this.dashInvulnerabilityTimer = Math.max(0, this.dashInvulnerabilityTimer - dt);
    this.dashVisualTimer = Math.max(0, this.dashVisualTimer - dt);
    this.landingSquashTimer = Math.max(0, this.landingSquashTimer - dt);
    this.staminaRegenDelayTimer = Math.max(0, this.staminaRegenDelayTimer - dt);

    if (input.jumpPressed) this.queueJump();
    if (input.jumpReleased) this.releaseJump();

    if (input.dashPressed && input.dashTarget) {
      this.tryDash(
        input.dashTarget,
        world,
        input.dashCooldownMultiplier ?? 1,
      );
    }

    this.updateStamina(dt, input, move);

    this.wasGrounded = this.grounded;
    this.updateHorizontal(dt, move, this.isSprinting);
    this.tryBufferedJump();
    this.updateGravity(dt, input.jumpHeld);

    this.moveAndCollide(dt, world);
    this.tryBufferedJump();
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

      if (
        previousBottom <= world.floorY &&
        currentBottom >= world.floorY &&
        world.floorY < landingY
      ) {
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

  updateAfterimages(dt) {
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter(a => a.life > 0);
  }


  grantAbilityInvulnerability(duration) {
    this.abilityInvulnerabilityTimer = Math.max(
      this.abilityInvulnerabilityTimer,
      duration,
    );
  }

  takeContinuousDamage(amount) {
    if (amount <= 0 || this.health <= 0) return false;
    if (this.abilityInvulnerabilityTimer > 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.hurtFlashTimer = Math.max(this.hurtFlashTimer, 0.045);
    return true;
  }

  takeDamage(amount, { ignoreDashInvulnerability = false } = {}) {
    if (amount <= 0 || this.health <= 0) return false;
    if (this.abilityInvulnerabilityTimer > 0) return false;
    if (!ignoreDashInvulnerability && this.dashInvulnerabilityTimer > 0) return false;
    if (this.hurtInvulnerabilityTimer > 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.hurtInvulnerabilityTimer = 0.34;
    this.hurtFlashTimer = 0.12;
    return true;
  }

  get healthRatio() {
    return this.health / this.maxHealth;
  }

  get dashReady() {
    return this.dashCooldownTimer <= 0 && this.stamina >= CFG.dashStaminaCost;
  }

  get dashCooldownRatio() {
    return 1 - Math.min(
      1,
      this.dashCooldownTimer / this.dashCooldownDuration,
    );
  }

  get staminaRatio() {
    return this.stamina / CFG.staminaMax;
  }

  get visualScale() {
    if (this.landingSquashTimer > 0) {
      const t = this.landingSquashTimer / CFG.landingSquashTime;
      return { x: 1 + 0.12 * t, y: 1 - 0.12 * t };
    }

    return { x: 1, y: 1 };
  }
}
