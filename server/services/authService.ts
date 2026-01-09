import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import firebaseAdmin from '../config/firebase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Función para generar IDs únicos (similar a cuid)
const generateId = () => {
  return 'c' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FirebaseAuthData {
  idToken: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId, email, type: 'refresh' }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

export const registerUser = async (data: RegisterData) => {
  const { email, password, firstName, lastName } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  // Obtener el rol de usuario por defecto
  let userRole = await prisma.role.findFirst({
    where: { name: 'user' },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        id: generateId(),
        name: 'user',
        description: 'Usuario regular',
        permissions: ['tasks:read', 'tasks:write'],
        updatedAt: new Date(),
      },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id: generateId(),
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      roleId: userRole.id,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roleId: true,
      createdAt: true,
    },
  });

  const tokens = generateTokens(user.id, user.email);

  return { user, ...tokens };
};

export const loginUser = async (data: LoginData) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { Role: true },
  });

  if (!user || !user.password) {
    throw new Error('Credenciales inválidas');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new Error('Credenciales inválidas');
  }

  const tokens = generateTokens(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.Role.name,
    },
    ...tokens,
  };
};

export const firebaseRegister = async (data: FirebaseAuthData) => {
  const { idToken, firstName, lastName } = data;

  const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
  const { uid, email } = decodedToken;

  if (!email) {
    throw new Error('No se pudo obtener el email de Firebase');
  }

  let user = await prisma.user.findUnique({
    where: { firebaseUid: uid },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Vincular cuenta existente con Firebase
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: uid, updatedAt: new Date() },
      });
    } else {
      // Obtener rol de usuario
      let userRole = await prisma.role.findFirst({
        where: { name: 'user' },
      });

      if (!userRole) {
        userRole = await prisma.role.create({
          data: {
            id: generateId(),
            name: 'user',
            description: 'Usuario regular',
            permissions: ['tasks:read', 'tasks:write'],
            updatedAt: new Date(),
          },
        });
      }

      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          id: generateId(),
          email,
          firebaseUid: uid,
          firstName: firstName || decodedToken.name?.split(' ')[0] || '',
          lastName: lastName || decodedToken.name?.split(' ').slice(1).join(' ') || '',
          roleId: userRole.id,
          updatedAt: new Date(),
        },
      });
    }
  }

  const tokens = generateTokens(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    ...tokens,
  };
};

export const firebaseLogin = async (data: FirebaseAuthData) => {
  const { idToken } = data;

  const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
  const { uid, email } = decodedToken;

  let user = await prisma.user.findUnique({
    where: { firebaseUid: uid },
    include: { Role: true },
  });

  if (!user && email) {
    user = await prisma.user.findUnique({
      where: { email },
      include: { Role: true },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: uid, updatedAt: new Date() },
        include: { Role: true },
      });
    }
  }

  if (!user) {
    throw new Error('Usuario no registrado. Por favor, regístrate primero.');
  }

  const tokens = generateTokens(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.Role.name,
    },
    ...tokens,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const tokens = generateTokens(user.id, user.email);

    return tokens;
  } catch (error) {
    throw new Error('Token de refresco inválido o expirado');
  }
};
