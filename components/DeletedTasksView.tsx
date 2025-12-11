import React, { useState } from 'react';
import { Task, Project, TEAM_MEMBERS, TeamMemberName, Priority, TaskStatus } from '../types';
import { Trash2, Circle, Search, X, Filter, Archive, ArchiveRestore, Clock } from 'lucide-react';

interface DeletedTasksViewProps {
  tasks: Task[];
  projects: Project[];
  onRestoreTask: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
  onClose: () => void;
}

const DeletedTasksView: React.FC<DeletedTasksViewProps> = ({
  tasks,
  projects,
  onRestoreTask,
  onPermanentDelete,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<TeamMemberName | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'week' | 'month' | 'older'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ESC key handler
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Click outside handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Filter and search tasks
  const filteredTasks = tasks
    .filter(task => {
      // Only show tasks that are actually deleted
      const isDeletedTask = task.deletedAt !== undefined;

      if (!isDeletedTask) {
        return false;
      }

      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Project filter
      const matchesProject = filterProject ? task.projectId === filterProject : true;

      // Assignee filter
      const matchesAssignee = filterAssignee ? task.assignee === filterAssignee : true;

      // Priority filter
      const matchesPriority = filterPriority ? task.priority === filterPriority : true;

      // Date filter - use deletedAt if available, otherwise fall back to dueDate or createdAt
      const taskDeletionDate = task.deletedAt || task.dueDate || task.createdAt;
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      let matchesDate = true;
      if (filterDateRange === 'week') {
        matchesDate = taskDeletionDate >= oneWeekAgo;
      } else if (filterDateRange === 'month') {
        matchesDate = taskDeletionDate >= oneMonthAgo && taskDeletionDate < oneWeekAgo;
      } else if (filterDateRange === 'older') {
        matchesDate = taskDeletionDate < oneMonthAgo;
      }

      return matchesSearch && matchesProject && matchesAssignee && matchesPriority && matchesDate;
    })
    .sort((a, b) => (b.deletedAt || b.dueDate || b.createdAt) - (a.deletedAt || a.dueDate || a.createdAt));

  // Group tasks by project
  const tasksByProject = projects.reduce((acc, project) => {
    const projectTasks = filteredTasks.filter(task => task.projectId === project.id);
    if (projectTasks.length > 0) {
      acc.push({
        project,
        tasks: projectTasks
      });
    }
    return acc;
  }, [] as { project: Project; tasks: Task[] }[]);

  // Tasks without project
  const tasksWithoutProject = filteredTasks.filter(task => !projects.some(p => p.id === task.projectId));

  if (tasksWithoutProject.length > 0) {
    tasksByProject.push({
      project: { id: 'no-project', name: 'Sin Proyecto', color: 'bg-slate-500' },
      tasks: tasksWithoutProject
    });
  }

  // Stats
  const totalDeleted = tasks.length;
  const totalFiltered = filteredTasks.length;

  // Calculate metrics using deletedAt if available
  const deletedThisWeek = tasks.filter(task => {
    const isDeleted = task.deletedAt !== undefined;
    if (!isDeleted) return false;

    const taskDate = task.deletedAt || task.dueDate || task.createdAt;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return taskDate >= oneWeekAgo;
  }).length;

  const deletedThisMonth = tasks.filter(task => {
    const isDeleted = task.deletedAt !== undefined;
    if (!isDeleted) return false;

    const taskDate = task.deletedAt || task.dueDate || task.createdAt;
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return taskDate >= oneMonthAgo;
  }).length;

  const deletedByProject = projects.map(project => {
    const count = tasks.filter(task => task.deletedAt !== undefined && task.projectId === project.id).length;
    return { projectId: project.id, projectName: project.name, count };
  });

  const deletedByAssignee = TEAM_MEMBERS.map(member => {
    const count = tasks.filter(task => task.deletedAt !== undefined && task.assignee === member.name).length;
    return { assignee: member.name, count };
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Trash2 className="text-red-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Tareas Eliminadas</h2>
            <span className="bg-slate-700 text-xs px-2 py-1 rounded-full font-mono">
              {totalFiltered} / {totalDeleted} tareas
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-slate-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800/40 rounded-lg p-3">
              <span className="text-2xl font-bold text-white block">{totalDeleted}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Eliminadas</span>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <span className="text-2xl font-bold text-red-400 block">{deletedThisWeek}</span>
              <span className="text-[10px] text-red-400/70 uppercase font-bold">Esta Semana</span>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <span className="text-2xl font-bold text-blue-400 block">{tasksByProject.length}</span>
              <span className="text-[10px] text-blue-400/70 uppercase font-bold">Proyectos</span>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="p-4 border-b border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
              <span className="text-xl font-bold text-purple-400 block">{deletedThisMonth}</span>
              <span className="text-[10px] text-purple-400/70 uppercase font-bold">Este Mes</span>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
              <span className="text-xl font-bold text-orange-400 block">{deletedByProject.reduce((sum, item) => sum + item.count, 0)}</span>
              <span className="text-[10px] text-orange-400/70 uppercase font-bold">Con Proyecto</span>
            </div>
            <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
              <span className="text-xl font-bold text-pink-400 block">{deletedByAssignee.reduce((sum, item) => sum + item.count, 0)}</span>
              <span className="text-[10px] text-pink-400/70 uppercase font-bold">Asignadas</span>
            </div>
            <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20">
              <span className="text-xl font-bold text-indigo-400 block">{tasksWithoutProject.length}</span>
              <span className="text-[10px] text-indigo-400/70 uppercase font-bold">Sin Proyecto</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar tareas eliminadas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            title="Filtros"
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Filter */}
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Proyecto</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={filterProject || ''}
                  onChange={(e) => setFilterProject(e.target.value || null)}
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Prioridad</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={filterPriority || ''}
                  onChange={(e) => setFilterPriority(e.target.value as Priority || null)}
                >
                  <option value="">Todas las prioridades</option>
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Asignado a</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={filterAssignee || ''}
                  onChange={(e) => setFilterAssignee(e.target.value as TeamMemberName || null)}
                >
                  <option value="">Todos los miembros</option>
                  {TEAM_MEMBERS.map(member => (
                    <option key={member.name} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Periodo</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value as 'all' | 'week' | 'month' | 'older')}
                >
                  <option value="all">Todos</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                  <option value="older">Más antiguos</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {filterProject || filterAssignee || filterPriority || filterDateRange !== 'all' ? (
              <button
                onClick={() => {
                  setFilterProject(null);
                  setFilterAssignee(null);
                  setFilterPriority(null);
                  setFilterDateRange('all');
                }}
                className="mt-3 text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
              >
                <X size={14} /> Limpiar filtros
              </button>
            ) : null}
          </div>
        )}

        {/* Tasks Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Trash2 className="text-slate-600 mb-4" size={48} />
              <p className="text-slate-500 text-center">
                {searchQuery || filterProject || filterAssignee || filterPriority || filterDateRange !== 'all'
                  ? 'No se encontraron tareas con los filtros actuales'
                  : 'No hay tareas eliminadas aún'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tasksByProject.map(({ project, tasks }) => (
                <div key={project.id} className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className={`w-3 h-3 rounded-full ${project.color}`} />
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      {project.name} ({tasks.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Trash2 className="text-red-400" size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-200 truncate">{task.title}</h4>
                                {task.priority && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    task.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                    task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {task.priority === 'HIGH' ? 'ALTA' :
                                     task.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  onClick={() => onRestoreTask(task.id)}
                                  className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-700 transition-colors"
                                  title="Restaurar tarea"
                                >
                                  <ArchiveRestore size={16} />
                                </button>
                                <button
                                  onClick={() => onPermanentDelete(task.id)}
                                  className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-700 transition-colors"
                                  title="Eliminar permanentemente"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-sm text-slate-400 mb-2 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1 text-slate-500">
                                <Circle size={12} className="text-blue-400" />
                                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                              </div>
                              {task.deletedAt && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Trash2 size={12} className="text-red-400" />
                                  <span>Eliminada: {new Date(task.deletedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Clock size={12} className="text-blue-400" />
                                  <span>Vencimiento: {new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <div className={`w-5 h-5 rounded-full ${TEAM_MEMBERS.find(m => m.name === task.assignee)?.color || 'bg-slate-500'} flex items-center justify-center`}>
                                  <span className="text-[8px] font-bold text-white">
                                    {task.assignee.substring(0, 2)}
                                  </span>
                                </div>
                                <span className="text-slate-400">{task.assignee}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-800/30">
          <p className="text-xs text-slate-500">
            Mostrando {totalFiltered} de {totalDeleted} tareas eliminadas
          </p>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletedTasksView;