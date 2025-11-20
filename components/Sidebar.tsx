import React from 'react';
import { Project, Task, TaskStatus, TEAM_MEMBERS } from '../types';
import { Plus, Layers, Pencil, Trash2, PieChart, User } from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  tasks: Task[]; // New prop for stats
  onSelectProject: (projectId: string | null) => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  activeProjectId, 
  tasks,
  onSelectProject, 
  onAddProject,
  onEditProject,
  onDeleteProject
}) => {
  
  // Calculate stats based on the passed tasks
  const totalTasks = tasks.length;
  const todoCount = tasks.filter(t => t.status === TaskStatus.TODO).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;

  // Calculate workload per member
  const workload = TEAM_MEMBERS.map(member => ({
    ...member,
    count: tasks.filter(t => t.assignee === member.name).length
  })).sort((a, b) => b.count - a.count);

  return (
    <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0 overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
         <div className="flex flex-col gap-4">
          {/* Branding */}
          <img 
             src="https://dtgrowthpartners.com/wp-content/uploads/2025/11/LOGO-BLANCO-DTGROWTH.png" 
             alt="DT Growth Partners" 
             className="h-12 object-contain self-start"
          />
          <h1 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Seguimiento de Tareas DT
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-4 space-y-6">
          
          {/* Main View */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Navegación</h3>
            <button
              onClick={() => onSelectProject(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeProjectId === null 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers size={18} />
              Todas las Tareas
            </button>
          </div>

          {/* Projects / Clients */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes / Proyectos</h3>
              <button 
                onClick={onAddProject}
                className="text-slate-500 hover:text-blue-400 transition-colors p-1 rounded hover:bg-slate-800"
                title="Agregar Proyecto"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="space-y-1">
              {projects.map((project) => {
                const isActive = activeProjectId === project.id;
                return (
                  <div key={project.id} className="relative group">
                    {/* Selection Button */}
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${project.color} flex-shrink-0`} />
                      <span className="truncate flex-1 pr-14">{project.name}</span>
                    </button>
                    
                    {/* Action Buttons - High Z-index to ensure clickability */}
                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <button 
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { 
                          e.stopPropagation();
                          e.preventDefault();
                          onEditProject(project); 
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900/80 bg-slate-800/50 rounded-md backdrop-blur-sm transition-colors shadow-sm cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button 
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { 
                          e.stopPropagation();
                          e.preventDefault();
                          onDeleteProject(project.id); 
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900/80 bg-slate-800/50 rounded-md backdrop-blur-sm transition-colors shadow-sm cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dashboard Summary Section */}
          <div className="pt-4 border-t border-slate-800">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <PieChart size={14} /> Resumen del Tablero
             </h3>
             
             <div className="grid grid-cols-2 gap-2 px-1 mb-4">
                <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-800">
                    <span className="text-2xl font-bold text-white block">{totalTasks}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total</span>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <span className="text-2xl font-bold text-emerald-400 block">{doneCount}</span>
                    <span className="text-[10px] text-emerald-400/70 uppercase font-bold">Terminadas</span>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                    <span className="text-lg font-bold text-blue-400 block">{todoCount}</span>
                    <span className="text-[10px] text-blue-400/70 uppercase font-bold">Pendientes</span>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                    <span className="text-lg font-bold text-amber-400 block">{inProgressCount}</span>
                    <span className="text-[10px] text-amber-400/70 uppercase font-bold">En Curso</span>
                </div>
             </div>

             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2 mt-6">
                <User size={14} /> Carga de Trabajo
             </h3>
             <div className="space-y-2 px-1">
                {workload.map(member => (
                   member.count > 0 && (
                    <div key={member.name} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${member.color}`} />
                            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{member.name}</span>
                        </div>
                        <span className="bg-slate-800 text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
                            {member.count}
                        </span>
                    </div>
                   )
                ))}
                {workload.every(m => m.count === 0) && (
                    <p className="text-xs text-slate-600 italic px-2">Sin tareas asignadas</p>
                )}
             </div>
          </div>

        </div>
      </div>
      
      <div className="p-4 border-t border-slate-800 flex-shrink-0 text-xs text-slate-600 text-center bg-slate-900 z-10">
        v1.3.2 • DT Growth Partners
      </div>
    </aside>
  );
};

export default Sidebar;