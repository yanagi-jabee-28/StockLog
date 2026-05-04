import React from 'react';
import { InventoryItemCard } from '../../../entities/inventory/ui/InventoryItemCard';
import { InventoryItem } from '../../../shared/types';

interface ActiveItemsListProps {
  activeItems: InventoryItem[];
  totalStockByRootId: Map<string, number>;
  activeCategoryId: string;
  incrementStock: (id: string) => void;
  decrementStock: (id: string) => void;
  openItem: (id: string) => void;
  unopenItem: (id: string) => void;
  archiveItem: (id: string) => void;
  updateRemainingAmount: (id: string, amount: string) => void;
  handleDeleteItem: (id: string) => void;
  handleEditItem: (item: InventoryItem) => void;
  handleDuplicateItem: (item: InventoryItem) => void;
}

export function ActiveItemsList({
  activeItems,
  totalStockByRootId,
  activeCategoryId,
  incrementStock,
  decrementStock,
  openItem,
  unopenItem,
  archiveItem,
  updateRemainingAmount,
  handleDeleteItem,
  handleEditItem,
  handleDuplicateItem,
}: ActiveItemsListProps) {
  if (activeItems.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase">Active / 使用中</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeItems.length} items</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {activeItems.map(item => (
          <InventoryItemCard
            key={item.id}
            item={{
              ...item,
              stock: totalStockByRootId.get(item.originalItemId || item.id) ?? item.stock,
              isHistoryView: activeCategoryId === 'history'
            }}
            onIncrement={incrementStock}
            onDecrement={decrementStock}
            onDelete={handleDeleteItem}
            onOpen={openItem}
            onUnopen={unopenItem}
            onDuplicate={handleDuplicateItem}
            onEdit={handleEditItem}
            onArchive={archiveItem}
            onUpdateRemaining={updateRemainingAmount}
          />
        ))}
      </div>
    </section>
  );
}
