import {
  compileSpriteAsset,
} from './SpriteAssets.js?v=45';
import {
  rasterize,
} from './pixelShapes.js?v=45';
import {
  evaluateAnimation,
  applyAnimationPose,
} from './SpriteAnimation.js?v=45';

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function rotatePoint(x, y, degrees) {
  const r =
    degrees * Math.PI / 180;

  const c = Math.cos(r);
  const s = Math.sin(r);

  return [
    x * c - y * s,
    x * s + y * c,
  ];
}

export class WeaponTestRoom {
  constructor({
    root,
    canvas,
    angleLabel,
    exitButton,
    onClose = null,
  }) {
    this.root = root;
    this.canvas = canvas;
    this.ctx =
      canvas.getContext('2d');

    this.angleLabel =
      angleLabel;

    this.exitButton =
      exitButton;

    this.onClose = onClose;

    this.opened = false;
    this.asset = null;
    this.compiled = null;
    this.angle = 0;
    this.pointerX =
      canvas.width * 0.75;
    this.pointerY =
      canvas.height * 0.45;

    this.frame = 0;
    this.rasterCache =
      new Map();
    this.currentClipName = 'idle';
    this.animationTime = 0;
    this.animationLastTime = 0;
    this.clipButtons = [
      ...this.root.querySelectorAll(
        '[data-test-clip]',
      ),
    ];

    this.canvas.addEventListener(
      'pointermove',
      event =>
        this.onPointerMove(event),
    );

    this.canvas.addEventListener(
      'pointerdown',
      event => {
        if (event.button === 0) {
          event.preventDefault();
        }
      },
    );

    this.exitButton?.addEventListener(
      'click',
      () => this.close(),
    );

    for (
      const button
      of this.clipButtons
    ) {
      button.addEventListener(
        'click',
        () => {
          this.setClip(
            button.dataset.testClip,
          );
        },
      );
    }

    this.root.addEventListener(
      'keydown',
      event => {
        if (
          event.code === 'Escape'
        ) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
      },
    );
  }

  get isOpen() {
    return this.opened;
  }

  open(asset) {
    const compiled =
      compileSpriteAsset(asset);

    if (
      compiled.asset.type !==
      'weapon'
    ) {
      throw new Error(
        'Weapon test room only accepts weapon assets.',
      );
    }

    this.asset =
      compiled.asset;

    this.compiled =
      compiled;

    this.rasterCache.clear();
    this.angle = 0;
    this.currentClipName = 'idle';
    this.animationTime = 0;
    this.animationLastTime =
      performance.now();
    this.updateClipButtons();

    this.pointerX =
      this.canvas.width * 0.78;

    this.pointerY =
      this.canvas.height * 0.45;

    this.opened = true;
    this.root.classList.remove(
      'hidden',
    );

    this.root.tabIndex = -1;
    this.root.focus();

    this.startLoop();
  }

  close() {
    if (!this.opened) return;

    this.opened = false;

    if (this.frame) {
      cancelAnimationFrame(
        this.frame,
      );

      this.frame = 0;
    }

    this.root.classList.add(
      'hidden',
    );

    this.onClose?.();
  }

  onPointerMove(event) {
    if (!this.opened) return;

    const rect =
      this.canvas
        .getBoundingClientRect();

    this.pointerX =
      (
        event.clientX -
        rect.left
      ) *
      (
        this.canvas.width /
        rect.width
      );

    this.pointerY =
      (
        event.clientY -
        rect.top
      ) *
      (
        this.canvas.height /
        rect.height
      );
  }

  setClip(name) {
    if (
      !['idle', 'fire', 'special']
        .includes(name)
    ) {
      return;
    }

    this.currentClipName = name;
    this.animationTime = 0;
    this.animationLastTime =
      performance.now();
    this.rasterCache.clear();
    this.updateClipButtons();
  }

  updateClipButtons() {
    for (
      const button
      of this.clipButtons
    ) {
      button.classList.toggle(
        'active',
        button.dataset.testClip ===
          this.currentClipName,
      );
    }
  }

