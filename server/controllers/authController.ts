import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const result = await authService.loginUser({ email, password });

    res.json({
      message: 'Login exitoso',
      ...result,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const firebaseRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, firstName, lastName } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Token de Firebase requerido' });
      return;
    }

    const result = await authService.firebaseRegister({
      idToken,
      firstName,
      lastName,
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente con Firebase',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const firebaseLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Token de Firebase requerido' });
      return;
    }

    const result = await authService.firebaseLogin({ idToken });

    res.json({
      message: 'Login exitoso con Firebase',
      ...result,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token requerido' });
      return;
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    res.json({
      message: 'Token renovado exitosamente',
      ...tokens,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
