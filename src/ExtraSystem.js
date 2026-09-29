import {
  rectangle,
  group,
  rasterize,
} from './pixelShapes.js?v=36';
import {
  PlayerController,
} from './PlayerController.js?v=36';

const OUTLINE = '#35383e';
const BODY = '#737880';
const DECOY_BODY = '#8a8e95';

function clamp(
  value,
  min,
  max,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export class ExtraSystem {
  constructor() {
    this.cooldowns = {
      turret: 0,
      decoy: 0,
    };

    this.cooldownDurations = {
      turret: 12,
      decoy: 16,
    };

    this.turret = null;
    this.decoy = null;
    this.turretBullets = [];

    this.turretShotSerial = 0;

    this.turretSize = 36;
    this.turretLifetime = 7;
    this.turretFireInterval = 0.12;
    this.turretBulletSpeed = 360;
    this.turretBulletLife = 3.4;
    this.turretBulletDamage = 4.5;
    this.turretBulletSize = 10;

    this.decoyLifetime = 10;
    this.decoyHealth = 42;

    this.turretDefinition =
      group([
        rectangle({
          width:
            this.turretSize / 4,
          height:
            this.turretSize / 4,
          color: BODY,
        }),
      ], {
        mergeOutlines: true,
        outline: {
          enabled: true,
          color: OUTLINE,
          thickness: 1,
        },
        padding: 2,
      });

    this.turretRasterCache =
      new Map();

    this.decoyRaster =
      rasterize(
        group([
          rectangle({
            width: 32 / 4,
            height: 56 / 4,
            color: DECOY_BODY,
          }),
        ], {
          mergeOutlines: true,
          outline: {
            enabled: true,
            color: '#4b4f57',
            thickness: 1,
          },
          padding: 2,
        }),
      );
  }

  reset() {
    this.cooldowns.turret = 0;
    this.cooldowns.decoy = 0;

    this.turret = null;
    this.decoy = null;
    this.turretBullets.length = 0;
    this.turretShotSerial = 0;
  }

  getCooldown(
    id,
  ) {
    return Math.max(
      0,
      this.cooldowns[id] ?? 0,
    );
  }

  isActive(
    id,
  ) {
    if (id === 'turret') {
      return !!this.turret;
    }

    if (id === 'decoy') {
      return !!this.decoy;
    }

    return false;
  }

  activate(
    id,
    player,
    world,
  ) {
    if (
      !player ||
      !world ||
      this.getCooldown(id) > 0
    ) {
      return false;
    }

    if (id === 'turret') {
      this.spawnTurret(
        player,
      );

      this.cooldowns.turret =
        this.cooldownDurations
          .turret;

      return true;
    }

    if (id === 'decoy') {
      this.spawnDecoy(
        player,
      );

      this.cooldowns.decoy =
        this.cooldownDurations
          .decoy;

      return true;
    }

    return false;
  }

  spawnTurret(
    player,
  ) {
    const turret = {
      x: player.x,
      y: player.y,
      w: this.turretSize,
      h: this.turretSize,
      health: 1,
      maxHealth: 1,
      life:
        this.turretLifetime,
      maxLife:
        this.turretLifetime,
      rotation: 0,
      fireTimer: 0,
      dead: false,
      takeDamage: amount => {
        if (
          turret.dead ||
          amount <= 0
        ) {
          return false;
        }

        turret.health = 0;
        turret.life = 0;
        turret.dead = true;
        return true;
      },
    };

    this.turret = turret;
  }

  spawnDecoy(
    player,
  ) {
    const controller =
      new PlayerController({
        x: player.x,
        y: player.y,
        width: player.w,
        height: player.h,
      });

    controller.maxHealth =
      this.decoyHealth;

    controller.health =
      this.decoyHealth;

    controller.stamina = 100;

    this.decoy = {
      controller,
      life:
        this.decoyLifetime,
      maxLife:
        this.decoyLifetime,
      direction:
        player.facing || 1,
      decisionTimer:
        0.75 +
        Math.random() * 0.7,
      jumpTimer:
        0.7 +
        Math.random() * 1.3,
    };
  }

  getBossTarget(
    player,
  ) {
    const controller =
      this.decoy
        ?.controller;

    if (
      controller &&
      controller.health > 0 &&
      this.decoy.life > 0
    ) {
      return controller;
    }

    return player;
  }

  getDamageTargets(
    player,
  ) {
    const result = [];

    const decoy =
      this.decoy?.controller;

    if (
      decoy &&
      decoy.health > 0 &&
      this.decoy.life > 0
    ) {
      result.push(decoy);
    }

    if (
      this.turret &&
      !this.turret.dead &&
      this.turret.life > 0
    ) {
      result.push(
        this.turret,
      );
    }

    if (player) {
      result.push(player);
    }

    return result;
  }

  update(
    dt,
    world,
    boss,
  ) {
    this.cooldowns.turret =
      Math.max(
        0,
        this.cooldowns.turret -
          dt,
      );

    this.cooldowns.decoy =
      Math.max(
        0,
        this.cooldowns.decoy -
          dt,
      );

    this.updateTurret(
      dt,
      boss,
    );

    this.updateDecoy(
      dt,
      world,
    );

    this.updateTurretBullets(
      dt,
      world,
      boss,
    );
  }

  updateTurret(
    dt,
    boss,
  ) {
    const turret =
      this.turret;

    if (!turret) return;

    turret.life -= dt;

    turret.rotation =
      (
        turret.rotation +
        220 * dt
      ) %
      360;

    turret.fireTimer -= dt;

    while (
      turret.fireTimer <= 0 &&
      turret.life > 0 &&
      !turret.dead
    ) {
      this.fireTurretPair(
        turret,
      );

      turret.fireTimer +=
        this.turretFireInterval;
    }

    if (
      turret.life <= 0 ||
      turret.health <= 0 ||
      turret.dead
    ) {
      this.turret = null;
    }
  }

  fireTurretPair(
    turret,
  ) {
    const angle =
      turret.rotation *
      Math.PI /
      180;

    const dx =
      Math.cos(angle);

    const dy =
      Math.sin(angle);

    const muzzle =
      this.turretSize *
      0.62;

    for (
      const side
      of [-1, 1]
    ) {
      this.turretBullets.push({
        x:
          turret.x +
          dx *
          muzzle *
          side,
        y:
          turret.y +
          dy *
          muzzle *
          side,
        vx:
          dx *
          this.turretBulletSpeed *
          side,
        vy:
          dy *
          this.turretBulletSpeed *
          side,
        life:
          this.turretBulletLife,
        maxLife:
          this.turretBulletLife,
        size:
          this.turretBulletSize,
        damage:
          this.turretBulletDamage,
      });
    }

    this.turretShotSerial++;
  }

  updateTurretBullets(
    dt,
    world,
    boss,
  ) {
    for (
      const bullet
      of this.turretBullets
    ) {
      bullet.x +=
        bullet.vx * dt;

      bullet.y +=
        bullet.vy * dt;

      bullet.life -= dt;

      if (
        bullet.life <= 0
      ) {
        continue;
      }

      if (
        boss &&
        !boss.dead &&
        boss.hitTest?.(
          bullet.x,
          bullet.y,
          bullet.size * 0.5,
        )
      ) {
        if (
          boss.takeDamage?.(
            bullet.damage,
          ) !== false
        ) {
          bullet.life = 0;
        }
      }

      if (
        bullet.x < -80 ||
        bullet.x >
          world.width + 80 ||
        bullet.y <
          world.roofY - 120 ||
        bullet.y >
          world.floorY + 120
      ) {
        bullet.life = 0;
      }
    }

    this.turretBullets =
      this.turretBullets
        .filter(
          bullet =>
            bullet.life > 0,
        );
  }

  updateDecoy(
    dt,
    world,
  ) {
    const decoy =
      this.decoy;

    if (!decoy) return;

    decoy.life -= dt;

    const controller =
      decoy.controller;

    if (
      decoy.life <= 0 ||
      controller.health <= 0
    ) {
      this.decoy = null;
      return;
    }

    decoy.decisionTimer -= dt;
    decoy.jumpTimer -= dt;

    if (
      controller.x <=
        controller.w * 0.65 ||
      controller.x >=
        world.width -
        controller.w * 0.65
    ) {
      decoy.direction *= -1;
      decoy.decisionTimer =
        0.8;
    }

    if (
      decoy.decisionTimer <= 0
    ) {
      if (
        Math.random() <
        0.46
      ) {
        decoy.direction *= -1;
      }

      decoy.decisionTimer =
        0.8 +
        Math.random() * 1.35;
    }

    const jump =
      decoy.jumpTimer <= 0 &&
      controller.grounded;

    if (jump) {
      decoy.jumpTimer =
        1.1 +
        Math.random() * 1.8;
    }

    controller.update(
      dt,
      {
        move:
          decoy.direction,
        jumpHeld:
          jump,
        jumpPressed:
          jump,
        jumpReleased:
          false,
        sprintHeld:
          false,
        dashPressed:
          false,
        dashTarget:
          null,
        dashCooldownMultiplier:
          1,
      },
      world,
    );
  }

  turretRaster(
    angleDegrees,
  ) {
    const key =
      (
        Math.round(
          angleDegrees / 5,
        ) * 5
      ) %
      360;

    if (
      !this.turretRasterCache
        .has(key)
    ) {
      this.turretRasterCache.set(
        key,
        rasterize(
          this.turretDefinition,
          key,
        ),
      );
    }

    return this.turretRasterCache
      .get(key);
  }

  drawRasterCentered(
    ctx,
    raster,
    x,
    y,
    cameraX,
    artPixelSize,
    alpha = 1,
  ) {
    const width =
      raster.width *
      artPixelSize;

    const height =
      raster.height *
      artPixelSize;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled =
      false;

    ctx.drawImage(
      raster,
      Math.round(
        x -
        cameraX -
        width / 2,
      ),
      Math.round(
        y -
        height / 2,
      ),
      width,
      height,
    );

    ctx.restore();
  }

  draw(
    ctx,
    cameraX,
    artPixelSize = 4,
  ) {
    for (
      const bullet
      of this.turretBullets
    ) {
      const alpha =
        clamp(
          bullet.life /
            bullet.maxLife,
          0,
          1,
        );

      ctx.save();
      ctx.globalAlpha =
        alpha;
      ctx.fillStyle =
        '#d7dbe2';

      ctx.fillRect(
        Math.round(
          bullet.x -
          cameraX -
          bullet.size / 2,
        ),
        Math.round(
          bullet.y -
          bullet.size / 2,
        ),
        bullet.size,
        bullet.size,
      );

      ctx.restore();
    }

    if (this.turret) {
      const raster =
        this.turretRaster(
          this.turret.rotation,
        );

      this.drawRasterCentered(
        ctx,
        raster,
        this.turret.x,
        this.turret.y,
        cameraX,
        artPixelSize,
        clamp(
          this.turret.life /
            0.35,
          0,
          1,
        ),
      );
    }

    if (this.decoy) {
      const controller =
        this.decoy.controller;

      const alpha =
        clamp(
          Math.min(
            1,
            this.decoy.life /
              0.5,
          ),
          0,
          1,
        );

      this.drawRasterCentered(
        ctx,
        this.decoyRaster,
        controller.x,
        controller.y,
        cameraX,
        artPixelSize,
        alpha,
      );
    }
  }
}
