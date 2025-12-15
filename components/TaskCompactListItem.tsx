import React from 'react';
import { Task, Project, TaskStatus } from '../types';
import { Check } from 'lucide-react';

interface TaskCompactListItemProps {
  task: Task;
  project?: Project;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onToggleComplete: (id: string, status: TaskStatus) => void;
  onAddComment?: (taskId: string) => void;
  onOpenImageModal?: (imageSrc: string) => void;
}

const TaskCompactListItem: React.FC<TaskCompactListItemProps> = ({
  task,
  project,
  onEdit,
  onToggleComplete
}) => {
  return (
    <div
      onClick={() => onEdit(task)}
      className="group w-full hover:bg-slate-800/30 border-b border-slate-700/30 px-2 py-1.5 transition-colors duration-100 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        {/* Minimal Checkbox */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const newStatus = task.status === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
            onToggleComplete(task.id, newStatus);
          }}
          className={`w-3 h-3 rounded border flex items-center justify-center transition-all duration-100 flex-shrink-0 ${
            task.status === TaskStatus.DONE
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          {task.status === TaskStatus.DONE && <Check size={8} />}
        </button>

        {/* Project Color Indicator */}
        {project && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${project.color}`} />
        )}

        {/* Task Title - Ultra compact */}
        <span className={`text-xs flex-1 truncate ${
          task.status === TaskStatus.DONE
            ? 'text-slate-500 line-through'
            : 'text-slate-200 group-hover:text-slate-100'
        }`}>
          {task.title}
        </span>

        {/* Priority Indicator - Minimal */}
        {task.priority && (
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            task.priority === 'HIGH' ? 'bg-red-400' :
            task.priority === 'MEDIUM' ? 'bg-amber-400' :
            'bg-emerald-400'
          }`} />
        )}
      </div>
    </div>
  );
};

export default TaskCompactListItem;
