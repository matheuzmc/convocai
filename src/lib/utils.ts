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

// Função para obter dados de exibição do usuário (nome e iniciais)
export function getUserDisplayData(userData: {
  name: string | null | undefined;
  lastName?: string | null | undefined;
  email?: string | null | undefined;
}): { displayName: string; fallbackInitials: string } {
  const firstName = userData.name;
  const lastName = userData.lastName;
  let displayName = "Usuário"; // Fallback padrão

  if (firstName && lastName) {
    displayName = `${firstName} ${lastName}`;
  } else if (firstName) {
    displayName = firstName;
  }

  // Fallback final para displayName se nem nome nem sobrenome estiverem disponíveis
  if (displayName === "Usuário" && userData.email) {
    displayName = userData.email;
  }

  // Calcular iniciais para o AvatarFallback
  let fallbackInitials = "U"; // Fallback padrão
  if (firstName && lastName) {
    const lastNameWords = lastName.trim().split(/\s+/); // Divide o sobrenome em palavras
    const lastWordOfLastName = lastNameWords[lastNameWords.length - 1]; // Pega a última palavra
    if (lastWordOfLastName) {
      fallbackInitials = `${firstName[0]}${lastWordOfLastName[0]}`.toUpperCase(); // Primeira do nome + Primeira do último sobrenome
    } else {
      // Fallback se o sobrenome for só espaço em branco
      fallbackInitials = firstName[0].toUpperCase();
    }
  } else if (firstName) {
    // Se só tiver nome, pega a primeira letra do nome
    fallbackInitials = firstName[0].toUpperCase();
  } else if (displayName !== "Usuário" && displayName.includes('@')) {
    // Tenta pegar a inicial do email se o nome não estiver disponível
    fallbackInitials = displayName[0].toUpperCase();
  }

  return { displayName, fallbackInitials };
}
