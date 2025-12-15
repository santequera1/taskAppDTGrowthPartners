import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Columns } from 'lucide-react';
import { BoardColumn } from '../types';

interface NewColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, icon: string) => void;
}

const COLUMN_COLORS = [
  'text-blue-400',
  'text-amber-400',
  'text-emerald-400',
  'text-purple-400',
  'text-pink-400',
  'text-indigo-400',
  'text-red-400',
  'text-teal-400',
  'text-orange-400',
  'text-cyan-400'
];

const COLUMN_ICONS = [
  'Circle',
  'Clock',
  'CheckCircle2',
  'Star',
  'Heart',
  'Zap',
  'Target',
  'Flag',
  'Bookmark',
  'Lightbulb'
];

const NewColumnModal: React.FC<NewColumnModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(COLUMN_ICONS[0]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedColor(COLUMN_COLORS[0]);
      setSelectedIcon(COLUMN_ICONS[0]);
    }
  }, [isOpen]);

  // Close on ESC key when open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, selectedColor, selectedIcon);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Columns size={20} className="text-blue-500"/>
            Nueva Columna
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre de la Columna</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: En Revisión"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLUMN_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-white scale-110'
                      : 'border-slate-600 hover:border-slate-400'
                  } ${color.replace('text-', 'bg-')}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Ícono</label>
            <div className="flex gap-2 flex-wrap">
              {COLUMN_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? 'border-white bg-slate-600 scale-105'
                      : 'border-slate-600 hover:border-slate-400 bg-slate-700/50'
                  }`}
                >
                  <span className="text-xs text-white">{icon.charAt(0)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewColumnModal;