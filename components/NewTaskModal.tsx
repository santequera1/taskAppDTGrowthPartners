import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Priority, TeamMemberName, TEAM_MEMBERS, Project, TASK_TYPES, TaskType, TRACKING_PRESETS, TrackingPreset } from '../types';
import { X, Save, User, UserPlus, Folder, PenLine, Copy, Calendar, CalendarClock } from 'lucide-react';
import PomodoroHistory from './PomodoroHistory';
import { timestampToInputDate, inputDateToTimestamp } from '../utils/dateUtils';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string, 
    description: string, 
    priority: Priority, 
    status: TaskStatus, 
    assignee: TeamMemberName, 
    creator: TeamMemberName, 
    projectId: string,
    startDate?: number,
    dueDate?: number,
    type?: TaskType,
    trackingPreset?: TrackingPreset
  ) => void;
  initialStatus: TaskStatus;
  projects: Project[];
  activeProjectId: string | null;
  taskToEdit?: Task | null;
  taskToDuplicate?: Task | null;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSave, initialStatus, projects, activeProjectId, taskToEdit, taskToDuplicate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [assignee, setAssignee] = useState<TeamMemberName>('Stiven');
  const [creator, setCreator] = useState<TeamMemberName>('Dairo');
  const [projectId, setProjectId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [type, setType] = useState<TaskType>(TASK_TYPES[0]);
  const [trackingPreset, setTrackingPreset] = useState<TrackingPreset | ''>('');

  useEffect(() => {
    if (isOpen) {
      const task = taskToEdit || taskToDuplicate;
      if (task) {
        setTitle(taskToEdit ? task.title : `${task.title} (Copia)`);
        setDescription(task.description);
        setPriority(task.priority);
        setStatus(task.status);
        setAssignee(task.assignee);
        setCreator(task.creator);
        setProjectId(task.projectId);
        setStartDate(timestampToInputDate(task.startDate));
        setDueDate(timestampToInputDate(task.dueDate));
        setType((task as Task).type || TASK_TYPES[0]);
        setTrackingPreset((task as Task).trackingPreset || '' as any);
      } else {
        // Create Mode: prefills to today's date to avoid empty-date errors
        const todayInput = timestampToInputDate(Date.now());
        setTitle('');
        setDescription('');
        setPriority(Priority.MEDIUM);
        setStatus(initialStatus);
        setAssignee('Stiven');
        setCreator('Dairo');
        setProjectId(activeProjectId || (projects.length > 0 ? projects[0].id : ''));
        setStartDate(todayInput);
        setDueDate(todayInput);
        setType(TASK_TYPES[0]);
        setTrackingPreset('');
      }
    }
  }, [isOpen, taskToEdit, taskToDuplicate, initialStatus, activeProjectId, projects]);

  // Close modal on Escape key when it's open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    onSave(
      title,
      description,
      priority,
      status,
      assignee,
      creator,
      projectId,
      inputDateToTimestamp(startDate),
      inputDateToTimestamp(dueDate),
      type,
      trackingPreset || undefined
    );
  };

  const getModalTitle = () => {
      if (taskToEdit) return 'Editar Tarea';
      if (taskToDuplicate) return 'Duplicar Tarea';
      return 'Nueva Tarea';
  };

  const getModalIcon = () => {
    if (taskToEdit) return <PenLine size={18} className="text-blue-500" />;
    if (taskToDuplicate) return <Copy size={18} className="text-blue-500" />;
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md md:max-w-2xl lg:max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {getModalIcon()}
            {getModalTitle()}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Project Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cliente / Proyecto</label>
            <div className="relative">
                <Folder className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 md:pl-10 p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseñar base de datos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Inicio <span className="text-xs text-slate-500 ml-2">dd/mm/aaaa hh:mm</span></label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                  <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 md:pl-10 p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Entrega <span className="text-xs text-slate-500 ml-2">dd/mm/aaaa hh:mm</span></label>
                <div className="relative">
                    <CalendarClock className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                  <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 md:pl-10 p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Asignado por (Creador)</label>
              <div className="relative">
                <UserPlus className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                <select
                  value={creator}
                  onChange={(e) => setCreator(e.target.value as TeamMemberName)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 md:pl-10 p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  {TEAM_MEMBERS.map(member => (
                    <option key={member.name} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Asignado a (Responsable)</label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value as TeamMemberName)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 md:pl-10 p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  {TEAM_MEMBERS.map(member => (
                    <option key={member.name} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value={Priority.LOW}>Baja</option>
                <option value={Priority.MEDIUM}>Media</option>
                <option value={Priority.HIGH}>Alta</option>
              </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Columna</label>
                <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                <option value={TaskStatus.TODO}>Tarea</option>
                <option value={TaskStatus.IN_PROGRESS}>En curso</option>
                <option value={TaskStatus.DONE}>Terminada</option>
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as TaskType)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Modo de Tracking</label>
              <select value={trackingPreset || ''} onChange={e => setTrackingPreset(e.target.value as TrackingPreset || '')} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="">Ninguno</option>
                {TRACKING_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 md:px-5 md:py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm md:text-base font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2 md:px-5 md:py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {taskToEdit ? 'Actualizar' : taskToDuplicate ? 'Crear Copia' : 'Guardar'}
            </button>
          </div>
          {taskToEdit && (
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Historial de Pomodoros</h3>
              <PomodoroHistory sessions={taskToEdit.pomodoroSessions} />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
