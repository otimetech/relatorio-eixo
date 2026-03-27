import { useQuery } from "@tanstack/react-query";
import {
  EixoItem,
  EixoRelatorioResponse,
  UltrasomRelatorioResponse,
  VibracaoRelatorioResponse,
} from "@/types/vibracao";

const DEFAULT_API_BASE_URL = "https://ayfkjjdgrbymmlkuzbig.supabase.co/functions/v1";

const normalizeBaseUrl = (value?: string) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/\/+$/, "");
};

const API_BASE_URLS = Array.from(
  new Set([
    normalizeBaseUrl(import.meta.env.VITE_API_URL),
    "/api",
    DEFAULT_API_BASE_URL,
  ].filter((value): value is string => Boolean(value))),
);

export type RelatorioResponse = VibracaoRelatorioResponse | UltrasomRelatorioResponse;

type ApiFetchResult<T> = {
  data: T | null;
  errors: string[];
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido";
};

const getUnexpectedResponseMessage = (url: string, contentType: string, bodyText: string) => {
  const responseSnippet = bodyText.slice(0, 120).replace(/\s+/g, " ").trim();
  const effectiveContentType = contentType || "desconhecido";

  return `Resposta inesperada da API em ${url} (${effectiveContentType}): ${responseSnippet || "corpo vazio"}`;
};

const fetchJsonFromApi = async <T>(endpointPath: string): Promise<ApiFetchResult<T>> => {
  const errors: string[] = [];

  for (const apiBaseUrl of API_BASE_URLS) {
    const requestUrl = `${apiBaseUrl}${endpointPath}`;

    try {
      const response = await fetch(requestUrl);
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const bodyText = await response.text();
        errors.push(`Erro ao buscar relatório em ${requestUrl}: ${response.status} ${bodyText.slice(0, 120)}`.trim());
        continue;
      }

      if (!contentType.includes("application/json")) {
        const bodyText = await response.text();
        errors.push(getUnexpectedResponseMessage(requestUrl, contentType, bodyText));
        continue;
      }

      return {
        data: (await response.json()) as T,
        errors,
      };
    } catch (error) {
      errors.push(`Falha de rede ao buscar ${requestUrl}: ${getErrorMessage(error)}`);
    }
  }

  return {
    data: null,
    errors,
  };
};

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
  const queryParam = encodeURIComponent(idRelatorio);
  const collectedErrors: string[] = [];

  const eixoResult = await fetchJsonFromApi<EixoRelatorioResponse>(`/get-relatorio-eixo?id_relatorio=${queryParam}`);
  collectedErrors.push(...eixoResult.errors);

  if (eixoResult.data?.relatorio?.id && Array.isArray(eixoResult.data.alinhamento_eixo)) {
    return normalizeEixoResponse(eixoResult.data);
  }

  const ultrasomResult = await fetchJsonFromApi<UltrasomRelatorioResponse>(`/get-relatorio-ultrassom?id_relatorio=${queryParam}`);
  collectedErrors.push(...ultrasomResult.errors);

  if (ultrasomResult.data?.relatorio?.ultrassom) {
    return ultrasomResult.data;
  }

  const vibracaoResult = await fetchJsonFromApi<VibracaoRelatorioResponse>(`/get-vibracao?id_relatorio=${queryParam}`);
  collectedErrors.push(...vibracaoResult.errors);

  if (vibracaoResult.data?.success) {
    return vibracaoResult.data;
  }

  if (vibracaoResult.data && !vibracaoResult.data.success) {
    collectedErrors.push(vibracaoResult.data.error || "Erro ao buscar relatório: resposta inválida");
  }

  throw new Error(collectedErrors[0] || "Não foi possível carregar o relatório.");
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
