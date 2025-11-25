import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Task, TaskStatus, Priority, TeamMemberName, Project, NewTask, NewProject, TaskType, TrackingPreset, TEAM_MEMBERS } from './types';
import * as firestoreService from './lib/firestoreService';
import { requestNotificationPermission } from './utils/pomodoroSound';
import Column from './components/Column';
import NewTaskModal from './components/NewTaskModal';
import NewProjectModal from './components/NewProjectModal';
import ConfirmModal from './components/ConfirmModal';
import ErrorModal from './components/ErrorModal';
import Sidebar from './components/Sidebar';
import DateFilter, { DateFilterType } from './components/DateFilter';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import MobileSidebar from './components/MobileSidebar';
import { isOverdue } from './utils/dateUtils';
import { CheckCircle2, Circle, Clock, Plus, Loader } from 'lucide-react';

const App: React.FC = () => {
  // --- RESPONSIVE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [duplicatingTask, setDuplicatingTask] = useState<Task | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<TaskStatus>(TaskStatus.TODO);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [loadedTasks, loadedProjects] = await Promise.all([
          firestoreService.loadTasks(),
          firestoreService.loadProjects(),
        ]);
        setTasks(loadedTasks);
        setProjects(loadedProjects);
        setError(null);
      } catch (err) {
        setError('Error al cargar datos desde Firebase.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Request notification permission for Pomodoro notifications
  useEffect(() => {
    requestNotificationPermission();
  }, []);

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

  const handleDeleteTask = useCallback(async (id: string) => {
    const originalTasks = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await firestoreService.deleteTask(id);
    } catch (err) {
      console.error('deleteTask error', err);
      setError('Error al eliminar la tarea.');
      setTasks(originalTasks);
    }
  }, [tasks]);

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

  const handleSaveTask = async (title: string, description: string, priority: Priority, status: TaskStatus, assignee: TeamMemberName, creator: TeamMemberName, projectId: string, startDate?: number, dueDate?: number, type?: TaskType, trackingPreset?: TrackingPreset) => {
    const taskData: NewTask = { title, description, priority, status, assignee, creator, projectId, startDate, dueDate, type, trackingPreset };
    
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
    
    if (dateFilter === 'noDate') {
      return !task.dueDate;
    }
    
    if (!task.dueDate) return false;
    
    const now = Date.now();
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
        const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
        return task.dueDate >= now && task.dueDate <= weekFromNow;
      case 'month':
        const monthFromNow = now + 30 * 24 * 60 * 60 * 1000;
        return task.dueDate >= now && task.dueDate <= monthFromNow;
      default:
        return true;
    }
  });

  console.log('4️⃣ Después de filtro fecha:', dateFilteredTasks.length);

  const counts = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const calcDate = (t: typeof filteredTasks[0]) => t.dueDate ?? t.createdAt;
    return {
      overdue: filteredTasks.filter(t => t.dueDate && isOverdue(t.dueDate) && t.status !== TaskStatus.DONE).length,
      today: filteredTasks.filter(t => {
        const d = calcDate(t);
        return d && d >= todayStart && d < todayStart + 86400000;
      }).length,
      week: filteredTasks.filter(t => {
        const d = calcDate(t);
        return d && d >= now && d <= now + 7 * 86400000;
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

  const renderDesktopView = () => (
    <>
      <Sidebar projects={projects} activeProjectId={activeProjectId} tasks={tasks} onSelectProject={setActiveProjectId} onAddProject={openAddProjectModal} onEditProject={openEditProjectModal} onDeleteProject={initiateDeleteProject} activeAssignee={selectedMember} onSelectAssignee={handleSelectAssignee} showCompleted={showCompleted} onToggleShowCompleted={() => setShowCompleted(!showCompleted)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">{getHeaderTitle()}</h2>
                    <p className="text-xs text-slate-500">{getHeaderSubtitle()}</p>
                </div>
                <button onClick={() => openNewTaskModal(TaskStatus.TODO)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={18} /><span>Nueva Tarea</span></button>
            </div>
            <DateFilter activeFilter={dateFilter} onFilterChange={setDateFilter} overdueCount={counts.overdue} todayCount={counts.today} weekCount={counts.week} />
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-hidden p-4">
            <div className="flex h-full gap-6 min-w-[1000px] mx-auto max-w-7xl">
                <Column title="Tarea" status={TaskStatus.TODO} tasks={todoTasks} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} icon={<Circle size={20} />} colorClass="text-blue-400" onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                <Column title="En curso" status={TaskStatus.IN_PROGRESS} tasks={inProgressTasks} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} icon={<Clock size={20} />} colorClass="text-amber-400" onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                <Column title="Terminada" status={TaskStatus.DONE} tasks={doneTasks} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} icon={<CheckCircle2 size={20} />} colorClass="text-emerald-400" onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
            </div>
        </main>
      </div>
    </>
  );

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
                  <Column title={activeColumnData.title} status={mobileActiveColumn} tasks={activeColumnData.tasks} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} icon={React.createElement(activeColumnData.icon, { size: 20 })} colorClass={activeColumnData.color} isMobile onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                )}
                {mobileActiveColumn === TaskStatus.IN_PROGRESS && (
                  <Column title={activeColumnData.title} status={mobileActiveColumn} tasks={activeColumnData.tasks} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} icon={React.createElement(activeColumnData.icon, { size: 20 })} colorClass={activeColumnData.color} isMobile onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
                )}
                {mobileActiveColumn === TaskStatus.DONE && (
                  <Column title={activeColumnData.title} status={mobileActiveColumn} tasks={activeColumnData.tasks} onDropTask={handleDropTask} onDeleteTask={handleDeleteTask} onAddTask={openNewTaskModal} onEditTask={openEditTaskModal} onDuplicateTask={openDuplicateTaskModal} onToggleComplete={handleToggleComplete} icon={React.createElement(activeColumnData.icon, { size: 20 })} colorClass={activeColumnData.color} isMobile onPomodoroComplete={handlePomodoroComplete} onPomodoroUpdate={handlePomodoroUpdate} />
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
      <NewTaskModal isOpen={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setDuplicatingTask(null); }} onSave={handleSaveTask} initialStatus={modalDefaultStatus} projects={projects} activeProjectId={activeProjectId} taskToEdit={editingTask} taskToDuplicate={duplicatingTask} />
      <NewProjectModal isOpen={isProjectModalOpen} onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }} onSave={handleProjectSave} onDelete={initiateDeleteProject} projectToEdit={editingProject} />
      <ConfirmModal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={confirmDeleteProject} title="Eliminar Proyecto" message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción eliminará permanentemente todas las tareas asociadas y no se puede deshacer." />
      <ErrorModal isOpen={!!error} message={error} onClose={() => setError(null)} />
    </div>
  );
};

export default App;
