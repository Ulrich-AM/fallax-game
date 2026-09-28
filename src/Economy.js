const STORAGE_KEY = 'fallax.economy.v1';

function clampAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.floor(number));
}

export class Economy {
  constructor() {
    this.denarius = 0;

    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? 'null',
      );

      if (
        saved &&
        typeof saved === 'object'
      ) {
        this.denarius =
          clampAmount(
            saved.denarius,
          );
      }
    } catch {
      this.denarius = 0;
    }
  }

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          denarius:
            this.denarius,
        }),
      );
    } catch {
      // Currency still works for the current session.
    }
  }

  setDenarius(amount) {
    this.denarius =
      clampAmount(amount);

    this.save();

    return this.denarius;
  }

  resetDenarius() {
    return this.setDenarius(0);
  }

  addDenarius(amount) {
    const gain =
      clampAmount(amount);

    this.denarius += gain;
    this.save();

    return gain;
  }

  spendDenarius(amount) {
    const cost =
      clampAmount(amount);

    if (
      cost >
      this.denarius
    ) {
      return false;
    }

    this.denarius -= cost;
    this.save();

    return true;
  }
}
