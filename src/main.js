import { rectangle, group, rasterize } from './pixelShapes.js?v=36';
import { PlayerController } from './PlayerController.js?v=36';
import { MOVEMENT } from './movementConfig.js?v=36';
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
} from './equipment.js?v=36';
import { VectorWeapon } from './VectorWeapon.js?v=36';
import { EuclidWeapon } from './EuclidWeapon.js?v=36';
import { HorizonWeapon } from './HorizonWeapon.js?v=36';
import { MachWeapon } from './MachWeapon.js?v=36';
import { BackfireAbility } from './BackfireAbility.js?v=36';
import { BossAI } from './bosses/BossAI.js?v=36';
import { PrologueBoss } from './bosses/PrologueBoss.js?v=36';
import { MatrixBoss } from './bosses/MatrixBoss.js?v=36';
import { GameAudio } from './AudioManager.js?v=49';
import { DeveloperConsole } from './DeveloperConsole.js?v=49';
import { SpriteEditor } from './SpriteEditor.js?v=49';
import { WeaponTestRoom } from './WeaponTestRoom.js?v=49';
import {
  SpriteAssetStore,
  compileSpriteAsset,
  listSpriteMaterials,
  serializeSpriteAsset,
} from './SpriteAssets.js?v=49';

const BUILD_VERSION = 'v50';

const menuScreen = document.querySelector('#menu-screen');
const chapterScreen = document.querySelector('#chapter-screen');
const gameScreen = document.querySelector('#game-screen');
const equipmentScreen = document.querySelector('#equipment-screen');
const shopScreen = document.querySelector('#shop-screen');
const settingsScreen = document.querySelector('#settings-screen');
const mainButton = document.querySelector('#main-button');
const equipmentButton = document.querySelector('#equipment-button');
const shopButton = document.querySelector('#shop-button');
const settingsButton = document.querySelector('#settings-button');
const settingsBack = document.querySelector('#settings-back');
const settingScreenShake = document.querySelector('#setting-screen-shake');
const settingParticles = document.querySelector('#setting-particles');
const settingHitFlash = document.querySelector('#setting-hit-flash');
const settingImpactCamera = document.querySelector('#setting-impact-camera');
const keybindButtons = [
  ...document.querySelectorAll('.keybind-button'),
];
const keybindStatus = document.querySelector('#keybind-status');
const resetKeybindsButton = document.querySelector('#reset-keybinds');
const devConsoleRoot = document.querySelector('#dev-console');
const devConsoleOutput = document.querySelector('#dev-console-output');
const devConsoleInput = document.querySelector('#dev-console-input');
const spriteEditorRoot = document.querySelector('#sprite-editor');
const spriteEditorCanvas = document.querySelector('#sprite-editor-canvas');
const spritePreviewCanvas = document.querySelector('#sprite-preview-canvas');
const spriteEditorName = document.querySelector('#sprite-editor-name');
const spriteEditorType = document.querySelector('#sprite-editor-type');
const spriteEditorMaterials = document.querySelector('#sprite-editor-materials');
const spriteEditorLayers = document.querySelector('#sprite-editor-layers');
const spriteEditorStatus = document.querySelector('#sprite-editor-status');
const spritePreviewRotation = document.querySelector('#sprite-preview-rotation');
const spritePreviewRotationLabel = document.querySelector('#sprite-preview-rotation-label');
const spritePreviewPlayer = document.querySelector('#sprite-preview-player');
const spriteEditorSnap = document.querySelector('#sprite-editor-snap');
const spriteEditorSymmetry = document.querySelector('#sprite-editor-symmetry');
const spriteEditorScale = document.querySelector('#sprite-editor-scale');
const spritePreviewSpin = document.querySelector('#sprite-preview-spin');
const spritePreviewGlow = document.querySelector('#sprite-preview-glow');
const spritePreviewGlowStrength = document.querySelector('#sprite-preview-glow-strength');
const spritePreviewGlowLabel = document.querySelector('#sprite-preview-glow-label');
const spriteEditorImportFile = document.querySelector('#sprite-editor-import-file');
const spriteWeaponTools = document.querySelector('#sprite-weapon-tools');
const spriteWeaponMarkerInfo = document.querySelector('#sprite-weapon-marker-info');
const spriteWeaponTestControls = document.querySelector('#sprite-weapon-test-controls');
const spriteAnimationPanel = document.querySelector('#sprite-animation-panel');
const spriteAnimationClip = document.querySelector('#sprite-animation-clip');
const spriteAnimationProperty = document.querySelector('#sprite-animation-property');
const spriteAnimationEasing = document.querySelector('#sprite-animation-easing');
const spriteAnimationValue = document.querySelector('#sprite-animation-value');
const spriteAnimationDuration = document.querySelector('#sprite-animation-duration');
const spriteAnimationLoop = document.querySelector('#sprite-animation-loop');
const spriteAnimationTime = document.querySelector('#sprite-animation-time');
const spriteAnimationTimeLabel = document.querySelector('#sprite-animation-time-label');
const spriteAnimationTarget = document.querySelector('#sprite-animation-target');
const spriteAnimationKeys = document.querySelector('#sprite-animation-keys');
const spriteSelectionSummary = document.querySelector('#sprite-selection-summary');
const spriteSelectionX = document.querySelector('#sprite-selection-x');
const spriteSelectionY = document.querySelector('#sprite-selection-y');
const spriteSelectionRotation = document.querySelector('#sprite-selection-rotation');
const weaponTestRoot = document.querySelector('#weapon-test-room');
const weaponTestCanvas = document.querySelector('#weapon-test-canvas');
const weaponTestAngle = document.querySelector('#weapon-test-angle');
const weaponTestExit = document.querySelector('#weapon-test-exit');
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

