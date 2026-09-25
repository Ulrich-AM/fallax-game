import { rectangle, polygon, group, rasterize } from './pixelShapes.js';
import { PlayerController } from './PlayerController.js';
import { MOVEMENT } from './movementConfig.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const ART_PIXEL = 4;

const COLORS = {
  bg: '#0b0c10',
  gridMinor: '#12151b',
  gridMajor: '#191d25',
  platform: '#343945',
  platformTop: '#5d6472',
  player: '#f0d34f',
  outline: '#050609',
  text: '#f0f1f4',
  dim: '#9ca2ad',
  panel: 'rgba(10, 11, 15, 0.86)',
  stamina: '#d7dbe2',
  staminaLow: '#a2a7b0',
  rotateFill: '#76b7ff',
  rotateAccent: '#ff8276',
};

const world = {
  width: 2700,
  floorY: 650,
  platforms: [
    { x: 340, y: 550, w: 250, h: 20 },
    { x: 720, y: 470, w: 210, h: 20 },
    { x: 1040, y: 565, w: 300, h: 20 },
    { x: 1470, y: 500, w: 230, h: 20 },
    { x: 1810, y: 420, w: 260, h: 20 },
    { x: 2190, y: 545, w: 260, h: 20 },
  ],
};

const player = new PlayerController({ x: 210, y: 500, width: 32, height: 56 });

const playerDefinition = group([
  rectangle({
    width: player.w / ART_PIXEL,
    height: player.h / ART_PIXEL,
    color: COLORS.player,
  }),
], {
  mergeOutlines: true,
  outline: { enabled: true, color: COLORS.outline, thickness: 1 },
});
const playerRaster = rasterize(playerDefinition);

// Clickable rotation test. It deliberately combines rectangles and polygons
// into one merged silhouette so rotating/re-rasterizing artifacts are easy to see.
const rotationTest = {
  x: world.width / 2,
  y: 330,
  angle: 0,
  clickStep: 15,
  hitRadius: 78,
};

const rotationTestDefinition = group([
  rectangle({ width: 15, height: 9, color: COLORS.rotateFill }),
  rectangle({ width: 5, height: 5, x: -7, y: -6, color: COLORS.rotateFill }),
  polygon({
    points: [[0, -5], [7, 0], [0, 5]],
    x: 11,
    y: 0,
    color: COLORS.rotateAccent,
  }),
  polygon({
    points: [[-4, 0], [0, -6], [4, 0]],
    x: 1,
    y: -8,
    color: COLORS.rotateAccent,
  }),
], {
  mergeOutlines: true,
  outline: { enabled: true, color: COLORS.outline, thickness: 1 },
  padding: 3,
});

let rotationTestRaster = rasterize(rotationTestDefinition, rotationTest.angle);

// Reusable examples remain available in the console for future boss composition.
export const shapeExamples = {
  merged: group([
    rectangle({ width: 12, height: 8, x: 0, y: 0, color: '#7bc4ff' }),
    polygon({ points: [[-3, 0], [0, -5], [3, 0]], x: 0, y: -6, color: '#ff8375' }),
  ], {
    mergeOutlines: true,
    outline: { enabled: true, color: '#050609', thickness: 1 },
  }),
  separate: group([
    rectangle({ width: 12, height: 8, color: '#7bc4ff' }),
    polygon({
      points: [[-3, 0], [0, -5], [3, 0]],
      y: -6,
      color: '#ff8375',
      outline: { enabled: true, color: '#050609', thickness: 1 },
    }),
  ], {
    mergeOutlines: false,
    outline: { enabled: true, color: '#050609', thickness: 1 },
  }),
  noOutline: group([
    polygon({ points: [[0, -6], [6, 5], [-6, 5]], color: '#b58cff' }),
  ], { mergeOutlines: true, outline: false }),
};

const camera = { x: 0, targetX: 0 };
const keys = new Set();
const pressed = new Set();
const released = new Set();

addEventListener('keydown', (e) => {
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
  if ([
    'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
    'ArrowLeft', 'ArrowRight',
  ].includes(e.code)) {
    e.preventDefault();
  }
});

addEventListener('keyup', (e) => {
  keys.delete(e.code);
  released.add(e.code);
});

function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPointFromEvent(e);
  const worldX = p.x + camera.x;
  const dx = worldX - rotationTest.x;
  const dy = p.y - rotationTest.y;

  if (Math.abs(dx) <= rotationTest.hitRadius && Math.abs(dy) <= rotationTest.hitRadius) {
    rotationTest.angle = (rotationTest.angle + rotationTest.clickStep) % 360;
    rotationTestRaster = rasterize(rotationTestDefinition, rotationTest.angle);
  }
});

