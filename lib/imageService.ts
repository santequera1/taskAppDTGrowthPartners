/**
 * Servicio de imágenes usando Base64
 * Sin dependencias externas
 */

/**
 * Convierte una imagen a Base64 comprimida
 * @param file - Archivo de imagen
 * @param maxWidth - Ancho máximo (default 800px)
 * @param maxHeight - Alto máximo (default 600px)
 * @param quality - Calidad JPEG 0-1 (default 0.7)
 * @returns Base64 string
 */
export const convertImageToBase64 = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.7
): Promise<string> => {

  console.log('🖼️ Convirtiendo imagen:', file.name);
  console.log('📦 Tamaño original:', (file.size / 1024).toFixed(2), 'KB');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Crear canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear contexto de canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Base64
        const base64 = canvas.toDataURL('image/jpeg', quality);

        // Calcular tamaño final
        const finalSize = (base64.length * 0.75) / 1024; // Aproximado en KB
        console.log('✅ Tamaño comprimido:', finalSize.toFixed(2), 'KB');
        console.log('📐 Dimensiones:', width, 'x', height);

        // Validar tamaño final
        if (finalSize > 1024) { // > 1MB
          reject(new Error('Imagen muy grande incluso después de comprimir. Intenta con una imagen más pequeña.'));
          return;
        }

        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Valida una imagen antes de procesarla
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Solo se permiten archivos de imagen' };
  }

  // Validar tamaño (5MB máximo antes de comprimir)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'La imagen no debe superar 5MB' };
  }

  return { valid: true };
};

/**
 * Crea un thumbnail desde Base64
 */
export const createThumbnail = async (
  base64: string,
  size: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Error creando thumbnail'));
        return;
      }

      // Crop to square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => reject(new Error('Error procesando thumbnail'));
    img.src = base64;
  });
};