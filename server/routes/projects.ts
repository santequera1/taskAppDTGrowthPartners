import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de proyectos
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