const buildVersionLabel = document.querySelector('#build-version');
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');

if (buildVersionLabel) {
  buildVersionLabel.textContent = BUILD_VERSION;
}
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
  player: '#8a8e95',
  playerOutline: '#4b4f57',
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
const audio = new GameAudio();
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

const spriteAssetStore =
  new SpriteAssetStore();

let selectedSpriteDraftName = null;

const weaponTestRoom =
  new WeaponTestRoom({
    root: weaponTestRoot,
    canvas: weaponTestCanvas,
    angleLabel: weaponTestAngle,
    exitButton: weaponTestExit,
    getControls: () =>
      controlBindings,
    onClose: () => {
      spriteEditorRoot?.focus();
    },
  });

const spriteEditor =
  new SpriteEditor({
    root: spriteEditorRoot,
    canvas: spriteEditorCanvas,
    previewCanvas: spritePreviewCanvas,
    nameInput: spriteEditorName,
    typeSelect: spriteEditorType,
    materialContainer: spriteEditorMaterials,
    layersContainer: spriteEditorLayers,
    status: spriteEditorStatus,
    rotationInput: spritePreviewRotation,
    rotationLabel: spritePreviewRotationLabel,
    showPlayerInput: spritePreviewPlayer,
    spinInput: spritePreviewSpin,
    glowInput: spritePreviewGlow,
    glowStrengthInput: spritePreviewGlowStrength,
    glowLabel: spritePreviewGlowLabel,
    scaleInput: spriteEditorScale,
    importFileInput: spriteEditorImportFile,
    snapInput: spriteEditorSnap,
    symmetryInput: spriteEditorSymmetry,
    weaponToolsRoot: spriteWeaponTools,
    weaponMarkerInfo: spriteWeaponMarkerInfo,
    weaponTestControls: spriteWeaponTestControls,
    animationPanelRoot: spriteAnimationPanel,
    animationClipInput: spriteAnimationClip,
    animationPropertyInput: spriteAnimationProperty,
    animationEasingInput: spriteAnimationEasing,
    animationValueInput: spriteAnimationValue,
    animationDurationInput: spriteAnimationDuration,
    animationLoopInput: spriteAnimationLoop,
    animationTimeInput: spriteAnimationTime,
    animationTimeLabel: spriteAnimationTimeLabel,
    animationTargetRoot: spriteAnimationTarget,
    animationKeysRoot: spriteAnimationKeys,
    selectionSummary: spriteSelectionSummary,
    selectionXInput: spriteSelectionX,
    selectionYInput: spriteSelectionY,
    selectionRotationInput: spriteSelectionRotation,
    store: spriteAssetStore,
    onClose: () => {
      audio.setSuspended(devConsole.isOpen);
      keys.clear();
      pressed.clear();
      released.clear();
    },
    onSaved: asset => {
      selectedSpriteDraftName = asset.name;
    },
    onTestWeapon: asset => {
      audio.setSuspended(true);
      weaponTestRoom.open(asset);
    },
  });

const devConsole =
  new DeveloperConsole({
    root: devConsoleRoot,
    output: devConsoleOutput,
    input: devConsoleInput,
    onOpen: () => {
      pointer.firing = false;
      audio.setSuspended(true);
      audio.stopWeaponLoops();
      keys.clear();
      pressed.clear();
      released.clear();
    },
    onClose: () => {
      audio.setSuspended(spriteEditor.isOpen);
      keys.clear();
      pressed.clear();
      released.clear();
    },
  });

