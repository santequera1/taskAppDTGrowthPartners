export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export type TaskType =
  | 'Estrategia'
  | 'Publicidad / Ads'
  | 'Contenido Orgánico'
  | 'Diseño'
  | 'Video / Multimedia'
  | 'Copywriting'
  | 'Revisión / Control de Calidad'
  | 'Cliente / Reuniones';

export const TASK_TYPES: TaskType[] = [
  'Estrategia',
  'Publicidad / Ads',
  'Contenido Orgánico',
  'Diseño',
  'Video / Multimedia',
  'Copywriting',
  'Revisión / Control de Calidad',
  'Cliente / Reuniones',
];

export type TrackingPreset = 'POMODORO_25' | 'DEEP_50' | 'STRATEGIC_90' | 'SHORT_BREAK' | 'LONG_BREAK';

export const TRACKING_PRESETS: { id: TrackingPreset; label: string; minutes: number }[] = [
  { id: 'POMODORO_25', label: '25 min = Pomodoro', minutes: 25 },
  { id: 'DEEP_50', label: '50 min profundo', minutes: 50 },
  { id: 'STRATEGIC_90', label: '90 min sesión estratégica', minutes: 90 },
  { id: 'SHORT_BREAK', label: 'Pausa corta', minutes: 5 },
  { id: 'LONG_BREAK', label: 'Pausa larga', minutes: 15 },
];

export type TeamMemberName = 'Dairo' | 'Stiven' | 'Mariana' | 'Jose' | 'Anderson';

export interface TeamMember {
  name: TeamMemberName;
  role: string;
  initials: string;
  color: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: 'Dairo', role: 'CEO', initials: 'DA', color: 'bg-purple-500' },
  { name: 'Stiven', role: 'Dev', initials: 'ST', color: 'bg-blue-500' },
  { name: 'Mariana', role: 'Designer', initials: 'MA', color: 'bg-pink-500' },
  { name: 'Jose', role: 'Freelancer', initials: 'JO', color: 'bg-orange-500' },
  { name: 'Anderson', role: 'Freelancer', initials: 'AN', color: 'bg-teal-500' },
];

export interface Project {
  id: string;
  name: string;
  color: string; // Tailwind color class for the badge (e.g., 'bg-indigo-500')
}

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'p1', name: 'Equilibrio Clinic', color: 'bg-indigo-500' },
  { id: 'p2', name: 'E-commerce V1', color: 'bg-rose-500' },
  { id: 'p3', name: 'Interno', color: 'bg-slate-500' },
];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: TeamMemberName; 
  creator: TeamMemberName;
  projectId: string; // New field linking task to a project
  type?: TaskType;
  trackingPreset?: TrackingPreset;
  createdAt: number;
  startDate?: number;
  dueDate?: number;
  // Pomodoro fields
  pomodoroSessions?: PomodoroSession[];
  totalPomodoros?: number;
  currentPomodoroTime?: number; // ms remaining when running/paused
  pomodoroStatus?: 'idle' | 'running' | 'paused' | 'break';
}

// Pomodoro session record
export interface PomodoroSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number;
  duration: number; // ms
  completed: boolean;
  type: 'work' | 'break';
  date: string; // ISO date YYYY-MM-DD
}

export interface PomodoroConfig {
  workDuration: number;    // ms
  shortBreak: number;      // ms
  longBreak: number;       // ms
  autoStartBreak: boolean;
  soundEnabled: boolean;
}

export type NewTask = Omit<Task, 'id' | 'createdAt'>;
export type NewProject = Omit<Project, 'id'>;

export interface DragItem {
  id: string;
  status: TaskStatus;
}
