import React from 'react';
import { Category, InventoryItem, ActivityEntry } from '../../../shared/types';
import { X, Search, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { useModalNavigation } from '../../../shared/lib/hooks/useModalNavigation';
import { isExpiryCategoryId } from '../../../constants';
import { useAddItemForm } from '../lib/useAddItemForm';
import { CategorySelector } from './AddItemModal/CategorySelector';
import { SuggestionList } from '../../../shared/ui/SuggestionList';
import { PriceSection } from './AddItemModal/PriceSection';
import { UnitPicker } from './AddItemModal/UnitPicker';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  items: InventoryItem[];
  activities: ActivityEntry[];
  onAdd: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  onEdit?: (id: string, updates: Partial<InventoryItem>) => void;
  initialCategory: string;
  initialValues?: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> | null;
  editItem?: InventoryItem | null;
  isDuplicate?: boolean;
}

export function AddItemModal({ isOpen, onClose, categories, items, activities, onAdd, onEdit, initialCategory, initialValues, editItem, isDuplicate }: Props) {
  const { state, actions } = useAddItemForm({
    isOpen,
    onClose,
    initialCategory,
    initialValues,
    editItem,
    isDuplicate,
    items,
    activities,
    onAdd,
    onEdit,
  });

  useModalNavigation(isOpen, actions.handleRequestClose, 'add-item-modal');

  if (!isOpen) return null;

  const showsExpiry = isExpiryCategoryId(state.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-6 transition-all">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-[2rem] font-black text-gray-900 tracking-tight leading-tight">
              {isDuplicate ? 'Add Another Batch' : editItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 leading-relaxed">
              {isDuplicate ? '別ロット・在庫を追加' : editItem ? 'アイテム情報の編集' : 'アイテムの新規登録'}
            </p>
          </div>
          <button 
            onClick={() => actions.handleRequestClose()}
            aria-label="閉じる"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-200 border border-gray-800 hover:bg-black hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={actions.handleSubmit} className="space-y-8">
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              品名
            </label>
            <div className="relative group/input">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-violet-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={state.name}
                onChange={e => {
                  actions.setName(e.target.value);
                  actions.setShowSuggestions(true);
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape' && state.showSuggestions && state.suggestions.length > 0) {
                    e.stopPropagation();
                    actions.setShowSuggestions(false);
                  }
                }}
                onFocus={() => actions.setShowSuggestions(true)}
                onBlur={() => setTimeout(() => actions.setShowSuggestions(false), 200)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-bold text-gray-900"
                placeholder="例: トマト水煮缶"
              />
            </div>
            
            {state.showSuggestions && (
              <SuggestionList 
                suggestions={state.suggestions} 
                categories={categories} 
                onSelect={actions.handleSelectSuggestion} 
              />
            )}
          </div>

          <CategorySelector 
            categories={categories} 
            activeCategoryId={state.categoryId} 
            onSelectCategory={actions.setCategoryId} 
          />

          <div className="rounded-[1.25rem] border border-gray-100 bg-gray-50/70 px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">
              在庫単位
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-100 px-4 py-2 shadow-sm">
              <span className="text-sm font-black text-gray-900">個</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">fixed</span>
            </div>
            <p className="mt-3 text-[10px] font-medium text-gray-400 leading-relaxed">
              在庫はすべて個数で管理します。選択するのは価格情報の内容量単位だけです。
            </p>
          </div>

          <PriceSection 
            purchasePrice={state.purchasePrice}
            onPurchasePriceChange={actions.setPurchasePrice}
            contentAmount={state.contentAmount}
            onContentAmountChange={actions.setContentAmount}
            contentUnit={state.contentUnit}
            onUnitPickerOpen={() => actions.setIsUnitPickerOpen(true)}
            unitPrice={actions.getUnitPrice()}
            onStartContentAmountAdjust={actions.startContentAmountAdjust}
            onStopContentAmountAdjust={actions.stopContentAmountAdjust}
          />

          <UnitPicker 
            isOpen={state.isUnitPickerOpen}
            onClose={() => actions.setIsUnitPickerOpen(false)}
            currentUnit={state.contentUnit}
            onSelectUnit={actions.handleSelectContentUnit}
          />

          {showsExpiry && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                賞味期限・期限
              </label>
              <input
                type="date"
                value={state.expiryDate}
                onChange={e => actions.setExpiryDate(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-bold text-gray-900"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              備考・メモ
            </label>
            <div className="relative group/notes">
              <div className="absolute left-6 top-5 text-gray-300 group-focus-within/notes:text-violet-500 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <textarea
                value={state.notes}
                onChange={e => actions.setNotes(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-medium text-gray-900 min-h-[100px] resize-none"
                placeholder="例: Aメーカーのもの、特大パックなど"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 lg:gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                {editItem ? '現在庫数' : '初期在庫数'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={state.stock}
                  onChange={e => actions.setStock(e.target.value)}
                  className="w-full px-5 pr-16 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-2xl font-mono font-bold text-gray-900"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onPointerDown={() => actions.startStockAdjust(1)}
                    onPointerUp={actions.stopStockAdjust}
                    onPointerLeave={actions.stopStockAdjust}
                    onPointerCancel={actions.stopStockAdjust}
                    className="flex h-9 w-11 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200"
                    aria-label="在庫を1増やす"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    type="button"
                    onPointerDown={() => actions.startStockAdjust(-1)}
                    onPointerUp={actions.stopStockAdjust}
                    onPointerLeave={actions.stopStockAdjust}
                    onPointerCancel={actions.stopStockAdjust}
                    disabled={(parseInt(state.stock) || 0) <= 0}
                    className="flex h-9 w-11 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="在庫を1減らす"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                通知 (在庫)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={state.alertThreshold}
                  onChange={e => actions.setAlertThreshold(e.target.value)}
                  className="w-full px-5 pr-16 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-2xl font-mono font-bold text-rose-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onPointerDown={() => actions.startAlertAdjust(1)}
                    onPointerUp={actions.stopAlertAdjust}
                    onPointerLeave={actions.stopAlertAdjust}
                    onPointerCancel={actions.stopAlertAdjust}
                    className="flex h-9 w-11 items-center justify-center bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
                    aria-label="通知在庫数を1増やす"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    type="button"
                    onPointerDown={() => actions.startAlertAdjust(-1)}
                    onPointerUp={actions.stopAlertAdjust}
                    onPointerLeave={actions.stopAlertAdjust}
                    onPointerCancel={actions.stopAlertAdjust}
                    disabled={(parseInt(state.alertThreshold) || 0) <= 0}
                    className="flex h-9 w-11 items-center justify-center bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="通知在庫数を1減らす"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                通知 (残量%)
              </label>
              <div className="space-y-3 rounded-[1.25rem] border border-gray-100 bg-gray-50/70 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">現在値</span>
                  <span className="text-2xl font-mono font-black text-amber-500">{state.alertThresholdPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={state.alertThresholdPercent}
                  onChange={e => actions.setAlertThresholdPercent(e.target.value)}
                  className="w-full h-3 appearance-none rounded-full bg-gray-200 accent-amber-500"
                  aria-label="通知残量のしきい値"
                />
                <div className="flex justify-between text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 pb-4 sm:pb-0">
            <button
              type="submit"
              className="w-full py-5 px-6 bg-gray-900 text-white text-lg font-black rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-black active:scale-[0.98] transition-all tracking-tight"
            >
              {isDuplicate ? 'Add Item' : editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>

        {state.showUnsavedConfirm && (
          <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center bg-gray-900/45 backdrop-blur-[2px] p-4 sm:p-6">
            <div className="w-full max-w-md rounded-[1.75rem] bg-white border border-amber-100 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.18em] mb-2">Unsaved Changes</p>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-2">保存していない入力があります</h3>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed mb-6">
                名前・価格・期限・メモなど入力中の内容は保存されません。破棄して閉じますか？
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={actions.handleCancelDiscard}
                  className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  編集を続ける
                </button>
                <button
                  type="button"
                  onClick={actions.handleConfirmDiscard}
                  className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all active:scale-95"
                >
                  破棄して閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