  updateAnimation(dt) {
    const evaluation =
      evaluateAnimation(
        this.asset?.animations,
        this.currentClipName,
        this.animationTime,
      );

    const clip =
      evaluation.clip;

    if (!clip) return;

    this.animationTime += dt;

    if (clip.loop) {
      if (clip.duration > 0) {
        this.animationTime %=
          clip.duration;
      }
      return;
    }

    if (
      this.animationTime >=
      clip.duration
    ) {
      if (
        this.currentClipName !==
        'idle'
      ) {
        this.setClip('idle');
      } else {
        this.animationTime =
          clip.duration;
      }
    }
  }

  startLoop() {
    if (this.frame) {
      cancelAnimationFrame(
        this.frame,
      );
    }

    this.animationLastTime =
      performance.now();

    const tick = now => {
      if (!this.opened) {
        this.frame = 0;
        return;
      }

      const dt = Math.min(
        0.05,
        Math.max(
          0,
          (
            now -
            this.animationLastTime
          ) /
          1000,
        ),
      );

      this.animationLastTime = now;

      this.updateAim();
      this.updateAnimation(dt);
      this.draw();

      this.frame =
        requestAnimationFrame(
          tick,
        );
    };

    this.frame =
      requestAnimationFrame(
        tick,
      );
  }

  playerPose() {
    const floorY = 624;

    const centerX =
      this.canvas.width * 0.5;

    const centerY =
      floorY - 28;

    return {
      centerX,
      centerY,
      width: 32,
      height: 56,
      pivotX:
        centerX + 14,
      pivotY:
        centerY - 10,
      floorY,
    };
  }

  updateAim() {
    const pose =
      this.playerPose();

    const dx =
      this.pointerX -
      pose.pivotX;

    const dy =
      this.pointerY -
      pose.pivotY;

    if (
      Math.abs(dx) +
      Math.abs(dy) <
      0.0001
    ) {
      return;
    }

    this.angle =
      Math.atan2(dy, dx) *
      180 /
      Math.PI;

    if (this.angleLabel) {
      const display =
        (
          (this.angle % 360) +
          360
        ) % 360;

      this.angleLabel.textContent =
        `${Math.round(
          display,
        )}°`;
    }
  }

  rasterEntry() {
    const angleKey =
      Math.round(
        this.angle / 2,
      ) * 2;

    const animationKey =
      Math.round(
        this.animationTime * 30,
      ) / 30;

    const key =
      `${this.currentClipName}:${animationKey}:${angleKey}`;

    if (
      this.rasterCache.has(key)
    ) {
      return this.rasterCache.get(
        key,
      );
    }

    const evaluation =
      evaluateAnimation(
        this.asset.animations,
        this.currentClipName,
        animationKey,
      );

    const animatedAsset =
      applyAnimationPose(
        this.asset,
        evaluation,
      );

    const compiled =
      compileSpriteAsset(
        animatedAsset,
      );

    const base =
      rasterize(
        compiled.shape,
        angleKey,
      );

    const glows =
      compiled.glowParts
        .map(part => ({
          color:
            part.glow.color,
          radius:
            part.glow.radius,
          raster:
            rasterize(
              part.shape,
              angleKey,
            ),
        }));

    const entry = {
      angle: angleKey,
      base,
      glows,
      compiled,
    };

    if (
      this.rasterCache.size >= 240
    ) {
      const firstKey =
        this.rasterCache
          .keys()
          .next()
          .value;

      this.rasterCache.delete(
        firstKey,
      );
    }

    this.rasterCache.set(
      key,
      entry,
    );

    return entry;
  }

  drawGrid() {
    const ctx = this.ctx;
    const w =
      this.canvas.width;

    const h =
      this.canvas.height;

    ctx.fillStyle = '#090b0f';
    ctx.fillRect(0, 0, w, h);

    const spacing = 40;

    ctx.lineWidth = 1;

    for (
      let x = 0;
      x <= w;
      x += spacing
    ) {
      ctx.strokeStyle =
        x % 160 === 0
          ? '#171b22'
          : '#11151b';

      ctx.beginPath();
      ctx.moveTo(
        x + 0.5,
        0,
      );

      ctx.lineTo(
        x + 0.5,
        h,
      );

      ctx.stroke();
    }

    for (
      let y = 0;
      y <= h;
      y += spacing
    ) {
      ctx.strokeStyle =
        y % 160 === 0
          ? '#171b22'
          : '#11151b';

      ctx.beginPath();
      ctx.moveTo(
        0,
        y + 0.5,
      );

      ctx.lineTo(
        w,
        y + 0.5,
      );

      ctx.stroke();
    }
  }

