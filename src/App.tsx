import React, { useEffect, useMemo, useState } from 'react';
import { 
  Settings, 
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
import { useInventory } from './hooks/useInventory';
import { InventoryItemCard } from './components/InventoryItemCard';
import { AddItemModal } from './components/AddItemModal';
import { SettingsModal } from './components/SettingsModal';
import { InventoryItem, ActivityType } from './types';
import { useModalNavigation } from './hooks/useModalNavigation';
import { ACTIVITY_META, APP_LAST_UPDATED, CATEGORY_IDS } from './constants';
import { compareByExpiryThenName } from './lib/alerts';

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

export default function App() {
  const { 
    items, 
    categories, 
    addItem, 
    incrementStock, 
    decrementStock, 
    deleteItem,
    openItem,
    unopenItem,
    updateRemainingAmount,
    updateItem,
    archiveItem,
    activities,
    deleteActivity,
    updateActivity,
    clearActivities,
    reloadData
  } = useInventory();
  
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || CATEGORY_IDS.fresh);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{id: string, details: string} | null>(null);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    item: InventoryItem;
    linkedOpenedCount: number;
  } | null>(null);

  // Handle Escape key and mobile Back gesture for activity edit
  useModalNavigation(!!editingActivity, () => setEditingActivity(null));
  useModalNavigation(!!deleteConfirmState, () => setDeleteConfirmState(null));

  const handleEditItem = (item: InventoryItem) => {
    setIsDuplicateMode(false);
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleDuplicateItem = (item: InventoryItem) => {
    setIsDuplicateMode(true);
    // When duplicating, we want a new item with same metadata but stock starts at 0 or same as source
    setEditingItem(item); 
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find(item => item.id === id);
    if (!target) return;

    const linkedOpenedCount = target.isOpened
      ? 0
      : items.filter(item => item.isOpened && item.originalItemId === id).length;

    setDeleteConfirmState({
      item: target,
      linkedOpenedCount,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmState) return;
    deleteItem(deleteConfirmState.item.id);
    setDeleteConfirmState(null);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setIsDuplicateMode(false);
  };

  useEffect(() => {
    if (categories.length === 0) return;
    if (activeCategoryId === 'history') return;

    const isValidCategory = categories.some((category) => category.id === activeCategoryId);
    if (!isValidCategory) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const filteredItems = items.filter(item => {
    if (activeCategoryId === 'history') return true; // Show ALL in history
    return !item.isArchived && item.categoryId === activeCategoryId;
  }).sort((a, b) => {
    if (activeCategoryId === 'history') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    }
    
    return compareByExpiryThenName(a, b);
  });

  const activeItems = filteredItems
    .filter(item => item.isOpened)
    .sort((a, b) => {
      const percentDiff = (a.remainingPercent ?? 100) - (b.remainingPercent ?? 100);
      if (percentDiff !== 0) return percentDiff;
      return compareByExpiryThenName(a, b);
    });

  const unopenedItems = filteredItems
    .filter(item => !item.isOpened)
    .sort(compareByExpiryThenName);

  const unopenedGroups = useMemo(() => {
    const groups = new Map<string, { name: string; items: InventoryItem[]; totalStock: number }>();

    for (const item of unopenedItems) {
      const key = item.name.trim().toLowerCase();
      const group = groups.get(key);
      if (!group) {
        groups.set(key, { name: item.name, items: [item], totalStock: item.stock });
        continue;
      }

      group.items.push(item);
      group.totalStock += item.stock;
    }

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [unopenedItems]);

  const totalStockByRootId = useMemo(() => {
    const totals = new Map<string, number>();

    for (const item of items) {
      if (item.isArchived) continue;

      const rootId = item.isOpened && item.originalItemId ? item.originalItemId : item.id;
      const current = totals.get(rootId) ?? 0;
      const contribution = item.isOpened ? 1 : item.stock;
      totals.set(rootId, current + contribution);
    }

    return totals;
  }, [items]);

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

  const getActivityMeta = (type: ActivityType) => {
    return {
      ...ACTIVITY_META[type],
      Icon: ACTIVITY_ICONS[type],
    };
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-white border-r border-gray-100 shrink-0 relative z-20">
        <div className="p-10 flex items-center">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <span className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-gray-200">S</span>
            StockLog
          </h1>
        </div>
        
        <div className="px-6 pb-2 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 px-4">Categories</p>
          <div className="flex flex-col gap-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                  activeCategoryId === category.id 
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{category.name}</span>
                {items.filter(i => !i.isArchived && i.categoryId === category.id).length > 0 && (
                   <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                     activeCategoryId === category.id ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'
                   }`}>
                     {items.filter(i => !i.isArchived && i.categoryId === category.id).length}
                   </span>
                )}
              </button>
            ))}
            
            <div className="mt-8 pt-8 border-t border-gray-100">
               <button
                onClick={() => setActiveCategoryId('history')}
                className={`text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 w-full group ${
                  activeCategoryId === 'history' 
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <History className={`w-4 h-4 transition-transform ${activeCategoryId === 'history' ? 'scale-110' : 'text-gray-300'}`} />
                <span>History Log</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-6">
          <div className="p-4 bg-gray-50 rounded-[2rem] border border-gray-100 mb-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-3 w-full px-5 py-3.5 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-medium text-gray-400 tracking-wide">
              最終更新 {APP_LAST_UPDATED}
            </p>
            <a 
              href="https://ai.studio/apps/cf93f8bf-7fd1-41ca-9a7c-e8395e8891e8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] hover:text-violet-500 transition-colors"
            >
              Google AI Studio
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 px-6 pt-10 pb-4 border-b border-gray-100 shrink-0 relative z-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <span className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-base font-black">S</span>
            StockLog
          </h1>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-400 bg-gray-50 rounded-full"
            aria-label="設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-4 text-[10px] font-medium text-gray-400 tracking-wide">
          最終更新 {APP_LAST_UPDATED}
        </p>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 -mx-6 px-6 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border ${
                activeCategoryId === category.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
          <button
            onClick={() => setActiveCategoryId('history')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border flex items-center gap-1.5 ${
              activeCategoryId === 'history'
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            <History className="w-3 h-3" />
            History
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-4 py-6 md:p-12 shrink-0 mb-28 md:mb-0">
          
          {/* Desktop Category Title & Add Button */}
          <div className="hidden md:flex justify-between items-center mb-12 border-b border-gray-100 pb-10">
            <div>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">Current Category</p>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
                {activeCategoryId === 'history' ? 'History Log' : categories.find(c => c.id === activeCategoryId)?.name}
              </h2>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-gray-200/50 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              アイテムを追加
            </button>
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
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
          aria-label="アイテムを追加"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Modals */}
      {deleteConfirmState && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDeleteConfirmState(null)}
        >
          <div
            className="bg-white rounded-t-[2rem] sm:rounded-3xl p-7 sm:p-8 w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.18em] mb-2">Delete Confirmation</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3">削除してもよろしいですか？</h3>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 mb-6">
              <p className="text-sm font-bold text-rose-700 leading-relaxed">
                {deleteConfirmState.item.isOpened
                  ? `開封中アイテム「${deleteConfirmState.item.name}」を削除します。`
                  : deleteConfirmState.linkedOpenedCount > 0
                    ? `ロット「${deleteConfirmState.item.name}」を削除します。紐付く開封中 ${deleteConfirmState.linkedOpenedCount} 件も同時に削除されます。`
                    : `ロット「${deleteConfirmState.item.name}」を削除します。`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all active:scale-95"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all active:scale-95"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {editingActivity && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setEditingActivity(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseAddModal} 
        categories={categories}
        items={items}
        onAdd={addItem}
        onEdit={updateItem}
        initialCategory={activeCategoryId}
        editItem={editingItem}
        isDuplicate={isDuplicateMode}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onDataImported={reloadData}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
