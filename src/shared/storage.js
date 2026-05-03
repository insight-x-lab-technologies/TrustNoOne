export function readJson(key, fallback = null, storage = localStorage) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function writeJson(key, value, storage = localStorage) {
  storage.setItem(key, JSON.stringify(value));
}

export function createStorageKey(namespace, name, version = 1) {
  return `mm_${namespace}_${name}_v${version}`;
}
