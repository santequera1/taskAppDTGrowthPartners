
import { db } from "./firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, arrayUnion, increment, where, getDoc } from "firebase/firestore";
import { Task, Project, BoardColumn } from '../types';

const TASKS_COLLECTION = 'tasks';
const PROJECTS_COLLECTION = 'projects';
const COMPLETED_TASKS_COLLECTION = 'completed_tasks';
const DELETED_TASKS_COLLECTION = 'deleted_tasks';

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

export const updateProjectOrder = async (projectId: string, order: number): Promise<void> => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  await updateDoc(projectRef, { order });
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

// Completed Tasks History
export const loadCompletedTasks = async (): Promise<Task[]> => {
  const q = query(collection(db, COMPLETED_TASKS_COLLECTION), orderBy('completedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Task));
};

export const moveTaskToCompleted = async (taskId: string, taskData: Task): Promise<void> => {
  // Add to completed tasks collection
  const completedTaskData = {
    ...taskData,
    completedAt: Date.now(),
    originalId: taskId
  };

  // Remove undefined fields
  const payload: any = { ...completedTaskData };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  await addDoc(collection(db, COMPLETED_TASKS_COLLECTION), payload);

  // Delete from active tasks
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
};

export const copyTaskToCompleted = async (taskId: string, taskData: Task): Promise<void> => {
  // Add to completed tasks collection without deleting from active tasks
  const completedTaskData = {
    ...taskData,
    completedAt: Date.now(),
    originalId: taskId
  };

  // Remove undefined fields
  const payload: any = { ...completedTaskData };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  await addDoc(collection(db, COMPLETED_TASKS_COLLECTION), payload);
};

export const restoreCompletedTask = async (completedTaskId: string): Promise<string> => {
  // Get the completed task
  const completedTaskDoc = doc(db, COMPLETED_TASKS_COLLECTION, completedTaskId);
  const completedTaskSnap = await getDoc(completedTaskDoc);

  if (!completedTaskSnap.exists()) {
    throw new Error('Completed task not found');
  }

  const taskData = completedTaskSnap.data() as Task;

  // Create new task in active tasks collection
  const newTaskData = {
    ...taskData,
    createdAt: Date.now(),
    completedAt: undefined,
    originalId: undefined
  };

  // Remove undefined fields
  const payload: any = { ...newTaskData };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  const newTaskRef = await addDoc(collection(db, TASKS_COLLECTION), payload);

  // Delete from completed tasks
  await deleteDoc(completedTaskDoc);

  return newTaskRef.id;
};

export const permanentlyDeleteCompletedTask = async (completedTaskId: string): Promise<void> => {
  await deleteDoc(doc(db, COMPLETED_TASKS_COLLECTION, completedTaskId));
};

// Deleted Tasks Management
export const loadDeletedTasks = async (): Promise<Task[]> => {
  const q = query(collection(db, DELETED_TASKS_COLLECTION), orderBy('deletedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Task));
};

export const moveTaskToDeleted = async (taskId: string, taskData: Task): Promise<void> => {
  // Add to deleted tasks collection
  const deletedTaskData = {
    ...taskData,
    deletedAt: Date.now(),
    originalId: taskId
  };

  // Remove undefined fields
  const payload: any = { ...deletedTaskData };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  await addDoc(collection(db, DELETED_TASKS_COLLECTION), payload);

  // Delete from active tasks
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
};

export const restoreDeletedTask = async (deletedTaskId: string): Promise<string> => {
  // Get the deleted task
  const deletedTaskDoc = doc(db, DELETED_TASKS_COLLECTION, deletedTaskId);
  const deletedTaskSnap = await getDoc(deletedTaskDoc);

  if (!deletedTaskSnap.exists()) {
    throw new Error('Deleted task not found');
  }

  const taskData = deletedTaskSnap.data() as Task;

  // Create new task in active tasks collection
  const newTaskData = {
    ...taskData,
    createdAt: Date.now(),
    deletedAt: undefined,
    originalId: undefined
  };

  // Remove undefined fields
  const payload: any = { ...newTaskData };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  const newTaskRef = await addDoc(collection(db, TASKS_COLLECTION), payload);

  // Delete from deleted tasks
  await deleteDoc(deletedTaskDoc);

  return newTaskRef.id;
};

export const permanentlyDeleteTask = async (deletedTaskId: string): Promise<void> => {
  await deleteDoc(doc(db, DELETED_TASKS_COLLECTION, deletedTaskId));
};

// Board Columns Management
const COLUMNS_COLLECTION = 'board_columns';

export const loadColumns = async (): Promise<BoardColumn[]> => {
  const q = query(collection(db, COLUMNS_COLLECTION), orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as BoardColumn));
};

export const createColumn = async (column: Omit<BoardColumn, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLUMNS_COLLECTION), column);
  return docRef.id;
};

export const updateColumn = async (id: string, column: Partial<BoardColumn>): Promise<void> => {
  const columnRef = doc(db, COLUMNS_COLLECTION, id);
  await updateDoc(columnRef, column);
};

export const deleteColumn = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLUMNS_COLLECTION, id));
};

export const updateColumnOrder = async (columnId: string, order: number): Promise<void> => {
  const columnRef = doc(db, COLUMNS_COLLECTION, columnId);
  await updateDoc(columnRef, { order });
};
