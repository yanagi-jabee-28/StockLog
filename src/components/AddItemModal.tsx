import React, { useCallback, useEffect, useState, useLayoutEffect, useMemo, useRef } from 'react';
import { Category, InventoryItem } from '../types';
import { X, Search, BoxSelect, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { ModalCloseReason, useModalNavigation } from '../hooks/useModalNavigation';
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
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
  const contentAmountRepeatRef = useRef<number | null>(null);
  const contentAmountLongPressRef = useRef<number | null>(null);
  const stockRepeatRef = useRef<number | null>(null);
  const stockLongPressRef = useRef<number | null>(null);
  const alertRepeatRef = useRef<number | null>(null);
  const alertLongPressRef = useRef<number | null>(null);

  const initialFormState = useMemo(() => {
    if (editItem) {
      return {
        name: editItem.name,
        categoryId: editItem.categoryId,
        stock: editItem.stock.toString(),
        unit: '個',
        purchasePrice: editItem.purchasePrice?.toString() || '',
        contentAmount: editItem.contentAmount?.toString() || '',
        contentUnit: editItem.contentUnit || editItem.unit,
        alertThreshold: editItem.alertThreshold.toString(),
        alertThresholdPercent: (editItem.alertThresholdPercent ?? 20).toString(),
        expiryDate: editItem.expiryDate || '',
        notes: editItem.notes || '',
      };
    }

    return {
      name: '',
      categoryId: initialCategory,
      stock: '0',
      unit: '個',
      purchasePrice: '',
      contentAmount: '',
      contentUnit: '個',
      alertThreshold: '1',
      alertThresholdPercent: '20',
      expiryDate: '',
      notes: '',
    };
  }, [editItem, initialCategory]);

  const hasUnsavedChanges =
    name !== initialFormState.name ||
    categoryId !== initialFormState.categoryId ||
    stock !== initialFormState.stock ||
    unit !== initialFormState.unit ||
    purchasePrice !== initialFormState.purchasePrice ||
    contentAmount !== initialFormState.contentAmount ||
    contentUnit !== initialFormState.contentUnit ||
    alertThreshold !== initialFormState.alertThreshold ||
    alertThresholdPercent !== initialFormState.alertThresholdPercent ||
    expiryDate !== initialFormState.expiryDate ||
    notes !== initialFormState.notes;

  const handleRequestClose = useCallback((reason?: ModalCloseReason) => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    // popstate 由来の閉じる操作をキャンセルした時に、
    // 次の戻る操作でもモーダルを先に閉じられるよう履歴を再積み上げする。
    if (reason === 'popstate') {
      window.history.pushState({ modalOpen: true }, '');
    }

    setShowUnsavedConfirm(true);
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmDiscard = () => {
    setShowUnsavedConfirm(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowUnsavedConfirm(false);
  };

  // Handle Escape key and mobile Back gesture
  useModalNavigation(isOpen, handleRequestClose);

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

  const clearStockTimers = () => {
    if (stockLongPressRef.current !== null) {
      window.clearTimeout(stockLongPressRef.current);
      stockLongPressRef.current = null;
    }

    if (stockRepeatRef.current !== null) {
      window.clearInterval(stockRepeatRef.current);
      stockRepeatRef.current = null;
    }
  };

  const clearAlertTimers = () => {
    if (alertLongPressRef.current !== null) {
      window.clearTimeout(alertLongPressRef.current);
      alertLongPressRef.current = null;
    }

    if (alertRepeatRef.current !== null) {
      window.clearInterval(alertRepeatRef.current);
      alertRepeatRef.current = null;
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

  const startStockAdjust = (delta: number) => {
    if (delta < 0 && (parseInt(stock) || 0) <= 0) return;

    clearStockTimers();
    changeStockBy(delta);

    stockLongPressRef.current = window.setTimeout(() => {
      stockRepeatRef.current = window.setInterval(() => {
        changeStockBy(delta);
      }, 120);
    }, 320);
  };

  const stopStockAdjust = () => {
    clearStockTimers();
  };

  const startAlertAdjust = (delta: number) => {
    if (delta < 0 && (parseInt(alertThreshold) || 0) <= 0) return;

    clearAlertTimers();
    changeAlertThresholdBy(delta);

    alertLongPressRef.current = window.setTimeout(() => {
      alertRepeatRef.current = window.setInterval(() => {
        changeAlertThresholdBy(delta);
      }, 120);
    }, 320);
  };

  const stopAlertAdjust = () => {
    clearAlertTimers();
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
        setShowUnsavedConfirm(false);
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
        setShowUnsavedConfirm(false);
      }
    }
  }, [isOpen, initialCategory, editItem]);

  useEffect(() => {
    return () => {
      clearContentAmountTimers();
      clearStockTimers();
      clearAlertTimers();
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
            onClick={() => handleRequestClose()}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

          <div className="space-y-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                価格情報
              </label>
              {getUnitPrice() !== null && (
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider whitespace-nowrap">
                  単価 ¥{getUnitPrice()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
                      <button
                        type="button"
                        onPointerDown={() => startContentAmountAdjust(1)}
                        onPointerUp={stopContentAmountAdjust}
                        onPointerLeave={stopContentAmountAdjust}
                        onPointerCancel={stopContentAmountAdjust}
                        className="flex h-8 w-10 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200"
                        aria-label="内容量を1増やす"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <div className="h-px bg-gray-100" />
                      <button
                        type="button"
                        onPointerDown={() => startContentAmountAdjust(-1)}
                        onPointerUp={stopContentAmountAdjust}
                        onPointerLeave={stopContentAmountAdjust}
                        onPointerCancel={stopContentAmountAdjust}
                        className="flex h-8 w-10 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200"
                        aria-label="内容量を1減らす"
                      >
                        <ChevronDown className="w-4 h-4" />
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
                    className="w-full px-4 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-base sm:text-lg font-bold text-gray-900 shadow-sm min-h-[3.75rem]"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 lg:gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                {editItem ? '現在庫数' : '初期在庫数'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full px-5 pr-16 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-2xl font-mono font-bold text-gray-900"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onPointerDown={() => startStockAdjust(1)}
                    onPointerUp={stopStockAdjust}
                    onPointerLeave={stopStockAdjust}
                    onPointerCancel={stopStockAdjust}
                    className="flex h-9 w-11 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200"
                    aria-label="在庫を1増やす"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    type="button"
                    onPointerDown={() => startStockAdjust(-1)}
                    onPointerUp={stopStockAdjust}
                    onPointerLeave={stopStockAdjust}
                    onPointerCancel={stopStockAdjust}
                    disabled={(parseInt(stock) || 0) <= 0}
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
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(e.target.value)}
                  className="w-full px-5 pr-16 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-2xl font-mono font-bold text-rose-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onPointerDown={() => startAlertAdjust(1)}
                    onPointerUp={stopAlertAdjust}
                    onPointerLeave={stopAlertAdjust}
                    onPointerCancel={stopAlertAdjust}
                    className="flex h-9 w-11 items-center justify-center bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
                    aria-label="通知在庫数を1増やす"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    type="button"
                    onPointerDown={() => startAlertAdjust(-1)}
                    onPointerUp={stopAlertAdjust}
                    onPointerLeave={stopAlertAdjust}
                    onPointerCancel={stopAlertAdjust}
                    disabled={(parseInt(alertThreshold) || 0) <= 0}
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

        {showUnsavedConfirm && (
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
                  onClick={handleCancelDiscard}
                  className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  編集を続ける
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
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
