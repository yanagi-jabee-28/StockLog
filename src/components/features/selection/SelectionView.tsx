import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  X, 
  Check, 
  UtensilsCrossed,
  Boxes,
  ClipboardCheck
} from 'lucide-react';
import { InventoryItem, Category } from '../../../types';

interface SelectionViewProps {
  items: InventoryItem[];
  categories: Category[];
  selectedItemIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onCopySelected: () => void;
  onClearSelection: () => void;
}

export function SelectionView({
  items,
  categories,
  selectedItemIds,
  onToggleSelection,
  onCopySelected,
  onClearSelection
}: SelectionViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const activeItems = items.filter(item => !item.isArchived);
  
  const filteredItems = activeItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group items by category
  const groupedItems = categories.map(category => ({
    ...category,
    items: filteredItems.filter(item => item.categoryId === category.id)
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">AI Assistant</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">食材選択</h2>
          <p className="text-xs text-gray-400 font-medium mt-4 max-w-md">
            使いたい食材をチェックして、AIに最適な献立を提案してもらいましょう。
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedItemIds.size > 0 && (
            <button
              onClick={onClearSelection}
              className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-400 px-6 py-4 rounded-2xl font-bold transition-all active:scale-95"
            >
              選択を解除
            </button>
          )}
          <button
            onClick={onCopySelected}
            disabled={selectedItemIds.size === 0}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all active:scale-95 ${
              selectedItemIds.size > 0 
                ? 'bg-gray-900 text-white shadow-gray-200/50 hover:bg-black' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${selectedItemIds.size > 0 ? 'text-violet-400' : ''}`} />
            {selectedItemIds.size > 0 ? `${selectedItemIds.size}件をAI用にコピー` : '食材を選択してください'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="食材を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selection Grid */}
      <div className="flex-1 space-y-12 pb-24">
        {groupedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 mb-6 rounded-3xl bg-gray-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">見つかりませんでした</h3>
            <p className="text-xs text-gray-400 font-medium">別のキーワードで試してみてください。</p>
          </div>
        ) : (
          groupedItems.map(group => (
            <section key={group.id}>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-lg">{group.name.split(' ')[0]}</span>
                <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase">
                  {group.name.split(' ').slice(1).join(' ')}
                </h3>
                <div className="h-px flex-1 bg-gray-50" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.items.map(item => {
                  const isSelected = selectedItemIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onToggleSelection(item.id)}
                      className={`relative group flex items-center gap-4 p-5 rounded-3xl border transition-all text-left ${
                        isSelected 
                          ? 'bg-violet-50 border-violet-500 shadow-xl shadow-violet-100 ring-2 ring-violet-500/10' 
                          : 'bg-white border-gray-100 hover:border-violet-200 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-8 h-8 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-violet-600 border-violet-600 text-white scale-110' 
                          : 'bg-gray-50 border-gray-100 text-transparent'
                      }`}>
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className={`font-black text-sm truncate ${isSelected ? 'text-violet-900' : 'text-gray-900'}`}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {item.stock}{item.unit}
                          </span>
                          {item.isOpened && (
                            <span className="text-[9px] font-black text-amber-500 uppercase">
                              {item.remainingPercent ?? 100}%
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
