import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=54c';

const MACH_SPRITE_ASSET = {
  version: 2,
  name: 'mach',
  displayName: 'Mach',
  type: 'weapon',
  scale: 1,
  pivot: [0, 0],
  parts: [
    {
      id: 'polygon-1',
      name: 'polygon-1',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 7,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [5, 0],
        [5, -2],
        [5, -7],
        [7, -5],
        [8, 0],
        [7, 5],
        [5, 7],
        [5, 2],
      ],
    },
    {
      id: 'polygon-2',
      name: 'polygon-2',
      type: 'polygon',
      material: 'gray',
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points: [
        [11, 5],
        [5, 2],
        [5, -2],
        [11, -5],
        [11, -3],
        [11, -1],
        [11, 1],
        [11, 3],
      ],
    },
  ],
  groups: [],
  animations: {
    clips: {
      idle: {
        name: 'idle',
        duration: 1,
        loop: true,
        tracks: [],
      },
      fire: {
        name: 'fire',
        duration: 0.25,
        loop: false,
        tracks: [],
      },
      special: {
        name: 'special',
        duration: 0.6,
        loop: false,
        tracks: [],
      },
    },
  },
  markers: {
    muzzle: {
      x: 15,
      y: 0,
      rotation: 0,
    },
  },
  render: {
    mergeOutlines: true,
    outline: {
      enabled: true,
      color: '#35383e',
      thickness: 1,
    },
    padding: 2,
  },
};

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

    this.recoil = 190;
    this.jetpackRecoil = 560;
    this.orbitRadius = 36;

    this.specialCooldown = 16;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialDuration = 0.82;
    this.specialActiveTimer = 0;
    this.specialWaveCount = 3;
    this.specialWavesFired = 0;
    this.specialWaveInterval = 0.18;
    this.specialWaveTimer = 0;
    this.specialDamage = 42;
    this.specialWaveSpeed = 620;
    this.specialWaveMaxRadius = 780;
    this.specialWaveThickness = 38;
    this.specialWaveHalfAngle = Math.PI * 0.46;

    this.bodyWidth = 9;
    this.bodyHeight = 4;

    this.waves = [];

    this.sprite =
      new WeaponSpriteRenderer(
        MACH_SPRITE_ASSET,
      );
  }

  reset() {
    this.cooldownTimer = 0;
    this.specialCooldownTimer = this.specialCooldown;
    this.specialActiveTimer = 0;
    this.specialWavesFired = 0;
    this.specialWaveTimer = 0;
    this.waves.length = 0;
  }

  triggerSpecial() {
    if (this.specialCooldownTimer > 0) return false;

    this.specialCooldownTimer = this.specialCooldown;
    this.specialActiveTimer = this.specialDuration;
    this.specialWavesFired = 0;
    this.specialWaveTimer = 0;
    return true;
  }

  get specialAbilities() {
    return [{
      id: 'mach-screech',
      name: 'screech',
      cooldown: this.specialCooldown,
      remaining: this.specialCooldownTimer,
      active: this.specialActiveTimer > 0,
    }];
  }

  get locksPlayer() {
    return this.specialActiveTimer > 0;
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

    if (active) {
      this.specialCooldownTimer = Math.max(
        0,
        this.specialCooldownTimer - dt,
      );
    }

    this.specialActiveTimer = Math.max(
      0,
      this.specialActiveTimer - dt,
    );

    if (this.specialActiveTimer > 0) {
      player.grantAbilityInvulnerability?.(dt + 0.08);
      player.vx = 0;
      player.vy = 0;

      this.specialWaveTimer -= dt;

      if (
        this.specialWavesFired < this.specialWaveCount &&
        this.specialWaveTimer <= 0
      ) {
        this.emitSpecialWave(player);
        this.specialWavesFired++;
        this.specialWaveTimer = this.specialWaveInterval;
      }
    }

    if (
      active &&
      this.specialActiveTimer <= 0 &&
      firing &&
      this.cooldownTimer <= 0
    ) {
      this.emitWave(player, pointerWorld);
      this.cooldownTimer = this.fireCooldown;
    }

    for (const wave of this.waves) {
      wave.previousRadius = wave.radius;
      wave.radius += wave.speed * dt;

      if (!wave.hitTarget && target && !target.dead) {
        this.tryHitTarget(wave, target);
      }
    }

    this.waves = this.waves.filter(
      wave => wave.radius < wave.maxRadius,
    );
  }

  emitWave(player, pointerWorld) {
    const aim = this.getAim(player, pointerWorld);

    const muzzle =
      this.sprite
        .getMarkerWorldPosition(
          'muzzle',
          aim.x,
          aim.y,
          aim.angle,
          4,
        );

    this.waves.push({
      x: muzzle.x,
      y: muzzle.y,
      angle: aim.angle,
      radius: this.waveStartRadius,
      previousRadius: this.waveStartRadius,
      hitTarget: false,
      special: false,
      damage: this.baseDamage,
      speed: this.waveSpeed,
      maxRadius: this.waveMaxRadius,
      thickness: this.waveThickness,
      halfAngle: this.waveHalfAngle,
    });

    const recoil =
      aim.dirY > 0.20
        ? this.jetpackRecoil
        : this.recoil;

    player.vx -= aim.dirX * recoil;
    player.vy -= aim.dirY * recoil;

    if (aim.dirY > 0.20) {
      player.grounded = false;
    }
  }

  emitSpecialWave(player) {
    this.waves.push({
      x: player.x,
      y: player.y,
      angle: 0,
      radius: 24,
      previousRadius: 24,
      hitTarget: false,
      special: true,
      damage: this.specialDamage,
      speed: this.specialWaveSpeed,
      maxRadius: this.specialWaveMaxRadius,
      thickness: this.specialWaveThickness,
      halfAngle: Math.PI,
    });
  }

  tryHitTarget(wave, target) {
    const dx = target.x - wave.x;
    const dy = target.y - wave.y;
    const distance = Math.hypot(dx, dy);

    const targetAngle = Math.atan2(dy, dx);
    const angularError = Math.abs(
      shortestAngleDelta(wave.angle, targetAngle),
    );

    if (angularError > wave.halfAngle) return;

    const targetRadius = (target.halfSize ?? 48) * 0.92;
    const inner =
      wave.previousRadius -
      wave.thickness -
      targetRadius;

    const outer =
      wave.radius +
      wave.thickness +
      targetRadius;

    if (
      distance < Math.max(0, inner) ||
      distance > outer
    ) {
      return;
    }

    const travelRatio = Math.min(
      1,
      distance / wave.maxRadius,
    );

    const multiplier =
      1 -
      (1 - this.minDamageMultiplier) *
        travelRatio;

    target.takeDamage?.(
      wave.damage * multiplier,
    );

    wave.hitTarget = true;
  }

  getSpriteEntry(
    angleRadians = 0,
    centered = false,
  ) {
    return centered
      ? this.sprite
          .getCenteredEntry(
            angleRadians,
          )
      : this.sprite
          .getEntry(
            angleRadians,
          );
  }

  draw(ctx, player, pointerWorld, cameraX, artPixelSize) {
    const aim = this.getAim(player, pointerWorld);
    this.sprite.draw(
      ctx,
      aim.x - cameraX,
      aim.y,
      aim.angle,
      artPixelSize,
    );

    this.drawWaves(ctx, cameraX);
  }

  drawWaves(ctx, cameraX) {
    ctx.save();
    ctx.lineCap = 'square';

    for (const wave of this.waves) {
      const ratio = Math.min(
        1,
        wave.radius / wave.maxRadius,
      );

      const alpha =
        0.62 * (1 - ratio * 0.74);

      ctx.globalAlpha = wave.special
        ? Math.min(1, alpha * 1.45)
        : alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = wave.special
        ? 'rgba(255,255,255,0.95)'
        : 'rgba(255,255,255,0)';
      ctx.shadowBlur = wave.special ? 18 : 0;
      ctx.lineWidth = wave.special
        ? Math.max(8, 18 - ratio * 8)
        : Math.max(2, 7 - ratio * 4);

      ctx.beginPath();
      ctx.arc(
        Math.round(wave.x - cameraX),
        Math.round(wave.y),
        wave.radius,
        wave.angle - wave.halfAngle,
        wave.angle + wave.halfAngle,
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
          wave.angle - wave.halfAngle,
          wave.angle + wave.halfAngle,
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
