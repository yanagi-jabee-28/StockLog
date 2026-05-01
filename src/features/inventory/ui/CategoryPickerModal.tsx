import React from 'react';
import { Category } from '../../../shared/types';

interface CategoryPickerModalProps {
  isOpen: boolean;
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onClose: () => void;
}

export function CategoryPickerModal({
  isOpen,
  categories,
  activeCategoryId,
  onSelectCategory,
  onClose,
}: CategoryPickerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-end md:items-center justify-center bg-black/45 backdrop-blur-sm p-0 md:p-6">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-10 w-full md:max-w-3xl rounded-t-[2rem] md:rounded-[2rem] bg-white shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">カテゴリ一覧</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">タップで切り替え</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-black"
            aria-label="カテゴリ一覧を閉じる"
          >
            ×
          </button>
        </div>

        <div className="px-4 md:px-6 pt-4 pb-6 max-h-[72vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onSelectCategory(category.id);
                  onClose();
                }}
                className={`min-h-12 md:min-h-14 rounded-2xl border px-3 py-2.5 text-left text-[11px] md:text-xs font-bold leading-tight transition-all ${
                  activeCategoryId === category.id
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-gray-700'
                }`}
                title={category.name}
              >
                <span className="block truncate">{category.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onSelectCategory('history');
                onClose();
              }}
              className={`min-h-12 md:min-h-14 rounded-2xl border px-3 py-2.5 text-left text-[11px] md:text-xs font-bold leading-tight transition-all ${
                activeCategoryId === 'history'
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              History Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}