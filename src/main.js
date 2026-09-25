import { rectangle, group, rasterize } from './pixelShapes.js?v=26';
import { PlayerController } from './PlayerController.js?v=26';
import { MOVEMENT } from './movementConfig.js?v=26';
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
  getWeaponSlotId,
  SHOP_CATALOG,
  purchaseItem,
} from './equipment.js?v=26';
import { VectorWeapon } from './VectorWeapon.js?v=26';
import { EuclidWeapon } from './EuclidWeapon.js?v=26';
import { HorizonWeapon } from './HorizonWeapon.js?v=26';
import { MachWeapon } from './MachWeapon.js?v=26';
import { BackfireAbility } from './BackfireAbility.js?v=26';
import { BossAI } from './bosses/BossAI.js?v=26';
import { PrologueBoss } from './bosses/PrologueBoss.js?v=26';
import { MatrixBoss } from './bosses/MatrixBoss.js?v=26';

const menuScreen = document.querySelector('#menu-screen');
const chapterScreen = document.querySelector('#chapter-screen');
const gameScreen = document.querySelector('#game-screen');
const equipmentScreen = document.querySelector('#equipment-screen');
const shopScreen = document.querySelector('#shop-screen');
const mainButton = document.querySelector('#main-button');
const equipmentButton = document.querySelector('#equipment-button');
const shopButton = document.querySelector('#shop-button');
const equipmentBack = document.querySelector('#equipment-back');
const shopBack = document.querySelector('#shop-back');
const shopItems = document.querySelector('#shop-items');
const chapterBack = document.querySelector('#chapter-back');
const chapterTabs = document.querySelector('#chapter-tabs');
const bossList = document.querySelector('#boss-list');
const deathMenu = document.querySelector('#death-menu');
const encounterResultTitle = document.querySelector('#encounter-result-title');
const deathRestart = document.querySelector('#death-restart');
const deathMenuButton = document.querySelector('#death-menu-button');
const deathInventory = document.querySelector('#death-inventory');
const weaponSlotButtons = [
  document.querySelector('#weapon-slot-1'),
  document.querySelector('#weapon-slot-2'),
];

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
  playerOutline: '#8f7b20',
  text: '#f0f1f4',
  dim: '#9ca2ad',
  health: '#c76565',
  stamina: '#d7dbe2',
  staminaLow: '#969da8',
  dash: '#f0d34f',
  special: '#f0f1f4',
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
  outline: { enabled: true, color: COLORS.playerOutline, thickness: 1 },
});

const playerRaster = rasterize(playerDefinition);
const vectorWeapon = new VectorWeapon();
const euclidWeapon = new EuclidWeapon();
const horizonWeapon = new HorizonWeapon();
const machWeapon = new MachWeapon();
const backfireAbility = new BackfireAbility();
const prologueBoss = new PrologueBoss(world);
const matrixBoss = new MatrixBoss(world);
let activeBoss = null;

const camera = {
  x: 0,
  targetX: 0,
  shakeTime: 0,
  shakeDuration: 0,
  shakeIntensity: 0,
  shakePhase: 0,
};
const keys = new Set();
const pressed = new Set();
const released = new Set();

const pointer = {
  screenX: W * 0.72,
  screenY: H * 0.5,
  firing: false,
};

const CHAPTERS = [
  {
    id: 'genesis',
    label: 'genesis',
    bosses: [
      { id: 'prologue', label: 'prologue', playable: true },
      { id: 'matrix', label: 'matrix', playable: true },
    ],
  },
  { id: 'unknown-2', label: '?', bosses: [{ id: 'unknown-2-boss', label: '?', playable: false }] },
  { id: 'unknown-3', label: '?', bosses: [{ id: 'unknown-3-boss', label: '?', playable: false }] },
  { id: 'unknown-4', label: '?', bosses: [{ id: 'unknown-4-boss', label: '?', playable: false }] },
  { id: 'unknown-5', label: '?', bosses: [{ id: 'unknown-5-boss', label: '?', playable: false }] },
];

let currentScreen = 'menu';
let encounterOver = false;
let activeWeaponSlot = 0;
let activeChapter = 'genesis';
let activeEquipmentTab = 'weapons';
let currentDrag = null;

function getActiveWeaponId() {
  return getWeaponSlotId(activeWeaponSlot);
}

function getWeaponInstance(id) {
  if (id === 'vector') return vectorWeapon;
  if (id === 'euclid') return euclidWeapon;
  if (id === 'horizon') return horizonWeapon;
  if (id === 'mach') return machWeapon;
  return null;
}

function getActiveWeaponInstance() {
  return getWeaponInstance(getActiveWeaponId());
}

function isAbilityEquipped(id) {
  return loadout.abilities.includes(id);
}

