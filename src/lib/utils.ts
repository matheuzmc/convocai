import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função auxiliar para extrair o caminho do arquivo da URL do Supabase Storage
export const getStoragePathFromUrl = (url: string | null | undefined, bucketName: string): string | null => {
  if (!url || !url.includes(`/${bucketName}/`) || url.startsWith('/')) { // Verifica presença de /bucketName/ e se não é caminho local
    return null;
  }
  try {
    // Encontra o índice onde o caminho do bucket começa (após a /)
    const bucketPathIndex = url.indexOf(`/${bucketName}/`) + `/${bucketName}/`.length;
    if (bucketPathIndex < `/${bucketName}/`.length) return null; // Segurança
    
    const filePathWithQuery = url.substring(bucketPathIndex);
    // Remove potenciais query params como '?t=...'
    return filePathWithQuery.split('?')[0];
  } catch (error) {
    console.error("Erro ao extrair caminho do storage da URL:", url, error);
  }
  return null;
};
