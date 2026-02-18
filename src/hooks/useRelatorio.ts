import { useQuery } from "@tanstack/react-query";
import { VibracaoRelatorioResponse, UltrasomRelatorioResponse } from "@/types/vibracao";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export type RelatorioResponse = VibracaoRelatorioResponse | UltrasomRelatorioResponse;

export const fetchRelatorio = async (idRelatorio: string): Promise<RelatorioResponse> => {
  // Tentar buscar dados de Ultrassom primeiro
  try {
    const ultrasomUrl = `${API_BASE_URL}/get-relatorio-ultrassom?id_relatorio=${idRelatorio}`;
    const response = await fetch(ultrasomUrl);
    
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data: UltrasomRelatorioResponse = await response.json();
        // Se a resposta tem a estrutura de ultrassom, retorna
        if (data.relatorio && data.relatorio.ultrassom) {
          return data;
        }
      }
    }
  } catch (error) {
    console.warn("Erro ao buscar Ultrassom, tentando Vibracao...", error);
  }

  // Fallback para Vibracao
  const vibracaoUrl = `${API_BASE_URL}/get-vibracao?id_relatorio=${idRelatorio}`;
  const response = await fetch(vibracaoUrl);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar relatório: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const bodyText = await response.text();
    throw new Error(`Resposta inesperada da API: ${bodyText.slice(0, 120)}`);
  }

  const data: VibracaoRelatorioResponse = await response.json();
  if (!data.success) {
    throw new Error("Erro ao buscar relatório: resposta inválida");
  }

  return data;
};

export const useRelatorio = (idRelatorio: string | null) => {
  return useQuery({
    queryKey: ["relatorio", idRelatorio],
    queryFn: () => fetchRelatorio(idRelatorio!),
    enabled: !!idRelatorio,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
