import React, { useState } from 'react';
import { X, Search, FileText, List } from 'lucide-react';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mealLog: { date: number; name: string; ingredients: string[]; notes: string }) => void;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [mealName, setMealName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mealName.trim()) {
      alert('料理名を入力してください');
      return;
    }

    // Parse ingredients by comma or newline
    const ingredients = ingredientsText
      .split(/[,\n]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    onAdd({
      date: Date.now(),
      name: mealName.trim(),
      ingredients,
      notes: notes.trim(),
    });

    // Reset form
    setMealName('');
    setIngredientsText('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-6 transition-all">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-[2rem] font-black text-gray-900 tracking-tight leading-tight">
              Record Meal
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 leading-relaxed">
              献立の記録
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
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="例：トマトとわさびのパスタ"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-bold text-gray-900"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              使用食材（カンマ、または改行で区切る）
            </label>
            <div className="relative group/notes">
              <div className="absolute left-6 top-5 text-gray-300 group-focus-within/notes:text-violet-500 transition-colors">
                <List className="w-5 h-5" />
              </div>
              <textarea
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="例：トマト, わさび, レモン&#10;または&#10;トマト&#10;わさび&#10;レモン"
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all font-medium text-gray-900 min-h-[120px] resize-none"
              />
            </div>
          </div>

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
              className="w-full py-5 px-6 bg-gray-900 text-white text-lg font-black rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-black active:scale-[0.98] transition-all tracking-tight"
            >
              記録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