function refreshWeaponButtons() {
  weaponSlotButtons.forEach((button, index) => {
    const id = getWeaponSlotId(index);
    const item = getItem(id);

    button.textContent = item ? item.name.toLowerCase() : 'empty';
    button.disabled = !item;
    button.classList.toggle('active', index === activeWeaponSlot && !!item);
  });
}

function selectWeaponSlot(index) {
  if (!getWeaponSlotId(index)) return;
  activeWeaponSlot = index;
  refreshWeaponButtons();
}

weaponSlotButtons[0].addEventListener('click', () => selectWeaponSlot(0));
weaponSlotButtons[1].addEventListener('click', () => selectWeaponSlot(1));

function setDeathMenuVisible(visible, result = 'defeated') {
  encounterResultTitle.textContent = result;
  deathMenu.classList.toggle('hidden', !visible);
}

function endEncounter(result) {
  if (encounterOver) return;

  encounterOver = true;
  pointer.firing = false;
  keys.clear();
  pressed.clear();
  released.clear();
  setDeathMenuVisible(true, result);
}

function showScreen(name) {
  currentScreen = name;

  menuScreen.classList.toggle('hidden', name !== 'menu');
  chapterScreen.classList.toggle('hidden', name !== 'chapters');
  gameScreen.classList.toggle('hidden', name !== 'game');
  equipmentScreen.classList.toggle('hidden', name !== 'equipment');
  shopScreen.classList.toggle('hidden', name !== 'shop');

  if (name !== 'game') {
    keys.clear();
    pressed.clear();
    released.clear();
    pointer.firing = false;
    setDeathMenuVisible(false, 'defeated');
  }

  if (name === 'equipment') renderEquipment();
  if (name === 'shop') renderShop();
  if (name === 'chapters') renderChapterSelect();
}

mainButton.addEventListener('click', () => showScreen('chapters'));
equipmentButton.addEventListener('click', () => showScreen('equipment'));
shopButton.addEventListener('click', () => showScreen('shop'));
equipmentBack.addEventListener('click', () => showScreen('menu'));
shopBack.addEventListener('click', () => showScreen('menu'));
chapterBack.addEventListener('click', () => showScreen('menu'));

deathRestart.addEventListener('click', () => {
  if (activeBoss === matrixBoss) startMatrix();
  else startPrologue();
});
deathMenuButton.addEventListener('click', () => {
  encounterOver = false;
  activeBoss = null;
  showScreen('menu');
});
deathInventory.addEventListener('click', () => {
  encounterOver = false;
  activeBoss = null;
  showScreen('equipment');
});

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (currentScreen === 'game') showScreen('chapters');
    else if (currentScreen !== 'menu') showScreen('menu');
    return;
  }

  if (currentScreen !== 'game') return;

  if (e.code === 'Digit1') selectWeaponSlot(0);
  if (e.code === 'Digit2') selectWeaponSlot(1);

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

function triggerCameraShake(intensity = 10, duration = 0.22) {
  camera.shakeIntensity = Math.max(camera.shakeIntensity, intensity);
  camera.shakeDuration = Math.max(camera.shakeDuration, duration);
  camera.shakeTime = Math.max(camera.shakeTime, duration);
}

function updateCameraShake(dt) {
  if (camera.shakeTime <= 0) return;
  camera.shakeTime = Math.max(0, camera.shakeTime - dt);
  camera.shakePhase += dt * 47;
}

