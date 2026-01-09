import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Crear roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: {
        tasks: ['create', 'read', 'update', 'delete'],
        projects: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        columns: ['create', 'read', 'update', 'delete'],
      },
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      permissions: {
        tasks: ['create', 'read', 'update', 'delete'],
        projects: ['read'],
        users: ['read'],
        columns: ['read'],
      },
    },
  });

  console.log('Roles creados:', { adminRole, userRole });

  // Crear usuario admin por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dtgrowthpartners.com' },
    update: {},
    create: {
      email: 'admin@dtgrowthpartners.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'DT Growth',
      roleId: adminRole.id,
    },
  });

  console.log('Usuario admin creado:', adminUser.email);

  // Crear proyectos por defecto
  const proyectos = [
    { name: 'Equilibrio Clinic', description: 'Proyecto principal', color: '#10B981' },
    { name: 'E-commerce V1', description: 'Tienda online', color: '#6366F1' },
    { name: 'Interno', description: 'Tareas internas', color: '#F59E0B' },
  ];

  for (const proyecto of proyectos) {
    await prisma.project.upsert({
      where: { id: proyectos.indexOf(proyecto) + 1 },
      update: proyecto,
      create: proyecto,
    });
  }

  console.log('Proyectos creados');

  // Crear columnas por defecto
  const columnas = [
    { name: 'Por Hacer', position: 0, color: '#6B7280' },
    { name: 'En Progreso', position: 1, color: '#3B82F6' },
    { name: 'En Revisión', position: 2, color: '#F59E0B' },
    { name: 'Completado', position: 3, color: '#10B981' },
  ];

  for (const columna of columnas) {
    await prisma.column.upsert({
      where: { id: columnas.indexOf(columna) + 1 },
      update: columna,
      create: columna,
    });
  }

  console.log('Columnas creadas');

  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