function registerDeveloperCommands() {
  devConsole.register('help', {
    description:
      'list commands or show help for one command',
    usage: 'help [command]',
    execute: ({ args, console }) => {
      const requested =
        args[0]?.toLowerCase();

      if (requested) {
        const command =
          console.commands.get(requested);

        if (!command) {
          throw new Error(
            `unknown command: ${requested}`,
          );
        }

        return [
          command.usage,
          command.description,
        ];
      }

      return console
        .listCommands()
        .map(
          command =>
            `${command.usage} — ${command.description}`,
        );
    },
  });

  devConsole.register('clear', {
    description: 'clear console output',
    usage: 'clear',
    execute: ({ console }) => {
      console.clear();
      return null;
    },
  });

  devConsole.register('sprite.editor', {
    description:
      'open the password-protected visual sprite creator',
    usage:
      'sprite.editor [boss|weapon|generic] [draft-name]',
    execute: async ({ args, console }) => {
      const type =
        args[0]?.toLowerCase() ??
        'generic';

      if (
        !['boss', 'weapon', 'generic']
          .includes(type)
      ) {
        throw new Error(
          'asset type must be boss, weapon, or generic.',
        );
      }

      const requestedName =
        args[1] ??
        selectedSpriteDraftName;

      const asset =
        requestedName
          ? spriteAssetStore.get(
              requestedName,
            )
          : null;

      if (
        args[1] &&
        !asset
      ) {
        throw new Error(
          `sprite draft "${args[1]}" not found.`,
        );
      }

      const password =
        await console.requestSecret(
          'sprite editor password:',
        );

      if (password == null) {
        return null;
      }

      if (password !== 'SPREDIT') {
        console.print(
          'access denied.',
          'error',
        );
        return null;
      }

      spriteEditor.open({
        asset,
        type:
          asset?.type ??
          type,
      });

      devConsole.close();
      audio.setSuspended(true);

      return null;
    },
  });

  devConsole.register('sprite.new', {
    description:
      'create an empty local sprite draft',
    usage:
      'sprite.new <name> [boss|weapon|generic]',
    execute: ({ args }) => {
      const name = args[0];
      const type =
        args[1]?.toLowerCase() ??
        'generic';

      if (!name) {
        throw new Error(
          'usage: sprite.new <name> [type]',
        );
      }

      if (
        !['boss', 'weapon', 'generic']
          .includes(type)
      ) {
        throw new Error(
          'asset type must be boss, weapon, or generic.',
        );
      }

      if (spriteAssetStore.has(name)) {
        throw new Error(
          `sprite draft "${name}" already exists.`,
        );
      }

      const asset =
        spriteAssetStore.create(
          name,
          type,
        );

      selectedSpriteDraftName =
        asset.name;

      return `created ${asset.type} sprite draft "${asset.name}".`;
    },
  });

  devConsole.register('sprite.list', {
    description:
      'list local sprite drafts',
    usage: 'sprite.list',
    execute: () => {
      const drafts =
        spriteAssetStore.list();

      if (!drafts.length) {
        return 'no local sprite drafts.';
      }

      return drafts.map(asset => {
        const selected =
          asset.name ===
          selectedSpriteDraftName
            ? ' *'
            : '';

        return (
          `${asset.name} [${asset.type}] — ` +
          `${asset.parts.length} parts${selected}`
        );
      });
    },
  });

  devConsole.register('sprite.load', {
    description:
      'validate and select a local sprite draft',
    usage: 'sprite.load <name>',
    execute: ({ args }) => {
      const name = args[0];

      if (!name) {
        throw new Error(
          'usage: sprite.load <name>',
        );
      }

      const asset =
        spriteAssetStore.get(name);

      if (!asset) {
        throw new Error(
          `sprite draft "${name}" not found.`,
        );
      }

      const compiled =
        compileSpriteAsset(asset);

      selectedSpriteDraftName =
        compiled.asset.name;

      return [
        `loaded "${compiled.asset.name}" [${compiled.asset.type}].`,
        `${compiled.asset.parts.length} parts, ${compiled.glowParts.length} glowing parts.`,
      ];
    },
  });

  devConsole.register('sprite.info', {
    description:
      'show summary information for a sprite draft',
    usage: 'sprite.info [name]',
    execute: ({ args }) => {
      const name =
        args[0] ??
        selectedSpriteDraftName;

      if (!name) {
        throw new Error(
          'no sprite selected. use sprite.load <name>.',
        );
      }

      const asset =
        spriteAssetStore.get(name);

      if (!asset) {
        throw new Error(
          `sprite draft "${name}" not found.`,
        );
      }

      const glowCount =
        compileSpriteAsset(asset)
          .glowParts.length;

      const markerNames =
        Object.keys(asset.markers);

      return [
        `name: ${asset.name}`,
        `type: ${asset.type}`,
        `pivot: ${asset.pivot[0]}, ${asset.pivot[1]}`,
        `scale: ${asset.scale ?? 1}x`,
        `parts: ${asset.parts.length}`,
        `glowing parts: ${glowCount}`,
        `markers: ${markerNames.length ? markerNames.join(', ') : 'none'}`,
      ];
    },
  });

  devConsole.register('sprite.materials', {
    description:
      'list available sprite materials',
    usage: 'sprite.materials',
    execute: () =>
      listSpriteMaterials().map(
        material =>
          material.glow
            ? `${material.id} — ${material.color} — glow ${material.glow.color}`
            : `${material.id} — ${material.color}`,
      ),
  });

  devConsole.register('sprite.json', {
    description:
      'print normalized JSON for a sprite draft',
    usage: 'sprite.json [name]',
    execute: ({ args }) => {
      const name =
        args[0] ??
        selectedSpriteDraftName;

      if (!name) {
        throw new Error(
          'no sprite selected. use sprite.load <name>.',
        );
      }

      const asset =
        spriteAssetStore.get(name);

      if (!asset) {
        throw new Error(
          `sprite draft "${name}" not found.`,
        );
      }

      return serializeSpriteAsset(asset);
    },
  });

  devConsole.register('sprite.delete', {
    description:
      'delete a local sprite draft',
    usage: 'sprite.delete <name>',
    execute: ({ args }) => {
      const name = args[0];

      if (!name) {
        throw new Error(
          'usage: sprite.delete <name>',
        );
      }

      const asset =
        spriteAssetStore.get(name);

      if (!asset) {
        throw new Error(
          `sprite draft "${name}" not found.`,
        );
      }

      spriteAssetStore.delete(name);

      if (
        selectedSpriteDraftName ===
        asset.name
      ) {
        selectedSpriteDraftName = null;
      }

      return `deleted sprite draft "${asset.name}".`;
    },
  });
}

