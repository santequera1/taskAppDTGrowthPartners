import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

let serviceAccount: admin.ServiceAccount | null = null;

// Intentar cargar desde archivo primero
const serviceAccountPath = resolve(process.cwd(), 'firebase-service-account.json');
if (existsSync(serviceAccountPath)) {
  try {
    const fileContent = readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(fileContent);
  } catch (e) {
    console.warn('No se pudo cargar firebase-service-account.json:', e);
  }
}

// Si no hay archivo, intentar desde variable de entorno
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.warn('No se pudo parsear FIREBASE_SERVICE_ACCOUNT:', e);
  }
}

if (serviceAccount && !admin.apps?.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
