const DEBUG_STORAGE_KEY = 'stocklog_debug';

const isBrowser = typeof window !== 'undefined';

const hasDebugQueryFlag = (): boolean => {
  if (!isBrowser) return false;

  const params = new URLSearchParams(window.location.search);
  const value = params.get('debug');
  return value === '1' || value === 'true';
};

const hasDebugStorageFlag = (): boolean => {
  if (!isBrowser) return false;

  try {
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const isDebugEnabled = (): boolean => {
  return hasDebugQueryFlag() || hasDebugStorageFlag();
};

export const setDebugEnabled = (enabled: boolean): void => {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(DEBUG_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore storage errors in restrictive browser modes.
  }
};

export const logDebug = (...args: unknown[]): void => {
  if (!isDebugEnabled()) return;
  console.debug('[StockLog]', ...args);
};

export const logInfo = (...args: unknown[]): void => {
  console.info('[StockLog]', ...args);
};

export const logWarn = (...args: unknown[]): void => {
  console.warn('[StockLog]', ...args);
};

export const logError = (...args: unknown[]): void => {
  console.error('[StockLog]', ...args);
};
