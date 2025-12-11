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
      className="group w-full bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/20 hover:border-slate-600/40 rounded-md px-3 py-2.5 transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Zona A: Checkbox - Perfectamente centrado */}
        <div className="flex-shrink-0 self-center">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const newStatus = task.status === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
              onToggleComplete(task.id, newStatus);
            }}
            className={`w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center ${
              task.status === TaskStatus.DONE
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-500 hover:border-slate-400 bg-slate-800/30'
            }`}
          >
            {task.status === TaskStatus.DONE && <Check size={10} />}
          </button>
        </div>

        {/* Zona B: Contenido Principal */}
        <div className="flex-1 min-w-0">
          {/* Título prominente con hasta 2 líneas */}
          <h3 className="font-semibold text-slate-100 text-sm leading-snug mb-1.5 line-clamp-2 break-words">
            {task.title}
          </h3>

          {/* Badges ordenados: Prioridad → Proyecto → Categoría */}
          <div className="flex items-center gap-1.5 mb-2">
            {task.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium border ${
                task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {task.priority === 'HIGH' ? 'ALTA' :
                 task.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
              </span>
            )}

            {project && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border ${project.color} text-white bg-opacity-80 border-opacity-20`}>
                {project.name}
              </span>
            )}

            {task.type && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-slate-700/50 text-slate-300 border border-slate-600/20">
                {task.type}
              </span>
            )}
          </div>

          {/* Descripción opcional con menor peso */}
          {task.description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-1 mb-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Zona C: Metadatos - Fila inferior organizada */}
        <div className="flex-shrink-0 flex items-center gap-3 text-[10px]">
          {/* Fecha con ícono consistente */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${dateBadgeColor} border border-opacity-15`}>
              {task.status !== TaskStatus.DONE && isOverdue(task.dueDate) ?
                <AlertCircle size={10} /> :
                <Clock size={10} />
              }
              <span>{task.status === TaskStatus.DONE ? 'Completada' : formatRelativeDate(task.dueDate)}</span>
            </div>
          )}

          {/* Asignado con avatar compacto */}
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${assignee.color}`}>
              {assignee.initials}
            </div>
            <span className="text-slate-400 font-medium truncate max-w-16">{assignee.name}</span>
          </div>

          {/* Meta-info: comentarios e imágenes */}
          <div className="flex items-center gap-2">
            {onAddComment && (task.comments?.length || 0) > 0 && (
              <div className="flex items-center gap-0.5 text-slate-500">
                <MessageCircle size={10} />
                <span className="font-medium">{task.comments!.length}</span>
              </div>
            )}

            {task.images && task.images.length > 0 && (
              <div className="flex items-center gap-0.5 text-slate-500">
                <span>📎</span>
                <span className="font-medium">{task.images.length}</span>
              </div>
            )}
          </div>

          {/* Drag handle - Solo visible en hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing">
            <GripVertical size={12} className="text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskListItem;