import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskImage } from '../types';

interface ImageLightboxProps {
  images: TaskImage[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onPrevious,
  onNext
}) => {
  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 
                   text-white rounded-lg z-10"
      >
        <X size={24} />
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 
                     text-white rounded-lg z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <img
        src={currentImage.url}
        alt={currentImage.fileName}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 
                     text-white rounded-lg z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                      px-4 py-2 bg-white/10 text-white rounded-lg text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

export default ImageLightbox;
