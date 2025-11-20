
import React from 'react';
import { X } from 'lucide-react';

export type DateFilterType = 'all' | 'overdue' | 'today' | 'week' | 'month';

interface DateFilterProps {
  activeFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
  overdueCount: number;
  todayCount: number;
  weekCount: number;
}

const DateFilter: React.FC<DateFilterProps> = ({
  activeFilter,
  onFilterChange,
  overdueCount,
  todayCount,
  weekCount,
}) => {
  const filters: { id: DateFilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'overdue', label: 'Vencidas', count: overdueCount },
    { id: 'today', label: 'Hoy', count: todayCount },
    { id: 'week', label: 'Esta Semana', count: weekCount },
    { id: 'month', label: 'Este Mes' },
  ];

  const getButtonClass = (filterId: DateFilterType) => {
    const baseClass = "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5";
    if (activeFilter === filterId) {
      return `${baseClass} bg-blue-600 text-white`;
    }
    return `${baseClass} bg-slate-800 hover:bg-slate-700 text-slate-300`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(({ id, label, count }) => (
        <button key={id} onClick={() => onFilterChange(id)} className={getButtonClass(id)}>
          <span>{label}</span>
          {count !== undefined && count > 0 && (
            <span className="bg-slate-900/50 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </button>
      ))}
      {activeFilter !== 'all' && (
        <button
          onClick={() => onFilterChange('all')}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
          title="Limpiar filtro"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default DateFilter;
