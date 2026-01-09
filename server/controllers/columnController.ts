import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';

export const getColumns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;

    const where: any = {};
    if (projectId) where.projectId = Number(projectId);

    const columns = await prisma.column.findMany({
      where,
      include: {
        tasks: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    res.json(columns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const column = await prisma.column.findUnique({
      where: { id: Number(id) },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        project: true,
      },
    });

    if (!column) {
      res.status(404).json({ error: 'Columna no encontrada' });
      return;
    }

    res.json(column);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, position, color, projectId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }

    const column = await prisma.column.create({
      data: {
        name,
        position: position || 0,
        color,
        projectId: projectId ? Number(projectId) : null,
      },
    });

    res.status(201).json(column);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, position, color, projectId } = req.body;

    const existingColumn = await prisma.column.findUnique({
      where: { id: Number(id) },
    });

    if (!existingColumn) {
      res.status(404).json({ error: 'Columna no encontrada' });
      return;
    }

    const column = await prisma.column.update({
      where: { id: Number(id) },
      data: {
        name,
        position,
        color,
        projectId: projectId !== undefined ? (projectId ? Number(projectId) : null) : undefined,
      },
    });

    res.json(column);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingColumn = await prisma.column.findUnique({
      where: { id: Number(id) },
    });

    if (!existingColumn) {
      res.status(404).json({ error: 'Columna no encontrada' });
      return;
    }

    await prisma.column.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Columna eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePositions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { columns } = req.body;

    if (!Array.isArray(columns)) {
      res.status(400).json({ error: 'Se requiere un array de columnas' });
      return;
    }

    await prisma.$transaction(
      columns.map((col: { id: number; position: number }) =>
        prisma.column.update({
          where: { id: col.id },
          data: { position: col.position },
        })
      )
    );

    res.json({ message: 'Posiciones actualizadas exitosamente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
