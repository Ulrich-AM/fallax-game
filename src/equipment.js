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
    description: 'A compact burst-fire weapon.',
    appearance: 'gray square',
    stats: [
      { label: 'damage', value: '4 x 3 burst' },
      { label: 'burst cooldown', value: '0.42s' },
      { label: 'special', value: '20-shot volley / 7.5s' },
    ],
  },
  euclid: {
    id: 'euclid',
    price: 340,
    name: 'Euclid',
    category: 'weapons',
    description: 'A sustained precision energy weapon.',
    appearance: 'thin gray rectangle',
    stats: [
      { label: 'beam dps', value: '8' },
      { label: 'overcharge', value: '72 dps x 3s' },
      { label: 'special cooldown', value: '18s' },
    ],
  },
  horizon: {
    id: 'horizon',
    price: 560,
    name: 'Horizon',
    category: 'weapons',
    description: 'A charged precision weapon with powerful recoil.',
    appearance: 'long gray rectangle',
    stats: [
      { label: 'shot damage', value: '42' },
      { label: 'charge / cooldown', value: '0.34s / 1.10s' },
      { label: 'Q recoil drive', value: '2250 recoil + 18 stagger / 6.5s' },
      { label: 'E overcharge', value: '105 damage + 34 stagger / 12s' },
      { label: 'Q + E', value: '3375 recoil + 52 stagger' },
    ],
  },
  mach: {
    id: 'mach',
    price: 700,
    name: 'Mach',
    category: 'weapons',
    description: 'A pressure-wave weapon with strong sustained recoil.',
    appearance: 'wide gray rectangle',
    stats: [
      { label: 'wave damage', value: 'up to 15' },
      { label: 'fire interval', value: '0.16s' },
      { label: 'point-blank rate', value: '~93.8 dps' },
      { label: 'fracture', value: '+5 / wave', effect: true },
      { label: 'screech', value: '3 x 42 / 16s' },
      { label: 'screech fracture', value: '+22 / wave', effect: true },
    ],
  },
  relay: {
    id: 'relay',
    price: 620,
    name: 'Relay',
    category: 'weapons',
    description: 'Plants relay nodes on surfaces. Adjacent nodes form damaging links that can be overloaded.',
    appearance: 'outlined relay emitter',
    stats: [
      { label: 'node shot', value: '7 damage' },
      { label: 'link damage', value: '13 dps each' },
      { label: 'capacity', value: '7 nodes / 6 links' },
      { label: 'overload', value: '3x links x 3s / 14s' },
    ],
  },
  parallax: {
    id: 'parallax',
    price: 520,
    name: 'Parallax',
    category: 'weapons',
    description: 'Three copies converge on a focal point. Its special forms low-damage lasers around a high-damage focal orb.',
    appearance: 'solid center gun with translucent copies',
    stats: [
      { label: 'volley', value: '3 x 5.2' },
      { label: 'focus bonus', value: '+9 (24.6 total)' },
      { label: 'fire cooldown', value: '0.46s' },
      { label: 'focal collapse', value: '60 focal dps + 4/beam' },
    ],
  },
  anchor: {
    id: 'anchor',
    price: 480,
    name: 'Anchor',
    category: 'weapons',
    description: 'Fires its neon anchor tip. Click again to recall it; Q enlarges the next anchor into a barbed shot that inflicts heavy Bleed buildup.',
    appearance: 'red-glowing tether weapon',
    stats: [
      { label: 'impact', value: '8 damage' },
      { label: 'tether', value: 'up to 28 dps' },
      { label: 'barbed hit', value: '18 + 100 Bleed buildup', effect: true },
      { label: 'special cooldown', value: '12s' },
    ],
  },
  kepler: {
    id: 'kepler',
    price: 420,
    name: 'Kepler',
    category: 'weapons',
    description: 'Builds an orbital magazine around the player, then launches stored shots toward the cursor.',
    appearance: 'white-glowing orbital weapon',
    stats: [
      { label: 'shot damage', value: '9' },
      { label: 'capacity', value: '6 orbiters' },
      { label: 'loaded fire rate', value: '1 shot / 0.28s' },
      { label: 'orbital release', value: '6 x 12.15 / 10s' },
    ],
  },
  backfire: {
    id: 'backfire',
    price: 240,
    name: 'Backfire',
    category: 'abilities',
    description: 'Dash propulsion that sprays a rear-facing bullet fan.',
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
    description: 'A dash through an enemy becomes a powerful melee strike.',
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
    description: 'Deploys a spinning square that fires a two-sided spiral until destroyed or expired.',
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
    description: 'Deploys a temporary clone that bosses prioritize for 10 seconds.',
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
    description: 'Rigid structural armor that resists fracture at the cost of poorer chemical protection.',
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
