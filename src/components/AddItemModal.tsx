import React, { useState, useEffect } from 'react';
import { Category, InventoryItem } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  onEdit?: (id: string, updates: Partial<InventoryItem>) => void;
  initialCategory: string;
  editItem?: InventoryItem | null;
}

const UNIT_GROUPS = [
  { label: '個数', units: ['個', '枚', '本', 'パック', '袋'] },
  { label: '重量', units: ['g', 'kg'] },
  { label: '容量', units: ['ml', 'L'] },
];

export function AddItemModal({ isOpen, onClose, categories, onAdd, onEdit, initialCategory, editItem }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('個');
  const [alertThreshold, setAlertThreshold] = useState('1');
  const [alertThresholdPercent, setAlertThresholdPercent] = useState('20');

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setName(editItem.name);
        setCategoryId(editItem.categoryId);
        setStock(editItem.stock.toString());
        setUnit(editItem.unit);
        setAlertThreshold(editItem.alertThreshold.toString());
        setAlertThresholdPercent((editItem.alertThresholdPercent ?? 20).toString());
      } else {
        setName('');
        setCategoryId(initialCategory);
        setStock('0');
        setUnit('個');
        setAlertThreshold('1');
        setAlertThresholdPercent('20');
      }
    }
  }, [isOpen, initialCategory, editItem]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      categoryId,
      stock: parseInt(stock) || 0,
      unit: unit.trim() || '個',
      alertThreshold: parseInt(alertThreshold) || 0,
      alertThresholdPercent: parseInt(alertThresholdPercent) || 20,
    };

    if (editItem && onEdit) {
      onEdit(editItem.id, data);
    } else {
      onAdd(data);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-6 transition-all">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {editItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {editItem ? 'アイテム情報の編集' : 'アイテムの新規登録'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              品名
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-bold text-gray-900"
              placeholder="例: トマト水煮缶"
            />
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

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest pl-1">
              単位を選択
            </label>
            <div className="space-y-4">
              {UNIT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-2 ml-1">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.units.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          unit === u 
                            ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                {editItem ? '現在庫数' : '初期在庫数'}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-2xl font-mono font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                通知 (在庫)
              </label>
              <input
                type="number"
                min="0"
                value={alertThreshold}
                onChange={e => setAlertThreshold(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-2xl font-mono font-bold text-rose-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
                通知 (残量%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={alertThresholdPercent}
                onChange={e => setAlertThresholdPercent(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-2xl font-mono font-bold text-amber-500"
              />
            </div>
          </div>

          <div className="pt-6 pb-4 sm:pb-0">
            <button
              type="submit"
              className="w-full py-5 px-6 bg-gray-900 text-white text-lg font-black rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-black active:scale-[0.98] transition-all tracking-tight"
            >
              {editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
