import { useState, useEffect } from 'react';
import { Category, InventoryItem } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  defaultCategoryId: string;
}

const UNIT_GROUPS = [
  { label: '個数', units: ['個', '枚', '本', 'パック', '袋'] },
  { label: '重量', units: ['g', 'kg'] },
  { label: '容量', units: ['ml', 'L'] },
];

export function AddItemModal({ isOpen, onClose, categories, onAdd, defaultCategoryId }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('個');
  const [alertThreshold, setAlertThreshold] = useState('1');

  // Sync categoryId when defaultCategoryId changes (e.g. user switched category before opening modal)
  useEffect(() => {
    if (isOpen) {
      setCategoryId(defaultCategoryId);
    }
  }, [isOpen, defaultCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      categoryId,
      stock: parseInt(stock) || 0,
      unit: unit.trim() || '個',
      alertThreshold: parseInt(alertThreshold) || 0,
    });
    
    // Reset and close
    setName('');
    setStock('0');
    setAlertThreshold('1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:fade-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">新しく追加</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
              品名
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-bold text-gray-900"
              placeholder="例: トマト水煮缶"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
              カテゴリ
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all appearance-none font-bold text-gray-900 pr-10"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">
              単位を選択
            </label>
            <div className="space-y-4">
              {UNIT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.units.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                          unit === u 
                            ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200 scale-[1.02]' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-violet-200 hover:bg-violet-50'
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

          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                初期在庫数
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-center text-2xl font-black text-violet-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                アラート基準
              </label>
              <input
                type="number"
                min="0"
                value={alertThreshold}
                onChange={e => setAlertThreshold(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-center text-2xl font-black text-gray-900"
              />
            </div>
          </div>

          <div className="pt-4 pb-8 sm:pb-0">
            <button
              type="submit"
              className="w-full py-5 px-6 bg-violet-600 text-white text-lg font-black rounded-2xl shadow-xl shadow-violet-200 hover:bg-violet-700 active:scale-[0.97] transition-all tracking-tight"
            >
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