function readInput() {
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  return {
    move: (right ? 1 : 0) - (left ? 1 : 0),
    jumpHeld: keys.has('Space'),
    jumpPressed: pressed.has('Space'),
    jumpReleased: released.has('Space'),
    sprintHeld: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    dashPressed: pressed.has('ControlLeft') || pressed.has('ControlRight'),
  };
}

function update(dt) {
  if (pressed.has('KeyR')) player.reset();

  player.update(dt, readInput(), world);

  camera.targetX = player.x - W * 0.38;
  camera.targetX = Math.max(0, Math.min(world.width - W, camera.targetX));

  const follow = 1 - Math.exp(-9 * dt);
  camera.x += (camera.targetX - camera.x) * follow;

  pressed.clear();
  released.clear();
}

function drawGrid() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  const spacing = 40;
  const offset = -(camera.x % spacing);
  ctx.lineWidth = 1;

  for (let i = -1; i < Math.ceil(W / spacing) + 2; i++) {
    const worldIndex = Math.floor((camera.x + i * spacing) / spacing);
    const x = Math.round(offset + i * spacing) + 0.5;
    ctx.strokeStyle = worldIndex % 4 === 0 ? COLORS.gridMajor : COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 10; y < H; y += spacing) {
    ctx.strokeStyle = Math.floor(y / spacing) % 4 === 0 ? COLORS.gridMajor : COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

function drawPlatforms() {
  ctx.fillStyle = COLORS.platform;
  ctx.fillRect(-camera.x, world.floorY, world.width, H - world.floorY);
  ctx.fillStyle = COLORS.platformTop;
  ctx.fillRect(-camera.x, world.floorY, world.width, 3);

  for (const p of world.platforms) {
    const x = Math.round(p.x - camera.x);
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(x, p.y, p.w, p.h);
    ctx.fillStyle = COLORS.platformTop;
    ctx.fillRect(x, p.y, p.w, 3);
  }
}

function drawRasterAt(raster, worldX, worldY, alpha = 1, scale = { x: 1, y: 1 }) {
  const screenX = worldX - camera.x;
  const dw = raster.width * ART_PIXEL;
  const dh = raster.height * ART_PIXEL;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(screenX), Math.round(worldY));
  ctx.scale(scale.x, scale.y);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(raster, Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
  ctx.restore();
}

function drawPlayer() {
  for (const a of player.afterimages) {
    drawRasterAt(playerRaster, a.x, a.y, (a.life / a.maxLife) * 0.23);
  }
  drawRasterAt(playerRaster, player.x, player.y, 1, player.visualScale);
}

function drawRotationTest() {
  const screenX = rotationTest.x - camera.x;
  if (screenX < -120 || screenX > W + 120) return;

  drawRasterAt(rotationTestRaster, rotationTest.x, rotationTest.y);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText('rotation test', Math.round(screenX), rotationTest.y + 68);
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`click to rotate  •  ${rotationTest.angle}°`, Math.round(screenX), rotationTest.y + 87);
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(18, 18, 306, 140);
  ctx.strokeStyle = '#2c313c';
  ctx.strokeRect(18.5, 18.5, 306, 140);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('Movement test', 32, 31);

  ctx.font = '13px Arial, sans-serif';
  ctx.fillStyle = COLORS.dim;
  const movementState = player.isSprinting ? 'sprinting' : (player.grounded ? 'grounded' : 'airborne');
  ctx.fillText(`speed ${Math.abs(player.vx).toFixed(0)}   vertical ${player.vy.toFixed(0)}`, 32, 57);
  ctx.fillText(movementState, 32, 78);

  ctx.fillText('stamina', 32, 101);
  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(89, 104, 154, 7);
  ctx.fillStyle = player.staminaRatio < 0.25 ? COLORS.staminaLow : COLORS.stamina;
  ctx.fillRect(89, 104, 154 * player.staminaRatio, 7);
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`${Math.ceil(player.stamina)}`, 252, 97);

  ctx.fillText('dash', 32, 126);
  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(68, 129, 130, 6);
  ctx.fillStyle = player.dashReady ? COLORS.player : '#9e8d43';
  ctx.fillRect(68, 129, 130 * player.dashCooldownRatio, 6);
  ctx.fillStyle = COLORS.dim;
  let dashText = 'ready';
  if (player.dashCooldownTimer > 0) dashText = 'cooldown';
  else if (player.stamina < MOVEMENT.dashStaminaCost) dashText = 'no stamina';
  ctx.fillText(dashText, 210, 122);
  ctx.restore();
}

function render() {
  drawGrid();
  drawPlatforms();
  drawRotationTest();
  drawPlayer();
  drawHUD();
}

let last = performance.now();
let accumulator = 0;
const STEP = 1 / 120;

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 0.05);
  accumulator += dt;

  while (accumulator >= STEP) {
    update(STEP);
    accumulator -= STEP;
  }

  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Expose tuning values for quick inspection in the browser console.
window.BOSSFIGHTS_MOVEMENT = MOVEMENT;
