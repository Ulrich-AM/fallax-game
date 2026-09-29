export const PROGRESS_EPOCH = 1;

const EPOCH_STORAGE_KEY =
  'fallax.progress-epoch.v1';

const PROGRESSION_KEYS = [
  'fallax.equipment.v1',
  'fallax.economy.v1',
];

function readStoredEpoch() {
  try {
    const raw =
      localStorage.getItem(
        EPOCH_STORAGE_KEY,
      );

    const value =
      Number(raw);

    return Number.isFinite(value)
      ? value
      : 0;
  } catch {
    return 0;
  }
}

export function ensureProgressEpoch() {
  const stored =
    readStoredEpoch();

  if (
    stored ===
    PROGRESS_EPOCH
  ) {
    return false;
  }

  try {
    for (
      const key
      of PROGRESSION_KEYS
    ) {
      localStorage.removeItem(
        key,
      );
    }

    localStorage.setItem(
      EPOCH_STORAGE_KEY,
      String(
        PROGRESS_EPOCH,
      ),
    );

    return true;
  } catch {
    return false;
  }
}

export function getProgressEpochStatus() {
  return {
    current:
      PROGRESS_EPOCH,
    stored:
      readStoredEpoch(),
  };
}
