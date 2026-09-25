import { rectangle, group, rasterize } from './pixelShapes.js?v=22';

function shortestAngleDelta(a, b) {
  return ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

export class MachWeapon {
  constructor() {
    this.name = 'Mach';

    this.baseDamage = 15;
    this.minDamageMultiplier = 0.24;
    this.fireCooldown = 0.16;
    this.cooldownTimer = 0;

    this.waveSpeed = 720;
    this.waveMaxRadius = 650;
    this.waveThickness = 20;
    this.waveHalfAngle = Math.PI * 0.34;
    this.waveStartRadius = 18;

    this.recoil = 128;
    this.orbitRadius = 43;

    this.bodyWidth = 6;
    this.bodyHeight = 4;

    this.waves = [];

    this.definition = group([
      rectangle({
        width: this.bodyWidth,
        height: this.bodyHeight,
        color: '#6f747c',
      }),
    ], {
      mergeOutlines: true,
      outline: false,
      padding: 1,
    });

    this.rasterCache = new Map();
  }

  reset() {
    this.cooldownTimer = 0;
    this.waves.length = 0;
  }

  get specialAbilities() {
    return [];
  }

  getAim(player, pointerWorld) {
    const angle = Math.atan2(
      pointerWorld.y - player.y,
      pointerWorld.x - player.x,
    );

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    return {
      angle,
      dirX,
      dirY,
      x: player.x + dirX * this.orbitRadius,
      y: player.y + dirY * this.orbitRadius,
    };
  }

  update(
    dt,
    player,
    pointerWorld,
    firing,
    target,
    active = true,
  ) {
    this.cooldownTimer = Math.max(
      0,
      this.cooldownTimer - dt,
    );

    if (active && firing && this.cooldownTimer <= 0) {
      this.emitWave(player, pointerWorld);
      this.cooldownTimer = this.fireCooldown;
    }

    for (const wave of this.waves) {
      wave.previousRadius = wave.radius;
      wave.radius += this.waveSpeed * dt;

      if (!wave.hitTarget && target && !target.dead) {
        this.tryHitTarget(wave, target);
      }
    }

    this.waves = this.waves.filter(
      wave => wave.radius < this.waveMaxRadius,
    );
  }

  emitWave(player, pointerWorld) {
    const aim = this.getAim(player, pointerWorld);

    this.waves.push({
      x: aim.x,
      y: aim.y,
      angle: aim.angle,
      radius: this.waveStartRadius,
      previousRadius: this.waveStartRadius,
      hitTarget: false,
    });

    player.vx -= aim.dirX * this.recoil;
    player.vy -= aim.dirY * this.recoil;

    if (aim.dirY > 0.20) {
      player.grounded = false;
    }
  }

  tryHitTarget(wave, target) {
    const dx = target.x - wave.x;
    const dy = target.y - wave.y;
    const distance = Math.hypot(dx, dy);

    const targetAngle = Math.atan2(dy, dx);
    const angularError = Math.abs(
      shortestAngleDelta(wave.angle, targetAngle),
    );

    if (angularError > this.waveHalfAngle) return;

    const targetRadius = (target.halfSize ?? 48) * 0.92;
    const inner =
      wave.previousRadius -
      this.waveThickness -
      targetRadius;

    const outer =
      wave.radius +
      this.waveThickness +
      targetRadius;

    if (
      distance < Math.max(0, inner) ||
      distance > outer
    ) {
      return;
    }

    const travelRatio = Math.min(
      1,
      distance / this.waveMaxRadius,
    );

    const multiplier =
      1 -
      (1 - this.minDamageMultiplier) *
        travelRatio;

    target.takeDamage?.(
      this.baseDamage * multiplier,
    );

    wave.hitTarget = true;
  }

  getRaster(angleRadians) {
    const degrees = angleRadians * 180 / Math.PI;
    const quantized = Math.round(degrees / 3) * 3;
    const key = ((quantized % 360) + 360) % 360;

    if (!this.rasterCache.has(key)) {
      this.rasterCache.set(
        key,
        rasterize(this.definition, key),
      );
    }

    return this.rasterCache.get(key);
  }

  draw(ctx, player, pointerWorld, cameraX, artPixelSize) {
    const aim = this.getAim(player, pointerWorld);
    const raster = this.getRaster(aim.angle);
    const dw = raster.width * artPixelSize;
    const dh = raster.height * artPixelSize;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      raster,
      Math.round(aim.x - cameraX - dw / 2),
      Math.round(aim.y - dh / 2),
      dw,
      dh,
    );
    ctx.restore();

    this.drawWaves(ctx, cameraX);
  }

  drawWaves(ctx, cameraX) {
    ctx.save();
    ctx.lineCap = 'square';

    for (const wave of this.waves) {
      const ratio = Math.min(
        1,
        wave.radius / this.waveMaxRadius,
      );

      const alpha =
        0.62 * (1 - ratio * 0.74);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(
        2,
        7 - ratio * 4,
      );

      ctx.beginPath();
      ctx.arc(
        Math.round(wave.x - cameraX),
        Math.round(wave.y),
        wave.radius,
        wave.angle - this.waveHalfAngle,
        wave.angle + this.waveHalfAngle,
      );
      ctx.stroke();

      // A faint trailing arc makes each pulse read more like a pressure wave.
      if (wave.radius > 22) {
        ctx.globalAlpha = alpha * 0.34;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          Math.round(wave.x - cameraX),
          Math.round(wave.y),
          Math.max(0, wave.radius - 16),
          wave.angle - this.waveHalfAngle,
          wave.angle + this.waveHalfAngle,
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
