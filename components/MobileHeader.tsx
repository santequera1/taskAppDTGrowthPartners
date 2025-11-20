
import React, { useState } from 'react';
import { Project } from '../types';
import { Menu, Plus, ChevronDown, Filter } from 'lucide-react';
import DateFilter, { DateFilterType } from './DateFilter';

interface MobileHeaderProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onOpenSidebar: () => void;
  onNewTask: () => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (filter: DateFilterType) => void;
  counts: { overdue: number; today: number; week: number; total: number; filtered: number };
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenSidebar,
  onNewTask,
  dateFilter,
  onDateFilterChange,
  counts,
}) => {
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [areFiltersVisible, setAreFiltersVisible] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeProjectName = activeProject ? activeProject.name : 'Todos los Proyectos';

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-3 space-y-3 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onOpenSidebar} className="p-2 text-slate-300">
            <Menu size={22} />
          </button>
          <div className="relative">
            <button onClick={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)} className="flex items-center gap-1">
              <span className="font-semibold text-white max-w-[150px] truncate">{activeProjectName}</span>
              <ChevronDown size={16} className={`transition-transform ${isProjectSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProjectSelectorOpen && (
              <div className="absolute top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-30">
                <button onClick={() => { onSelectProject(null); setIsProjectSelectorOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700">Todos los Proyectos</button>
                {projects.map(p => (
                  <button key={p.id} onClick={() => { onSelectProject(p.id); setIsProjectSelectorOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700">{p.name}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={onNewTask} className="p-2 text-white bg-blue-600 rounded-full">
          <Plus size={22} />
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{counts.filtered} de {counts.total} tareas</span>
        <button onClick={() => setAreFiltersVisible(!areFiltersVisible)} className="flex items-center gap-1 p-1 rounded-md bg-slate-800">
            <Filter size={12} />
            <span>Filtros</span>
            <ChevronDown size={14} className={`transition-transform ${areFiltersVisible ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {areFiltersVisible && (
        <div className="overflow-x-auto pb-2 scrollbar-hide">
            <DateFilter 
                activeFilter={dateFilter}
                onFilterChange={onDateFilterChange}
                overdueCount={counts.overdue}
                todayCount={counts.today}
                weekCount={counts.week}
            />
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
