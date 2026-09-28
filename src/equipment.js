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
  },
  euclid: {
    id: 'euclid',
    price: 160,
    name: 'Euclid',
    category: 'weapons',
    description: 'A sustained precision energy weapon.',
    appearance: 'thin gray rectangle',
  },
  horizon: {
    id: 'horizon',
    price: 280,
    name: 'Horizon',
    category: 'weapons',
    description: 'A charged precision weapon with powerful recoil.',
    appearance: 'long gray rectangle',
  },
  mach: {
    id: 'mach',
    price: 220,
    name: 'Mach',
    category: 'weapons',
    description: 'A pressure-wave weapon with strong sustained recoil.',
    appearance: 'wide gray rectangle',
  },
  relay: {
    id: 'relay',
    price: 260,
    name: 'Relay',
    category: 'weapons',
    description: 'Plants relay nodes on surfaces. Adjacent nodes form damaging links that can be overloaded.',
    appearance: 'outlined relay emitter',
  },
  parallax: {
    id: 'parallax',
    price: 240,
    name: 'Parallax',
    category: 'weapons',
    description: 'A focal-geometry weapon. Three copies converge on the cursor and reward precise focus hits.',
    appearance: 'solid center gun with translucent copies',
  },
  anchor: {
    id: 'anchor',
    price: 300,
    name: 'Anchor',
    category: 'weapons',
    description: 'Fires a tether spike. Stretching a boss tether increases damage; terrain anchors can reel you in.',
    appearance: 'red-glowing tether weapon',
  },
  kepler: {
    id: 'kepler',
    price: 250,
    name: 'Kepler',
    category: 'weapons',
    description: 'Builds an orbital magazine around the player, then launches stored shots toward the cursor.',
    appearance: 'white-glowing orbital weapon',
  },
  backfire: {
    id: 'backfire',
    price: 120,
    name: 'Backfire',
    category: 'abilities',
    description: 'Dash propulsion that sprays a rear-facing bullet fan.',
    appearance: 'ability module',
  },
  strike: {
    id: 'strike',
    price: 180,
    name: 'Strike',
    category: 'abilities',
    description: 'A dash through an enemy becomes a powerful melee strike.',
    appearance: 'ability module',
  },
  turret: {
    id: 'turret',
    price: 150,
    name: 'Turret',
    category: 'extra',
    description: 'Deploys a spinning square that fires a two-sided spiral until destroyed or expired.',
    appearance: 'outlined spinning square',
  },
  decoy: {
    id: 'decoy',
    price: 130,
    name: 'Decoy',
    category: 'extra',
    description: 'Deploys a temporary clone that bosses prioritize for 10 seconds.',
    appearance: 'player clone',
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
