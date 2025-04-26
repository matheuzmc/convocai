// src/lib/constants.ts

// Opções de compressão para avatares de usuário
export const AVATAR_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,        // Tamanho máximo em MB
  maxWidthOrHeight: 800, // Resolução máxima
  fileType: 'image/webp', // Formato de saída preferido
  useWebWorker: true,    // Usa Web Worker para não bloquear a thread principal
};

// Opções de compressão para imagens de grupo (banners)
export const GROUP_IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,        // Tamanho similar ao avatar
  maxWidthOrHeight: 800, // Resolução similar ao avatar
  fileType: 'image/webp', // Formato de saída preferido
  useWebWorker: true,
};

// Outras constantes podem ser adicionadas aqui... 