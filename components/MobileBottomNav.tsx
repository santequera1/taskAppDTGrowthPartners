
import React from 'react';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import { TaskStatus } from '../types';

interface MobileBottomNavProps {
  activeColumn: TaskStatus;
  onColumnChange: (status: TaskStatus) => void;
  counts: Record<TaskStatus, number>;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeColumn, onColumnChange, counts }) => {
  const navItems = [
    { status: 'TODO' as TaskStatus, icon: Circle, label: 'Tareas' },
    { status: 'IN_PROGRESS' as TaskStatus, icon: Clock, label: 'En Curso' },
    { status: 'DONE' as TaskStatus, icon: CheckCircle2, label: 'Terminada' },
  ];

  const getButtonClass = (status: TaskStatus) => {
    const baseClass = "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all duration-200";
    if (activeColumn === status) {
      return `${baseClass} bg-blue-600/20 text-blue-400 scale-105`;
    }
    return `${baseClass} text-slate-400 hover:bg-slate-800`;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 p-2 flex items-center gap-2 z-20" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      {navItems.map(({ status, icon: Icon, label }) => (
        <button key={status} onClick={() => onColumnChange(status)} className={getButtonClass(status)}>
          <div className="relative">
            <Icon size={20} />
            {counts[status] > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {counts[status]}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
