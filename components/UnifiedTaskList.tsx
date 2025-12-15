import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Project, BoardColumn } from '../types';
import StatusSelector from './StatusSelector';
import { GripVertical, Plus } from 'lucide-react';

interface UnifiedTaskListProps {
  tasks: Task[];
  projects: Project[];
  columns: BoardColumn[];
  onEditTask: (task: Task) => void;
  onToggleComplete: (id: string, status: TaskStatus) => void;
  onAddTask?: () => void;
}

const UnifiedTaskList: React.FC<UnifiedTaskListProps> = ({
  tasks,
  projects,
  columns,
  onEditTask,
  onToggleComplete,
  onAddTask
}) => {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Filter tasks based on status
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter(task => task.status === statusFilter);
  }, [tasks, statusFilter]);

  // Add project info to tasks
  const tasksWithProjects = filteredTasks.map(task => ({
    ...task,
    project: projects.find(p => p.id === task.projectId)
  }));

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const statusFilterOptions = [
    { value: 'all' as const, label: 'Todos', count: tasks.length },
    ...columns.map(column => ({
      value: column.status,
      label: column.name,
      count: tasks.filter(t => t.status === column.status).length
    }))
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Todas las Tareas</h2>

          {/* Status Filters */}
          <div className="flex items-center gap-2">
            {statusFilterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <span>{option.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === option.value
                    ? 'bg-white/20'
                    : 'bg-slate-600'
                }`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Task Button */}
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nueva Tarea
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-700/50">
          {tasksWithProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-slate-500 mb-2">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-400 mb-1">No hay tareas</h3>
              <p className="text-sm text-slate-500">
                {statusFilter === 'all'
                  ? 'Crea tu primera tarea para comenzar'
                  : `No hay tareas ${statusFilterOptions.find(opt => opt.value === statusFilter)?.label.toLowerCase()}`
                }
              </p>
            </div>
          ) : (
            tasksWithProjects.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors border-l-4 border-transparent hover:border-slate-600"
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical size={16} className="text-slate-500" />
                </div>

                {/* Status Selector */}
                <div className="flex-shrink-0">
                  <StatusSelector
                    currentStatus={task.status}
                    onStatusChange={(newStatus) => onToggleComplete(task.id, newStatus)}
                    columns={columns}
                    size="sm"
                  />
                </div>

                {/* Task Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onEditTask(task)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className={`font-medium text-sm ${
                      task.status === 'DONE'
                        ? 'text-slate-500 line-through'
                        : 'text-slate-100 group-hover:text-white'
                    }`}>
                      {task.title}
                    </h3>

                    {/* Project Badge */}
                    {task.project && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${task.project.color} text-white bg-opacity-80`}>
                        {task.project.name}
                      </span>
                    )}

                    {/* Priority Indicator */}
                    {task.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        task.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {task.priority === 'HIGH' ? 'ALTA' :
                         task.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Assignee */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {task.assignee}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                      {task.assignee.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTaskList;