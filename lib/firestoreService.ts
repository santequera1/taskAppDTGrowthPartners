
import { db } from "./firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, arrayUnion, increment } from "firebase/firestore";
import { Task, Project } from '../types';

const TASKS_COLLECTION = 'tasks';
const PROJECTS_COLLECTION = 'projects';

// Tasks
export const loadTasks = async (): Promise<Task[]> => {
  const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Task));
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log('firestoreService.createTask payload:', task);
    // Remove undefined fields because Firestore doesn't accept `undefined` values
    const payload: any = { ...task, createdAt: Date.now() };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    const docRef = await addDoc(collection(db, TASKS_COLLECTION), payload);
    return docRef.id;
  } catch (err) {
    console.error('firestoreService.createTask error', err);
    throw err;
  }
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<void> => {
  // Sanitize update payload as well
  const payload: any = { ...task };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await updateDoc(taskRef, payload);
};

export const deleteTask = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, TASKS_COLLECTION, id));
};

// Projects
export const loadProjects = async (): Promise<Project[]> => {
  const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Project));
};

export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), project);
  return docRef.id;
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<void> => {
  const projectRef = doc(db, PROJECTS_COLLECTION, id);
  await updateDoc(projectRef, project);
};

export const deleteProject = async (id: string): Promise<void> => {
  // Note: This only deletes the project doc. You might want to delete associated tasks in a batch write.
  await deleteDoc(doc(db, PROJECTS_COLLECTION, id));
};

// Pomodoro helpers
import { PomodoroSession } from '../types';

export const updateTaskPomodoro = async (taskId: string, session: PomodoroSession): Promise<void> => {
  const taskDoc = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskDoc, {
    pomodoroSessions: arrayUnion(session),
    totalPomodoros: increment(1),
    currentPomodoroTime: null,
    pomodoroStatus: 'idle'
  });
};

export const updateTaskPomodoroState = async (
  taskId: string,
  state: { pomodoroStatus?: string; currentPomodoroTime?: number | null }
): Promise<void> => {
  const taskDoc = doc(db, TASKS_COLLECTION, taskId);
  // sanitize
  const payload: any = { ...state };
  Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
  await updateDoc(taskDoc, payload);
};

export const updateTaskImages = async (taskId: string, images: any[]): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskRef, {
    images: images,
    imageCount: images.length
  });
};
