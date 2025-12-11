import React, { useState, useCallback, useEffect, useMemo } from 'react';

// Custom hook for viewport width
const useViewportWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};
import { Task, TaskStatus, Priority, TeamMemberName, Project, NewTask, NewProject, TaskType, TrackingPreset, TaskComment, TEAM_MEMBERS } from './types';
import * as firestoreService from './lib/firestoreService';
import Column from './components/Column';
import UnifiedTaskList from './components/UnifiedTaskList';
import NewTaskModal from './components/NewTaskModal';
import NewProjectModal from './components/NewProjectModal';
import CommentsModal from './components/CommentsModal';
import ConfirmModal from './components/ConfirmModal';
import ErrorModal from './components/ErrorModal';
import ImageModal from './components/ImageModal';
import Sidebar from './components/Sidebar';
import CompletedTasksView from './components/CompletedTasksView';
import DeletedTasksView from './components/DeletedTasksView';
import DateFilter, { DateFilterType } from './components/DateFilter';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import MobileSidebar from './components/MobileSidebar';
import { isOverdue } from './utils/dateUtils';
import { generateId } from './utils/pomodoroHelpers';
import { CheckCircle2, Circle, Clock, Plus, Loader, List, Grid3X3 } from 'lucide-react';

const App: React.FC = () => {
  // --- RESPONSIVE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const viewportWidth = useViewportWidth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- DATA STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // --- LOADING & ERROR STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- UI STATE ---
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMemberName | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'compact' | 'unified'>(() => {
    const saved = localStorage.getItem('taskViewMode');
    return (saved as 'card' | 'list' | 'compact' | 'unified') || 'card';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [duplicatingTask, setDuplicatingTask] = useState<Task | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<TaskStatus>(TaskStatus.TODO);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [currentCommentingUser, setCurrentCommentingUser] = useState<TeamMemberName>('Stiven');

  // Completed Tasks History
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isCompletedTasksViewOpen, setIsCompletedTasksViewOpen] = useState(false);
  const [isLoadingCompletedTasks, setIsLoadingCompletedTasks] = useState(false);

  // Deleted Tasks History
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [isDeletedTasksViewOpen, setIsDeletedTasksViewOpen] = useState(false);
  const [isLoadingDeletedTasks, setIsLoadingDeletedTasks] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [loadedTasks, loadedProjects, loadedDeletedTasks] = await Promise.all([
          firestoreService.loadTasks(),
          firestoreService.loadProjects(),
          firestoreService.loadDeletedTasks(),
        ]);
        setTasks(loadedTasks);
        setProjects(loadedProjects);
        setDeletedTasks(loadedDeletedTasks);
        setError(null);
      } catch (err) {
        setError('Error al cargar datos desde Firebase.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load completed tasks when view is opened
  useEffect(() => {
    if (isCompletedTasksViewOpen) {
      const loadCompletedTasksData = async () => {
        try {
          setIsLoadingCompletedTasks(true);
          const loadedCompletedTasks = await firestoreService.loadCompletedTasks();
          setCompletedTasks(loadedCompletedTasks);
        } catch (err) {
          setError('Error al cargar tareas completadas.');
        } finally {
          setIsLoadingCompletedTasks(false);
        }
      };
      loadCompletedTasksData();
    }
  }, [isCompletedTasksViewOpen]);

  // Load deleted tasks when view is opened
  useEffect(() => {
    if (isDeletedTasksViewOpen) {
      const loadDeletedTasksData = async () => {
        try {
          setIsLoadingDeletedTasks(true);
          const loadedDeletedTasks = await firestoreService.loadDeletedTasks();
          setDeletedTasks(loadedDeletedTasks);
        } catch (err) {
          setError('Error al cargar tareas eliminadas.');
        } finally {
          setIsLoadingDeletedTasks(false);
        }
      };
      loadDeletedTasksData();
    }
  }, [isDeletedTasksViewOpen]);


  // ESC key handler for image modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false);
        setSelectedImage('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [imageModalOpen]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('taskViewMode', viewMode);
  }, [viewMode]);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Pomodoro handlers
  const handlePomodoroComplete = async (taskId: string, session: any) => {
    // Update local state
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, totalPomodoros: (t.totalPomodoros || 0) + 1, pomodoroSessions: [...(t.pomodoroSessions || []), session], currentPomodoroTime: undefined, pomodoroStatus: 'idle' } : t));
    try {
      await firestoreService.updateTaskPomodoro(taskId, session);
    } catch (err) {
      console.error('updateTaskPomodoro error', err);
      setError('Error al guardar sesión de pomodoro.');
    }
  };

  const handlePomodoroUpdate = async (taskId: string, state: { pomodoroStatus?: string; currentPomodoroTime?: number | null }) => {
    // Update local state
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, pomodoroStatus: state.pomodoroStatus as any || t.pomodoroStatus, currentPomodoroTime: state.currentPomodoroTime ?? t.currentPomodoroTime } : t));
    try {
      await firestoreService.updateTaskPomodoroState(taskId, state);
    } catch (err) {
      console.error('updateTaskPomodoroState error', err);
    }
  };

  const handleAddComment = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTaskForComments(task);
      setCommentsModalOpen(true);
    }
  };

  const handleSaveComment = async (taskId: string, commentData: { text: string; author: TeamMemberName; createdAt: number }) => {
    const originalTasks = tasks;
    const newComment: TaskComment = {
      id: generateId(),
      ...commentData
    };

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const updatedComments: TaskComment[] = [...(taskToUpdate.comments || []), newComment];
    const updatedTask: Task = {
      ...taskToUpdate,
      comments: updatedComments
    };

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    try {
      await firestoreService.updateTask(taskId, { comments: updatedComments });
      setSelectedTaskForComments(updatedTask);
    } catch (err) {
      console.error('Error saving comment:', err);
      setError('Error al guardar el comentario.');
      setTasks(originalTasks);
    }
  };

  // --- HANDLERS ---
  const handleDropTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const originalTasks = tasks;
    const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
    setTasks(updatedTasks);
    try {
      await firestoreService.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('updateTask (status) error', err);
      setError('Error al actualizar el estado de la tarea.');
      setTasks(originalTasks); // Revert on error
    }
  }, [tasks]);

  const handleToggleComplete = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const originalTasks = tasks;
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    // If marking as DONE, update status and copy to completed tasks collection
    if (newStatus === TaskStatus.DONE) {
      try {
        // Update task status in main collection
        const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
        setTasks(updatedTasks);

        // Copy task to completed collection (don't delete from main collection)
        await firestoreService.copyTaskToCompleted(taskId, taskToUpdate);

        // Update task status in Firestore
        await firestoreService.updateTask(taskId, { status: newStatus });
      } catch (err) {
        console.error('Error completing task:', err);
        setError('Error al completar la tarea.');
        setTasks(originalTasks); // Revert on error
      }
    }
    // If restoring from DONE to another status
    else if (taskToUpdate.status === TaskStatus.DONE) {
      try {
        const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
        setTasks(updatedTasks);
        await firestoreService.updateTask(taskId, { status: newStatus });
      } catch (err) {
        console.error('updateTask (status) error', err);
        setError('Error al actualizar el estado de la tarea.');
        setTasks(originalTasks); // Revert on error
      }
    }
    // Normal status change (not involving DONE)
    else {
      const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
      setTasks(updatedTasks);
      try {
        await firestoreService.updateTask(taskId, { status: newStatus });
      } catch (err) {
        console.error('updateTask (status) error', err);
        setError('Error al actualizar el estado de la tarea.');
        setTasks(originalTasks); // Revert on error
      }
    }
  }, [tasks]);

  const handleDeleteTask = useCallback(async (id: string) => {
    const originalTasks = tasks;
    const taskToDelete = tasks.find(task => task.id === id);
    if (!taskToDelete) return;

    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await firestoreService.moveTaskToDeleted(id, taskToDelete);
    } catch (err) {
      console.error('deleteTask error', err);
      setError('Error al eliminar la tarea.');
      setTasks(originalTasks);
    }
  }, [tasks]);

  // Completed Tasks Handlers
  const handleRestoreCompletedTask = async (taskId: string) => {
    try {
      const taskToRestore = completedTasks.find(t => t.id === taskId);

      if (taskToRestore) {
        // It's a completed task, restore it
        const newTaskId = await firestoreService.restoreCompletedTask(taskId);
        // Remove from completed tasks list
        setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
        // Refresh the main tasks list
        setTasks(await firestoreService.loadTasks());
      } else {
        // It's a regular DONE task, just change its status back
        const updatedTasks = tasks.map(task =>
          task.id === taskId ? { ...task, status: TaskStatus.TODO } : task
        );
        setTasks(updatedTasks);
        await firestoreService.updateTask(taskId, { status: TaskStatus.TODO });
      }
    } catch (err) {
      console.error('Error restoring task:', err);
      setError('Error al restaurar la tarea.');
    }
  };

  const handlePermanentDeleteCompletedTask = async (completedTaskId: string) => {
    try {
      await firestoreService.permanentlyDeleteCompletedTask(completedTaskId);
      setCompletedTasks(prev => prev.filter(t => t.id !== completedTaskId));
    } catch (err) {
      console.error('Error permanently deleting completed task:', err);
      setError('Error al eliminar permanentemente la tarea.');
    }
  };

  // Deleted Tasks Handlers
  const handleRestoreDeletedTask = async (deletedTaskId: string) => {
    try {
      const newTaskId = await firestoreService.restoreDeletedTask(deletedTaskId);
      // Remove from deleted tasks list
      setDeletedTasks(prev => prev.filter(t => t.id !== deletedTaskId));
      // The new task will be loaded when we refresh the main tasks list
      setTasks(await firestoreService.loadTasks());
    } catch (err) {
      console.error('Error restoring deleted task:', err);
      setError('Error al restaurar la tarea eliminada.');
    }
  };

  const handlePermanentDeleteTask = async (deletedTaskId: string) => {
    try {
      await firestoreService.permanentlyDeleteTask(deletedTaskId);
      setDeletedTasks(prev => prev.filter(t => t.id !== deletedTaskId));
    } catch (err) {
      console.error('Error permanently deleting task:', err);
      setError('Error al eliminar permanentemente la tarea.');
    }
  };

  // Project reordering handler
  const handleReorderProjects = async (reorderedProjects: Project[]) => {
    try {
      // Update local state
      setProjects(reorderedProjects);

      // Save order to Firestore for each project
      const updatePromises = reorderedProjects.map(project =>
        firestoreService.updateProjectOrder(project.id, project.order || 0)
      );

      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error reordering projects:', err);
      setError('Error al reordenar proyectos.');
      // Revert to original order
      setProjects(await firestoreService.loadProjects());
    }
  };

  const openNewTaskModal = (status: TaskStatus = TaskStatus.TODO) => {
    setModalDefaultStatus(status);
    setEditingTask(null);
    setDuplicatingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setDuplicatingTask(null);
    setModalDefaultStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const openDuplicateTaskModal = (task: Task) => {
    setDuplicatingTask(task);
    setEditingTask(null);
    setModalDefaultStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (title: string, description: string, priority: Priority, status: TaskStatus, assignee: TeamMemberName, creator: TeamMemberName, projectId: string, startDate?: number, dueDate?: number, type?: TaskType, trackingPreset?: TrackingPreset, images?: string[]) => {
    const taskData: NewTask = { title, description, priority, status, assignee, creator, projectId, startDate, dueDate, type, trackingPreset, images };
    
    if (editingTask) {
      const originalTasks = tasks;
      const updatedTask = { ...editingTask, ...taskData };
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      try {
        await firestoreService.updateTask(editingTask.id, taskData);
        setIsTaskModalOpen(false);
      } catch (err) {
        console.error('updateTask error', err);
        setError('Error al actualizar la tarea.');
        setTasks(originalTasks);
        return;
      }
    } else {
      try {
        console.log('Creating task with data:', taskData);
        if (!taskData.projectId) {
          setError('Selecciona un proyecto antes de crear la tarea.');
          return;
        }
        const newId = await firestoreService.createTask(taskData);
        const newTask: Task = { id: newId, createdAt: Date.now(), ...taskData };
        setTasks(prev => [newTask, ...prev]);
        setIsTaskModalOpen(false);
      } catch (err) {
        console.error('createTask error', err);
        const message = (err as any)?.message || JSON.stringify(err);
        setError(`Error al crear la tarea: ${message}`);
        return;
      }
    }
    setEditingTask(null);
    setDuplicatingTask(null);
  };

  const handleProjectSave = async (name: string, color: string) => {
    setIsProjectModalOpen(false);
    const projectData: NewProject = { name, color };

    if (editingProject) {
      const originalProjects = projects;
      const updatedProject = { ...editingProject, ...projectData };
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
      try {
        await firestoreService.updateProject(editingProject.id, projectData);
      } catch (err) {
        console.error('updateProject error', err);
        setError('Error al actualizar el proyecto.');
        setProjects(originalProjects);
      }
    } else {
      try {
        const newId = await firestoreService.createProject(projectData);
        const newProject: Project = { id: newId, ...projectData };
        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
      } catch (err) {
        console.error('createProject error', err);
        setError('Error al crear el proyecto.');
      }
    }
    setEditingProject(null);
  };

  const openAddProjectModal = () => {
      setEditingProject(null);
      setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
      setEditingProject(project);
      setIsProjectModalOpen(true);
  };

  const initiateDeleteProject = (projectId: string) => setProjectToDelete(projectId);

  const confirmDeleteProject = async () => {
      if (!projectToDelete) return;
      const id = projectToDelete;
      const originalProjects = projects;
      const originalTasks = tasks;

      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      
      try {
        await firestoreService.deleteProject(id);
        // Opcional: eliminar tareas asociadas en Firestore si lo deseas
      } catch (err) {
        console.error('deleteProject error', err);
        setError('Error al eliminar el proyecto.');
        setProjects(originalProjects);
        setTasks(originalTasks);
      }

      if (activeProjectId === id) setActiveProjectId(null);
      if (isProjectModalOpen && editingProject?.id === id) {
         setIsProjectModalOpen(false);
         setEditingProject(null);
      }
      setProjectToDelete(null);
  };

  // --- FILTERING ---
  useEffect(() => {
    console.log('🔍 Filtros activos:', {
      activeProjectId,
      dateFilter,
      selectedMember,
      showCompleted
    });
  }, [activeProjectId, dateFilter, selectedMember, showCompleted]);

  // 1. Filtrar por proyecto
  let filteredTasks = activeProjectId 
    ? tasks.filter(t => t.projectId === activeProjectId)
    : tasks;

  console.log('1️⃣ Después de filtro proyecto:', filteredTasks.length);

  // 2. Filtrar por miembro (CRÍTICO: debe ser ANTES de otros filtros)
  if (selectedMember) {
    filteredTasks = filteredTasks.filter(t => t.assignee === selectedMember);
    console.log(`2️⃣ Después de filtro miembro (${selectedMember}):`, filteredTasks.length);
  }

  // 3. Filtrar por completadas
  if (showCompleted) {
    filteredTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE);
    console.log('3️⃣ Después de filtro completadas:', filteredTasks.length);
  }

  // 4. Aplicar filtro de fecha (dateFilteredTasks)
  const dateFilteredTasks = filteredTasks.filter(task => {
    if (dateFilter === 'all') return true;

    if (!task.dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000;

    switch (dateFilter) {
      case 'overdue':
        return isOverdue(task.dueDate) && task.status !== TaskStatus.DONE;
      case 'today':
        return task.dueDate >= todayTimestamp && task.dueDate < tomorrowTimestamp;
      case 'week':
        // Get start of current week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekTimestamp = startOfWeek.getTime();

        // Get end of current week (Saturday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const endOfWeekTimestamp = endOfWeek.getTime();

        return task.dueDate >= startOfWeekTimestamp && task.dueDate <= endOfWeekTimestamp;
      case 'month':
        // Get start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfMonthTimestamp = startOfMonth.getTime();

        // Get end of current month
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        const endOfMonthTimestamp = endOfMonth.getTime();

        return task.dueDate >= startOfMonthTimestamp && task.dueDate <= endOfMonthTimestamp;
      default:
        return true;
    }
  });

  console.log('4️⃣ Después de filtro fecha:', dateFilteredTasks.length);

  const counts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

    // Calculate week range (current week)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekTimestamp = startOfWeek.getTime();

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const endOfWeekTimestamp = endOfWeek.getTime();

    // Calculate month range (current month) - used in filtering logic below
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return {
      overdue: filteredTasks.filter(t => t.dueDate && isOverdue(t.dueDate) && t.status !== TaskStatus.DONE).length,
      today: filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate >= todayStart && t.dueDate < tomorrowStart;
      }).length,
      week: filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate >= startOfWeekTimestamp && t.dueDate <= endOfWeekTimestamp;
      }).length,
      total: filteredTasks.length,
      filtered: dateFilteredTasks.length,
      [TaskStatus.TODO]: dateFilteredTasks.filter(t => t.status === TaskStatus.TODO).length,
      [TaskStatus.IN_PROGRESS]: dateFilteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      [TaskStatus.DONE]: dateFilteredTasks.filter(t => t.status === TaskStatus.DONE).length,
    };
  }, [filteredTasks, dateFilteredTasks]);
  
  const taskCountsByProject = useMemo(() => {
    return tasks.reduce((acc, task) => {
        acc[task.projectId] = (acc[task.projectId] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
  }, [tasks]);

  const tasksWithProjects = dateFilteredTasks.map(t => ({ ...t, project: projects.find(p => p.id === t.projectId) }));
  const todoTasks = tasksWithProjects.filter(t => t.status === TaskStatus.TODO);
  const inProgressTasks = tasksWithProjects.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const doneTasks = tasksWithProjects.filter(t => t.status === TaskStatus.DONE);
  
  const getHeaderTitle = () => {
    if (selectedMember) {
      return `📋 Tareas de ${selectedMember}`;
    }
    if (showCompleted) {
      return '✓ Tareas Completadas';
    }
    if (activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId);
      return project?.name || 'Proyecto';
    }
    return 'Todos los Proyectos';
  };

  const getHeaderSubtitle = () => {
    const parts = [];

    if (selectedMember) parts.push(`Asignadas a ${selectedMember}`);
    if (showCompleted) parts.push('Completadas');
    if (activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId);
      if(project) parts.push(project.name);
    }

    return parts.length > 0
      ? `${dateFilteredTasks.length} tareas • ${parts.join(' • ')}`
      : `${dateFilteredTasks.length} tareas en total`;
  };


  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  const handleSelectAssignee = (assignee: TeamMemberName | null) => {
    setSelectedMember(assignee);
    if (assignee) {
      setShowCompleted(false);
    }
  };

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setImageModalOpen(true);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const renderDesktopView = () => {
    // Dynamic margin-left based on sidebar state
    const mainMarginLeft = isSidebarCollapsed ? 'ml-20' : 'ml-72'; // 80px : 288px

    return (
      <>
        {/* Sidebar with smooth transitions */}
        <div className={`fixed left-0 top-0 h-full z-30 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}>
          <Sidebar
            projects={projects}
            activeProjectId={activeProjectId}
            tasks={tasks}
            deletedTasksCount={deletedTasks.length}
            onSelectProject={setActiveProjectId}
            onAddProject={openAddProjectModal}
            onEditProject={openEditProjectModal}
            onDeleteProject={initiateDeleteProject}
            onReorderProjects={handleReorderProjects}
            activeAssignee={selectedMember}
            onSelectAssignee={handleSelectAssignee}
            onOpenCompletedTasks={() => setIsCompletedTasksViewOpen(true)}
            onOpenDeletedTasks={() => setIsDeletedTasksViewOpen(true)}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {/* Main content area with dynamic margin */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainMarginLeft}`}>
          <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-lg font-semibold text-white">{getHeaderTitle()}</h2>
                      <p className="text-xs text-slate-500">{getHeaderSubtitle()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <button
                          onClick={() => {
                            const modes = ['card', 'list', 'compact', 'unified'] as const;
                            const currentIndex = modes.indexOf(viewMode as any);
                            const nextIndex = (currentIndex + 1) % modes.length;
                            setViewMode(modes[nextIndex]);
                          }}
                          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          title={
                            viewMode === 'card' ? 'Cambiar a vista de lista' :
                            viewMode === 'list' ? 'Cambiar a vista compacta' :
                            viewMode === 'compact' ? 'Cambiar a vista unificada' :
                            'Cambiar a vista de tarjetas'
                          }
                      >
                          {viewMode === 'card' ? <List size={18} /> :
                           viewMode === 'list' ? <Grid3X3 size={18} /> :
                           viewMode === 'compact' ? <List size={18} /> :
                           <Grid3X3 size={18} />}
                          <span>
                            {viewMode === 'card' ? 'Lista' :
                             viewMode === 'list' ? 'Compacta' :
                             viewMode === 'compact' ? 'Unificada' :
                             'Tarjetas'}
                          </span>
                      </button>
                      <button onClick={() => openNewTaskModal(TaskStatus.TODO)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={18} /><span>Nueva Tarea</span></button>
                  </div>
              </div>
              <DateFilter activeFilter={dateFilter} onFilterChange={setDateFilter} overdueCount={counts.overdue} todayCount={counts.today} weekCount={counts.week} />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">
              {viewMode === 'unified' ? (
                  /* Unified List View */
                  <UnifiedTaskList
                      tasks={tasks}
                      projects={projects}
                      onEditTask={openEditTaskModal}
                      onToggleComplete={handleToggleComplete}
                      onAddTask={() => openNewTaskModal(TaskStatus.TODO)}
                  />
              ) : (
                  /* Kanban Board with Fluid Grid Layout */
                  <div className="p-6 h-full overflow-hidden">
                      <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                          {/* Column 1: TODO */}
                          <div className="min-w-0">
                              <Column
                                title="Tarea"
                                status={TaskStatus.TODO}
                                tasks={todoTasks}
                                viewMode={viewMode}
                                onDropTask={handleDropTask}
                                onDeleteTask={handleDeleteTask}
                                onAddTask={openNewTaskModal}
                                onEditTask={openEditTaskModal}
                                onDuplicateTask={openDuplicateTaskModal}
                                onToggleComplete={handleToggleComplete}
                                onAddComment={handleAddComment}
                                onOpenImageModal={openImageModal}
                                icon={<Circle size={20} />}
                                colorClass="text-blue-400"
                                onPomodoroComplete={handlePomodoroComplete}
                                onPomodoroUpdate={handlePomodoroUpdate}
                              />
                          </div>

                          {/* Column 2: IN PROGRESS */}
                          <div className="min-w-0">
                              <Column
                                title="En curso"
                                status={TaskStatus.IN_PROGRESS}
                                tasks={inProgressTasks}
                                viewMode={viewMode}
                                onDropTask={handleDropTask}
                                onDeleteTask={handleDeleteTask}
                                onAddTask={openNewTaskModal}
                                onEditTask={openEditTaskModal}
                                onDuplicateTask={openDuplicateTaskModal}
                                onToggleComplete={handleToggleComplete}
                                onAddComment={handleAddComment}
                                onOpenImageModal={openImageModal}
                                icon={<Clock size={20} />}
                                colorClass="text-amber-400"
                                onPomodoroComplete={handlePomodoroComplete}
                                onPomodoroUpdate={handlePomodoroUpdate}
                              />
                          </div>

                          {/* Column 3: DONE */}
                          <div className="min-w-0">
                              <Column
                                title="Terminada"
                                status={TaskStatus.DONE}
                                tasks={doneTasks}
                                viewMode={viewMode}
                                onDropTask={handleDropTask}
                                onDeleteTask={handleDeleteTask}
                                onAddTask={openNewTaskModal}
                                onEditTask={openEditTaskModal}
                                onDuplicateTask={openDuplicateTaskModal}
                                onToggleComplete={handleToggleComplete}
                                onAddComment={handleAddComment}
                                onOpenImageModal={openImageModal}
                                icon={<CheckCircle2 size={20} />}
                                colorClass="text-emerald-400"
                                onPomodoroComplete={handlePomodoroComplete}
                                onPomodoroUpdate={handlePomodoroUpdate}
                              />
                          </div>
                      </div>
                  </div>
              )}
          </main>
        </div>
      </>
    );
  };

  const renderMobileView = () => {
    const columnMap = {
        [TaskStatus.TODO]: { tasks: todoTasks, title: "Tareas", icon: Circle, color: "text-blue-400" },
        [TaskStatus.IN_PROGRESS]: { tasks: inProgressTasks, title: "En Curso", icon: Clock, color: "text-amber-400" },
        [TaskStatus.DONE]: { tasks: doneTasks, title: "Terminadas", icon: CheckCircle2, color: "text-emerald-400" },
    };
    const activeColumnData = columnMap[mobileActiveColumn];

    return (
        <>
            <MobileHeader projects={projects} activeProjectId={activeProjectId} onSelectProject={setActiveProjectId} onOpenSidebar={() => setIsMobileSidebarOpen(true)} onNewTask={() => openNewTaskModal(mobileActiveColumn)} dateFilter={dateFilter} onDateFilterChange={setDateFilter} counts={{ overdue: counts.overdue, today: counts.today, week: counts.week, total: counts.total, filtered: counts.filtered }} activeAssignee={selectedMember} />
            <main className="flex-1 overflow-y-auto p-4 pb-20 w-full">
                {mobileActiveColumn === TaskStatus.TODO && (
                  <Column title={activeColumnData.title} status={mobileActiveColumn} tasks={activeColumnData.tasks} viewMode={viewMode} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} onAddComment={handleAddComment} onOpenImageModal={openImageModal} icon={React.createElement(activeColumnData.icon, { size: 20 })} colorClass={activeColumnData.color} isMobile onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                )}
                {mobileActiveColumn === TaskStatus.IN_PROGRESS && (
                  <Column title={activeColumnData.title} status={mobileActiveColumn} tasks={activeColumnData.tasks} viewMode={viewMode} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} onAddComment={handleAddComment} onOpenImageModal={openImageModal} icon={React.createElement(activeColumnData.icon, { size: 20 })} colorClass={activeColumnData.color} isMobile onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                )}
                {mobileActiveColumn === TaskStatus.DONE && (
                  <Column title={activeColumnData.title} status={mobileActiveColumn} tasks={activeColumnData.tasks} viewMode={viewMode} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} onAddComment={handleAddComment} onOpenImageModal={openImageModal} icon={React.createElement(activeColumnData.icon, { size: 20 })} colorClass={activeColumnData.color} isMobile onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                )}
                
            </main>
            <MobileBottomNav activeColumn={mobileActiveColumn} onColumnChange={setMobileActiveColumn} counts={{ [TaskStatus.TODO]: todoTasks.length, [TaskStatus.IN_PROGRESS]: inProgressTasks.length, [TaskStatus.DONE]: doneTasks.length }} />
            <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} projects={projects} activeProjectId={activeProjectId} onSelectProject={setActiveProjectId} onAddProject={openAddProjectModal} onEditProject={openEditProjectModal} onDeleteProject={initiateDeleteProject} taskCounts={taskCountsByProject} activeAssignee={selectedMember} onSelectAssignee={setSelectedMember} />
        </>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 overflow-hidden text-slate-300">
      {isMobile ? renderMobileView() : renderDesktopView()}
      <NewTaskModal isOpen={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setDuplicatingTask(null); }} onSave={handleSaveTask} onTaskUpdate={handleTaskUpdate} initialStatus={modalDefaultStatus} projects={projects} activeProjectId={activeProjectId} taskToEdit={editingTask} taskToDuplicate={duplicatingTask} />
      <NewProjectModal isOpen={isProjectModalOpen} onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }} onSave={handleProjectSave} onDelete={initiateDeleteProject} projectToEdit={editingProject} />
      <CommentsModal isOpen={commentsModalOpen} onClose={() => { setCommentsModalOpen(false); setSelectedTaskForComments(null); }} task={selectedTaskForComments!} onSaveComment={handleSaveComment} currentUser={currentCommentingUser} onCurrentUserChange={setCurrentCommentingUser} />
      <ConfirmModal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={confirmDeleteProject} title="Eliminar Proyecto" message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción eliminará permanentemente todas las tareas asociadas y no se puede deshacer." />
      <ErrorModal isOpen={!!error} message={error} onClose={() => setError(null)} />
      <ImageModal isOpen={imageModalOpen} onClose={() => { setImageModalOpen(false); setSelectedImage(''); }} imageSrc={selectedImage} alt="Imagen de tarea" />
      {isCompletedTasksViewOpen && (
        <CompletedTasksView
          tasks={[...completedTasks, ...tasks.filter(t => t.status === TaskStatus.DONE)]}
          projects={projects}
          onRestoreTask={handleRestoreCompletedTask}
          onPermanentDelete={handlePermanentDeleteCompletedTask}
          onDeleteRegularTask={handleDeleteTask}
          onClose={() => setIsCompletedTasksViewOpen(false)}
        />
      )}

      {isDeletedTasksViewOpen && (
        <DeletedTasksView
          tasks={deletedTasks}
          projects={projects}
          onRestoreTask={handleRestoreDeletedTask}
          onPermanentDelete={handlePermanentDeleteTask}
          onClose={() => setIsDeletedTasksViewOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