registerDeveloperCommands();

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

const CONTROL_STORAGE_KEY = 'bossfights.controls.v1';

const DEFAULT_CONTROLS = Object.freeze({
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  sprint: 'ShiftLeft',
  dash: 'KeyF',
  special: 'KeyQ',
  weapon1: 'Digit1',
  weapon2: 'Digit2',
  restart: 'KeyR',
});

const controlBindings = {
  ...DEFAULT_CONTROLS,
};

try {
  const savedControls = JSON.parse(
    localStorage.getItem(CONTROL_STORAGE_KEY) ?? 'null',
  );

  if (
    savedControls &&
    typeof savedControls === 'object'
  ) {
    for (const action of Object.keys(DEFAULT_CONTROLS)) {
      const code = savedControls[action];

      if (
        typeof code === 'string' &&
        code.length > 0 &&
        code !== 'Escape' &&
        code !== 'Backquote'
      ) {
        controlBindings[action] = code;
      }
    }
  }
} catch {
  // Keep defaults if saved controls are unavailable or malformed.
}

let pendingBindingAction = null;

function saveControlBindings() {
  try {
    localStorage.setItem(
      CONTROL_STORAGE_KEY,
      JSON.stringify(controlBindings),
    );
  } catch {
    // Rebinding still works for the current session.
  }
}

function keyLabel(code) {
  if (!code) return '?';

  const named = {
    Space: 'Space',
    ShiftLeft: 'Left Shift',
    ShiftRight: 'Right Shift',
    ControlLeft: 'Left Ctrl',
    ControlRight: 'Right Ctrl',
    AltLeft: 'Left Alt',
    AltRight: 'Right Alt',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Enter: 'Enter',
    Tab: 'Tab',
    Backspace: 'Backspace',
    Backquote: '~',
  };

  if (named[code]) return named[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) {
    return `Numpad ${code.slice(6)}`;
  }

  return code;
}

function renderKeybinds() {
  for (const button of keybindButtons) {
    const action = button.dataset.bindAction;
    const listening =
      pendingBindingAction === action;

    button.classList.toggle(
      'listening',
      listening,
    );

    button.textContent = listening
      ? 'press a key...'
      : keyLabel(controlBindings[action]);
  }

  if (keybindStatus) {
    keybindStatus.textContent =
      pendingBindingAction
        ? 'Press a key to bind it. Esc cancels.'
        : 'Esc and ~ stay reserved. Fire stays on LMB.';
  }
}

