import React from 'react';
import { InventoryItem } from '../../../shared/types';

interface StockItemsListProps {
  unopenedItems: InventoryItem[];
  unopenedGroups: Array<{ name: string; items: InventoryItem[]; totalStock: number }>;
  incrementStock: (id: string) => void;
  decrementStock: (id: string) => void;
  openItem: (id: string) => void;
  handleEditItem: (item: InventoryItem) => void;
  handleDuplicateItem: (item: InventoryItem) => void;
  handleDeleteItem: (id: string) => void;
}

export function StockItemsList({
  unopenedItems,
  unopenedGroups,
  incrementStock,
  decrementStock,
  openItem,
  handleEditItem,
  handleDuplicateItem,
  handleDeleteItem,
}: StockItemsListProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase">Stock / 未開封在庫</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{unopenedItems.length} items</span>
      </div>
      {unopenedItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 py-14 text-center">
          <p className="text-xs font-bold text-gray-400">このカテゴリの未開封在庫はありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unopenedGroups.map(group => (
            <details key={group.name} className="rounded-3xl border border-gray-100 bg-white shadow-sm open:shadow-md transition-all" open={group.items.length === 1}>
              <summary className="list-none cursor-pointer px-6 py-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-base font-black text-gray-900 truncate">{group.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {group.items.length} ロット / 合計在庫 {group.totalStock}
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  展開
                </span>
              </summary>

              <div className="px-4 pb-4">
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  {group.items.map((item, index) => (
                    <div key={item.id} className={`p-4 ${index !== group.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-800">
                            ロット {index + 1}
                            {item.contentAmount !== undefined && (item.contentUnit || item.unit)
                              ? ` · ${item.contentAmount}${item.contentUnit || item.unit}`
                              : ''}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium mt-1">
                            {item.expiryDate ? `期限 ${item.expiryDate}` : '期限なし'}
                            {item.purchasePrice !== undefined ? ` · ¥${item.purchasePrice.toLocaleString('ja-JP')}` : ''}
                            {item.notes ? ` · ${item.notes}` : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-black text-gray-500 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                            在庫 {item.stock}{item.unit}
                          </span>
                          <button
                            onClick={() => decrementStock(item.id)}
                            disabled={item.stock <= 0}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${item.stock > 0 ? 'bg-white border border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600' : 'bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed'}`}
                          >
                            -1
                          </button>
                          <button
                            onClick={() => incrementStock(item.id)}
                            className="px-3 py-2 rounded-xl text-xs font-black bg-gray-900 text-white hover:bg-black transition-all"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => openItem(item.id)}
                            disabled={item.stock <= 0}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${item.stock > 0 ? 'bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
                            title="このロットから1つ開封"
                          >
                            1つ開封
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDuplicateItem(item)}
                            className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            別ロット追加
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
