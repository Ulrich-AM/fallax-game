import { rectangle, group, rasterize } from './pixelShapes.js?v=14';

function rayCircleHit(originX, originY, dirX, dirY, maxDistance, circleX, circleY, radius) {
  const ox = originX - circleX;
  const oy = originY - circleY;

  const b = 2 * (ox * dirX + oy * dirY);
  const c = ox * ox + oy * oy - radius * radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const t1 = (-b - root) / 2;
  const t2 = (-b + root) / 2;

  if (t1 >= 0 && t1 <= maxDistance) return t1;
  if (t2 >= 0 && t2 <= maxDistance) return t2;
  return null;
}

export class EuclidWeapon {
  constructor() {
    this.name = 'Euclid';
    this.damagePerSecond = 8;
    this.orbitRadius = 42;
    this.beamRange = 1700;
    this.beamWidth = 3;
    this.bodyLength = 5;
    this.bodyThickness = 3;

    this.firing = false;
    this.aim = {
      angle: 0,
      x: 0,
      y: 0,
      dirX: 1,
      dirY: 0,
      beamEndX: 0,
      beamEndY: 0,
    };

    this.definition = group([
      rectangle({
        width: this.bodyLength,
        height: this.bodyThickness,
        color: '#050505',
      }),
    ], {
      mergeOutlines: true,
      outline: false,
      padding: 1,
    });

    this.rasterCache = new Map();
  }

  reset() {
    this.firing = false;
  }

  getAim(player, pointerWorld) {
    const dx = pointerWorld.x - player.x;
    const dy = pointerWorld.y - player.y;
    const angle = Math.atan2(dy, dx);
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

  update(dt, player, pointerWorld, firing, target) {
    const aim = this.getAim(player, pointerWorld);
    this.firing = firing;

    let beamDistance = this.beamRange;

    if (firing && target && !target.dead) {
      const radius = (target.halfSize ?? 48) * 0.94;
      const hitDistance = rayCircleHit(
        aim.x,
        aim.y,
        aim.dirX,
        aim.dirY,
        this.beamRange,
        target.x,
        target.y,
        radius,
      );

      if (hitDistance !== null) {
        beamDistance = hitDistance;
        target.takeDamage?.(this.damagePerSecond * dt);
      }
    }

    this.aim = {
      ...aim,
      beamEndX: aim.x + aim.dirX * beamDistance,
      beamEndY: aim.y + aim.dirY * beamDistance,
    };
  }

  getRaster(angleRadians) {
    const degrees = angleRadians * 180 / Math.PI;
    const quantized = Math.round(degrees / 3) * 3;
    const key = ((quantized % 360) + 360) % 360;

    if (!this.rasterCache.has(key)) {
      this.rasterCache.set(key, rasterize(this.definition, key));
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

    if (!this.firing) return;

    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = this.beamWidth;
    ctx.lineCap = 'butt';
    ctx.shadowColor = 'rgba(255,255,255,0.65)';
    ctx.shadowBlur = 7;

    ctx.beginPath();
    ctx.moveTo(
      Math.round(this.aim.x - cameraX),
      Math.round(this.aim.y),
    );
    ctx.lineTo(
      Math.round(this.aim.beamEndX - cameraX),
      Math.round(this.aim.beamEndY),
    );
    ctx.stroke();
    ctx.restore();
  }
}
