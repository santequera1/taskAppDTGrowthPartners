import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de tareas
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Comentarios
router.post('/:id/comments', taskController.addComment);

// Actualizar posiciones (para drag & drop)
router.put('/batch/positions', taskController.updatePositions);

export default router;
