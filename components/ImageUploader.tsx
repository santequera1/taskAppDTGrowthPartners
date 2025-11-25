import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { TaskImage } from '../types';

interface ImageUploaderProps {
  taskId: string;
  images: TaskImage[];
  localImages?: File[];
  onUpload: (file: File) => void;
  onDelete: (imageId: string) => void;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  taskId,
  images,
  localImages = [],
  onUpload,
  onDelete,
  maxImages = 5
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalImages = images.length + localImages.length;

  // Click para seleccionar archivo
  const handleClick = () => {
    if (totalImages >= maxImages) return;
    fileInputRef.current?.click();
  };

  // Cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (totalImages < maxImages) {
        onUpload(file);
      }
    });
  };

  // Drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (totalImages >= maxImages) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/') && totalImages < maxImages) {
        onUpload(file);
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all
          ${dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
          }
          ${totalImages >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={totalImages >= maxImages}
        />
        <Upload className="mx-auto mb-2 text-slate-400" size={24} />
        <p className="text-sm text-slate-400">
          Click o arrastra imágenes aquí
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Ctrl+V para pegar screenshots • Máximo {maxImages}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          {totalImages} / {maxImages} imágenes
        </p>
      </div>

      {/* Image Grid */}
      {(images.length > 0 || localImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map(image => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt={image.fileName}
                className="w-full h-24 object-cover rounded-lg border border-slate-700"
              />
              <button
                onClick={() => onDelete(image.id)}
                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500
                          text-white rounded-full opacity-0 group-hover:opacity-100
                          transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {localImages.map((file, index) => (
            <div key={`temp-${index}`} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-24 object-cover rounded-lg border border-slate-700"
              />
              <button
                onClick={() => onDelete(`temp-${index}`)}
                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500
                          text-white rounded-full opacity-0 group-hover:opacity-100
                          transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
