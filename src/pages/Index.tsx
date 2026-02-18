import { useParams, useSearchParams } from "react-router-dom";
import ReportHeader from "@/components/ReportHeader";
import ReportFooter from "@/components/ReportFooter";
import { useRelatorio, RelatorioResponse } from "@/hooks/useRelatorio";
import { UltrasomItem } from "@/types/vibracao";

const Index = () => {
  const { idRelatorio: paramId } = useParams<{
    idRelatorio?: string;
  }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("idRelatorio");

  // Suporta tanto /relatorio/:id quanto /?idRelatorio=id
  const idRelatorio = paramId || queryId;
  const {
    data,
    isLoading,
    error
  } = useRelatorio(idRelatorio);

  // Normalizar dados para suportar tanto vibracao quanto ultrassom
  const normalizeRelatorio = (response: RelatorioResponse) => {
    const relatorio = response.relatorio as any;
    // Se tem array ultrassom, normalize para vibracoes
    if (relatorio.ultrassom && !relatorio.vibracoes) {
      relatorio.vibracoes = relatorio.ultrassom.map((item: UltrasomItem) => ({
        id: item.id || 0,
        foto: item.foto_painel || item.foto1 || item.foto,
        foto2: item.foto_camera || item.foto2,
        setor: item.setor,
        num_vazamento: item.num_vazamento,
        localizacao: item.localizacao,
        componente: item.componente,
        valor_medido: item.valor_medido,
        local: item.local || item.localizacao || "",
        area: item.area || item.setor,
        conjunto: item.conjunto || "",
        espectro: null,
        diagnostico: item.diagnostico,
        equipamento: null,
        recomendacao: item.recomendacao,
        status: item.status,
        st3: item.status,
        data_exe: relatorio.dataExe
      }));
    }
    return relatorio;
  };

  const handlePrint = () => {
    window.print();
  };
  if (!idRelatorio) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-primary mb-4">Relatório de Ultrassom</h1>
          <p className="text-muted-foreground mb-6">
            Informe o ID do relatório na URL para visualizar os dados.
          </p>
          <div className="bg-secondary/30 rounded-lg p-4 text-sm font-mono">
            <p>/relatorio/38</p>
            <p className="text-muted-foreground mt-2">ou</p>
            <p>/?idRelatorio=38</p>
          </div>
        </div>
      </div>;
  }
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-destructive text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-destructive mb-2">Erro ao carregar relatório</h1>
          <p className="text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>;
  }
  if (!data) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum dado encontrado.</p>
      </div>;
  }

  // Normalizar dados para suportar tanto vibracao quanto ultrassom
  const relatorio = normalizeRelatorio(data);

  // Usar cliente do response ou do relatorio
  const clienteData = relatorio.cliente;
  // Usar executor do response ou do relatorio
  const executorData = relatorio.executor;
  // Usar aprovador do response ou do relatorio
  const aprovadorData = relatorio.aprovador;

  const getReportDateString = () => {
    if (relatorio.data_execucao) {
      return relatorio.data_execucao;
    }
    return relatorio.dataExe;
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(dateStr);
  };

  const formatDataExe = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString("pt-BR");
  };

  // Formatar data
  const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString("pt-BR");
  };

  // Formatar data como mês/ano
  const formatMonthYear = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/de /g, "");
  };
  return <div className="min-h-screen bg-background py-8 px-4 print:p-0 print:bg-white">
      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button onClick={handlePrint} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimir A4
        </button>
      </div>

      <div className="a4-container">
        
        {/* Cover Page */}
        <div className="report-page print-break flex flex-col text-center">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <img src="/logo-jundpred.jpg" alt="JundPred - Manutenção Preditiva" className="cover-logo h-8 w-auto" />
              <img src="/logo_brasil.jpg" alt="Logo Brasil" className="cover-logo h-8 w-auto" />
            </div>

            <div className="bg-primary text-primary-foreground py-4 px-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold">RELATÓRIO DE MANUTENÇÃO PREDITIVA</h2>
              <p className="text-lg mt-2">REF. INSPEÇÃO ANÁLISE POR ULTRASSOM</p>
              <p className="text-sm mt-2 opacity-80">Nº {`${relatorio.id} ${relatorio.num_revisao ?? ""}`.trim()}</p>
            </div>

            <div className="mb-8 flex justify-center items-center">
              <img src="/vibracao-cover.jpg" alt="Imagem de Análise de Ultrassom" className="cover-image rounded-lg" style={{ width: "160px", height: "120px", objectFit: "cover" }} />
            </div>

            {clienteData?.logo && <div className="mb-8">
              <img src={clienteData.logo} alt={clienteData.nome} className="cover-logo h-20 w-auto mx-auto" />
            </div>}

            {clienteData && <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-center">
                <h3 className="font-semibold text-primary mb-2">Cliente / Unidade</h3>
                <p className="font-bold text-lg">{clienteData.nome} - {clienteData.cidade}/{clienteData.estado}</p>
                
              </div>}

            <div className="grid grid-cols-1 gap-8 text-center max-w-lg mx-auto">
              <div>
                <p className="text-muted-foreground text-sm">Data da Inspeção</p>
                <p className="font-semibold">{formatMonthYear(relatorio.dataExe)}</p>
              </div>
              
            </div>
          </div>

          <ReportFooter />
        </div>

        {/* Letter Page */}
        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
          <ReportHeader />
          
          <div className="text-right text-sm text-muted-foreground mb-8">
            Jundiaí, {formatDataExe(relatorio.dataExe)}.
          </div>

          <div className="mb-8">
            <p className="text-sm text-muted-foreground">A/C:</p>
            <p className="font-semibold">{clienteData?.pessoa_contato || "Departamento de Manutenção"}</p>
            {clienteData?.departamento_contato && <p className="text-sm text-muted-foreground">{clienteData.departamento_contato}</p>}
            {clienteData && <div className="mt-2 text-sm">
                <p className="font-medium">{clienteData.nome}</p>
                <p className="text-muted-foreground">{clienteData.email}</p>
                <p className="text-muted-foreground">{clienteData.telefone}</p>
              </div>}
          </div>

          <div className="mb-8">
            
            <p className="text-foreground leading-relaxed">Referente à inspeção de análise por ultrassom nos equipamentos na data de <strong>{getReportDateString()}</strong>.
              <br />
              Relatório Nº <strong>{`${relatorio.id} ${relatorio.num_revisao ?? ""}`.trim()}</strong>.
              <br />
              O princípio do trabalho visa diagnosticar por intermédio do instrumento Digital ultrassonico
              com indicação em tela LCD, os pontos com vazamento, e o quanto está sendo desperdiçado
              em termos de vazão de energia, e o quanto representa financeiramente os desperdícios.
            </p>
          </div>

          <div className="mb-8">
            <p className="mb-4">Atenciosamente,</p>
            <div className="border-l-4 border-primary pl-4">
              <p className="font-semibold">Luís Henrique Guimarães Stefani</p>
              <p className="text-muted-foreground text-sm">DIETOR COMERCIAL</p>
              <p className="text-sm mt-2">luis@jundpred.com.br</p>
              <p className="text-sm mt-2">Tel.: (11) 2817-0616</p>
              <p className="text-sm mt-2">Cel.: (11) 97471-9744</p>
            </div>
          </div>
          </div>
          <ReportFooter />
        </div>

        {/* Vazamentos - 1 por pagina */}
        {relatorio.vibracoes && relatorio.vibracoes.length > 0 ? (
          relatorio.vibracoes.map((item, index) => (
            <div key={item.id || index} className="report-page print-break flex flex-col">
              <div className="flex-1">
                <ReportHeader />

                <h2 className="report-title">REGISTRO DE VAZAMENTO {index + 1}</h2>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="border border-gray-300 p-2 text-left">#</th>
                        <th className="border border-gray-300 p-2 text-left">Setor</th>
                        <th className="border border-gray-300 p-2 text-left">Nº lacre</th>
                        <th className="border border-gray-300 p-2 text-left">Localização</th>
                        <th className="border border-gray-300 p-2 text-left">Componente</th>
                        <th className="border border-gray-300 p-2 text-left">Valor medido</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-secondary/50">
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{item.setor || item.area || "-"}</td>
                        <td className="border border-gray-300 p-2">{item.num_vazamento || "-"}</td>
                        <td className="border border-gray-300 p-2">{item.localizacao || item.local || "-"}</td>
                        <td className="border border-gray-300 p-2">{item.componente || "-"}</td>
                        <td className="border border-gray-300 p-2">{item.valor_medido || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <p className="vazamento-photo-title">Foto Equipamento</p>
                    <div className="vazamento-photo-body">
                      {item.foto ? (
                        <img
                          src={item.foto}
                          alt={`Foto 1 - ${item.localizacao || item.local}`}
                          className="vazamento-photo"
                        />
                      ) : (
                        <div className="image-placeholder h-full w-full">
                          <span className="text-xs text-muted-foreground">Sem foto 1</span>
                        </div>
                      )}
                    </div>
                    <p className="vazamento-photo-caption">Foto 1</p>
                  </div>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <p className="vazamento-photo-title">Foto Equipamento</p>
                    <div className="vazamento-photo-body">
                      {item.foto2 ? (
                        <img
                          src={item.foto2}
                          alt={`Foto 2 - ${item.localizacao || item.local}`}
                          className="vazamento-photo"
                        />
                      ) : (
                        <div className="image-placeholder h-full w-full">
                          <span className="text-xs text-muted-foreground">Sem foto 2</span>
                        </div>
                      )}
                    </div>
                    <p className="vazamento-photo-caption">Foto 2</p>
                  </div>
                </div>
              </div>

              <ReportFooter />
            </div>
          ))
        ) : (
          <div className="report-page print-break flex flex-col">
            <div className="flex-1">
              <ReportHeader />
              <h2 className="report-title">REGISTRO DE VAZAMENTO</h2>
              <div className="border border-gray-300 p-4 text-center text-muted-foreground">
                Nenhum equipamento registrado
              </div>
            </div>
            <ReportFooter />
          </div>
        )}

        {/* Final Considerations */}
        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
            <ReportHeader />
          
          <h2 className="report-title">CONSIDERAÇÕES FINAIS</h2>
          
          <div className="bg-secondary/30 rounded-lg p-6 mb-8">
            <p className="text-foreground leading-relaxed mb-4">
              As medições realizadas referem-se ao plano de monitoramento
              dos equipamentos rotativos, método da manutenção preditiva, que avalia a condição atual dos
              equipamentos por análise das vibrações..
            </p>
            <p className="text-primary font-semibold">
              Muito obrigado pela confiança.
            </p>
          </div>

          {executorData && (
            <div className="mb-8">
              <p className="mb-4">Atenciosamente,</p>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-semibold">{executorData.nome}</p>
                <p className="text-muted-foreground text-sm">{executorData.departamento}</p>
                <p className="text-sm mt-2">{executorData.email}</p>
                {executorData.telefone && <p className="text-sm">Tel.: {executorData.telefone}</p>}
              </div>
            </div>
          )}

          {aprovadorData && (
            <div className="mb-8">
              <p className="mb-4">Aprovado por,</p>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-semibold">{aprovadorData.nome}</p>
                <p className="text-muted-foreground text-sm">{aprovadorData.departamento}</p>
                <p className="text-sm mt-2">{aprovadorData.email}</p>
                {aprovadorData.telefone && <p className="text-sm">Tel.: {aprovadorData.telefone}</p>}
              </div>
            </div>
          )}
          </div>
          <ReportFooter />
        </div>

        {/* Services Page */}
        <div className="report-page flex flex-col">
          <div className="flex-1">
            <ReportHeader />
            
            <h2 className="report-title">NOSSOS SERVIÇOS</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[{
              title: "Análise de Vibrações",
              desc: "Off-line e on-line, solo e estrutural"
            }, {
              title: "Inspeção Termográfica",
              desc: "Painéis, cabines, fornos, mancais, etc."
            }, {
              title: "Alinhamento a Laser",
              desc: "De eixos e polias + calços calibrados"
            }, {
              title: "Balanceamento Dinâmico",
              desc: "Realizado no local – 1 a 4 planos"
            }, {
              title: "ODS (Estrutural)",
              desc: "Análise de torção de base com correção"
            }, {
              title: "MCA – Inspeção Elétrica",
              desc: "Avaliação de circuitos em motores elétricos"
            }, {
              title: "Análise de Óleo",
              desc: "Lubrificante / pacote industrial"
            }, {
              title: "Técnicas Multiparâmetro",
              desc: "Aplicação de diversas técnicas preditivas"
            }, {
              title: "Treinamentos de Preditiva",
              desc: "Análise de vibração e Termografia – N1"
            }, {
              title: "Monitoramento Online",
              desc: "Sensor online de vibração"
            }, {
              title: "Inspeção Ultrassônica",
              desc: "Ar comprimido, vapor, gases e elétrica"
            }, {
              title: "Inspeção Sensitiva",
              desc: "Abordagem para identificar falhas incipientes"
            }].map((service, index) => <div key={index} className="info-card hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-primary">{service.title}</h4>
                  <p className="text-sm text-muted-foreground">{service.desc}</p>
                </div>)}
            </div>
            <ReportFooter />
          </div>
        </div>

      </div>
    </div>
};
export default Index;