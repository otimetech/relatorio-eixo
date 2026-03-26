import { useQuery } from "@tanstack/react-query";
import {
  EixoItem,
  EixoRelatorioResponse,
  UltrasomRelatorioResponse,
  VibracaoRelatorioResponse,
} from "@/types/vibracao";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export type RelatorioResponse = VibracaoRelatorioResponse | UltrasomRelatorioResponse;

const normalizeEixoResponse = (payload: EixoRelatorioResponse): UltrasomRelatorioResponse => {
  const alinhamentos = payload.alinhamento_eixo ?? [];

  const hasVertical = (item: EixoItem) =>
    Boolean(item.inicial_vertical_a || item.inicial_vertical_b || item.final_vertical_a || item.final_vertical_b);
  const hasHorizontal = (item: EixoItem) =>
    Boolean(item.inicial_horizontal_a || item.inicial_horizontal_b || item.final_horizontal_a || item.final_horizontal_b);

  return {
    relatorio: {
      ...payload.relatorio,
      cliente: payload.cliente,
      executor: payload.usuario,
      aprovador: payload.aprovador,
      alinhamentos: alinhamentos.map((item) => ({
        ...item,
        velocidade: item.rotacao,
        valor_desalinhamento: item.tolerancia,
        distancia_cabecotes: item.num_ensaio,
        consideracao_final: item.status,
        desalinhamento_vertical: hasVertical(item),
        desalinhamento_horizontal: hasHorizontal(item),
        desalinhamento_paralelo: false,
        desalinhamento_combinado: hasVertical(item) && hasHorizontal(item),
      })),
      ultrassom: alinhamentos.map((item) => ({
        id: item.id,
        foto_painel: item.foto_epto || null,
        foto_camera: null,
        diagnostico: item.comentario || "-",
        recomendacao: item.status || "-",
        status: item.status || payload.relatorio.status || "Não iniciado",
      })),
    },
  } as UltrasomRelatorioResponse;
};

export const fetchRelatorio = async (idRelatorio: string): Promise<RelatorioResponse> => {
  const eixoUrl = `${API_BASE_URL}/get-relatorio-eixo?id_relatorio=${idRelatorio}`;
  const eixoResponse = await fetch(eixoUrl);

  if (eixoResponse.ok) {
    const contentType = eixoResponse.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const eixoData: EixoRelatorioResponse = await eixoResponse.json();

      if (eixoData?.relatorio?.id && Array.isArray(eixoData.alinhamento_eixo)) {
        return normalizeEixoResponse(eixoData);
      }
    }
  }

  if (eixoResponse.status >= 400) {
    throw new Error(`Erro ao buscar relatório de eixo: ${eixoResponse.status}`);
  }

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