function setControlBinding(action, newCode) {
  if (
    !Object.hasOwn(controlBindings, action) ||
    !newCode ||
    newCode === 'Escape' ||
    newCode === 'Backquote'
  ) {
    return false;
  }

  const oldCode = controlBindings[action];

  if (oldCode === newCode) {
    pendingBindingAction = null;
    renderKeybinds();
    return true;
  }

  const conflictAction =
    Object.keys(controlBindings).find(
      key =>
        key !== action &&
        controlBindings[key] === newCode,
    );

  if (conflictAction) {
    controlBindings[conflictAction] = oldCode;
  }

  controlBindings[action] = newCode;
  pendingBindingAction = null;

  keys.clear();
  pressed.clear();
  released.clear();

  saveControlBindings();
  renderKeybinds();
  refreshWeaponButtons();

  return true;
}

for (const button of keybindButtons) {
  button.addEventListener('click', () => {
    pendingBindingAction =
      button.dataset.bindAction;
    renderKeybinds();
  });
}

resetKeybindsButton?.addEventListener(
  'click',
  () => {
    Object.assign(
      controlBindings,
      DEFAULT_CONTROLS,
    );

    pendingBindingAction = null;
    keys.clear();
    pressed.clear();
    released.clear();

    saveControlBindings();
    renderKeybinds();
    refreshWeaponButtons();
  },
);

const FX_STORAGE_KEY = 'bossfights.fx-settings.v1';
const fxSettings = {
  screenShake: true,
  particles: true,
  hitFlash: true,
  impactCamera: true,
};

try {
  const saved = JSON.parse(
    localStorage.getItem(FX_STORAGE_KEY) ?? 'null',
  );

  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(fxSettings)) {
      if (typeof saved[key] === 'boolean') {
        fxSettings[key] = saved[key];
      }
    }
  }
} catch {
  // Ignore malformed or unavailable local storage.
}

const particles = [];
const MAX_PARTICLES = 220;
let bossImpactFxCooldown = 0;
let playerImpactFxCooldown = 0;

function saveFxSettings() {
  try {
    localStorage.setItem(
      FX_STORAGE_KEY,
      JSON.stringify(fxSettings),
    );
  } catch {
    // Settings still work for the current session.
  }
}

function renderSettings() {
  settingScreenShake.checked = fxSettings.screenShake;
  settingParticles.checked = fxSettings.particles;
  settingHitFlash.checked = fxSettings.hitFlash;
  settingImpactCamera.checked = fxSettings.impactCamera;
  renderKeybinds();
}

function bindSetting(input, key) {
  input.addEventListener('change', () => {
    fxSettings[key] = input.checked;

    if (key === 'particles' && !input.checked) {
      particles.length = 0;
    }

    if (key === 'screenShake' && !input.checked) {
      camera.shakeTime = 0;
      camera.shakeDuration = 0;
      camera.shakeIntensity = 0;
    }

    saveFxSettings();
  });
}

bindSetting(settingScreenShake, 'screenShake');
bindSetting(settingParticles, 'particles');
bindSetting(settingHitFlash, 'hitFlash');
bindSetting(settingImpactCamera, 'impactCamera');

function fxLerp(a, b, t) {
  return a + (b - a) * t;
}

function spawnParticle(
  x,
  y,
  {
    vx = 0,
    vy = 0,
    life = 0.24,
    size = 4,
    gravity = 0,
    alpha = 1,
    color = '#e5e7eb',
  } = {},
) {
  if (!fxSettings.particles) return;

  if (particles.length >= MAX_PARTICLES) {
    particles.splice(
      0,
      particles.length - MAX_PARTICLES + 1,
    );
  }

  particles.push({
    x,
    y,
    vx,
    vy,
    life,
    maxLife: life,
    size,
    gravity,
    alpha,
    color,
  });
}

function spawnSparkBurst(
  x,
  y,
  count = 6,
  speed = 150,
  color = '#ffffff',
) {
  if (!fxSettings.particles) return;

  for (let i = 0; i < count; i++) {
    const angle =
      Math.random() * Math.PI * 2;

    const magnitude =
      speed * (0.45 + Math.random() * 0.55);

    spawnParticle(x, y, {
      vx: Math.cos(angle) * magnitude,
      vy: Math.sin(angle) * magnitude,
      life: 0.12 + Math.random() * 0.16,
      size: Math.random() < 0.65 ? 3 : 5,
      gravity: 160,
      color,
    });
  }
}

