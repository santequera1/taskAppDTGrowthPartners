import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';

// Función para generar IDs únicos
const generateId = () => {
  return 'c' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        User: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        TaskComment: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        TaskComment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      position,
      color,
      images,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'El título es requerido' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        id: generateId(),
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        position: position || 0,
        color,
        images: images || [],
        createdBy: req.user.id,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      position,
      color,
      images,
    } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        position,
        color,
        images,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    if (!text) {
      res.status(400).json({ error: 'El texto del comentario es requerido' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        id: generateId(),
        text,
        author: author || req.user?.email || 'Anónimo',
        taskId: id,
      },
    });

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePositions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      res.status(400).json({ error: 'Se requiere un array de tareas' });
      return;
    }

    await prisma.$transaction(
      tasks.map((task: { id: string; position: number }) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            position: task.position,
            updatedAt: new Date(),
          },
        })
      )
    );

    res.json({ message: 'Posiciones actualizadas exitosamente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
