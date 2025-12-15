import React, { useState } from 'react';
import { Project, Task, TaskStatus, TEAM_MEMBERS, TeamMemberName } from '../types';
import { Plus, Layers, Pencil, Trash2, PieChart, Archive, GripVertical, PanelLeftClose } from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  tasks: Task[]; // New prop for stats
  deletedTasksCount?: number; // New prop for deleted tasks count
  onSelectProject: (projectId: string | null) => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onReorderProjects?: (projects: Project[]) => void; // New prop for project reordering
  activeAssignee: TeamMemberName | null;
  onSelectAssignee: (assignee: TeamMemberName | null) => void;
  onOpenCompletedTasks?: () => void; // New prop for completed tasks view
  onOpenDeletedTasks?: () => void; // New prop for deleted tasks view
  onToggleCollapse?: () => void; // New prop for sidebar collapse toggle
  isCollapsed?: boolean; // New prop for sidebar collapsed state
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  tasks,
  deletedTasksCount = 0,
  onSelectProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onReorderProjects,
  activeAssignee,
  onSelectAssignee,
  onOpenCompletedTasks,
  onOpenDeletedTasks,
  onToggleCollapse,
  isCollapsed = false
}) => {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sort projects by order
  const sortedProjects = [...projects].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedProject || !onReorderProjects) return;

    const draggedIndex = sortedProjects.findIndex(p => p.id === draggedProject.id);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const newProjects = [...sortedProjects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(dropIndex, 0, removed);

    // Update order values
    const updatedProjects = newProjects.map((project, index) => ({
      ...project,
      order: index
    }));

    onReorderProjects(updatedProjects);
    setDraggedProject(null);
    setDragOverIndex(null);
  };

  // Calculate stats based on the passed tasks
  const totalTasks = tasks.length;
  const todoCount = tasks.filter(t => t.status === TaskStatus.TODO).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;

  return (
    <aside className={`hidden md:flex bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden transition-all duration-400 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-72'
    }`}>
      {/* Header */}
      <div className={`border-b border-slate-800 flex-shrink-0 ${isCollapsed ? 'p-3' : 'p-6'}`}>
        {isCollapsed ? (
          // Mini header - just toggle button
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
              title="Mostrar sidebar"
            >
              <PanelLeftClose size={18} className="rotate-180" />
            </button>
          </div>
        ) : (
          // Full header
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-4">
              {/* Branding */}
              <img
                src="https://dtgrowthpartners.com/assets/DT-GROWTH-LOGO-DYCI6Arf.png"
                alt="DT Growth Partners"
                className="h-12 object-contain self-start"
              />
              <h1 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Seguimiento de Tareas DT
              </h1>
            </div>
            {/* Toggle Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
                title="Ocultar sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {isCollapsed ? (
          // Mini sidebar content - icons only
          <div className="p-2 space-y-4">
            {/* Main navigation icons */}
            <div className="space-y-2">
              <button
                onClick={() => onSelectProject(null)}
                className={`w-full flex justify-center py-3 rounded-lg transition-all ${
                  activeProjectId === null
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title="Todas las Tareas"
              >
                <Layers size={20} />
              </button>

              <button
                onClick={onOpenCompletedTasks || (() => console.log('Completed tasks handler not provided'))}
                className="w-full flex justify-center py-3 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
                title="Historial de Tareas"
              >
                <Archive size={20} />
              </button>

              <button
                onClick={onOpenDeletedTasks || (() => console.log('Deleted tasks handler not provided'))}
                className="w-full flex justify-center py-3 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
                title="Tareas Eliminadas"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Projects icons */}
            <div className="space-y-2">
              {sortedProjects.slice(0, 5).map((project) => {
                const isActive = activeProjectId === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={`w-full flex justify-center py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                    title={project.name}
                  >
                    <div className={`w-3 h-3 rounded-full ${project.color}`} />
                  </button>
                );
              })}
              {sortedProjects.length > 5 && (
                <button
                  onClick={onAddProject}
                  className="w-full flex justify-center py-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800/50 transition-colors"
                  title="Más proyectos..."
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Users icons */}
            <div className="space-y-2">
              {TEAM_MEMBERS.slice(0, 4).map(member => {
                const isActive = activeAssignee === member.name;
                return (
                  <button
                    key={member.name}
                    onClick={() => {
                      if (isActive) {
                        onSelectAssignee(null);
                      } else {
                        onSelectAssignee(member.name);
                      }
                    }}
                    className={`w-full flex justify-center py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                    title={member.name}
                  >
                    <div className={`w-5 h-5 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white`}>
                      {member.initials}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Full sidebar content
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

            {/* Completed Tasks History */}
            <div>
              <button
                onClick={onOpenCompletedTasks || (() => console.log('Completed tasks handler not provided'))}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <Archive size={18} />
                  <span>Historial de Tareas</span>
                </div>
                <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full font-mono">
                  {doneCount}
                </span>
              </button>
            </div>

            {/* Deleted Tasks History */}
            <div>
              <button
                onClick={onOpenDeletedTasks || (() => console.log('Deleted tasks handler not provided'))}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={18} />
                  <span>Tareas Eliminadas</span>
                </div>
                <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full font-mono">
                  {deletedTasksCount}
                </span>
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
                {sortedProjects.map((project, index) => {
                  const isActive = activeProjectId === project.id;
                  const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
                  return (
                    <div
                      key={project.id}
                      className="relative group"
                      draggable
                      onDragStart={(e) => handleDragStart(e, project)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Selection Button */}
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isActive
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        } ${dragOverIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <GripVertical size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                        <div className={`w-2.5 h-2.5 rounded-full ${project.color} flex-shrink-0`} />
                        <span className="truncate flex-1">{project.name}</span>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-700'}`}>
                          {projectTaskCount}
                        </span>
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

            {/* Users / Assignees */}
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuarios</h3>
              </div>

              <div className="space-y-1">
                {TEAM_MEMBERS.map(member => {
                  const memberTasksCount = tasks.filter(t =>
                    t.assignee === member.name &&
                    (!activeProjectId || t.projectId === activeProjectId)
                  ).length;

                  const isActive = activeAssignee === member.name;

                  return (
                    <button
                      key={member.name}
                      onClick={() => {
                        if (isActive) {
                          onSelectAssignee(null);
                        } else {
                          onSelectAssignee(member.name);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white`}>
                            {member.initials}
                          </div>
                          {member.name}
                        </div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-700'}`}>
                          {memberTasksCount}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {activeAssignee && (
                  <button
                    onClick={() => {
                      onSelectAssignee(null);
                      console.log('🧹 Filtro de miembro limpiado');
                    }}
                    className="w-full mt-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Limpiar filtro de miembro
                  </button>
                )}
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

            </div>
          </div>
        )}
      </div>

      <div className={`border-t border-slate-800 flex-shrink-0 text-xs text-slate-600 text-center bg-slate-900 z-10 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        {isCollapsed ? 'v1.3.2' : 'v1.3.2 • DT Growth Partners'}
      </div>
    </aside>
  );
};

export default Sidebar;
