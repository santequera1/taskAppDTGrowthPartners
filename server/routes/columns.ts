import { Router } from 'express';
import * as columnController from '../controllers/columnController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de columnas
router.get('/', columnController.getColumns);
router.get('/:id', columnController.getColumn);
router.post('/', columnController.createColumn);
router.put('/:id', columnController.updateColumn);
router.delete('/:id', columnController.deleteColumn);

// Actualizar posiciones
router.put('/batch/positions', columnController.updatePositions);

export default router;
