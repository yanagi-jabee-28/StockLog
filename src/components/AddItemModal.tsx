import React, { useEffect, useState, useLayoutEffect, useMemo, useRef } from 'react';
import { Category, InventoryItem } from '../types';
import { X, Search, BoxSelect, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { useModalNavigation } from '../hooks/useModalNavigation';
import { isExpiryCategoryId } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  items: InventoryItem[];
  onAdd: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  onEdit?: (id: string, updates: Partial<InventoryItem>) => void;
  initialCategory: string;
  editItem?: InventoryItem | null;
  isDuplicate?: boolean;
}

const UNIT_GROUPS = [
  { label: '個数', units: ['個', '枚', '本', 'ペア', 'パック', '袋'] },
  { label: '重量', units: ['g', 'kg'] },
  { label: '容量', units: ['ml', 'L'] },
];

export function AddItemModal({ isOpen, onClose, categories, items, onAdd, onEdit, initialCategory, editItem, isDuplicate }: Props) {
  const [name, setName] = useState('');
  
  // Handle Escape key and mobile Back gesture
  useModalNavigation(isOpen, onClose);

  const [categoryId, setCategoryId] = useState(initialCategory);
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('個');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [contentAmount, setContentAmount] = useState('');
  const [contentUnit, setContentUnit] = useState('個');
  const [alertThreshold, setAlertThreshold] = useState('1');
  const [alertThresholdPercent, setAlertThresholdPercent] = useState('20');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
  const contentAmountRepeatRef = useRef<number | null>(null);
  const contentAmountLongPressRef = useRef<number | null>(null);

  // Derive unique suggestions from existing items
  const suggestions = useMemo(() => {
    if (!name.trim() || name.length < 1) return [];
    
    // Get unique items by name strategy
    const uniqueItemsMap = new Map<string, InventoryItem>();
    items.forEach(item => {
      const lowerName = item.name.toLowerCase();
      if (!uniqueItemsMap.has(lowerName)) {
        uniqueItemsMap.set(lowerName, item);
      }
    });

    return Array.from(uniqueItemsMap.values())
      .filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase()) && 
        item.name.toLowerCase() !== name.toLowerCase()
      )
      .slice(0, 5); // Limit to top 5
  }, [items, name]);

  const handleSelectSuggestion = (suggestion: InventoryItem) => {
    setName(suggestion.name);
    setCategoryId(suggestion.categoryId);
    setUnit('個');
    setContentUnit(suggestion.contentUnit || suggestion.unit);
    setShowSuggestions(false);
  };

  const getUnitPrice = () => {
    const price = parseFloat(purchasePrice);
    const amount = parseFloat(contentAmount);

    if (!Number.isFinite(price) || price <= 0) return null;
    if (!Number.isFinite(amount) || amount <= 0) return price;
    return Math.round((price / amount) * 100) / 100;
  };

  const changeStockBy = (delta: number) => {
    setStock(current => {
      const nextValue = Math.max(0, (parseInt(current) || 0) + delta);
      return nextValue.toString();
    });
  };

  const changeAlertThresholdBy = (delta: number) => {
    setAlertThreshold(current => {
      const nextValue = Math.max(0, (parseInt(current) || 0) + delta);
      return nextValue.toString();
    });
  };

  const clearContentAmountTimers = () => {
    if (contentAmountLongPressRef.current !== null) {
      window.clearTimeout(contentAmountLongPressRef.current);
      contentAmountLongPressRef.current = null;
    }

    if (contentAmountRepeatRef.current !== null) {
      window.clearInterval(contentAmountRepeatRef.current);
      contentAmountRepeatRef.current = null;
    }
  };

  const changeContentAmountBy = (delta: number) => {
    setContentAmount(current => {
      const currentValue = parseFloat(current) || 0;
      const nextValue = Math.max(0, Math.round((currentValue + delta) * 100) / 100);
      return Number.isInteger(nextValue) ? String(nextValue) : nextValue.toString();
    });
  };

  const startContentAmountAdjust = (delta: number) => {
    clearContentAmountTimers();
    changeContentAmountBy(delta);

    contentAmountLongPressRef.current = window.setTimeout(() => {
      contentAmountRepeatRef.current = window.setInterval(() => {
        changeContentAmountBy(delta);
      }, 120);
    }, 320);
  };

  const stopContentAmountAdjust = () => {
    clearContentAmountTimers();
  };

  const handleSelectContentUnit = (selectedUnit: string) => {
    setContentUnit(selectedUnit);
    setIsUnitPickerOpen(false);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      if (editItem) {
        setName(editItem.name);
        setCategoryId(editItem.categoryId);
        setStock(editItem.stock.toString());
        setUnit('個');
        setPurchasePrice(editItem.purchasePrice?.toString() || '');
        setContentAmount(editItem.contentAmount?.toString() || '');
        setContentUnit(editItem.contentUnit || editItem.unit);
        setAlertThreshold(editItem.alertThreshold.toString());
        setAlertThresholdPercent((editItem.alertThresholdPercent ?? 20).toString());
        setExpiryDate(editItem.expiryDate || '');
        setNotes(editItem.notes || '');
      } else {
        setName('');
        setCategoryId(initialCategory);
        setStock('0');
        setUnit('個');
        setPurchasePrice('');
        setContentAmount('');
        setContentUnit('個');
        setAlertThreshold('1');
        setAlertThresholdPercent('20');
        setExpiryDate('');
        setNotes('');
        setIsUnitPickerOpen(false);
      }
    }
  }, [isOpen, initialCategory, editItem]);

  useEffect(() => {
    return () => {
      clearContentAmountTimers();
    };
  }, []);

  if (!isOpen) return null;

  const showsExpiry = isExpiryCategoryId(categoryId);
  const selectedContentUnitGroup = UNIT_GROUPS.find(group => group.units.includes(contentUnit));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      categoryId,
      stock: parseInt(stock) || 0,
      unit: '個',
      purchasePrice: purchasePrice.trim() ? Math.max(0, parseFloat(purchasePrice) || 0) : undefined,
      contentAmount: contentAmount.trim() ? Math.max(0, parseFloat(contentAmount) || 0) : undefined,
      contentUnit: contentAmount.trim() ? (contentUnit.trim() || '個') : undefined,
      pricePerUnit: getUnitPrice() ?? undefined,
      lowestPricePerUnit: getUnitPrice() ?? undefined,
      priceHistory: purchasePrice.trim()
        ? [{
            timestamp: new Date().toISOString(),
            purchasePrice: Math.max(0, parseFloat(purchasePrice) || 0),
            contentAmount: contentAmount.trim() ? Math.max(0, parseFloat(contentAmount) || 0) : undefined,
            contentUnit: contentAmount.trim() ? (contentUnit.trim() || '個') : undefined,
            pricePerUnit: getUnitPrice() ?? 0,
            notes: notes.trim() || undefined,
          }]
        : [],
      alertThreshold: parseInt(alertThreshold) || 0,
      alertThresholdPercent: parseInt(alertThresholdPercent) || 20,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
    };

    if (editItem && onEdit && !isDuplicate) {
      onEdit(editItem.id, data);
    } else {
      onAdd({
        ...data,
        isOpened: false,
        originalItemId: undefined,
        remainingAmount: undefined,
        remainingPercent: undefined,
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-6 transition-all">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {isDuplicate ? 'Add Another Batch' : editItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {isDuplicate ? '別ロット・在庫を追加' : editItem ? 'アイテム情報の編集' : 'アイテムの新規登録'}
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="閉じる"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-200 border border-gray-800 hover:bg-black hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape' && showSuggestions && suggestions.length > 0) {
                    e.stopPropagation();
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click detection
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-bold text-gray-900"
                placeholder="例: トマト水煮缶"
              />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl shadow-gray-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-2">登録済みの商品から入力</p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group/sug"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{suggestion.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {categories.find(c => c.id === suggestion.categoryId)?.name} · {suggestion.unit}
                          {suggestion.contentAmount !== undefined && suggestion.contentUnit ? ` · ${suggestion.contentAmount}${suggestion.contentUnit}` : ''}
                          {suggestion.expiryDate ? ` · 期限 ${suggestion.expiryDate}` : ''}
                        </span>
                      </div>
                      <BoxSelect className="w-4 h-4 text-gray-200 group-hover/sug:text-violet-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              カテゴリ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                    categoryId === cat.id
                      ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200'
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

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

          <div className="space-y-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                価格情報
              </label>
              {getUnitPrice() !== null && (
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider">
                  単価 ¥{getUnitPrice()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                  購入価格
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-xl font-mono font-bold text-gray-900"
                  placeholder="例: 298"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                    内容量
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={contentAmount}
                      onChange={e => setContentAmount(e.target.value)}
                      className="w-full pl-5 pr-14 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-xl font-mono font-bold text-gray-900"
                      placeholder="例: 500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[0.85rem] border border-gray-100 bg-gray-50 shadow-sm">
                      <button
                        type="button"
                        onPointerDown={() => startContentAmountAdjust(1)}
                        onPointerUp={stopContentAmountAdjust}
                        onPointerLeave={stopContentAmountAdjust}
                        onPointerCancel={stopContentAmountAdjust}
                        className="flex h-6 w-9 items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
                        aria-label="内容量を1増やす"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-px bg-gray-100" />
                      <button
                        type="button"
                        onPointerDown={() => startContentAmountAdjust(-1)}
                        onPointerUp={stopContentAmountAdjust}
                        onPointerLeave={stopContentAmountAdjust}
                        onPointerCancel={stopContentAmountAdjust}
                        className="flex h-6 w-9 items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
                        aria-label="内容量を1減らす"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                    単位
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUnitPickerOpen(true)}
                    className="w-full px-4 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-lg font-bold text-gray-900 shadow-sm"
                    aria-label="内容量の単位を選択"
                  >
                    {selectedContentUnitGroup ? `${selectedContentUnitGroup.label} / ${contentUnit}` : contentUnit}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
              購入価格と内容量を入れると、単価を自動で計算します。最安値はこの単価で比較します。
            </p>
          </div>

          {isUnitPickerOpen && (
            <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-sm p-0 sm:p-6">
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] bg-white shadow-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-200">
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">内容量の単位</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">縦にスクロールして選択</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUnitPickerOpen(false)}
                    aria-label="単位選択を閉じる"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-200 border border-gray-800 hover:bg-black hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-[calc(80vh-92px)] overflow-y-auto px-4 py-4">
                  <div className="space-y-4">
                    {UNIT_GROUPS.map(group => (
                      <div key={group.label} className="rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-4">
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-3 ml-1">{group.label}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {group.units.map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => handleSelectContentUnit(u)}
                              className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                                contentUnit === u
                                  ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm'
                                  : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                              }`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showsExpiry && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                賞味期限・期限
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
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
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-medium text-gray-900 min-h-[100px] resize-none"
                placeholder="例: Aメーカーのもの、特大パックなど"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                {editItem ? '現在庫数' : '初期在庫数'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeStockBy(-1)}
                  disabled={(parseInt(stock) || 0) <= 0}
                  className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-white border border-gray-100 text-gray-500 font-black text-xl shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="在庫を1減らす"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-2xl font-mono font-bold text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => changeStockBy(1)}
                  className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-gray-900 text-white font-black text-xl shadow-sm hover:bg-black transition-all"
                  aria-label="在庫を1増やす"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                通知 (在庫)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeAlertThresholdBy(-1)}
                  disabled={(parseInt(alertThreshold) || 0) <= 0}
                  className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-white border border-gray-100 text-rose-400 font-black text-xl shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="通知在庫数を1減らす"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-2xl font-mono font-bold text-rose-500"
                />
                <button
                  type="button"
                  onClick={() => changeAlertThresholdBy(1)}
                  className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-rose-500 text-white font-black text-xl shadow-sm hover:bg-rose-600 transition-all"
                  aria-label="通知在庫数を1増やす"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                通知 (残量%)
              </label>
              <div className="space-y-3 rounded-[1.25rem] border border-gray-100 bg-gray-50/70 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">現在値</span>
                  <span className="text-2xl font-mono font-black text-amber-500">{alertThresholdPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={alertThresholdPercent}
                  onChange={e => setAlertThresholdPercent(e.target.value)}
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
      </div>
    </div>
  );
}
