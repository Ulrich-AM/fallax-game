import { rectangle, group, rasterize } from './pixelShapes.js?v=5';
import { PlayerController } from './PlayerController.js?v=5';
import { MOVEMENT } from './movementConfig.js?v=5';
import {
  EQUIPMENT_CATEGORIES,
  ownedItems,
  loadout,
  getCategory,
  getItem,
  findEquippedItem,
  equipItem,
  unequipSlot,
  getPrimaryWeaponId,
} from './equipment.js?v=5';
import { VectorWeapon } from './VectorWeapon.js?v=5';

const menuScreen = document.querySelector('#menu-screen');
const gameScreen = document.querySelector('#game-screen');
const equipmentScreen = document.querySelector('#equipment-screen');
const mainButton = document.querySelector('#main-button');
const equipmentButton = document.querySelector('#equipment-button');
const equipmentBack = document.querySelector('#equipment-back');

const equipmentTabs = document.querySelector('#equipment-tabs');
const equipmentCategoryTitle = document.querySelector('#equipment-category-title');
const equipmentSlotSummary = document.querySelector('#equipment-slot-summary');
const equipmentSlots = document.querySelector('#equipment-slots');
const equipmentInventory = document.querySelector('#equipment-inventory');
const inventoryDropZone = document.querySelector('#inventory-drop-zone');

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
  stamina: '#d7dbe2',
  staminaLow: '#969da8',
  dash: '#f0d34f',
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
const vectorWeapon = new VectorWeapon();

const camera = { x: 0, targetX: 0 };
const keys = new Set();
const pressed = new Set();
const released = new Set();

const pointer = {
  screenX: W * 0.72,
  screenY: H * 0.5,
  firing: false,
};

let currentScreen = 'menu';
let activeEquipmentTab = 'weapons';
let currentDrag = null;

function showScreen(name) {
  currentScreen = name;

  menuScreen.classList.toggle('hidden', name !== 'menu');
  gameScreen.classList.toggle('hidden', name !== 'game');
  equipmentScreen.classList.toggle('hidden', name !== 'equipment');

  if (name !== 'game') {
    keys.clear();
    pressed.clear();
    released.clear();
    pointer.firing = false;
  }

  if (name === 'equipment') renderEquipment();
}

