import { ActivityType, Category } from './types';

export const CATEGORY_IDS = {
  priority: 'priority',
  priorityDaily: 'priority_daily',
  beverages: 'beverages',
  grocery: 'grocery',
  prepped: 'prepped',
  frozen: 'frozen',
  pantry: 'pantry',
  daily: 'daily',
  homeUtility: 'home_utility',
  emergencyStock: 'emergency_stock',
  hobby: 'hobby',
  medCosme: 'med_cosme',
} as const;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: CATEGORY_IDS.priority, name: '🚨 開封済・食べ物' },
  { id: CATEGORY_IDS.priorityDaily, name: '🧼 使用中・消耗品' },
  { id: CATEGORY_IDS.beverages, name: '🥤 飲料・ドリンク' },
  { id: CATEGORY_IDS.grocery, name: '🛒 生鮮・買い出し品' },
  { id: CATEGORY_IDS.prepped, name: '🍱 作り置き・お弁当' },
  { id: CATEGORY_IDS.frozen, name: '❄️ 冷凍・ストック' },
  { id: CATEGORY_IDS.pantry, name: '🧂 調味料・乾物' },
  { id: CATEGORY_IDS.daily, name: '🧻 日用品・消耗品' },
  { id: CATEGORY_IDS.homeUtility, name: '🛠️ 家電・住設消耗品' },
  { id: CATEGORY_IDS.emergencyStock, name: '🆘 防災備蓄' },
  { id: CATEGORY_IDS.hobby, name: '🎨 趣味・ホビー' },
  { id: CATEGORY_IDS.medCosme, name: '💄 常備薬・コスメ' },
];

export const EXPIRY_CATEGORY_IDS = [
  CATEGORY_IDS.priority,
  CATEGORY_IDS.beverages,
  CATEGORY_IDS.grocery,
  CATEGORY_IDS.frozen,
  CATEGORY_IDS.pantry,
  CATEGORY_IDS.medCosme,
  CATEGORY_IDS.prepped,
] as const;

const EXPIRY_CATEGORY_ID_SET = new Set<string>(EXPIRY_CATEGORY_IDS);

export const isExpiryCategoryId = (categoryId: string): boolean => {
  return EXPIRY_CATEGORY_ID_SET.has(categoryId);
};

export const OPENED_DAILY_CATEGORY_IDS = [
  CATEGORY_IDS.daily,
  CATEGORY_IDS.homeUtility,
  CATEGORY_IDS.emergencyStock,
  CATEGORY_IDS.medCosme,
  CATEGORY_IDS.hobby,
] as const;

const OPENED_DAILY_CATEGORY_ID_SET = new Set<string>(OPENED_DAILY_CATEGORY_IDS);

export const isOpenedDailyCategoryId = (categoryId: string): boolean => {
  return OPENED_DAILY_CATEGORY_ID_SET.has(categoryId);
};

export interface ActivityMeta {
  label: string;
  iconClassName: string;
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  added: { label: '新規登録', iconClassName: 'text-emerald-500' },
  stock_up: { label: '入荷 / 追加', iconClassName: 'text-blue-500' },
  stock_down: { label: '消費 / 減少', iconClassName: 'text-orange-500' },
  opened: { label: '使用開始', iconClassName: 'text-violet-500' },
  remaining_update: { label: '残量更新', iconClassName: 'text-amber-500' },
  archived: { label: '使い切り完了', iconClassName: 'text-gray-500' },
  deleted: { label: '削除', iconClassName: 'text-rose-500' },
  edited: { label: '情報更新', iconClassName: 'text-indigo-500' },
};