  drawPlayer(pose) {
    const ctx = this.ctx;

    const left =
      pose.centerX -
      pose.width / 2;

    const top =
      pose.centerY -
      pose.height / 2;

    ctx.fillStyle = '#8a8e95';
    ctx.fillRect(
      left,
      top,
      pose.width,
      pose.height,
    );

    ctx.strokeStyle = '#4b4f57';
    ctx.strokeRect(
      left + 0.5,
      top + 0.5,
      pose.width,
      pose.height,
    );
  }

  drawRasterAtPivot(
    raster,
    pivotX,
    pivotY,
    artPixelSize = 4,
    {
      alpha = 1,
      shadowColor = null,
      shadowBlur = 0,
    } = {},
  ) {
    const bounds =
      raster.shapeBounds ?? {
        minX:
          -raster.width / 2,
        minY:
          -raster.height / 2,
      };

    const left =
      pivotX +
      bounds.minX *
      artPixelSize;

    const top =
      pivotY +
      bounds.minY *
      artPixelSize;

    this.ctx.save();

    this.ctx.globalAlpha =
      alpha;

    this.ctx.imageSmoothingEnabled =
      false;

    if (shadowColor) {
      this.ctx.shadowColor =
        shadowColor;

      this.ctx.shadowBlur =
        shadowBlur;
    }

    this.ctx.drawImage(
      raster,
      Math.round(left),
      Math.round(top),
      raster.width *
        artPixelSize,
      raster.height *
        artPixelSize,
    );

    this.ctx.restore();
  }

  drawMuzzle(pose, compiled) {
    const marker =
      compiled
        .markers
        .muzzle;

    if (!marker) return;

    const rotated =
      rotatePoint(
        marker.x,
        marker.y,
        this.angle,
      );

    const x =
      pose.pivotX +
      rotated[0] * 4;

    const y =
      pose.pivotY +
      rotated[1] * 4;

    this.ctx.save();

    this.ctx.strokeStyle =
      '#ff8585';

    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.arc(
      x,
      y,
      5,
      0,
      Math.PI * 2,
    );
    this.ctx.stroke();

    this.ctx.restore();
  }

  draw() {
    if (
      !this.opened ||
      !this.compiled
    ) {
      return;
    }

    const ctx = this.ctx;
    const pose =
      this.playerPose();

    this.drawGrid();

    ctx.fillStyle = '#2f343e';
    ctx.fillRect(
      0,
      pose.floorY,
      this.canvas.width,
      this.canvas.height -
        pose.floorY,
    );

    ctx.fillStyle = '#606875';
    ctx.fillRect(
      0,
      pose.floorY,
      this.canvas.width,
      3,
    );

    this.drawPlayer(pose);

    ctx.save();

    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = '#b6c0cc';
    ctx.setLineDash([8, 10]);

    ctx.beginPath();
    ctx.moveTo(
      pose.pivotX,
      pose.pivotY,
    );

    const lineLength = 260;

    const lineAngle =
      this.angle *
      Math.PI / 180;

    ctx.lineTo(
      pose.pivotX +
        Math.cos(lineAngle) *
        lineLength,
      pose.pivotY +
        Math.sin(lineAngle) *
        lineLength,
    );

    ctx.stroke();
    ctx.restore();

    const entry =
      this.rasterEntry();

    for (
      const glow
      of entry.glows
    ) {
      this.drawRasterAtPivot(
        glow.raster,
        pose.pivotX,
        pose.pivotY,
        4,
        {
          alpha: 0.72,
          shadowColor:
            glow.color,
          shadowBlur:
            clamp(
              glow.radius,
              4,
              46,
            ),
        },
      );
    }

    this.drawRasterAtPivot(
      entry.base,
      pose.pivotX,
      pose.pivotY,
      4,
    );

    this.drawMuzzle(
      pose,
      entry.compiled,
    );

    ctx.save();
    ctx.fillStyle = '#bfc6d0';

    ctx.beginPath();
    ctx.arc(
      pose.pivotX,
      pose.pivotY,
      3,
      0,
      Math.PI * 2,
    );

    ctx.fill();
    ctx.restore();
  }
}