function getCameraShakeOffset() {
  if (camera.shakeTime <= 0 || camera.shakeDuration <= 0) return { x: 0, y: 0 };

  const strength = camera.shakeIntensity * (camera.shakeTime / camera.shakeDuration);
  return {
    x: Math.sin(camera.shakePhase * 1.37) * strength,
    y: Math.cos(camera.shakePhase * 1.91) * strength * 0.72,
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

  if (encounterOver) {
    pressed.clear();
    released.clear();
    pointer.firing = false;
    return;
  }

  if (pressed.has('KeyR')) {
    player.reset();
    vectorWeapon.reset();
    euclidWeapon.reset();
    horizonWeapon.reset();
    machWeapon.reset();
    backfireAbility.reset(player);
    activeBoss?.reset?.(world);
  }

  const activeWeaponId = getActiveWeaponId();
  const activeWeapon = getActiveWeaponInstance();

  const backfireEquipped = isAbilityEquipped('backfire');

  const playerInput = {
    ...readInput(),
    dashTarget: getPointerWorld(),
    dashCooldownMultiplier: backfireEquipped
      ? backfireAbility.dashCooldownMultiplier
      : 1,
  };

  const weaponLocksPlayer =
    !!activeWeapon?.locksPlayer ||
    !!machWeapon.locksPlayer;
  const lockedPlayerX = player.x;
  const lockedPlayerY = player.y;

  if (weaponLocksPlayer) {
    playerInput.move = 0;
    playerInput.jumpHeld = false;
    playerInput.jumpPressed = false;
    playerInput.jumpReleased = false;
    playerInput.sprintHeld = false;
    playerInput.dashPressed = false;
    player.vx = 0;
    player.vy = 0;
  }

  player.update(dt, playerInput, world);

  if (weaponLocksPlayer) {
    player.x = lockedPlayerX;
    player.y = lockedPlayerY;
    player.prevY = lockedPlayerY;
    player.vx = 0;
    player.vy = 0;
  }

  camera.targetX = player.x - W * 0.38;
  camera.targetX = Math.max(0, Math.min(world.width - W, camera.targetX));

  const follow = 1 - Math.exp(-9 * dt);
  camera.x += (camera.targetX - camera.x) * follow;

  backfireAbility.update(
    dt,
    player,
    world,
    activeBoss,
    backfireEquipped,
  );

  activeBoss?.update?.(dt, {
    player,
    world,
    shakeCamera: triggerCameraShake,
  });

  updateCameraShake(dt);

  if (pressed.has('KeyQ')) {
    activeWeapon?.triggerSpecial?.({
      player,
      pointerWorld: getPointerWorld(),
    });
  }

  // Vector projectiles keep moving after switching weapons, but it only begins
  // new bursts while its slot is active.
  vectorWeapon.update(
    dt,
    player,
    getPointerWorld(),
    activeWeaponId === 'vector' && pointer.firing,
    world,
    activeWeaponId === 'vector',
  );
  vectorWeapon.applyHitsToTarget(activeBoss, ART_PIXEL);

  // Euclid has no ammo, heat, or charge depletion. Holding fire simply keeps
  // the low-damage beam active for as long as this weapon is selected.
  euclidWeapon.update(
    dt,
    player,
    getPointerWorld(),
    activeWeaponId === 'euclid' && pointer.firing,
    activeBoss,
    ART_PIXEL,
    activeWeaponId === 'euclid',
  );

  horizonWeapon.update(
    dt,
    player,
    getPointerWorld(),
    activeWeaponId === 'horizon' && pointer.firing,
    activeBoss,
    ART_PIXEL,
    activeWeaponId === 'horizon',
  );

  machWeapon.update(
    dt,
    player,
    getPointerWorld(),
    activeWeaponId === 'mach' && pointer.firing,
    activeBoss,
    activeWeaponId === 'mach',
  );

  if (player.health <= 0) {
    endEncounter('defeated');
    return;
  }

  if (activeBoss?.dead || activeBoss?.health <= 0) {
    endEncounter('victory');
    return;
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
  const healthY = H - 100;
  const specialY = H - 134;
  const staminaY = H - 66;
  const dashY = H - 32;

  const activeWeapon = getActiveWeaponInstance();
  const specials = activeWeapon?.specialAbilities ?? [];

  if (specials.length > 0) {
    const special = specials[0];
    const readyRatio =
      special.cooldown > 0
        ? 1 - Math.min(1, special.remaining / special.cooldown)
        : 1;

    const specialText =
      special.remaining <= 0
        ? 'READY [Q]'
        : `${special.remaining.toFixed(1)}s`;

    drawResourceBar(
      'SPECIAL ABILITY',
      readyRatio,
      1,
      bx,
      specialY,
      bw,
      COLORS.special,
      specialText,
    );
  }

  drawResourceBar(
    'HEALTH',
    player.health,
    player.maxHealth,
    bx,
    healthY,
    bw,
    COLORS.health,
    `${Math.ceil(player.health)} / ${player.maxHealth}`,
  );

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
  ctx.fillText('A/D move   Space jump   Shift sprint   Ctrl dash   Q special   LMB fire', W - 20, H - 24);
  const activeItem = getItem(getActiveWeaponId());
  ctx.fillText(activeItem ? activeItem.name : 'No weapon equipped', W - 20, H - 44);
  ctx.restore();
}

function drawBossBar() {
  if (!activeBoss) return;

  const width = 560;
  const height = 12;
  const x = Math.round((W - width) / 2);
  const y = 34;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(activeBoss.name, W / 2, y - 8);

  ctx.fillStyle = '#17191f';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#8a8e95';
  ctx.fillRect(x, y, width * activeBoss.healthRatio, height);

  ctx.strokeStyle = '#3b404a';
  ctx.strokeRect(x + 0.5, y + 0.5, width, height);

  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.textBaseline = 'top';
  ctx.fillText(
    activeBoss.phaseLabel ?? '',
    W / 2,
    y + height + 6,
  );

  ctx.restore();
}

function renderGame() {
  const shake = getCameraShakeOffset();

  ctx.save();
  ctx.translate(Math.round(shake.x), Math.round(shake.y));

  drawGrid();
  drawPlatforms();

  activeBoss?.draw?.(ctx, camera.x, ART_PIXEL);
  drawPlayer();

  const activeWeaponId = getActiveWeaponId();

  if (activeWeaponId === 'vector') {
    vectorWeapon.draw(ctx, player, getPointerWorld(), camera.x, ART_PIXEL);
  } else {
    // Existing Vector rounds remain visible after changing weapons.
    vectorWeapon.drawBullets(ctx, camera.x, ART_PIXEL);
  }

  if (activeWeaponId === 'euclid') {
    euclidWeapon.draw(ctx, player, getPointerWorld(), camera.x, ART_PIXEL);
  }

  if (activeWeaponId === 'horizon') {
    horizonWeapon.draw(ctx, player, getPointerWorld(), camera.x);
  } else {
    horizonWeapon.drawSpecialProjectiles(ctx, camera.x);
  }

  if (activeWeaponId === 'mach') {
    machWeapon.draw(
      ctx,
      player,
      getPointerWorld(),
      camera.x,
      ART_PIXEL,
    );
  } else {
    machWeapon.drawWaves(ctx, camera.x);
  }

  backfireAbility.draw(ctx, camera.x);

  ctx.restore();

  drawBossBar();
  drawHUD();
}

function prepareEncounter(boss) {
  encounterOver = false;
  setDeathMenuVisible(false, 'defeated');

  player.reset();
  vectorWeapon.reset();
  euclidWeapon.reset();
  horizonWeapon.reset();
  machWeapon.reset();
  backfireAbility.reset(player);

  boss.reset(world);
  activeBoss = boss;

  camera.x = 0;
  camera.targetX = 0;
  camera.shakeTime = 0;
  camera.shakeDuration = 0;
  camera.shakeIntensity = 0;

  showScreen('game');
}

function startPrologue() {
  prepareEncounter(prologueBoss);
}

function startMatrix() {
  prepareEncounter(matrixBoss);
}

function renderChapterSelect() {
  chapterTabs.innerHTML = '';
  bossList.innerHTML = '';

  for (const chapter of CHAPTERS) {
    const tab = document.createElement('button');
    tab.className = 'chapter-tab';
    tab.textContent = chapter.label;
    tab.classList.toggle('active', chapter.id === activeChapter);

    tab.addEventListener('click', () => {
      activeChapter = chapter.id;
      renderChapterSelect();
    });

    chapterTabs.appendChild(tab);
  }

  const chapter = CHAPTERS.find(entry => entry.id === activeChapter) ?? CHAPTERS[0];

  for (const boss of chapter.bosses) {
    const button = document.createElement('button');
    button.className = 'boss-button';
    button.textContent = boss.label;

    if (!boss.playable) {
      button.classList.add('locked');
      button.disabled = true;
    } else if (boss.id === 'prologue') {
      button.addEventListener('click', startPrologue);
    } else if (boss.id === 'matrix') {
      button.addEventListener('click', startMatrix);
    }

    bossList.appendChild(button);
  }
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


function renderShop() {
  shopItems.innerHTML = '';

  for (const itemId of SHOP_CATALOG) {
    const item = getItem(itemId);
    if (!item) continue;

    const card = document.createElement('div');
    card.className = 'shop-item-card';

    const owned = ownedItems.includes(item.id);

    card.innerHTML = `
      <div class="item-title">
        <span class="item-icon" aria-hidden="true"></span>
        <span>${item.name}</span>
      </div>
      <div class="item-description">${item.description}</div>
      <div class="shop-item-actions"></div>
    `;

    const actions = card.querySelector('.shop-item-actions');
    const buy = document.createElement('button');
    buy.className = 'shop-buy-button';
    buy.textContent = owned ? 'owned' : 'free';
    buy.disabled = owned;

    buy.addEventListener('click', () => {
      if (purchaseItem(item.id)) {
        renderShop();
        renderEquipment();
      }
    });

    actions.appendChild(buy);
    shopItems.appendChild(card);
  }
}

function renderEquipment() {
  renderTabs();
  renderSlots();
  renderInventory();
  refreshWeaponButtons();
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

refreshWeaponButtons();
renderEquipment();
renderChapterSelect();
showScreen('menu');
requestAnimationFrame(frame);

window.BOSSFIGHTS = {
  MOVEMENT,
  loadout,
  ownedItems,
  BossAI,
  PrologueBoss,
  prologueBoss,
  matrixBoss,
  vectorWeapon,
  euclidWeapon,
  horizonWeapon,
  machWeapon,
  backfireAbility,
};
