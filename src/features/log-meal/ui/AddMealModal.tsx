import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, FileText, List, CheckCircle2, AlertCircle } from 'lucide-react';
import { MealLog, InventoryItem, Category, ActivityEntry } from '../../../shared/types';
import { SuggestionList } from '../../../shared/ui/SuggestionList';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mealLog: { date: number; name: string; ingredients: string[]; notes: string }) => void;
  onUpdate: (id: string, mealLog: Partial<MealLog>) => void;
  editMeal?: MealLog | null;
  items: InventoryItem[];
  categories: Category[];
  activities: ActivityEntry[];
  decrementStock: (id: string) => void;
  archiveItem: (id: string) => void;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  editMeal,
  items,
  categories,
  activities,
  decrementStock,
  archiveItem,
}) => {
  const [mealName, setMealName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      if (editMeal) {
        setMealName(editMeal.name);
        setIngredientsText(editMeal.ingredients.join(', '));
        setNotes(editMeal.notes || '');
      } else {
        setMealName('');
        setIngredientsText('');
        setNotes('');
        setSelectedMatchIds(new Set());
      }
    }
  }, [isOpen, editMeal]);

  // Inventory Matching Logic
  const currentIngredients = useMemo(() => {
    return ingredientsText
      .split(/[,\n]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }, [ingredientsText]);

  const matchedItems = useMemo(() => {
    const activeInventory = items.filter(i => !i.isArchived);
    const matches = new Map<string, InventoryItem>();
    
    currentIngredients.forEach(ing => {
      const match = activeInventory.find(item => 
        item.name.toLowerCase() === ing.toLowerCase()
      );
      if (match) matches.set(match.id, match);
    });
    
    return Array.from(matches.values());
  }, [currentIngredients, items]);

  // Update selected matches when matchedItems change
  useEffect(() => {
    if (!editMeal) {
      const next = new Set<string>();
      matchedItems.forEach(item => next.add(item.id));
      setSelectedMatchIds(next);
    }
  }, [matchedItems, editMeal]);

  // Suggestion logic for ingredients
  const currentInput = useMemo(() => {
    const lines = ingredientsText.split(/[,\n]+/);
    return lines[lines.length - 1]?.trim() || '';
  }, [ingredientsText]);

  const suggestions = useMemo(() => {
    if (!currentInput || currentInput.length < 1) return [];
    
    const stats = new Map<string, { count: number }>();
    activities.forEach(a => {
      const lower = a.itemName.toLowerCase();
      stats.set(lower, { count: (stats.get(lower)?.count || 0) + 1 });
    });

    const uniqueItemsMap = new Map<string, InventoryItem>();
    items.forEach(item => {
      const lower = item.name.toLowerCase();
      if (!uniqueItemsMap.has(lower) || (!uniqueItemsMap.get(lower)?.isArchived && item.isArchived)) {
        uniqueItemsMap.set(lower, item);
      }
    });

    return Array.from(uniqueItemsMap.values())
      .filter(item => 
        item.name.toLowerCase().includes(currentInput.toLowerCase()) && 
        item.name.toLowerCase() !== currentInput.toLowerCase()
      )
      .sort((a, b) => (stats.get(b.name.toLowerCase())?.count || 0) - (stats.get(a.name.toLowerCase())?.count || 0))
      .slice(0, 5);
  }, [items, activities, currentInput]);

  const handleSelectSuggestion = (suggestion: InventoryItem) => {
    const lines = ingredientsText.split(/[,\n]+/);
    lines[lines.length - 1] = suggestion.name;
    setIngredientsText(lines.join(', ') + ', ');
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mealName.trim()) {
      alert('料理名を入力してください');
      return;
    }

    const ingredients = currentIngredients;

    if (editMeal) {
      onUpdate(editMeal.id, {
        name: mealName.trim(),
        ingredients,
        notes: notes.trim(),
      });
    } else {
      // Handle Inventory Consumption
      selectedMatchIds.forEach(id => {
        const item = items.find(i => i.id === id);
        if (item) {
          if (item.isOpened) {
            archiveItem(id);
          } else if (item.stock > 0) {
            decrementStock(id);
          }
        }
      });

      onAdd({
        date: Date.now(),
        name: mealName.trim(),
        ingredients,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  const toggleMatchSelection = (id: string) => {
    const next = new Set(selectedMatchIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMatchIds(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-6 transition-all">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-[2rem] font-black text-gray-900 tracking-tight leading-tight">
              {editMeal ? 'Edit Meal' : 'Record Meal'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 leading-relaxed">
              {editMeal ? '献立の編集' : '献立の記録'}
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
          {/* Meal Name */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              料理名
            </label>
            <div className="relative group/input">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-violet-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                autoFocus={!editMeal}
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="例：トマトとわさびのパスタ"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-bold text-gray-900"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              使用食材（カンマ、または改行で区切る）
            </label>
            <div className="relative group/notes">
              <div className="absolute left-6 top-5 text-gray-300 group-focus-within/notes:text-violet-500 transition-colors">
                <List className="w-5 h-5" />
              </div>
              <textarea
                value={ingredientsText}
                onChange={(e) => {
                  setIngredientsText(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="例：トマト, わさび, レモン&#10;または&#10;トマト&#10;わさび&#10;レモン"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-medium text-gray-900 min-h-[120px] resize-none"
              />
            </div>

            {showSuggestions && (
              <SuggestionList 
                suggestions={suggestions} 
                categories={categories} 
                onSelect={handleSelectSuggestion} 
              />
            )}
          </div>

          {/* Inventory Matching Feedback */}
          {!editMeal && matchedItems.length > 0 && (
            <div className="p-5 bg-violet-50/50 border border-violet-100 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Inventory Match</span>
                </div>
                <span className="text-[9px] font-bold text-violet-400 uppercase">記録時に自動消費されます</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matchedItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMatchSelection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-black transition-all ${
                      selectedMatchIds.has(item.id)
                        ? 'bg-white border-violet-200 text-violet-600 shadow-sm'
                        : 'bg-gray-100/50 border-transparent text-gray-400 opacity-60'
                    }`}
                  >
                    {item.name}
                    <span className="opacity-50 font-medium">({item.isOpened ? '使用中' : `在庫${item.stock}`})</span>
                  </button>
                ))}
              </div>
              {selectedMatchIds.size > 0 && (
                <p className="text-[9px] font-medium text-violet-400 pl-1">
                  ※ チェックされたアイテムは「使い切り」または「在庫-1」として処理されます。
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              備考（分量・調理プロトコルなど）
            </label>
            <div className="relative group/notes">
              <div className="absolute left-6 top-5 text-gray-300 group-focus-within/notes:text-violet-500 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例：180ml の水、次回は塩を減らす、想像以上に刺激的な味わい"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-medium text-gray-900 min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 pb-4 sm:pb-0">
            <button
              type="submit"
              className="w-full py-5 px-6 bg-gray-900 text-white text-lg font-black rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-black active:scale-[0.98] transition-all tracking-tight flex items-center justify-center gap-3"
            >
              {editMeal ? '保存する' : '記録する'}
              {!editMeal && selectedMatchIds.size > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px]">
                  在庫消費 {selectedMatchIds.size}件
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
