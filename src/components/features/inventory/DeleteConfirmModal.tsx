import React from 'react';
import { InventoryItem } from '../../../types';

interface DeleteConfirmState {
  item: InventoryItem;
  linkedOpenedCount: number;
}

interface DeleteConfirmModalProps {
  deleteConfirmState: DeleteConfirmState | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  deleteConfirmState,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!deleteConfirmState) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div
        className="relative z-10 bg-white rounded-t-[2rem] sm:rounded-3xl p-7 sm:p-8 w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.18em] mb-2">Delete Confirmation</p>
        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3">削除してもよろしいですか？</h3>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 mb-6">
          <p className="text-sm font-bold text-rose-700 leading-relaxed">
            {deleteConfirmState.item.isOpened
              ? `開封中アイテム「${deleteConfirmState.item.name}」を削除します。`
              : deleteConfirmState.linkedOpenedCount > 0
                ? `ロット「${deleteConfirmState.item.name}」を削除します。紐付く開封中 ${deleteConfirmState.linkedOpenedCount} 件も同時に削除されます。`
                : `ロット「${deleteConfirmState.item.name}」を削除します。`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all active:scale-95"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}