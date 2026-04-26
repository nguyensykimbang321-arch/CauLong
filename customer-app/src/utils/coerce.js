export function coerceBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') return value;
  if (value == null) return defaultValue;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    if (normalized === '') return defaultValue;
  }

  if (typeof value === 'number') return value !== 0;

  return Boolean(value);
}

