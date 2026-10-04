import {
  ensureProgressEpoch,
} from './ProgressEpoch.js?v=63';

ensureProgressEpoch();

export const EQUIPMENT_CATEGORIES = [
  { id: 'weapons', label: 'Weapons', slotCount: 2, slotLabel: 'Weapon' },
  { id: 'abilities', label: 'Abilities', slotCount: 3, slotLabel: 'Ability' },
  { id: 'extra', label: 'Extra', slotCount: 2, slotLabel: 'Extra' },
  { id: 'armor', label: 'Armor', slotCount: 2, slotLabel: 'Armor' },
];

const EQUIPMENT_STORAGE_KEY = 'fallax.equipment.v1';

export const ITEM_LIBRARY = {
  vector: {
    id: 'vector',
    price: 0,
    name: 'Vector',
    category: 'weapons',
    description: 'Fires three-round bursts. Volley fires a lot more shots at once.',
    appearance: 'gray square',
    stats: [
      { label: 'damage', value: '4 x 3 burst' },
      { label: 'burst cooldown', value: '0.42s' },
      { label: 'volley', value: '20 shots / 7.5s', special: true, effect: true },
    ],
  },
  magnitude: {
    id: 'magnitude',
    price: 220,
    name: 'Magnitude',
    category: 'weapons',
    description: 'Fires faster Vector-style bursts. Machine Gun fires continuously for 3 seconds and pushes you backward.',
    appearance: 'long gray burst weapon',
    stats: [
      { label: 'damage', value: '4 x 3 burst' },
      { label: 'burst cooldown', value: '0.30s' },
      { label: 'bullet speed', value: '1360' },
      { label: 'machine gun', value: '3s continuous fire / 12s', special: true, effect: true },
    ],
  },
  euclid: {
    id: 'euclid',
    price: 340,
    name: 'Euclid',
    category: 'weapons',
    description: 'Fires a steady beam. Overcharge makes the beam much stronger for a short time.',
    appearance: 'thin gray rectangle',
    stats: [
      { label: 'beam dps', value: '8' },
      { label: 'overcharge', value: '72 dps x 3s / 18s', special: true, effect: true },
    ],
  },
  horizon: {
    id: 'horizon',
    price: 560,
    name: 'Horizon',
    category: 'weapons',
    description: 'A charged long-range gun with heavy recoil. Its specials can make the shot stronger or throw you backward.',
    appearance: 'long gray rectangle',
    stats: [
      { label: 'shot damage', value: '42' },
      { label: 'charge / cooldown', value: '0.34s / 1.10s' },
      { label: 'recoil drive', value: '2250 recoil + 18 stagger / 6.5s', special: true, effect: true },
      { label: 'overcharge', value: '105 damage + 34 stagger / 12s', special: true, effect: true },
    ],
  },
  vienna: {
    id: 'vienna',
    price: 680,
    name: 'Vienna',
    category: 'weapons',
    description: 'Fires three heavy laser pulses, then reloads. Barrage fires three larger pulses that cause Bleed and Burn.',
    appearance: 'large gray rifle',
    stats: [
      { label: 'pulse burst', value: '3 x 30 damage' },
      { label: 'reload', value: '2.6s' },
      { label: 'bleed', value: '+28 / pulse', effect: true },
      { label: 'barrage', value: '3 x 55 + 42 Bleed + 28 Burn / 15s', special: true, effect: true },
    ],
  },
  kismet: {
    id: 'kismet',
    price: 1250,
    name: 'Kismet',
    category: 'weapons',
    description: 'Continuously fires inaccurate homing squares that build Fatigue and Burn. Fated Orbit shoots larger squares into orbit, and Convergence slams them inward.',
    appearance: 'large glowing gray weapon',
    stats: [
      { label: 'shot', value: '5 damage / 0.11s' },
      { label: 'homing', value: 'first 1.0s' },
      { label: 'fatigue', value: '+3 / bullet', effect: true },
      { label: 'burn', value: '+1 / bullet', effect: true },
      { label: 'max orbiters', value: '15' },
      { label: 'fated orbit', value: '+3 orbiters / 6.5s', special: true, effect: true },
      { label: 'convergence', value: '50 + 4.5 / orbiter / 10.5s', special: true, effect: true },
    ],
  },
  mach: {
    id: 'mach',
    price: 700,
    name: 'Mach',
    category: 'weapons',
    description: 'Fires short-range pressure waves. It does more damage up close and builds Fracture.',
    appearance: 'wide gray rectangle',
    stats: [
      { label: 'wave damage', value: 'up to 15' },
      { label: 'fire interval', value: '0.16s' },
      { label: 'point-blank rate', value: '~93.8 dps' },
      { label: 'fracture', value: '+5 / wave', effect: true },
      { label: 'screech', value: '3 x 42 + 22 fracture / wave / 16s', special: true, effect: true },
    ],
  },
  relay: {
    id: 'relay',
    price: 620,
    name: 'Relay',
    category: 'weapons',
    description: 'Places nodes that connect with damaging lines. Overload makes the links much stronger for a short time.',
    appearance: 'outlined relay emitter',
    stats: [
      { label: 'node shot', value: '7 damage' },
      { label: 'link damage', value: '13 dps each' },
      { label: 'capacity', value: '7 nodes / 6 links' },
      { label: 'overload', value: '3x links x 3s / 14s', special: true, effect: true },
    ],
  },
  parallax: {
    id: 'parallax',
    price: 520,
    name: 'Parallax',
    category: 'weapons',
    description: 'Fires three shots that meet at one point. Hitting with all three does extra damage.',
    appearance: 'solid center gun with translucent copies',
    stats: [
      { label: 'volley', value: '3 x 5.2' },
      { label: 'focus bonus', value: '+9 (24.6 total)' },
      { label: 'fire cooldown', value: '0.46s' },
      { label: 'focal collapse', value: '60 focal dps + 4 / beam', special: true, effect: true },
    ],
  },
  anchor: {
    id: 'anchor',
    price: 480,
    name: 'Anchor',
    category: 'weapons',
    description: 'Fires a tethered anchor. It can stick to bosses or terrain, and Ripcord pulls harder or tears the anchor out.',
    appearance: 'red-glowing tether weapon',
    stats: [
      { label: 'impact', value: '8 damage + 12 Bleed buildup', effect: true },
      { label: 'tether', value: 'up to 28 dps' },
      { label: 'ripcord', value: '24-54 damage + 55-120 Bleed + 10-32 stagger / 9s', special: true, effect: true },
      { label: 'ripcord (surface)', value: '1050-1600 pull impulse / 9s', special: true, effect: true },
    ],
  },
  fukiya: {
    id: 'fukiya',
    price: 460,
    name: 'Fukiya',
    category: 'weapons',
    description: 'Fires poisoned darts. Needleburst fires several darts quickly.',
    appearance: 'long thin gray blowgun',
    stats: [
      { label: 'dart', value: '12 damage / 0.58s' },
      { label: 'poison', value: '+22 buildup / dart', effect: true },
      { label: 'needleburst', value: '7 x 5 damage + 18 Poison / dart / 10s', special: true, effect: true },
    ],
  },

  kepler: {
    id: 'kepler',
    price: 420,
    name: 'Kepler',
    category: 'weapons',
    description: 'Stores shots around you, then fires them toward the cursor.',
    appearance: 'white-glowing orbital weapon',
    stats: [
      { label: 'shot damage', value: '9' },
      { label: 'capacity', value: '6 orbiters' },
      { label: 'loaded fire rate', value: '1 shot / 0.28s' },
      { label: 'orbital release', value: '6 x 12.15 / 10s', special: true, effect: true },
    ],
  },
  backfire: {
    id: 'backfire',
    price: 240,
    name: 'Backfire',
    category: 'abilities',
    description: 'Fires burning pellets behind you when you dash.',
    appearance: 'ability module',
    stats: [
      { label: 'fan', value: '9 x 5 damage' },
      { label: 'burn', value: 'up to +10 / pellet', effect: true },
      { label: 'spread', value: '100 deg' },
      { label: 'dash cooldown', value: '1.70x' },
    ],
  },
  strike: {
    id: 'strike',
    price: 380,
    name: 'Strike',
    category: 'abilities',
    description: 'Dashing through an enemy deals a strong melee hit and builds Fracture.',
    appearance: 'ability module',
    combatModifiers: {
      outgoingBuildup: {
        fracture: 1.05,
      },
    },
    stats: [
      { label: 'damage', value: '55' },
      { label: 'stagger', value: '+24' },
      { label: 'fracture', value: '+28 buildup', effect: true },
      { label: 'fracture buildup', value: '+5%', effect: true },
      { label: 'trigger', value: 'dash through target' },
    ],
  },
  turret: {
    id: 'turret',
    price: 320,
    name: 'Turret',
    category: 'extra',
    description: 'Places a temporary turret that shoots until it breaks or expires.',
    appearance: 'outlined spinning square',
    stats: [
      { label: 'shot pair', value: '2 x 4.5 / 0.12s' },
      { label: 'lifetime', value: '7s' },
      { label: 'cooldown', value: '12s' },
      { label: 'durability', value: '1 hit' },
    ],
  },
  decoy: {
    id: 'decoy',
    price: 260,
    name: 'Decoy',
    category: 'extra',
    description: "Places a temporary clone that bosses will target instead of you.",
    appearance: 'player clone',
    stats: [
      { label: 'health', value: '42' },
      { label: 'lifetime', value: '10s' },
      { label: 'cooldown', value: '16s' },
      { label: 'effect', value: 'boss priority target' },
    ],
  },
  carapace: {
    id: 'carapace',
    price: 430,
    name: 'Carapace',
    category: 'armor',
    description: 'Reduces Fracture buildup, but makes Poison buildup slightly worse.',
    appearance: 'heavy segmented armor',
    combatModifiers: {
      incomingBuildup: {
        fracture: 0.75,
        poison: 1.10,
      },
    },
    stats: [
      { label: 'fracture susceptibility', value: '-25%', effect: true },
      { label: 'poison susceptibility', value: '+10%', effect: true },
    ],
  },
};

