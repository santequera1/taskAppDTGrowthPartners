import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BoardColumn } from '../types';

interface AddColumnButtonProps {
  onCreateColumn: (columnData: Omit<BoardColumn, 'id' | 'createdAt'>) => void;
  existingColumnsCount: number;
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

const AddColumnButton: React.FC<AddColumnButtonProps> = ({
  onCreateColumn,
  existingColumnsCount
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(COLUMN_ICONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim()) return;

    const newColumn: Omit<BoardColumn, 'id' | 'createdAt'> = {
      name: columnName.trim(),
      color: selectedColor,
      icon: selectedIcon,
      order: existingColumnsCount,
      isDefault: false,
      status: columnName.trim()
    };

    onCreateColumn(newColumn);

    // Reset form
    setColumnName('');
    setSelectedColor(COLUMN_COLORS[0]);
    setSelectedIcon(COLUMN_ICONS[0]);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setColumnName('');
    setSelectedColor(COLUMN_COLORS[0]);
    setSelectedIcon(COLUMN_ICONS[0]);
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="min-w-[280px] bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="Nombre de la columna"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Color</label>
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
            <label className="block text-xs text-slate-400 mb-2">Ícono</label>
            <div className="flex gap-2 flex-wrap">
              {COLUMN_ICONS.slice(0, 6).map(icon => (
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

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Crear Columna
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="min-w-[280px] bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 rounded-2xl p-6 transition-all duration-200 group cursor-pointer"
    >
      <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-slate-300">
        <div className="w-10 h-10 rounded-full bg-slate-700/50 group-hover:bg-slate-600/50 flex items-center justify-center transition-colors">
          <Plus size={20} />
        </div>
        <span className="text-sm font-medium">Agregar Columna</span>
      </div>
    </button>
  );
};

export default AddColumnButton;