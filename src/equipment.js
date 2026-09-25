export const EQUIPMENT_CATEGORIES = [
  { id: 'weapons', label: 'Weapons', slotCount: 2, slotLabel: 'Weapon' },
  { id: 'abilities', label: 'Abilities', slotCount: 3, slotLabel: 'Ability' },
  { id: 'extra', label: 'Extra', slotCount: 2, slotLabel: 'Extra' },
  { id: 'armor', label: 'Armor', slotCount: 2, slotLabel: 'Armor' },
];

export const ITEM_LIBRARY = {
  vector: {
    id: 'vector',
    name: 'Vector',
    category: 'weapons',
    description: 'A compact burst-fire weapon.',
    appearance: 'black square',
  },
  euclid: {
    id: 'euclid',
    name: 'Euclid',
    category: 'weapons',
    description: 'A sustained precision energy weapon.',
    appearance: 'thin black rectangle',
  },
  horizon: {
    id: 'horizon',
    name: 'Horizon',
    category: 'weapons',
    description: 'A charged precision weapon with powerful recoil.',
    appearance: 'long black rectangle',
  },
};

export const ownedItems = ['vector', 'euclid'];

export const loadout = {
  weapons: ['vector', 'euclid'],
  abilities: [null, null, null],
  extra: [null, null],
  armor: [null, null],
};

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
  return true;
}

export function unequipSlot(categoryId, slotIndex) {
  const category = getCategory(categoryId);
  if (!category) return false;
  if (slotIndex < 0 || slotIndex >= category.slotCount) return false;
  loadout[categoryId][slotIndex] = null;
  return true;
}

export function getPrimaryWeaponId() {
  return loadout.weapons.find(Boolean) ?? null;
}

export function getWeaponSlotId(index) {
  return loadout.weapons[index] ?? null;
}


export const SHOP_CATALOG = Object.keys(ITEM_LIBRARY);

export function purchaseItem(itemId) {
  if (!ITEM_LIBRARY[itemId]) return false;
  if (ownedItems.includes(itemId)) return true;
  ownedItems.push(itemId);
  return true;
}
