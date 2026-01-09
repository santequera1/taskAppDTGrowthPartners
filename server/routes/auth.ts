import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// Registro tradicional (email/password)
router.post('/register', authController.register);

// Login tradicional
router.post('/login', authController.login);

// Registro con Firebase/Google
router.post('/firebase/register', authController.firebaseRegister);

// Login con Firebase/Google
router.post('/firebase/login', authController.firebaseLogin);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

export default router;