export const ownedItems = [
  'vector',
];

export const loadout = {
  weapons: ['vector', null],
  abilities: [null, null, null],
  extra: [null, null],
  armor: [null, null],
};

function saveEquipmentState() {
  try {
    localStorage.setItem(
      EQUIPMENT_STORAGE_KEY,
      JSON.stringify({
        ownedItems,
        loadout,
      }),
    );
  } catch {
    // Equipment still works for the current session.
  }
}

function restoreEquipmentState() {
  try {
    const saved =
      JSON.parse(
        localStorage.getItem(
          EQUIPMENT_STORAGE_KEY,
        ) ?? 'null',
      );

    if (
      !saved ||
      typeof saved !== 'object'
    ) {
      return;
    }

    const restoredOwned =
      Array.isArray(
        saved.ownedItems,
      )
        ? saved.ownedItems
            .filter(
              id =>
                typeof id === 'string' &&
                ITEM_LIBRARY[id],
            )
        : [];

    if (
      !restoredOwned.includes(
        'vector',
      )
    ) {
      restoredOwned.unshift(
        'vector',
      );
    }

    ownedItems.splice(
      0,
      ownedItems.length,
      ...new Set(restoredOwned),
    );

    for (
      const category
      of EQUIPMENT_CATEGORIES
    ) {
      const savedSlots =
        Array.isArray(
          saved.loadout?.[
            category.id
          ],
        )
          ? saved.loadout[
              category.id
            ]
          : [];

      const restoredSlots =
        Array.from(
          {
            length:
              category.slotCount,
          },
          (_, index) => {
            const itemId =
              savedSlots[index];

            const item =
              ITEM_LIBRARY[
                itemId
              ];

            if (
              !item ||
              item.category !==
                category.id ||
              !ownedItems.includes(
                itemId,
              )
            ) {
              return null;
            }

            return itemId;
          },
        );

      loadout[
        category.id
      ].splice(
        0,
        loadout[
          category.id
        ].length,
        ...restoredSlots,
      );
    }

    if (
      !loadout.weapons.some(
        Boolean,
      )
    ) {
      loadout.weapons[0] =
        'vector';
    }
  } catch {
    // Keep the fresh Vector-only defaults if saved equipment is malformed.
  }
}

