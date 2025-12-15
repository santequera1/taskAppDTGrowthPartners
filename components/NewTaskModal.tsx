import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, Priority, TeamMemberName, TEAM_MEMBERS, Project, TASK_TYPES, TaskType, TRACKING_PRESETS, TrackingPreset } from '../types';
import { X, Save, User, UserPlus, Folder, PenLine, Copy, Calendar, CalendarClock, Upload } from 'lucide-react';
import PomodoroHistory from './PomodoroHistory';
import { timestampToInputDate, inputDateToTimestamp } from '../utils/dateUtils';
import { convertImageToBase64, validateImage } from '../lib/imageService';
import { updateTask } from '../lib/firestoreService';

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
    trackingPreset?: TrackingPreset,
    images?: string[]
  ) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  initialStatus: TaskStatus;
  projects: Project[];
  activeProjectId: string | null;
  taskToEdit?: Task | null;
  taskToDuplicate?: Task | null;
  columns: import('../types').BoardColumn[];
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSave, onTaskUpdate, initialStatus, projects, activeProjectId, taskToEdit: editingTask, taskToDuplicate, columns }) => {
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
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const task = editingTask || taskToDuplicate;
      if (task) {
        setTitle(editingTask ? task.title : `${task.title} (Copia)`);
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
        setImages(task.images || []);
      } else {
        // Create Mode
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
        setImages([]);
      }
    }
  }, [isOpen, editingTask, taskToDuplicate, initialStatus, activeProjectId, projects]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Handler para pegar imágenes desde portapapeles
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
        break; // Solo procesar la primera imagen
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    // Validar
    const validation = validateImage(file);
    if (!validation.valid) {
      alert(`❌ ${validation.error}`);
      return;
    }

    // Límite de imágenes
    if (images.length >= 5) {
      alert('❌ Máximo 5 imágenes por tarea');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🔄 Procesando imagen...');

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Convertir a Base64
      const base64 = await convertImageToBase64(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Agregar a la lista
      const newImages = [...images, base64];
      setImages(newImages);

      console.log('✅ Imagen agregada');

      // Si editar tarea existente, actualizar Firestore y estado local
      if (editingTask) {
        await updateTask(editingTask.id, { images: newImages });
        onTaskUpdate?.(editingTask.id, { images: newImages });
      }

    } catch (error) {
      console.error('❌ Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 300);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler para eliminar imagen
  const handleRemoveImage = (index: number) => {
    console.log('🗑️ Eliminando imagen:', index);

    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // Si estamos editando una tarea existente, actualizar en Firestore y estado local
    if (editingTask) {
      updateTask(editingTask.id, { images: newImages });
      onTaskUpdate?.(editingTask.id, { images: newImages });
      console.log('💾 Firestore actualizado - imagen eliminada');
    }
  };


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
      trackingPreset || undefined,
      images
    );
  };

  const getModalTitle = () => {
      if (editingTask) return 'Editar Tarea';
      if (taskToDuplicate) return 'Duplicar Tarea';
      return 'Nueva Tarea';
  };

  const getModalIcon = () => {
    if (editingTask) return <PenLine size={18} className="text-blue-500" />;
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
              onPaste={handlePaste}
              placeholder="Detalles adicionales..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
            />
          </div>

          {/* Sección de Imágenes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Imágenes adjuntas
              {uploading && (
                <span className="ml-2 text-xs text-blue-400">
                  Procesando {uploadProgress}%
                </span>
              )}
            </label>

            {/* Botón upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className={`w-full px-4 py-3 border-2 border-dashed rounded-lg
                         transition-all flex items-center justify-center gap-2
                         ${uploading || images.length >= 5
                           ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed'
                           : 'border-slate-600 hover:border-blue-500 bg-slate-800/30 text-slate-400'
                         }`}
            >
              <Upload size={18} />
              <span className="text-sm">
                {uploading ? 'Procesando...' : images.length >= 5 ? 'Límite (5/5)' : 'Subir imagen'}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />

            <p className="text-xs text-slate-500 text-center mt-2">
              {images.length}/5 • Max 5MB • Se comprime automáticamente
            </p>

            {/* Progress bar */}
            {uploading && (
              <div className="mt-2 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Grid imágenes */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((base64, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={base64}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-24 object-contain rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500
                                 text-white rounded-full opacity-0 group-hover:opacity-100
                                 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                {columns.map(column => (
                  <option key={column.status} value={column.status}>{column.name}</option>
                ))}
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
              {editingTask ? 'Actualizar' : taskToDuplicate ? 'Crear Copia' : 'Guardar'}
            </button>
          </div>
          {editingTask && (
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Historial de Pomodoros</h3>
              <PomodoroHistory sessions={editingTask.pomodoroSessions} />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
