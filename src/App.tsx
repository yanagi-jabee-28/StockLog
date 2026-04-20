import React, { useState } from 'react';
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
  Clock,
  Calendar
} from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { InventoryItemCard } from './components/InventoryItemCard';
import { AddItemModal } from './components/AddItemModal';
import { SettingsModal } from './components/SettingsModal';
import { InventoryItem, ActivityType } from './types';
import { useModalNavigation } from './hooks/useModalNavigation';

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
  
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || 'priority');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{id: string, details: string} | null>(null);

  // Handle Escape key and mobile Back gesture for activity edit
  useModalNavigation(!!editingActivity, () => setEditingActivity(null));

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

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setIsDuplicateMode(false);
  };

  // If categories finish loading asynchronously and active is out of sync, set it safely
  // We allow 'history' as a special virtual category ID
  if (categories.length > 0 && activeCategoryId !== 'history' && !categories.find(c => c.id === activeCategoryId)) {
    setActiveCategoryId(categories[0].id);
  }

  const filteredItems = items.filter(item => {
    if (activeCategoryId === 'history') return true; // Show ALL in history
    return !item.isArchived && item.categoryId === activeCategoryId;
  }).sort((a, b) => {
    if (activeCategoryId === 'history') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    }
    
    // 1. Sort by expiry date (earliest first)
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    if (a.expiryDate) return -1; // a has date, b doesn't -> a comes first
    if (b.expiryDate) return 1;  // b has date, a doesn't -> b comes first

    // 2. Fallback to name
    return a.name.localeCompare(b.name, 'ja');
  });

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

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'added': return <Plus className="w-4 h-4 text-emerald-500" />;
      case 'stock_up': return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'stock_down': return <MinusCircle className="w-4 h-4 text-orange-500" />;
      case 'opened': return <BoxSelect className="w-4 h-4 text-violet-500" />;
      case 'remaining_update': return <Gauge className="w-4 h-4 text-amber-500" />;
      case 'archived': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      case 'deleted': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'edited': return <Settings2 className="w-4 h-4 text-indigo-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case 'added': return '新規登録';
      case 'stock_up': return '入荷 / 追加';
      case 'stock_down': return '消費 / 減少';
      case 'opened': return '使用開始';
      case 'remaining_update': return '残量更新';
      case 'archived': return '使い切り完了';
      case 'deleted': return '削除';
      case 'edited': return '情報更新';
      default: return 'アクティビティ';
    }
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
          
          <div className="flex flex-col items-center">
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
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-10 pb-6 group">
                      {/* Timeline Line */}
                      <div className="absolute left-[18px] top-4 bottom-0 w-px bg-gray-100 group-last:hidden" />
                      
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm z-10 group-hover:scale-110 transition-transform">
                        {getActivityIcon(activity.type)}
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
                              {getActivityLabel(activity.type)}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{activity.itemName}</h4>
                        <p className="text-xs text-gray-500">{activity.details}</p>
                      </div>
                    </div>
                  ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredItems.map(item => (
                <InventoryItemCard
                  key={item.id}
                  item={{...item, isHistoryView: activeCategoryId === 'history'} as any}
                  onIncrement={incrementStock}
                  onDecrement={decrementStock}
                  onDelete={deleteItem}
                  onOpen={openItem}
                  onUnopen={unopenItem}
                  onDuplicate={handleDuplicateItem}
                  onEdit={handleEditItem}
                  onArchive={archiveItem}
                  onUpdateRemaining={updateRemainingAmount}
                />
              ))}
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
