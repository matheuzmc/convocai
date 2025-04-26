"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUserProfile } from "@/services/api";

export const useCurrentUser = () => {
  return useQuery({
    // queryKey: Identificador único para esta query. 
    // Usamos 'currentUser' para que o React Query possa gerenciar o cache.
    queryKey: ['currentUser'], 
    // queryFn: A função assíncrona que busca os dados.
    queryFn: getCurrentUserProfile,
    // Opções adicionais (opcional):
    // staleTime: Quanto tempo (em ms) os dados são considerados "frescos" (evita refetchs imediatos).
    // staleTime: 5 * 60 * 1000, // 5 minutos
    // cacheTime: Quanto tempo (em ms) os dados inativos ficam no cache.
    // cacheTime: 10 * 60 * 1000, // 10 minutos
    // refetchOnWindowFocus: Buscar novamente quando a janela recebe foco?
    // refetchOnWindowFocus: false,
  });
}; 