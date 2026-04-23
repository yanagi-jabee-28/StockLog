import { ActivityType, Category } from './types';

export const CATEGORY_IDS = {
  fresh: 'fresh',
  frozen: 'frozen',
  seasoning: 'seasoning',
  pantry: 'pantry',
  beverage: 'beverage',
  daily: 'daily',
  beauty: 'beauty',
  utility: 'utility',
  furniture: 'furniture',
  emergency: 'emergency',
  wardrobe: 'wardrobe',
  innerwear: 'innerwear',
  accessories: 'accessories',
  seasonal: 'seasonal',
  healthcare: 'healthcare',
  hobby: 'hobby',
} as const;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: CATEGORY_IDS.fresh, name: '🥬 冷蔵保存（生鮮・要冷蔵品）' },
  { id: CATEGORY_IDS.frozen, name: '🧊 冷凍保存' },
  { id: CATEGORY_IDS.seasoning, name: '🧂 調味料（常温）' },
  { id: CATEGORY_IDS.pantry, name: '🍘 乾物・保存食' },
  { id: CATEGORY_IDS.beverage, name: '🥤 飲料・嗜好品' },
  { id: CATEGORY_IDS.daily, name: '🧻 日用消耗品' },
  { id: CATEGORY_IDS.beauty, name: '💄 コスメ・美容ケア' },
  { id: CATEGORY_IDS.healthcare, name: '🩺 医療・ヘルスケア' },
  { id: CATEGORY_IDS.wardrobe, name: '👕 衣類・ワードローブ' },
  { id: CATEGORY_IDS.innerwear, name: '🧦 インナー・靴下' },
  { id: CATEGORY_IDS.accessories, name: '👟 靴・服飾雑貨' },
  { id: CATEGORY_IDS.seasonal, name: '🧥 季節もの・保管衣類' },
  { id: CATEGORY_IDS.utility, name: '🔧 住設・家電消耗品' },
  { id: CATEGORY_IDS.hobby, name: '🎨 趣味・探求' },
  { id: CATEGORY_IDS.furniture, name: '🪑 家具・インテリア' },
  { id: CATEGORY_IDS.emergency, name: '🧰 防災・備蓄' },
];

export const APP_LAST_UPDATED = '2026/04/23 23:24';

export const EXPIRY_CATEGORY_IDS = [
  CATEGORY_IDS.fresh,
  CATEGORY_IDS.frozen,
  CATEGORY_IDS.seasoning,
  CATEGORY_IDS.pantry,
  CATEGORY_IDS.beverage,
  CATEGORY_IDS.emergency,
  CATEGORY_IDS.healthcare,
] as const;

const EXPIRY_CATEGORY_ID_SET = new Set<string>(EXPIRY_CATEGORY_IDS);

export const isExpiryCategoryId = (categoryId: string): boolean => {
  return EXPIRY_CATEGORY_ID_SET.has(categoryId);
};

export const OPENED_DAILY_CATEGORY_IDS = [
  CATEGORY_IDS.daily,
  CATEGORY_IDS.beauty,
  CATEGORY_IDS.utility,
  CATEGORY_IDS.emergency,
  CATEGORY_IDS.healthcare,
  CATEGORY_IDS.hobby,
  CATEGORY_IDS.innerwear,
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
