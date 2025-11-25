import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from './firebase';

// Subir imagen
export const uploadTaskImage = async (
  taskId: string,
  file: File,
  uploadedBy: string,
  onProgress?: (progress: number) => void
): Promise<string> => {  // Retornar solo la URL

  console.log('📤 Iniciando upload...', { taskId, fileName: file.name });

  try {
    // Generar nombre único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomId}_${file.name}`;

    // Crear referencia en Storage
    const storageRef = ref(storage, `tasks/${taskId}/${fileName}`);

    console.log('📁 Storage path:', storageRef.fullPath);

    // Iniciar upload con seguimiento de progreso
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Crear promesa que resuelve cuando termina el upload
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',

        // Progress callback
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(1)}%`);

          if (onProgress) {
            onProgress(progress);
          }
        },

        // Error callback
        (error) => {
          console.error('❌ Upload error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          reject(error);
        },

        // Success callback
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Upload complete! URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });

  } catch (error) {
    console.error('❌ Error en uploadTaskImage:', error);
    throw error;
  }
};

// Eliminar imagen
export const deleteTaskImage = async (
  taskId: string,
  imageUrl: string
): Promise<void> => {
  try {
    // Extraer el path de la URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    console.log('🗑️ Image deleted:', path);
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw error;
  }
};