mainButton.addEventListener('click', () => showScreen('game'));
equipmentButton.addEventListener('click', () => showScreen('equipment'));
equipmentBack.addEventListener('click', () => showScreen('menu'));

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (currentScreen !== 'menu') showScreen('menu');
    return;
  }

  if (currentScreen !== 'game') return;

  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);

  if ([
    'Space',
    'ShiftLeft',
    'ShiftRight',
    'ControlLeft',
    'ControlRight',
    'ArrowLeft',
    'ArrowRight',
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

canvas.addEventListener('pointermove', (e) => {
  const p = canvasPointFromEvent(e);
  pointer.screenX = p.x;
  pointer.screenY = p.y;
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || currentScreen !== 'game') return;
  const p = canvasPointFromEvent(e);
  pointer.screenX = p.x;
  pointer.screenY = p.y;
  pointer.firing = true;
  e.preventDefault();
});

addEventListener('pointerup', (e) => {
  if (e.button === 0) pointer.firing = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

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

function getPointerWorld() {
  return {
    x: pointer.screenX + camera.x,
    y: pointer.screenY,
  };
}

function update(dt) {
  if (currentScreen !== 'game') {
    pressed.clear();
    released.clear();
    return;
  }

  if (pressed.has('KeyR')) {
    player.reset();
    vectorWeapon.reset();
  }

  player.update(dt, readInput(), world);

  camera.targetX = player.x - W * 0.38;
  camera.targetX = Math.max(0, Math.min(world.width - W, camera.targetX));

  const follow = 1 - Math.exp(-9 * dt);
  camera.x += (camera.targetX - camera.x) * follow;

  if (getPrimaryWeaponId() === 'vector') {
    vectorWeapon.update(
      dt,
      player,
      getPointerWorld(),
      pointer.firing,
      world,
    );
  }

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

function drawResourceBar(label, value, max, x, y, width, color, rightText = '') {
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(label, x, y - 18);

  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(x, y, width, 12);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, value / max)), 12);
  ctx.strokeStyle = '#343a46';
  ctx.strokeRect(x + 0.5, y + 0.5, width, 12);

  if (rightText) {
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(rightText, x + width + 12, y - 1);
  }

  ctx.restore();
}

function drawHUD() {
  const bx = 24;
  const bw = 260;
  const staminaY = H - 66;
  const dashY = H - 32;

  drawResourceBar(
    'STAMINA',
    player.stamina,
    MOVEMENT.staminaMax,
    bx,
    staminaY,
    bw,
    player.staminaRatio < 0.25 ? COLORS.staminaLow : COLORS.stamina,
    `${Math.ceil(player.stamina)} / ${MOVEMENT.staminaMax}`,
  );

  const dashRatio = player.dashCooldownRatio;
  let dashText = 'READY';
  if (player.dashCooldownTimer > 0) dashText = `${player.dashCooldownTimer.toFixed(2)}s`;
  else if (player.stamina < MOVEMENT.dashStaminaCost) dashText = `needs ${MOVEMENT.dashStaminaCost} stamina`;

  drawResourceBar(
    'DASH',
    dashRatio,
    1,
    bx,
    dashY,
    bw,
    player.dashReady ? COLORS.dash : '#8e8246',
    dashText,
  );

  ctx.save();
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.textAlign = 'right';
  ctx.fillText('A/D move   Space jump   Shift sprint   Ctrl dash   LMB fire', W - 20, H - 24);
  ctx.fillText(getPrimaryWeaponId() ? 'Vector' : 'No weapon equipped', W - 20, H - 44);
  ctx.restore();
}

function renderGame() {
  drawGrid();
  drawPlatforms();
  drawPlayer();

  if (getPrimaryWeaponId() === 'vector') {
    vectorWeapon.draw(ctx, player, getPointerWorld(), camera.x, ART_PIXEL);
  }

  drawHUD();
}

function createItemCard(itemId, source = null) {
  const item = getItem(itemId);
  if (!item) return null;

  const card = document.createElement('div');
  card.className = 'item-card';
  card.draggable = true;
  card.dataset.itemId = item.id;

  if (source) {
    card.dataset.sourceCategory = source.category;
    card.dataset.sourceIndex = String(source.index);
  }

  card.innerHTML = `
    <div class="item-title">
      <span class="item-icon" aria-hidden="true"></span>
      <span>${item.name}</span>
    </div>
    <div class="item-description">${item.description}</div>
  `;

  card.addEventListener('dragstart', (e) => {
    const payload = {
      itemId: item.id,
      sourceCategory: card.dataset.sourceCategory ?? null,
      sourceIndex: card.dataset.sourceIndex ?? null,
    };

    currentDrag = payload;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
  });

  card.addEventListener('dragend', () => {
    currentDrag = null;
  });

  return card;
}

function readDragPayload(e) {
  if (currentDrag) return currentDrag;

  try {
    const raw = e.dataTransfer.getData('text/plain');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderTabs() {
  equipmentTabs.innerHTML = '';

  for (const category of EQUIPMENT_CATEGORIES) {
    const button = document.createElement('button');
    button.className = 'tab-button';
    button.textContent = category.label.toLowerCase();
    button.classList.toggle('active', category.id === activeEquipmentTab);

    button.addEventListener('click', () => {
      activeEquipmentTab = category.id;
      renderEquipment();
    });

    equipmentTabs.appendChild(button);
  }
}

function renderSlots() {
  const category = getCategory(activeEquipmentTab);
  equipmentCategoryTitle.textContent = category.label.toLowerCase();
  equipmentSlotSummary.textContent = `${category.slotCount} slot${category.slotCount === 1 ? '' : 's'}`;
  equipmentSlots.innerHTML = '';

  loadout[category.id].forEach((itemId, index) => {
    const slot = document.createElement('div');
    slot.className = 'equipment-slot';
    slot.dataset.category = category.id;
    slot.dataset.index = String(index);

    const label = document.createElement('div');
    label.className = 'slot-label';
    label.textContent = `${category.slotLabel} ${index + 1}`;
    slot.appendChild(label);

    if (itemId) {
      slot.appendChild(createItemCard(itemId, { category: category.id, index }));
    }

    slot.addEventListener('dragover', (e) => {
      const payload = readDragPayload(e);
      const item = payload ? getItem(payload.itemId) : null;
      if (!item || item.category !== category.id) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const payload = readDragPayload(e);
      if (!payload) return;

      if (equipItem(payload.itemId, category.id, index)) {
        renderEquipment();
      }
    });

    equipmentSlots.appendChild(slot);
  });
}

function renderInventory() {
  equipmentInventory.innerHTML = '';

  const available = ownedItems
    .map(getItem)
    .filter(Boolean)
    .filter(item => item.category === activeEquipmentTab)
    .filter(item => !findEquippedItem(item.id));

  if (!available.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-note';
    empty.textContent = activeEquipmentTab === 'weapons'
      ? 'All owned weapons are equipped.'
      : 'No items in this category yet.';
    equipmentInventory.appendChild(empty);
    return;
  }

  for (const item of available) {
    equipmentInventory.appendChild(createItemCard(item.id));
  }
}

function renderEquipment() {
  renderTabs();
  renderSlots();
  renderInventory();
}

inventoryDropZone.addEventListener('dragover', (e) => {
  const payload = readDragPayload(e);
  if (!payload?.sourceCategory) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  inventoryDropZone.classList.add('drag-over');
});

inventoryDropZone.addEventListener('dragleave', () => {
  inventoryDropZone.classList.remove('drag-over');
});

inventoryDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  inventoryDropZone.classList.remove('drag-over');

  const payload = readDragPayload(e);
  if (!payload?.sourceCategory) return;

  unequipSlot(payload.sourceCategory, Number(payload.sourceIndex));
  renderEquipment();
});

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

  if (currentScreen === 'game') renderGame();
  requestAnimationFrame(frame);
}

renderEquipment();
showScreen('menu');
requestAnimationFrame(frame);

window.BOSSFIGHTS = {
  MOVEMENT,
  loadout,
  ownedItems,
};
