import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onAddTask?: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  icon: React.ReactNode;
  colorClass: string;
  isMobile?: boolean;
  onPomodoroComplete?: (taskId: string, session: import('../types').PomodoroSession) => void;
  onPomodoroUpdate?: (taskId: string, state: { pomodoroStatus?: string; currentPomodoroTime?: number | null }) => void;
}

const Column: React.FC<ColumnProps> = ({ 
  title, 
  status, 
  tasks, 
  onDropTask, 
  onDeleteTask,
  onAddTask,
  onEditTask,
  onDuplicateTask,
  icon,
  colorClass,
  isMobile = false,
  onPomodoroComplete, onPomodoroUpdate
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

  // Ensure full width on mobile, and provide a sensible min-width on larger screens
  const columnClasses = isMobile
    ? 'w-full flex flex-col h-full'
    : `min-w-[320px] flex flex-col h-full rounded-2xl transition-colors duration-300 ${isOver ? 'bg-slate-800/80 ring-2 ring-blue-500/30' : 'bg-slate-900/50'}`;

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
        {onAddTask && !isMobile && (
          <button 
            onClick={() => onAddTask(status)}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className={`flex-1 overflow-y-auto min-h-[200px] custom-scrollbar ${isMobile ? 'p-1' : 'p-3'}`}>
        <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4'}`}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDelete={onDeleteTask} 
              onEdit={onEditTask}
              onDuplicate={onDuplicateTask}
              project={(task as any).project}
              isMobile={isMobile}
              onPomodoroComplete={onPomodoroComplete}
              onPomodoroUpdate={onPomodoroUpdate}
            />
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