function spawnDashParticles(dash) {
  if (!fxSettings.particles || !dash) return;

  const count = 10;

  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 1 : i / (count - 1);

    spawnParticle(
      fxLerp(dash.startX, dash.endX, t),
      fxLerp(dash.startY, dash.endY, t),
      {
        vx:
          -dash.nx * (80 + Math.random() * 100) +
          (Math.random() * 2 - 1) * 45,
        vy:
          -dash.ny * (80 + Math.random() * 100) +
          (Math.random() * 2 - 1) * 45,
        life: 0.16 + Math.random() * 0.12,
        size: Math.random() < 0.5 ? 4 : 6,
        alpha: 0.55,
        color: '#aeb4bf',
      },
    );
  }
}

function spawnLandingParticles(x, y, strength = 1) {
  if (!fxSettings.particles) return;

  const count = Math.round(
    5 + Math.min(5, strength * 4),
  );

  for (let i = 0; i < count; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;

    spawnParticle(x, y, {
      vx:
        side *
        (45 + Math.random() * 115),
      vy:
        -(25 + Math.random() * 90),
      life: 0.18 + Math.random() * 0.18,
      size: Math.random() < 0.6 ? 4 : 6,
      gravity: 360,
      alpha: 0.52,
      color: '#8a8e95',
    });
  }
}

