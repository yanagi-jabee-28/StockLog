import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle2, AlertCircle, RefreshCw, Github, Copy, Clipboard } from 'lucide-react';
import { inventoryRepository } from '../../../entities/inventory/api/LocalStorageInventoryRepository';
import { useModalNavigation } from '../../../shared/lib/hooks/useModalNavigation';
import { logError } from '../../../shared/lib/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
}

export function SettingsModal({ isOpen, onClose, onDataImported }: Props) {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error' | 'copied'>('idle');
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Handle Escape key and mobile Back gesture
  useModalNavigation(isOpen, () => onClose(), 'settings-modal');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = inventoryRepository.exportData();
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

  const handleCopyToClipboard = async () => {
    const data = inventoryRepository.exportData();
    try {
      await navigator.clipboard.writeText(data);
      setImportStatus('copied');
      setTimeout(() => setImportStatus('idle'), 2000);
    } catch (err) {
      logError('Copy to clipboard failed:', err);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const success = inventoryRepository.importData(text);
      if (success) {
        setImportStatus('success');
        onDataImported();
      } else {
        setImportStatus('error');
      }
      setTimeout(() => setImportStatus('idle'), 2000);
    } catch (err) {
      logError('Paste from clipboard failed:', err);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = inventoryRepository.importData(content);
      
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
    inventoryRepository.resetToDefaults();
    onDataImported();
    setImportStatus('success');
    setShowResetConfirm(false);
    setTimeout(() => setImportStatus('idle'), 2000);
  };

  const handleBrowserRecovery = async () => {
    if (isRecovering) return;

    setIsRecovering(true);
    try {
      const backup = inventoryRepository.exportData();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stocklog_recovery_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      inventoryRepository.repairData();

      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      onDataImported();

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('_recovery', Date.now().toString());
      window.location.replace(nextUrl.toString());
    } catch (error) {
      logError('Browser recovery failed:', error);
      setImportStatus('error');
      setIsRecovering(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">管理とバックアップ</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="閉じる"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-200 border border-gray-800 hover:bg-black hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Export Section */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] pl-1">
              Data Backup
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExport}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 uppercase">JSON Export</span>
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                    <Copy className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 uppercase">Copy JSON</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef}
                  onChange={handleImport}
                  className="hidden"
                  id="import-file-settings"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 uppercase">JSON Import</span>
                </button>
                <button
                  onClick={handlePasteFromClipboard}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                    <Clipboard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 uppercase">Paste JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] pl-1">
              Maintenance
            </label>
            {!showResetConfirm ? (
              <div className="space-y-2">
                <button
                  onClick={handleBrowserRecovery}
                  disabled={isRecovering}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
                  {isRecovering ? 'Recovering Browser State...' : 'ブラウザ復旧モード'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset All Data
                </button>
                <p className="text-[10px] text-gray-400 font-semibold leading-relaxed px-1">
                  復旧モードはバックアップを書き出した後、破損データ修復・キャッシュ削除・再読み込みを実行します。
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2 bg-rose-50 rounded-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black text-rose-600 text-center uppercase tracking-widest py-2">
                  本当にリセットしますか？
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-rose-500 text-white text-[10px] font-black py-3 rounded-xl hover:bg-rose-600 transition-colors uppercase tracking-widest"
                  >
                    はい
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 bg-white text-gray-400 text-[10px] font-black py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors uppercase tracking-widest"
                  >
                    いいえ
                  </button>
                </div>
              </div>
            )}
            
            {/* Status Messages */}
            {importStatus === 'success' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>SUCCESS!</span>
              </div>
            )}
            {importStatus === 'copied' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-violet-600 bg-violet-50 py-3 rounded-xl border border-violet-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>COPIED TO CLIPBOARD</span>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-rose-600 bg-rose-50 py-3 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                <span>INVALID DATA</span>
              </div>
            )}
          </div>

          {/* Social/Build Section */}
          <div className="pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-4 bg-gray-100" />
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Links</p>
              <div className="h-[1px] w-4 bg-gray-100" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <a 
                href="https://github.com/yanagi-jabee-28/StockLog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-[10px] font-black shadow-lg shadow-gray-200 hover:bg-black transition-all"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub Repository
              </a>
              <a 
                href="https://ai.studio/apps/cf93f8bf-7fd1-41ca-9a7c-e8395e8891e8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-black hover:bg-gray-200 transition-all"
              >
                Google AI Studio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
