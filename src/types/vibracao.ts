export interface Vibracao {
  id: number;
  created_at: string;
  id_cliente: number;
  id_relatorio: number;
  localizacao: string;
  setor: string;
  status: "Normal" | "Alerta" | "Crítico" | string;
  observacao: string;
  velocidade_global: string;
  velocidade_admissivel: string;
  foto_equipamento: string | null;
  foto_espectro: string | null;
  componente: string;
  descricao_problema: string;
  recomendacao: string;
  tag: string;
  id_user: number;
  rpm: string;
  potencia: string;
  frequencia_fundamental: string;
  ponto_medicao: string;
}

export interface VibracaoEquipamento {
  id: number;
  area?: string | null;
  local?: string | null;
  modelo?: string | null;
  rotacao?: string | null;
  conjunto?: string | null;
  potencia?: string | null;
  descricao?: string | null;
  fabricante?: string | null;
  foto_equipamento?: string | null;
  rolamento?: string | null;
  alimentacao?: string | null;
  transmissao?: string | null;
}

export interface VibracaoItem {
  id: number;
  foto: string | null;
  local: string;
  area?: string;
  conjunto: string;
  espectro: string | null;
  diagnostico: string | null;
  equipamento: VibracaoEquipamento | null;
  recomendacao: string | null;
  status?: string;
  st3?: string;
  data_exe?: string;
}

export interface VibracaoCliente {
  id: number;
  cnpj?: string;
  logo?: string | null;
  nome: string;
  cidade?: string;
  estado?: string | null;
  email?: string;
  telefone?: string;
  pessoa_contato?: string;
  departamento_contato?: string;
}

export interface VibracaoUsuario {
  id: number;
  nome: string;
  email?: string;
  foto_assinatura?: string | null;
  departamento?: string;
  telefone?: string;
}

export interface VibracaoRelatorio {
  id: number;
  n_relatorio: string;
  tipo: string;
  status: string;
  created_at: string;
  dataExe: string;
  cliente?: VibracaoCliente;
  usuario?: VibracaoUsuario;
  aprovador?: VibracaoUsuario | null;
  vibracoes: VibracaoItem[];
}

export interface VibracaoRelatorioResponse {
  success: boolean;
  relatorio: VibracaoRelatorio;
}

// Tipos para Ultrassom
export interface UltrasomCliente {
  id: number;
  cnpj: string;
  logo: string | null;
  nome: string;
  ativo: boolean;
  email: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone: string;
  valor_gas: number;
  valor_kwh: number;
  created_at: string;
  valor_vapor: number | null;
  horas_trabalho: number;
  pessoa_contato: string;
  departamento_contato: string;
}

export interface UltrasomItem {
  id?: number;
  foto?: string | null;
  local?: string;
  area?: string;
  conjunto?: string;
  diagnostico?: string | null;
  recomendacao?: string | null;
  status?: string;
  [key: string]: any;
}

export interface UltrasomRelatorio {
  id: number;
  n_relatorio: string | null;
  tipo: string;
  status: string;
  dataExe: string;
  data_execucao: string;
  tipoVazamento: string | null;
  num_revisao: string | null;
  cliente: UltrasomCliente;
  ultrassom: UltrasomItem[];
}

export interface UltrasomRelatorioResponse {
  success?: boolean;
  relatorio: UltrasomRelatorio;
}

export interface SeverityLevel {
  range: string;
  classification: string;
  color: string;
  bgColor: string;
}

export const SEVERITY_LEVELS: SeverityLevel[] = [
  { range: "0,00 a 0,70", classification: "BOM", color: "text-green-700", bgColor: "bg-green-100" },
  { range: "0,71 a 1,80", classification: "ACEITÁVEL", color: "text-green-600", bgColor: "bg-green-50" },
  { range: "1,81 a 4,50", classification: "ALERTA", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  { range: "4,51 a 7,10", classification: "ALTO", color: "text-orange-700", bgColor: "bg-orange-100" },
  { range: "7,11 a 11,20", classification: "CRÍTICO", color: "text-red-600", bgColor: "bg-red-100" },
  { range: "≥ 11,21", classification: "MUITO CRÍTICO", color: "text-red-800", bgColor: "bg-red-200" },
];

export const mapVibracaoStatusToStatusType = (status: string): "normal" | "alert" | "critical" | "maintenance" | "off" => {
  const statusLower = status.toLowerCase();
  if (statusLower === "normal" || statusLower === "bom" || statusLower === "aceitável" || statusLower === "aceitavel" || statusLower === "n") return "normal";
  if (statusLower === "alerta" || statusLower === "a1") return "alert";
  if (statusLower === "crítico" || statusLower === "critico" || statusLower === "alto" || statusLower === "muito crítico" || statusLower === "a2") return "critical";
  if (statusLower === "manutenção" || statusLower === "manutencao") return "maintenance";
  if (statusLower === "desligado") return "off";
  return "normal";
};