function updateParticles(dt) {
  for (const particle of particles) {
    particle.life -= dt;
    particle.vy += particle.gravity * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  if (!fxSettings.particles) return;

  ctx.save();

  for (const particle of particles) {
    const lifeRatio = Math.max(
      0,
      particle.life / particle.maxLife,
    );

    ctx.globalAlpha =
      lifeRatio * particle.alpha;

    ctx.fillStyle = particle.color;

    ctx.fillRect(
      Math.round(
        particle.x -
        camera.x -
        particle.size / 2,
      ),
      Math.round(
        particle.y -
        particle.size / 2,
      ),
      particle.size,
      particle.size,
    );
  }

  ctx.restore();
}

function drainBossFxEvents(boss) {
  if (!boss?.fxEvents?.length) return;

  for (const event of boss.fxEvents) {
    if (event.type === 'ricochet') {
      spawnSparkBurst(
        event.x,
        event.y,
        4,
        125,
        '#d7dbe2',
      );
    } else if (event.type === 'projectileBreak') {
      spawnSparkBurst(
        event.x,
        event.y,
        7,
        175,
        '#ffffff',
      );
    } else if (event.type === 'wallImpact') {
      spawnSparkBurst(
        event.x,
        event.y,
        8,
        190,
        '#ffffff',
      );
    }
  }

  boss.fxEvents.length = 0;
}

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

function playRepeated(count, callback) {
  for (let i = 0; i < count; i++) callback();
}

function syncWeaponAudio(activeWeaponId = getActiveWeaponId()) {
  if (currentScreen !== 'game' || encounterOver) {
    audio.stopWeaponLoops();
    return;
  }

  const euclidSpecial =
    activeWeaponId === 'euclid' &&
    euclidWeapon.specialActiveTimer > 0;

  audio.setLoop(
    'euclidSpecial',
    euclidSpecial,
  );

  audio.setLoop(
    'euclidShoot',
    activeWeaponId === 'euclid' &&
      euclidWeapon.firing &&
      !euclidSpecial,
  );

  audio.setLoop(
    'machShoot',
    activeWeaponId === 'mach' &&
      pointer.firing &&
      machWeapon.specialActiveTimer <= 0,
  );
}

function refreshWeaponButtons() {
  weaponSlotButtons.forEach((button, index) => {
    const id = getWeaponSlotId(index);
    const item = getItem(id);

    const binding =
      controlBindings[
        index === 0 ? 'weapon1' : 'weapon2'
      ];

    button.textContent = item
      ? `${keyLabel(binding)}: ${item.name.toLowerCase()}`
      : 'empty';
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
  audio.stopWeaponLoops();
  keys.clear();
  pressed.clear();
  released.clear();
  setDeathMenuVisible(true, result);
}

function showScreen(name) {
  currentScreen = name;

  if (name === 'game') {
    if (activeBoss === matrixBoss) {
      audio.setTheme('matrix');
    } else {
      audio.setTheme('prologue');
    }
  } else {
    audio.setTheme('mainmenu');
    audio.stopWeaponLoops();
  }

  menuScreen.classList.toggle('hidden', name !== 'menu');
  chapterScreen.classList.toggle('hidden', name !== 'chapters');
  gameScreen.classList.toggle('hidden', name !== 'game');
  equipmentScreen.classList.toggle('hidden', name !== 'equipment');
  shopScreen.classList.toggle('hidden', name !== 'shop');
  settingsScreen.classList.toggle('hidden', name !== 'settings');

  if (name !== 'game') {
    keys.clear();
    pressed.clear();
    released.clear();
    pointer.firing = false;
    setDeathMenuVisible(false, 'defeated');
  }

  if (name === 'equipment') renderEquipment();
  if (name === 'shop') renderShop();
  if (name === 'settings') renderSettings();
  if (name === 'chapters') renderChapterSelect();
}

mainButton.addEventListener('click', () => showScreen('chapters'));
equipmentButton.addEventListener('click', () => showScreen('equipment'));
shopButton.addEventListener('click', () => showScreen('shop'));
settingsButton.addEventListener('click', () => showScreen('settings'));
equipmentBack.addEventListener('click', () => showScreen('menu'));
shopBack.addEventListener('click', () => showScreen('menu'));
settingsBack.addEventListener('click', () => showScreen('menu'));
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

addEventListener(
  'pointerdown',
  () => audio.unlock(),
  { capture: true },
);

addEventListener(
  'keydown',
  () => audio.unlock(),
  { capture: true },
);

document.addEventListener('pointerover', (e) => {
  const button = e.target.closest?.('button');
  if (!button || button.disabled) return;

  const previous = e.relatedTarget;
  if (previous && button.contains(previous)) return;

  audio.playHover();
});

addEventListener('keydown', (e) => {
  if (spriteEditor.isOpen) {
    return;
  }

  if (e.code === 'Backquote') {
    if (pendingBindingAction) {
      pendingBindingAction = null;
      renderKeybinds();
    }

    devConsole.toggle();
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (
    devConsole.isOpen ||
    spriteEditor.isOpen ||
    weaponTestRoom.isOpen
  ) {
    if (
      e.target !== devConsoleInput
    ) {
      devConsoleInput?.focus();
    }

    return;
  }

  if (pendingBindingAction) {
    if (e.code === 'Escape') {
      pendingBindingAction = null;
      renderKeybinds();
    } else {
      setControlBinding(
        pendingBindingAction,
        e.code,
      );
    }

    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (e.code === 'Escape') {
    if (currentScreen === 'game') {
      showScreen('chapters');
    } else if (currentScreen !== 'menu') {
      showScreen('menu');
    }
    return;
  }

  if (currentScreen !== 'game') return;

  if (e.code === controlBindings.weapon1) {
    selectWeaponSlot(0);
  }

  if (e.code === controlBindings.weapon2) {
    selectWeaponSlot(1);
  }

  if (!keys.has(e.code)) {
    pressed.add(e.code);
  }

  keys.add(e.code);

  if (
    Object.values(controlBindings).includes(
      e.code,
    )
  ) {
    e.preventDefault();
  }
});

addEventListener('keyup', (e) => {
  if (
    devConsole.isOpen ||
    spriteEditor.isOpen ||
    weaponTestRoom.isOpen
  ) {
    e.preventDefault();
    return;
  }

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
  const right =
    keys.has(controlBindings.moveRight);

  const left =
    keys.has(controlBindings.moveLeft);

  return {
    move:
      (right ? 1 : 0) -
      (left ? 1 : 0),
    jumpHeld:
      keys.has(controlBindings.jump),
    jumpPressed:
      pressed.has(controlBindings.jump),
    jumpReleased:
      released.has(controlBindings.jump),
    sprintHeld:
      keys.has(controlBindings.sprint),
    dashPressed:
      pressed.has(controlBindings.dash),
  };
}

function triggerCameraShake(intensity = 10, duration = 0.22) {
  if (!fxSettings.screenShake) return;

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
  if (
    devConsole.isOpen ||
    spriteEditor.isOpen
  ) {
    pressed.clear();
    released.clear();
    pointer.firing = false;
    return;
  }

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

  bossImpactFxCooldown = Math.max(
    0,
    bossImpactFxCooldown - dt,
  );
  playerImpactFxCooldown = Math.max(
    0,
    playerImpactFxCooldown - dt,
  );
  updateParticles(dt);

  if (pressed.has(controlBindings.restart)) {
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

  const dashSerialBefore = player.dashSerial;
  const groundedBefore = player.grounded;
  const verticalSpeedBefore = player.vy;
  const playerHealthBefore = player.health;
  const bossHealthBefore = activeBoss?.health ?? 0;

  const vectorShotsBefore = vectorWeapon.shotSerial;
  const horizonShotsBefore = horizonWeapon.shotSerial;
  const backfireShotsBefore = backfireAbility.shotSerial;
  const machSpecialWavesBefore = machWeapon.specialWavesFired;
  const bossShotsBefore = activeBoss?.shotSerial ?? 0;

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

  if (
    player.dashSerial !== dashSerialBefore &&
    player.lastDash
  ) {
    spawnDashParticles(player.lastDash);
  }

  if (
    !groundedBefore &&
    player.grounded &&
    verticalSpeedBefore > 180
  ) {
    spawnLandingParticles(
      player.x,
      player.y + player.h * 0.5,
      Math.min(
        2,
        verticalSpeedBefore / 700,
      ),
    );
  }

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
    cameraX: camera.x,
    viewportWidth: W,
    shakeCamera: triggerCameraShake,
  });

  updateCameraShake(dt);

  if (pressed.has(controlBindings.special)) {
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

  playRepeated(
    Math.max(0, vectorWeapon.shotSerial - vectorShotsBefore),
    () => audio.playShot('vector'),
  );

  playRepeated(
    Math.max(0, horizonWeapon.shotSerial - horizonShotsBefore),
    () => audio.playShot('horizon'),
  );

  playRepeated(
    Math.max(0, backfireAbility.shotSerial - backfireShotsBefore),
    () => audio.playShot('default'),
  );

  playRepeated(
    Math.max(
      0,
      (activeBoss?.shotSerial ?? 0) - bossShotsBefore,
    ),
    () => audio.playShot('default'),
  );

  playRepeated(
    Math.max(
      0,
      machWeapon.specialWavesFired - machSpecialWavesBefore,
    ),
    () => audio.playBoom(),
  );

  syncWeaponAudio(activeWeaponId);

  const bossHealthAfter =
    activeBoss?.health ?? bossHealthBefore;

  if (
    activeBoss &&
    bossHealthAfter < bossHealthBefore &&
    bossImpactFxCooldown <= 0
  ) {
    spawnSparkBurst(
      activeBoss.x,
      activeBoss.y,
      6,
      165,
      '#ffffff',
    );

    if (fxSettings.impactCamera) {
      triggerCameraShake(2.4, 0.065);
    }

    bossImpactFxCooldown = 0.075;
  }

  if (
    player.health < playerHealthBefore &&
    playerImpactFxCooldown <= 0
  ) {
    spawnSparkBurst(
      player.x,
      player.y,
      5,
      135,
      '#c9cdd4',
    );

    if (fxSettings.impactCamera) {
      triggerCameraShake(2.8, 0.075);
    }

    playerImpactFxCooldown = 0.10;
  }

  if (!fxSettings.hitFlash && activeBoss) {
    activeBoss.hurtFlash = 0;
  }

  drainBossFxEvents(activeBoss);

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
  const barHeight = 8;

  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(label, x, y - 15);

  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(x, y, width, barHeight);
  ctx.fillStyle = color;
  ctx.fillRect(
    x,
    y,
    width * Math.max(0, Math.min(1, value / max)),
    barHeight,
  );
  ctx.strokeStyle = '#343a46';
  ctx.strokeRect(
    x + 0.5,
    y + 0.5,
    width,
    barHeight,
  );

  if (rightText) {
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(rightText, x + width + 10, y - 2);
  }

  ctx.restore();
}

function drawHUD() {
  const bx = 20;
  const bw = 205;
  const healthY = H - 88;
  const specialY = H - 116;
  const staminaY = H - 60;
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
        ? `READY [${keyLabel(controlBindings.special)}]`
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
  const controlHint =
    `${keyLabel(controlBindings.moveLeft)}/${keyLabel(controlBindings.moveRight)} move   ` +
    `${keyLabel(controlBindings.jump)} jump   ` +
    `${keyLabel(controlBindings.sprint)} sprint   ` +
    `${keyLabel(controlBindings.dash)} dash   ` +
    `${keyLabel(controlBindings.special)} special   LMB fire`;

  ctx.fillText(
    controlHint,
    W - 20,
    H - 24,
  );
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
  drawParticles();
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
  particles.length = 0;
  bossImpactFxCooldown = 0;
  playerImpactFxCooldown = 0;

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
  audio,
  fxSettings,
  controlBindings,
  devConsole,
  spriteAssetStore,
  spriteEditor,
  weaponTestRoom,
};
