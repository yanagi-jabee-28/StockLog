import React, { useState } from 'react';
import { Trash2, History, Settings2, Plus, PlusCircle, MinusCircle, BoxSelect, Gauge, CheckCircle, type LucideIcon } from 'lucide-react';
import { ActivityEntry, ActivityType } from '../../../shared/types';
import { ACTIVITY_META } from '../../../constants';
import { useModalNavigation } from '../../../shared/lib/hooks/useModalNavigation';

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  added: Plus,
  stock_up: PlusCircle,
  stock_down: MinusCircle,
  opened: BoxSelect,
  remaining_update: Gauge,
  archived: CheckCircle,
  deleted: Trash2,
  edited: Settings2,
};

const formatJapaneseDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short'
  }).format(date);
};

interface HistoryLogListProps {
  activities: ActivityEntry[];
  deleteActivity: (id: string) => void;
  updateActivity: (id: string, updates: Partial<ActivityEntry>) => void;
  clearActivities: () => void;
}

export function HistoryLogList({
  activities,
  deleteActivity,
  updateActivity,
  clearActivities,
}: HistoryLogListProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{id: string, details: string} | null>(null);

  useModalNavigation(!!editingActivity, () => setEditingActivity(null), 'activity-edit-modal');

  const handleClearActivities = () => {
    clearActivities();
    setShowClearConfirm(false);
  };

  const handleEditActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      updateActivity(editingActivity.id, { details: editingActivity.details });
      setEditingActivity(null);
    }
  };

  const getActivityMeta = (type: ActivityType) => {
    return {
      ...ACTIVITY_META[type],
      Icon: ACTIVITY_ICONS[type],
    };
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {activities.length > 0 && (
        <div className="flex justify-end mb-6">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-5 py-2.5 rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              履歴をすべて消去
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-3">本当に消去しますか？</span>
              <button
                onClick={handleClearActivities}
                className="bg-rose-500 text-white text-[9px] font-black px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors uppercase tracking-widest"
              >
                はい
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-white text-gray-400 text-[9px] font-black px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors uppercase tracking-widest"
              >
                いいえ
              </button>
            </div>
          )}
        </div>
      )}
      
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 mb-6 rounded-3xl bg-gray-50 flex items-center justify-center">
            <History className="w-6 h-6 text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">履歴がありません</h3>
          <p className="text-xs text-gray-400 font-medium">アイテムを操作すると、ここに履歴が残ります。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const meta = getActivityMeta(activity.type);
            return (
            <div key={activity.id} className="relative pl-10 pb-6 group">
              {/* Timeline Line */}
              <div className="absolute left-[18px] top-4 bottom-0 w-px bg-gray-100 group-last:hidden" />
              
              {/* Timeline Dot */}
              <div className="absolute left-0 top-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm z-10 group-hover:scale-110 transition-transform">
                <meta.Icon className={`w-4 h-4 ${meta.iconClassName}`} />
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {formatJapaneseDateTime(activity.timestamp)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingActivity({ id: activity.id, details: activity.details || '' })}
                      className="text-gray-300 hover:text-gray-600 transition-colors p-1"
                      title="編集"
                    >
                      <Settings2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => deleteActivity(activity.id)}
                      className="text-gray-300 hover:text-rose-500 transition-colors p-1"
                      title="削除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md border border-gray-100 uppercase">
                      {meta.label}
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{activity.itemName}</h4>
                <p className="text-xs text-gray-500">{activity.details}</p>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Activity Edit Modal */}
      {editingActivity && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditingActivity(null)}
        >
          <div className="absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">履歴を編集</h3>
            <form onSubmit={handleEditActivitySubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">Details</label>
                <textarea
                  autoFocus
                  value={editingActivity.details}
                  onChange={e => setEditingActivity({ ...editingActivity, details: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all resize-none h-32"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
                >
                  保存する
                </button>
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
