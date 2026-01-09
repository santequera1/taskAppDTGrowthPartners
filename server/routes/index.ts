import { Router } from 'express';
import authRoutes from './auth';
import taskRoutes from './tasks';
import projectRoutes from './projects';
import columnRoutes from './columns';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/columns', columnRoutes);

export default router;