restoreEquipmentState();

export function getCategory(id) {
  return EQUIPMENT_CATEGORIES.find(category => category.id === id) ?? null;
}

export function getItem(id) {
  return id ? ITEM_LIBRARY[id] ?? null : null;
}

export function findEquippedItem(itemId) {
  for (const category of EQUIPMENT_CATEGORIES) {
    const index = loadout[category.id].indexOf(itemId);
    if (index !== -1) return { category: category.id, index };
  }
  return null;
}

export function equipItem(itemId, categoryId, slotIndex) {
  const item = getItem(itemId);
  const category = getCategory(categoryId);
  if (!item || !category) return false;
  if (item.category !== categoryId) return false;
  if (slotIndex < 0 || slotIndex >= category.slotCount) return false;

  const existing = findEquippedItem(itemId);
  if (existing) loadout[existing.category][existing.index] = null;

  loadout[categoryId][slotIndex] = itemId;
  saveEquipmentState();
  return true;
}

export function unequipSlot(categoryId, slotIndex) {
  const category = getCategory(categoryId);
  if (!category) return false;
  if (slotIndex < 0 || slotIndex >= category.slotCount) return false;
  loadout[categoryId][slotIndex] = null;
  saveEquipmentState();
  return true;
}

export function getPrimaryWeaponId() {
  return loadout.weapons.find(Boolean) ?? null;
}

export function getWeaponSlotId(index) {
  return loadout.weapons[index] ?? null;
}

export function getExtraSlotId(index) {
  return loadout.extra[index] ?? null;
}

export function getEquippedItems() {
  const items = [];

  for (
    const category
    of EQUIPMENT_CATEGORIES
  ) {
    for (
      const itemId
      of loadout[
        category.id
      ]
    ) {
      const item =
        getItem(itemId);

      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}


export const SHOP_CATALOG = Object.keys(ITEM_LIBRARY);

export function grantItem(itemId) {
  if (!ITEM_LIBRARY[itemId]) {
    return false;
  }

  if (!ownedItems.includes(itemId)) {
    ownedItems.push(itemId);
    saveEquipmentState();
  }

  return true;
}

export function purchaseItem(itemId) {
  return grantItem(itemId);
}

export function resetEquipmentState() {
  ownedItems.splice(
    0,
    ownedItems.length,
    'vector',
  );

  loadout.weapons.splice(
    0,
    loadout.weapons.length,
    'vector',
    null,
  );

  loadout.abilities.splice(
    0,
    loadout.abilities.length,
    null,
    null,
    null,
  );

  loadout.extra.splice(
    0,
    loadout.extra.length,
    null,
    null,
  );

  loadout.armor.splice(
    0,
    loadout.armor.length,
    null,
    null,
  );

  saveEquipmentState();
  return true;
}
