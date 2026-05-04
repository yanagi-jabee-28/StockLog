import React, { useRef } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';

interface ImagePickerProps {
  imageUrl?: string;
  onImageSelect: (base64?: string) => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ imageUrl, onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: 画像のリサイズ処理を入れる（localStorageの制限対策）
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
        画像・写真 (将来用)
      </label>
      
      {imageUrl ? (
        <div className="relative group">
          <img 
            src={imageUrl} 
            alt="Item" 
            className="w-full aspect-video object-cover rounded-[1.5rem] border border-gray-100 shadow-sm"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white rounded-full shadow-lg text-gray-700 hover:scale-110 transition-transform"
              title="写真を変更"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onImageSelect(undefined)}
              className="p-3 bg-rose-500 rounded-full shadow-lg text-white hover:scale-110 transition-transform"
              title="写真を削除"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[2/1] rounded-[1.5rem] border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all flex flex-col items-center justify-center gap-3 text-gray-400 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
            <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-violet-400 transition-colors" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest">タップして写真を追加</span>
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
