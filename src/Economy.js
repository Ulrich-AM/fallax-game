import {
  ensureProgressEpoch,
} from './ProgressEpoch.js?v=63';

ensureProgressEpoch();

const STORAGE_KEY = 'fallax.economy.v1';

function clampAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.floor(number));
}

export class Economy {
  constructor() {
    this.denarius = 0;
    this.telos = 0;

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

        this.telos =
          clampAmount(
            saved.telos,
          );
      }
    } catch {
      this.denarius = 0;
      this.telos = 0;
    }
  }

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          denarius:
            this.denarius,
          telos:
            this.telos,
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

  setTelos(amount) {
    this.telos =
      clampAmount(amount);

    this.save();

    return this.telos;
  }

  resetTelos() {
    return this.setTelos(0);
  }

  addTelos(amount) {
    const gain =
      clampAmount(amount);

    this.telos += gain;
    this.save();

    return gain;
  }

  spendTelos(amount) {
    const cost =
      clampAmount(amount);

    if (
      cost >
      this.telos
    ) {
      return false;
    }

    this.telos -= cost;
    this.save();

    return true;
  }

  resetCurrencies() {
    this.denarius = 0;
    this.telos = 0;
    this.save();

    return {
      denarius: this.denarius,
      telos: this.telos,
    };
  }
}
