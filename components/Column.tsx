import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';
import TaskListItem from './TaskListItem';
import TaskCompactListItem from './TaskCompactListItem';
import { Plus, Trash2 } from 'lucide-react';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  viewMode: 'card' | 'list' | 'compact' | 'unified';
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onAddTask?: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onToggleComplete: (id: string, status: TaskStatus) => void;
  onAddComment?: (taskId: string) => void;
  onOpenImageModal?: (imageSrc: string) => void;
  icon: React.ReactNode;
  colorClass: string;
  isMobile?: boolean;
  onPomodoroComplete?: (taskId: string, session: import('../types').PomodoroSession) => void;
  onPomodoroUpdate?: (taskId: string, state: { pomodoroStatus?: string; currentPomodoroTime?: number | null }) => void;
  className?: string;
  isDefault?: boolean;
  onDeleteColumn?: () => void;
}

const Column: React.FC<ColumnProps> = ({
  title,
  status,
  tasks,
  viewMode,
  onDropTask,
  onDeleteTask,
  onAddTask,
  onEditTask,
  onDuplicateTask,
  onToggleComplete,
  onAddComment,
  onOpenImageModal,
  icon,
  colorClass,
  isMobile = false,
  onPomodoroComplete, onPomodoroUpdate,
  className = '',
  isDefault = false,
  onDeleteColumn
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return;
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    if (isMobile) return;
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMobile) return;
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  // Fluid width for desktop grid layout, fixed width for mobile
  const columnClasses = isMobile
    ? `w-full flex flex-col h-full ${className}`
    : `w-full min-w-[280px] flex flex-col h-full rounded-2xl transition-all duration-300 ${isOver ? 'bg-slate-800/80 ring-2 ring-blue-500/30' : 'bg-slate-900/50'} ${className}`;

  const headerClasses = isMobile
    ? 'p-2 flex items-center justify-between'
    : `p-4 border-b border-slate-800 flex items-center justify-between rounded-t-2xl ${isOver ? 'bg-slate-800' : ''}`;

  return (
    <div 
      className={columnClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={headerClasses}>
        <div className="flex items-center gap-3">
          {!isMobile && (
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: colorClass.replace('text-', '') }) : icon}
            </div>
          )}
          <div className="flex flex-col">
             <h2 className="font-bold text-slate-200">{title}</h2>
             <span className="text-xs text-slate-500 font-medium">{tasks.length} tasks</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onAddTask && !isMobile && (
            <button
              onClick={() => onAddTask(status)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Plus size={20} />
            </button>
          )}
          {onDeleteColumn && !isDefault && !isMobile && (
            <button
              onClick={onDeleteColumn}
              className="p-1.5 hover:bg-red-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className={`flex-1 overflow-y-auto min-h-[200px] custom-scrollbar ${isMobile ? 'p-1' : 'p-3'}`}>
        <div className={`flex flex-col ${isMobile ? 'gap-3' : viewMode === 'compact' ? 'gap-0' : 'gap-4'}`}>
          {tasks.map((task) => (
            viewMode === 'card' ? (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onDuplicate={onDuplicateTask}
                onToggleComplete={onToggleComplete}
                onAddComment={onAddComment}
                onOpenImageModal={onOpenImageModal}
                project={(task as any).project}
                isMobile={isMobile}
                onPomodoroComplete={onPomodoroComplete}
                onPomodoroUpdate={onPomodoroUpdate}
              />
            ) : viewMode === 'list' ? (
              <TaskListItem
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onDuplicate={onDuplicateTask}
                onToggleComplete={onToggleComplete}
                onAddComment={onAddComment}
                onOpenImageModal={onOpenImageModal}
                project={(task as any).project}
              />
            ) : (
              <TaskCompactListItem
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onDuplicate={onDuplicateTask}
                onToggleComplete={onToggleComplete}
                onAddComment={onAddComment}
                onOpenImageModal={onOpenImageModal}
                project={(task as any).project}
              />
            )
          ))}
        </div>
        
        {tasks.length === 0 && !isMobile && (
          <div className="h-32 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600">
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs">Drop items here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
