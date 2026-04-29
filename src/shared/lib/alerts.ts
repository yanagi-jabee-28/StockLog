export interface ExpiryStatus {
  label: string;
  color: string;
  isCritical: boolean;
}

export interface ItemAlertState {
  isStockAlert: boolean;
  isPercentAlert: boolean;
  expiryStatus: ExpiryStatus | null;
  isAlert: boolean;
}

export interface ItemLike {
  isOpened?: boolean;
  stock?: number;
  alertThreshold?: number;
  alertThresholdPercent?: number;
  remainingPercent?: number;
  expiryDate?: string;
  name?: string;
}

export const getExpiryStatus = (expiryDate?: string): ExpiryStatus | null => {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `期限切れ (${Math.abs(diffDays)}日経過)`, color: 'text-rose-600', isCritical: true };
  if (diffDays === 0) return { label: '今日が期限', color: 'text-rose-500', isCritical: true };
  if (diffDays <= 3) return { label: `あと${diffDays}日`, color: 'text-rose-500', isCritical: true };
  if (diffDays <= 7) return { label: `あと${diffDays}日`, color: 'text-amber-500', isCritical: false };
  return { label: `あと${diffDays}日`, color: 'text-gray-400', isCritical: false };
};

export const getItemAlertState = (item: ItemLike): ItemAlertState => {
  const isStockAlert = !item.isOpened && (item.stock ?? 0) <= (item.alertThreshold ?? 0);
  const isPercentAlert = Boolean(item.isOpened) && (item.remainingPercent ?? 100) <= (item.alertThresholdPercent ?? 20);
  const expiryStatus = getExpiryStatus(item.expiryDate);
  const isAlert = isStockAlert || isPercentAlert || (expiryStatus?.isCritical ?? false);

  return {
    isStockAlert,
    isPercentAlert,
    expiryStatus,
    isAlert,
  };
};

export const compareByExpiryThenName = (a: ItemLike, b: ItemLike): number => {
  const aExpiry = a.expiryDate;
  const bExpiry = b.expiryDate;
  const aName = a.name ?? '';
  const bName = b.name ?? '';

  if (aExpiry && bExpiry) {
    return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
  }
  if (aExpiry) return -1;
  if (bExpiry) return 1;

  return aName.localeCompare(bName, 'ja');
};
