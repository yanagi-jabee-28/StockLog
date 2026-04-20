import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { storage, DEFAULT_CATEGORIES } from '../lib/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
}

export function SettingsModal({ isOpen, onClose, onDataImported }: Props) {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stocklog_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importData(content);
      
      if (success) {
        setImportStatus('success');
        onDataImported();
        setTimeout(() => {
          setImportStatus('idle');
        }, 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => {
          setImportStatus('idle');
        }, 3000);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('全てのアイテムとカテゴリ設定をリセットし、初期状態（新しいカテゴリ体系）に戻しますか？')) {
      localStorage.clear(); // Clear all
      storage.setCategories(DEFAULT_CATEGORIES);
      onDataImported();
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">設定・管理</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Section */}
          <div className="group">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Backup
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-100 rounded-2xl transition-all text-gray-800 font-bold group-hover:shadow-md group-hover:shadow-violet-100/50"
              >
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                  <Download className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-gray-900">エクスポート</span>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">JSON形式で保存</span>
                </div>
              </button>
            </div>
          </div>

          {/* Import/Reset Section */}
          <div className="group">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Restore & Tools
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-fuchsia-50 border border-gray-100 hover:border-fuchsia-100 rounded-2xl transition-all text-gray-800 font-bold group-hover:shadow-md group-hover:shadow-fuchsia-100/50"
              >
                <div className="w-12 h-12 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-gray-900">インポート</span>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">ファイルから復元する</span>
                </div>
              </button>

              <button
                onClick={handleReset}
                className="w-full flex items-center gap-4 px-5 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                カテゴリを初期状態にリセット
              </button>
            </div>
            
            {/* Status Messages */}
            {importStatus === 'success' && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 slide-in-from-top-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5" />
                <span>完了しました</span>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-rose-700 bg-rose-50 px-4 py-3 rounded-xl border border-rose-200 slide-in-from-top-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5" />
                <span>無効なファイル形式です</span>
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="pt-4 border-t border-gray-50 flex flex-col items-center gap-3">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Build with</p>
            <a 
              href="https://ai.studio/apps/cf93f8bf-7fd1-41ca-9a7c-e8395e8891e8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-2 bg-violet-50 text-violet-600 rounded-full text-xs font-black shadow-sm hover:bg-violet-100 transition-all border border-violet-100"
            >
              Google AI Studio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
