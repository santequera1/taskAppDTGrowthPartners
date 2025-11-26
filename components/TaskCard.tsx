import React from 'react';
import { Task, Priority, TEAM_MEMBERS, Project, TaskStatus, TRACKING_PRESETS } from '../types';
import PomodoroTimer from './PomodoroTimer';
import PomodoroHistory from './PomodoroHistory';
import { GripVertical, Trash2, ArrowRight, Copy, Calendar, Clock, AlertCircle, Check, MessageCircle } from 'lucide-react';
import { formatDate, formatRelativeDate, getDateBadgeColor, isOverdue } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  project?: Project;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onToggleComplete: (id: string, status: TaskStatus) => void;
  onAddComment?: (taskId: string) => void;
  onOpenImageModal?: (imageSrc: string) => void;
  isMobile?: boolean;
  onPomodoroComplete?: (taskId: string, session: import('../types').PomodoroSession) => void;
  onPomodoroUpdate?: (taskId: string, state: { pomodoroStatus?: string; currentPomodoroTime?: number | null }) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, project, onDelete, onEdit, onDuplicate, onToggleComplete, onAddComment, onOpenImageModal, isMobile = false, onPomodoroComplete, onPomodoroUpdate }) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.classList.add('bg-blue-600', 'w-64', 'h-20', 'rounded-lg', 'absolute', '-top-9999px');
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH:
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case Priority.MEDIUM:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case Priority.LOW:
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  const assignee = TEAM_MEMBERS.find((m) => m.name === task.assignee) || TEAM_MEMBERS[0];
  const creator = TEAM_MEMBERS.find((m) => m.name === task.creator) || TEAM_MEMBERS[0];
  const dateBadgeColor = getDateBadgeColor(task.dueDate, task.status);

  // Responsive min-height: mobile compact, sm/desktop larger
  const cardClasses = `w-full group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between items-start min-h-[180px] sm:min-h-[200px] ${isMobile ? 'p-3' : 'p-4 hover:-translate-y-0.5'}`;
  const descriptionClasses = `text-slate-400 leading-relaxed mb-3 ${isMobile ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`;

  return (
    <div
      draggable={!isMobile}
      onDragStart={handleDragStart}
      onClick={() => onEdit(task)}
      className={cardClasses}
    >
      <div className="flex-1 w-full">
        {/* Header: Project & Priority */}
        <div className="flex justify-between items-start mb-2 relative">
          <div className="flex flex-wrap items-center gap-2 pr-14">
            {project && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${project.color} text-white bg-opacity-80`}>
                {project.name}
              </span>
            )}
            {task.type && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                {task.type}
              </span>
            )}
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          <div className="absolute -top-1 -right-1 flex items-center gap-1">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const newStatus = task.status === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
                onToggleComplete(task.id, newStatus);
              }}
              className={`p-1.5 rounded-lg transition-colors z-10 ${
                task.status === TaskStatus.DONE
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700/80'
              }`}
              title={task.status === TaskStatus.DONE ? "Marcar como 'En Progreso'" : "Completar Tarea"}
            >
              <Check size={isMobile ? 12 : 14} />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(task);
              }}
              className="text-slate-500 hover:text-blue-400 hover:bg-slate-700/80 bg-slate-800/50 p-1.5 rounded-lg transition-colors z-10"
              title="Duplicar tarea"
            >
              <Copy size={isMobile ? 12 : 14} />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="text-slate-500 hover:text-red-400 hover:bg-slate-700/80 bg-slate-800/50 p-1.5 rounded-lg transition-colors z-10"
              title="Eliminar tarea"
            >
              <Trash2 size={isMobile ? 12 : 14} />
            </button>
          </div>
        </div>

        <h3 className={`font-semibold text-slate-200 mb-1 pr-4 leading-snug ${isMobile ? 'text-sm' : ''}`}>{task.title}</h3>
        <p className={descriptionClasses}>{task.description}</p>

        {task.images && task.images.length > 0 && (
          <div className="mb-2 flex gap-1 flex-wrap">
            {task.images.slice(0, 3).map((base64, index) => (
              <img
                key={index}
                src={base64}
                alt={`Img ${index + 1}`}
                className="w-12 h-16 object-contain rounded border border-slate-700
                           hover:scale-110 transition-transform cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onOpenImageModal?.(base64);
                }}
              />
            ))}
            {task.images.length > 3 && (
              <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded
                              flex items-center justify-center text-xs text-slate-400">
                +{task.images.length - 3}
              </div>
            )}
          </div>
        )}

        {(task.startDate || task.dueDate) && (
          <div className="mb-3">
            {task.startDate && !isMobile && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Calendar size={12} className="text-slate-500" />
                <span>Creado: {formatDate(task.startDate)}</span>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-start justify-between">
                <div className={`flex items-center gap-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${dateBadgeColor}`}>
                  {task.status !== TaskStatus.DONE && isOverdue(task.dueDate) ? <AlertCircle size={12} /> : <Clock size={12} />}
                  <span>{task.status === TaskStatus.DONE ? 'Completada' : formatRelativeDate(task.dueDate)}</span>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <PomodoroTimer
                      taskId={task.id}
                      initialTimeMs={task.currentPomodoroTime}
                      initialStatus={task.pomodoroStatus as any}
                      onComplete={onPomodoroComplete}
                      onUpdate={onPomodoroUpdate}
                      compact={true}
                    />
                  </div>
                  { (task.totalPomodoros || 0) > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1">{task.totalPomodoros}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center" title={`Creado por: ${creator.name}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white opacity-70 ${creator.color}`}>
              {creator.initials}
            </div>

          </div>
          <ArrowRight size={12} className="text-slate-600" />
          <div className="flex items-center gap-2 bg-slate-800/80 pr-2 rounded-full">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${assignee.color}`} title={`Responsable: ${assignee.name} (${assignee.role})`}>
              {assignee.initials}
            </div>
            {!isMobile && <span className="text-[10px] text-slate-300 leading-none">{assignee.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onAddComment && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAddComment(task.id);
              }}
              className="text-slate-500 hover:text-blue-400 hover:bg-slate-700/80 bg-slate-800/50 p-1.5 rounded-lg transition-colors relative"
              title="Agregar comentario"
            >
              <MessageCircle size={isMobile ? 12 : 14} />
              {(task.comments?.length || 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                  {task.comments!.length}
                </span>
              )}
            </button>
          )}
          {!isMobile && (
            <div className="text-slate-600" title="Arrastrar">
              <GripVertical size={14} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TaskCard;
