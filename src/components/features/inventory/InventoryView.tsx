import React, { useState } from 'react';
import { 
  Plus, 
  Boxes, 
  History, 
  PlusCircle,
  MinusCircle,
  CheckCircle,
  BoxSelect,
  Trash2, 
  Gauge,
  Settings2,
  type LucideIcon
} from 'lucide-react';
import { InventoryItemCard } from '../../InventoryItemCard';
import { InventoryItem, ActivityType, Category, ActivityEntry } from '../../../types';
import { useInventoryView } from '../../../hooks/useInventoryView';
import { ACTIVITY_META } from '../../../constants';
import { useModalNavigation } from '../../../hooks/useModalNavigation';

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  added: Plus,
  stock_up: PlusCircle,
  stock_down: MinusCircle,
  opened: BoxSelect,
  remaining_update: Gauge,
  archived: CheckCircle,
  deleted: Trash2,
  edited: Settings2,
};

const formatJapaneseDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short'
  }).format(date);
};

interface InventoryViewProps {
  items: InventoryItem[];
  categories: Category[];
  activeCategoryId: string;
  activities: ActivityEntry[];
  incrementStock: (id: string) => void;
  decrementStock: (id: string) => void;
  openItem: (id: string) => void;
  unopenItem: (id: string) => void;
  archiveItem: (id: string) => void;
  updateRemainingAmount: (id: string, amount: string) => void;
  handleDeleteItem: (id: string) => void;
  handleEditItem: (item: InventoryItem) => void;
  handleDuplicateItem: (item: InventoryItem) => void;
  deleteActivity: (id: string) => void;
  updateActivity: (id: string, updates: Partial<ActivityEntry>) => void;
  clearActivities: () => void;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export function InventoryView({
  items,
  categories,
  activeCategoryId,
  activities,
  incrementStock,
  decrementStock,
  openItem,
  unopenItem,
  archiveItem,
  updateRemainingAmount,
  handleDeleteItem,
  handleEditItem,
  handleDuplicateItem,
  deleteActivity,
  updateActivity,
  clearActivities,
  setIsAddModalOpen
}: InventoryViewProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{id: string, details: string} | null>(null);

  useModalNavigation(!!editingActivity, () => setEditingActivity(null), 'activity-edit-modal');

  const { filteredItems, activeItems, unopenedItems, unopenedGroups, totalStockByRootId } = useInventoryView(
    items,
    activeCategoryId
  );

  const handleClearActivities = () => {
    clearActivities();
    setShowClearConfirm(false);
  };

  const handleEditActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      updateActivity(editingActivity.id, { details: editingActivity.details });
      setEditingActivity(null);
    }
  };

  const showAddItemButton = activeCategoryId !== 'history';

  const getActivityMeta = (type: ActivityType) => {
    return {
      ...ACTIVITY_META[type],
      Icon: ACTIVITY_ICONS[type],
    };
  };

  return (
    <>
      {/* Desktop Category Title & Add Button */}
      <div className="hidden md:flex justify-between items-center mb-12 border-b border-gray-100 pb-10">
        <div>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">Current Category</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            {activeCategoryId === 'history' ? 'History Log' : categories.find(c => c.id === activeCategoryId)?.name}
          </h2>
        </div>
        {showAddItemButton && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-gray-200/50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            アイテムを追加
          </button>
        )}
      </div>

      {activeCategoryId === 'history' ? (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
          {activities.length > 0 && (
            <div className="flex justify-end mb-6">
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-5 py-2.5 rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  履歴をすべて消去
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-3">本当に消去しますか？</span>
                  <button
                    onClick={handleClearActivities}
                    className="bg-rose-500 text-white text-[9px] font-black px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors uppercase tracking-widest"
                  >
                    はい
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-white text-gray-400 text-[9px] font-black px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors uppercase tracking-widest"
                  >
                    いいえ
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 mb-6 rounded-3xl bg-gray-50 flex items-center justify-center">
                <History className="w-6 h-6 text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">履歴がありません</h3>
              <p className="text-xs text-gray-400 font-medium">アイテムを操作すると、ここに履歴が残ります。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const meta = getActivityMeta(activity.type);
                return (
                <div key={activity.id} className="relative pl-10 pb-6 group">
                  {/* Timeline Line */}
                  <div className="absolute left-[18px] top-4 bottom-0 w-px bg-gray-100 group-last:hidden" />
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm z-10 group-hover:scale-110 transition-transform">
                    <meta.Icon className={`w-4 h-4 ${meta.iconClassName}`} />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        {formatJapaneseDateTime(activity.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingActivity({ id: activity.id, details: activity.details || '' })}
                          className="text-gray-300 hover:text-gray-600 transition-colors p-1"
                          title="編集"
                        >
                          <Settings2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => deleteActivity(activity.id)}
                          className="text-gray-300 hover:text-rose-500 transition-colors p-1"
                          title="削除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md border border-gray-100 uppercase">
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{activity.itemName}</h4>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 mb-6 rounded-3xl bg-gray-50 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">アイテムがありません</h3>
          <p className="text-xs text-gray-400 font-medium max-w-[200px] mx-auto">
             このカテゴリにはまだアイテムが登録されていません。
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {activeItems.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase">Active / 使用中</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeItems.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {activeItems.map(item => (
                  <InventoryItemCard
                    key={item.id}
                    item={{
                      ...item,
                      stock: totalStockByRootId.get(item.originalItemId || item.id) ?? item.stock,
                      isHistoryView: activeCategoryId === 'history'
                    }}
                    onIncrement={incrementStock}
                    onDecrement={decrementStock}
                    onDelete={handleDeleteItem}
                    onOpen={openItem}
                    onUnopen={unopenItem}
                    onDuplicate={handleDuplicateItem}
                    onEdit={handleEditItem}
                    onArchive={archiveItem}
                    onUpdateRemaining={updateRemainingAmount}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase">Stock / 未開封在庫</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{unopenedItems.length} items</span>
            </div>
            {unopenedItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 py-14 text-center">
                <p className="text-xs font-bold text-gray-400">このカテゴリの未開封在庫はありません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unopenedGroups.map(group => (
                  <details key={group.name} className="rounded-3xl border border-gray-100 bg-white shadow-sm open:shadow-md transition-all" open={group.items.length === 1}>
                    <summary className="list-none cursor-pointer px-6 py-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-gray-900 truncate">{group.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {group.items.length} ロット / 合計在庫 {group.totalStock}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        展開
                      </span>
                    </summary>

                    <div className="px-4 pb-4">
                      <div className="overflow-hidden rounded-2xl border border-gray-100">
                        {group.items.map((item, index) => (
                          <div key={item.id} className={`p-4 ${index !== group.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-black text-gray-800">
                                  ロット {index + 1}
                                  {item.contentAmount !== undefined && (item.contentUnit || item.unit)
                                    ? ` · ${item.contentAmount}${item.contentUnit || item.unit}`
                                    : ''}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                  {item.expiryDate ? `期限 ${item.expiryDate}` : '期限なし'}
                                  {item.purchasePrice !== undefined ? ` · ¥${item.purchasePrice.toLocaleString('ja-JP')}` : ''}
                                  {item.notes ? ` · ${item.notes}` : ''}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-black text-gray-500 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                                  在庫 {item.stock}{item.unit}
                                </span>
                                <button
                                  onClick={() => decrementStock(item.id)}
                                  disabled={item.stock <= 0}
                                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${item.stock > 0 ? 'bg-white border border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600' : 'bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed'}`}
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => incrementStock(item.id)}
                                  className="px-3 py-2 rounded-xl text-xs font-black bg-gray-900 text-white hover:bg-black transition-all"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => openItem(item.id)}
                                  disabled={item.stock <= 0}
                                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${item.stock > 0 ? 'bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
                                  title="このロットから1つ開封"
                                >
                                  1つ開封
                                </button>
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                  編集
                                </button>
                                <button
                                  onClick={() => handleDuplicateItem(item)}
                                  className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 transition-all"
                                >
                                  別ロット追加
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all"
                                >
                                  削除
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      {showAddItemButton && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
            aria-label="アイテムを追加"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Activity Edit Modal */}
      {editingActivity && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditingActivity(null)}
        >
          <div className="absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">履歴を編集</h3>
            <form onSubmit={handleEditActivitySubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">Details</label>
                <textarea
                  autoFocus
                  value={editingActivity.details}
                  onChange={e => setEditingActivity({ ...editingActivity, details: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all resize-none h-32"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
                >
                  保存する
                </button>
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
