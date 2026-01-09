import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, columnId, status, priority } = req.query;

    const where: any = {};

    if (projectId) where.projectId = Number(projectId);
    if (columnId) where.columnId = Number(columnId);
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        column: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true, color: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
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
      where: { id: Number(id) },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        column: true,
        project: true,
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
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
      columnId,
      projectId,
      userId,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'El título es requerido' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        position: position || 0,
        color,
        images: images || [],
        columnId: columnId ? Number(columnId) : null,
        projectId: projectId ? Number(projectId) : null,
        userId: userId ? Number(userId) : req.user?.id,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        column: true,
        project: true,
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
      columnId,
      projectId,
      userId,
    } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        position,
        color,
        images,
        columnId: columnId !== undefined ? (columnId ? Number(columnId) : null) : undefined,
        projectId: projectId !== undefined ? (projectId ? Number(projectId) : null) : undefined,
        userId: userId !== undefined ? (userId ? Number(userId) : null) : undefined,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        column: true,
        project: true,
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
      where: { id: Number(id) },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    await prisma.task.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'El contenido del comentario es requerido' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId: Number(id),
        userId: req.user.id,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
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
      tasks.map((task: { id: number; position: number; columnId?: number }) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            position: task.position,
            columnId: task.columnId !== undefined ? task.columnId : undefined,
          },
        })
      )
    );

    res.json({ message: 'Posiciones actualizadas exitosamente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
