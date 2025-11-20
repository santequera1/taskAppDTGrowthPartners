
import React from 'react';
import { Project } from '../types';
import { X, Plus, Edit, Trash2 } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  taskCounts: { [key: string]: number };
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  taskCounts
}) => {
  if (!isOpen) return null;

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative w-[85%] max-w-[320px] h-full bg-slate-900 border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-300">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Proyectos</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-2 space-y-1">
            <button onClick={onAddProject} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-slate-800 rounded-md">
                <Plus size={16} />
                <span>Nuevo Proyecto</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button 
            onClick={() => { onSelectProject(null); onClose(); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md flex justify-between items-center ${!activeProjectId ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800'}`}
          >
            <span>Todos los Proyectos</span>
            <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">{totalTasks}</span>
          </button>
          {projects.map(p => (
            <div key={p.id} className={`group w-full text-left px-3 py-2 text-sm rounded-md flex justify-between items-center ${activeProjectId === p.id ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800'}`}>
              <span onClick={() => { onSelectProject(p.id); onClose(); }} className="flex-1 truncate">{p.name}</span>
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full mr-2">{taskCounts[p.id] || 0}</span>
              <button onClick={() => onEditProject(p)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white">
                <Edit size={14} />
              </button>
              <button onClick={() => onDeleteProject(p.id)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
