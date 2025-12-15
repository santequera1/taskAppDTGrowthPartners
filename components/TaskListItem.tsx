import React from 'react';
import { Task, Priority, TEAM_MEMBERS, Project, TaskStatus } from '../types';
import { Clock, AlertCircle, Check, MessageCircle, GripVertical } from 'lucide-react';
import { formatRelativeDate, getDateBadgeColor, isOverdue } from '../utils/dateUtils';

interface TaskListItemProps {
  task: Task;
  project?: Project;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onToggleComplete: (id: string, status: TaskStatus) => void;
  onAddComment?: (taskId: string) => void;
  onOpenImageModal?: (imageSrc: string) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  project,
  onDelete,
  onEdit,
  onDuplicate,
  onToggleComplete,
  onAddComment,
  onOpenImageModal
}) => {
  const assignee = TEAM_MEMBERS.find((m) => m.name === task.assignee) || TEAM_MEMBERS[0];
  const creator = TEAM_MEMBERS.find((m) => m.name === task.creator) || TEAM_MEMBERS[0];
  const dateBadgeColor = getDateBadgeColor(task.dueDate, task.status);

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH:
        return 'text-red-400';
      case Priority.MEDIUM:
        return 'text-yellow-400';
      case Priority.LOW:
        return 'text-emerald-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className="group w-full bg-slate-800/10 hover:bg-slate-800/30 border-b border-slate-700/10 hover:border-slate-600/20 px-4 py-3 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start gap-4">
        {/* Zona A: Checkbox */}
        <div className="flex-shrink-0 pt-0.5">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const newStatus = task.status === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
              onToggleComplete(task.id, newStatus);
            }}
            className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
              task.status === TaskStatus.DONE
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'border-slate-600 hover:border-slate-400 bg-slate-800/40 hover:bg-slate-700/40'
            }`}
          >
            {task.status === TaskStatus.DONE && <Check size={12} strokeWidth={3} />}
          </button>
        </div>

        {/* Zona B: Contenido Principal */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Título prominente */}
          <h3 className={`font-semibold text-[15px] leading-snug line-clamp-2 break-words ${
            task.status === TaskStatus.DONE ? 'text-slate-400 line-through' : 'text-slate-50'
          }`}>
            {task.title}
          </h3>

          {/* Metadata Row - Prioridad, Proyecto, Tipo en una línea compacta */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Indicador de prioridad minimalista */}
            {task.priority && (
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  task.priority === 'HIGH' ? 'bg-red-400 shadow-sm shadow-red-400/50' :
                  task.priority === 'MEDIUM' ? 'bg-amber-400 shadow-sm shadow-amber-400/50' :
                  'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                }`} />
                <span className={`text-[11px] font-medium ${
                  task.priority === 'HIGH' ? 'text-red-400/90' :
                  task.priority === 'MEDIUM' ? 'text-amber-400/90' :
                  'text-emerald-400/90'
                }`}>
                  {task.priority === 'HIGH' ? 'Alta' :
                   task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
                </span>
              </div>
            )}

            {/* Separador sutil */}
            {task.priority && (project || task.type) && (
              <div className="w-0.5 h-3 bg-slate-700/30" />
            )}

            {/* Proyecto con color distintivo */}
            {project && (
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${project.color}`} />
                <span className="text-[11px] font-medium text-slate-300">
                  {project.name}
                </span>
              </div>
            )}

            {/* Tipo de tarea */}
            {task.type && (
              <>
                {project && <div className="w-0.5 h-3 bg-slate-700/30" />}
                <span className="text-[11px] font-medium text-slate-400/80">
                  {task.type}
                </span>
              </>
            )}
          </div>

          {/* Descripción sutil */}
          {task.description && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Zona C: Metadata Secundaria (Right Sidebar) */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2.5 pt-0.5">
          {/* Fecha */}
          {task.dueDate && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              task.status === TaskStatus.DONE
                ? 'bg-slate-700/20 text-slate-500'
                : dateBadgeColor.includes('red')
                ? 'bg-red-500/10 text-red-400/90'
                : dateBadgeColor.includes('yellow')
                ? 'bg-amber-500/10 text-amber-400/90'
                : 'bg-slate-700/30 text-slate-400'
            }`}>
              {task.status !== TaskStatus.DONE && isOverdue(task.dueDate) ?
                <AlertCircle size={11} strokeWidth={2.5} /> :
                <Clock size={11} strokeWidth={2.5} />
              }
              <span>{task.status === TaskStatus.DONE ? 'Hecho' : formatRelativeDate(task.dueDate)}</span>
            </div>
          )}

          {/* Avatar y nombre del asignado */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Asignado a</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${assignee.color} shadow-sm`}>
              {assignee.initials}
            </div>
          </div>

          {/* Indicators row: comentarios, imágenes, drag handle */}
          <div className="flex items-center gap-3">
            {onAddComment && (task.comments?.length || 0) > 0 && (
              <div className="flex items-center gap-1 text-slate-500 hover:text-slate-400 transition-colors">
                <MessageCircle size={11} />
                <span className="text-[11px] font-semibold">{task.comments!.length}</span>
              </div>
            )}

            {task.images && task.images.length > 0 && (
              <div className="flex items-center gap-1 text-slate-500 hover:text-slate-400 transition-colors">
                <span className="text-xs">📎</span>
                <span className="text-[11px] font-semibold">{task.images.length}</span>
              </div>
            )}

            {/* Drag handle */}
            <div className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing">
              <GripVertical size={14} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskListItem;
