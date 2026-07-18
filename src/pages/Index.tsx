import { Fragment } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ReportHeader from "@/components/ReportHeader";
import ReportFooter from "@/components/ReportFooter";
import ReportCoverImage from "@/components/ReportCoverImage";
import ServicesGrid from "@/components/ServiceGrid";
import { useRelatorio, RelatorioResponse } from "@/hooks/useRelatorio";
import { UltrasomItem } from "@/types/vibracao";
import planoVertical from "@/assets/plano-vertical.jpg";
import planoHorizontal from "@/assets/plano-horizontal.jpg";

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

  // Compatibiliza respostas legadas com o formato usado pela página
  const normalizeRelatorio = (response: RelatorioResponse) => {
    const relatorio = response.relatorio as any;
    // Reaproveita fotos do formato legado no bloco atual de imagens do serviço
    if (relatorio.ultrassom && !relatorio.vibracoes) {
      relatorio.vibracoes = relatorio.ultrassom.map((item: UltrasomItem) => ({
        id: item.id || 0,
        foto: item.foto_painel || item.foto1 || item.foto,
        foto2: item.foto_camera || item.foto2,
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
          <h1 className="text-2xl font-bold text-primary mb-4">Relatório de Alinhamento entre Eixos</h1>
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

  // Compatibiliza respostas legadas com o formato usado pela página
  const relatorio = normalizeRelatorio(data);
  const shouldShowCompressedAirPage = relatorio.tipo_vazamento?.trim().toLowerCase() === "ar";

  // Usar cliente do response ou do relatorio
  const clienteData = relatorio.cliente;
  // Usar executor do response ou do relatorio
  const executorData = relatorio.executor;
  // Usar aprovador do response ou do relatorio
  const aprovadorData = relatorio.aprovador;
  const conjuntoData = relatorio.alinhamentos?.[0];
  const initialPlanes = [
    {
      key: "initial-vertical",
      title: "Plano vertical",
      image: planoVertical,
      primaryValue: conjuntoData?.inicial_vertical_a,
      secondaryValue: conjuntoData?.inicial_vertical_b,
    },
    {
      key: "initial-horizontal",
      title: "Plano horizontal",
      image: planoHorizontal,
      primaryValue: conjuntoData?.inicial_horizontal_a,
      secondaryValue: conjuntoData?.inicial_horizontal_b,
    },
  ];
  const finalPlanes = [
    {
      key: "final-vertical",
      title: "Plano vertical",
      image: planoVertical,
      primaryValue: conjuntoData?.final_vertical_a,
      secondaryValue: conjuntoData?.final_vertical_b,
    },
    {
      key: "final-horizontal",
      title: "Plano horizontal",
      image: planoHorizontal,
      primaryValue: conjuntoData?.final_horizontal_a,
      secondaryValue: conjuntoData?.final_horizontal_b,
    },
  ];

  const isVibrationDone = (() => {
    const value = conjuntoData?.is_vibracao;

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();
      return ["true", "1", "sim", "yes"].includes(normalizedValue);
    }

    return false;
  })();

  const shouldSplitFinalConsiderationsPage = isVibrationDone;

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

  // Formatar data como mês/ano
  const formatMonthYear = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/de /g, "");
  };
  const renderConditionPlane = (
    title: string,
    image: string,
    primaryValue?: string | null,
    secondaryValue?: string | null,
    tone: "initial" | "final" = "initial",
  ) => {
    const toneColor = tone === "initial" ? "#db2020" : "#00a63d";

    return <div className="condition-plane-card">
      <h3 className="condition-plane-title">{title}</h3>
      <img src={image} alt={title} className="condition-plane-image" />
      <div className="condition-plane-values">
        <div className="condition-value-group">
          <span className="condition-parenthesis">(</span>
          <span className={`condition-value condition-value-${tone}`} style={{ color: toneColor }}>{primaryValue || "-"}</span>
          <span className="condition-unit">/100 mm</span>
          <span className="condition-parenthesis">)</span>
        </div>
        <div className="condition-value-group">
          <span className="condition-parenthesis">(</span>
          <span className={`condition-value condition-value-${tone}`} style={{ color: toneColor }}>{secondaryValue || "-"}</span>
          <span className="condition-parenthesis">)</span>
        </div>
      </div>
      <div className="condition-plane-legends">
        <span>Angular</span>
        <span>Paralelo</span>
      </div>
    </div>;
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
              <p className="text-lg mt-2">REF. ALINHAMENTO A LASER (ENTRE EIXOS)</p>
              <p className="text-sm mt-2 opacity-80">Nº {`${relatorio.id} ${relatorio.num_revisao ?? ""}`.trim()}</p>
            </div>

            <ReportCoverImage
              src="/alinhamento-cover.jpg"
              alt="Imagem de Alinhamento a Laser"
            />

            

            {clienteData && <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-center">
                <h3 className="font-semibold text-primary mb-2">Cliente / Unidade</h3>
                <p className="font-bold text-lg">{clienteData.nome} - {clienteData.cidade}/{clienteData.estado}</p>
                
              </div>}

            <div className="grid grid-cols-1 gap-8 text-center max-w-lg mx-auto">
              <div>
                <p className="text-muted-foreground text-sm">Data da Inspeção</p>
                <p className="font-semibold">{formatMonthYear(getReportDateString())}</p>
              </div>
              
            </div>

            {clienteData?.logo && <div className="mb-8">
              <img src={clienteData.logo} alt={clienteData.nome} className="client-cover-logo mx-auto" />
            </div>}
          </div>

          <ReportFooter />
        </div>

        {/* Letter Page */}
        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
          <ReportHeader />
          
          <div className="text-right text-sm text-muted-foreground mb-8">
            Jundiaí, {formatDataExe(getReportDateString())}.
          </div>

          <div className="mb-8">
            <p className="text-sm text-muted-foreground">A/C:</p>
            {clienteData && <div className="mt-2 text-sm">
                <p className="text-muted-foreground">{clienteData.pessoa_contato}</p>
                {/* <p className="text-muted-foreground">{clienteData.telefone}</p> */}
              </div>}
              {clienteData?.departamento_contato && <p className="font-semibold">{clienteData.departamento_contato}</p>}
          </div>
          

          <div className="mb-8">
            
            <p className="text-foreground leading-relaxed">Referente à inspeção de alinhamento a laser entre eixos nos equipamentos na data de <strong>{getReportDateString()}</strong>.
              <br />
              Relatório Nº <strong>{`${relatorio.id} ${relatorio.num_revisao ?? ""}`.trim()}</strong>.
              <br />
              < br/>
                O princípio do trabalho visa diagnosticar por intermédio do instrumento Digital ultrassonico
              com indicação em tela LCD, os pontos com vazamento, e o quanto está sendo desperdiçado
              em termos de vazão de energia, e o quanto representa financeiramente os desperdícios.
            </p>
          </div>

          <div className="mb-8">
            <p className="mb-4">Atenciosamente,</p>
            <div className="border-l-4 border-primary pl-4">
              <p className="font-semibold">Luís Henrique Guimarães Stefani</p>
              <p className="text-muted-foreground text-sm">DIRETOR COMERCIAL</p>
              <p className="text-sm mt-2">luis@jundpred.com.br</p>
              <p className="text-sm mt-2">Tel.: (11) 2817-0616</p>
              <p className="text-sm mt-2">Cel.: (11) 97471-9744</p>
            </div>
          </div>
          </div>
          <ReportFooter />
        </div>

        {/* Second Page */}
        {shouldShowCompressedAirPage && relatorio.resumo_ar_comprimido && (
        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
            <ReportHeader />
            
            <h2 className="report-title">PONTOS DE VAZAMENTO DE AR COMPRIMIDO</h2>
            
            <div className="mb-6">
              <p className="mb-4">
                <span className="text-primary font-semibold">➤ Total de pontos de vazamento de Ar Comprimido = {relatorio.resumo_ar_comprimido.tabela.reduce((sum, item) => sum + item.qtd, 0)} pontos;</span>
              </p>
            </div>

            {/* First Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="border border-gray-300 p-2 text-left">Total KWh</th>
                    <th className="border border-gray-300 p-2 text-left">Valor KWh (R$)</th>
                    <th className="border border-gray-300 p-2 text-left">Total Horas Mês</th>
                    <th className="border border-gray-300 p-2 text-left">Total Mês</th>
                    <th className="border border-gray-300 p-2 text-left">Total Ano</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-secondary/50">
                    <td className="border border-gray-300 p-2">{relatorio.resumo_ar_comprimido.total_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                    <td className="border border-gray-300 p-2 font-bold">R$ {relatorio.resumo_ar_comprimido.valor_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border border-gray-300 p-2">{relatorio.resumo_ar_comprimido.horas_mes}</td>
                    <td className="border border-gray-300 p-2">R$ {relatorio.resumo_ar_comprimido.custo_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border border-gray-300 p-2">R$ {relatorio.resumo_ar_comprimido.custo_ano.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Second Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="border border-gray-300 p-2 text-left">mm do furo</th>
                    <th className="border border-gray-300 p-2 text-left">KW</th>
                    <th className="border border-gray-300 p-2 text-left">Qtd</th>
                    <th className="border border-gray-300 p-2 text-left">Total KWh</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.resumo_ar_comprimido.tabela.map((item, index) => (
                    <tr key={index} className="hover:bg-secondary/50">
                      <td className="border border-gray-300 p-2">{item.mm_furo}</td>
                      <td className="border border-gray-300 p-2">{item.kw.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                      <td className="border border-gray-300 p-2">{item.qtd}</td>
                      <td className="border border-gray-300 p-2">{item.total_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 p-2" colSpan={3}>Total</td>
                    <td className="border border-gray-300 p-2">{relatorio.resumo_ar_comprimido.total_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Text */}
            <div className="mt-6 text-sm text-foreground leading-relaxed">
              <p className="mb-3">
                <span className="font-semibold">Assim teremos: AR COMPRIMIDO</span>
                <br />
                {relatorio.resumo_ar_comprimido.total_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kW X {relatorio.resumo_ar_comprimido.horas_mes} horas mês = {relatorio.resumo_ar_comprimido.kwh_mes.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kWh/mês.
                <br />
                {relatorio.resumo_ar_comprimido.kwh_mes.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kWh/mês X R$ {relatorio.resumo_ar_comprimido.valor_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW/hora = R$ {relatorio.resumo_ar_comprimido.custo_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mês.
              </p>
              <p className="mb-3 font-semibold text-primary">
                O custo mensal nesta proporção de energia será de R$ {relatorio.resumo_ar_comprimido.custo_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mb-3">
                {relatorio.resumo_ar_comprimido.total_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kW X {relatorio.resumo_ar_comprimido.horas_ano} horas ano = {relatorio.resumo_ar_comprimido.kwh_ano.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kWh/ano.
                <br />
                {relatorio.resumo_ar_comprimido.kwh_ano.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kWh/ano X R$ {relatorio.resumo_ar_comprimido.valor_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW/hora = R$ {relatorio.resumo_ar_comprimido.custo_ano.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ano.
              </p>
              <p className="font-semibold text-primary">
                O custo anual nesta proporção de energia será de R$ {relatorio.resumo_ar_comprimido.custo_ano.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <ReportFooter />
        </div>
        )}

        {/* Vazamentos - 1 por pagina */}
        {relatorio.vibracoes && relatorio.vibracoes.length > 0 ? (
          relatorio.vibracoes.map((item, index) => (
            <Fragment key={item.id || index}>
            <div className="report-page print-break flex flex-col">
              <div className="flex-1">
                <ReportHeader />

            <div className="mt-10 space-y-8 text-foreground">
              <section>
                <h2 className="report-title text-left">1. VANTAGENS</h2>
                <ul className="list-disc pl-6 space-y-3 text-base leading-relaxed">
                  <li>Não há necessidade de desmontar ou retirar o equipamento do local de trabalho;</li>
                  <li>Resultados avançados, melhores que métodos convencionais, como por exemplo, relógio comparador ou réguas;</li>
                  <li>Aumento da vida útil do equipamento em virtude da diminuição dos esforços provocados pelo desalinhamento entre os eixos;</li>
                  <li>Correção de diversos parâmetros como paralelo e angular;</li>
                  
                </ul>
              </section>

              <section>
                <h2 className="report-title text-left">2. SISTEMAS UTILIZADOS:</h2>
                <ul className="list-disc pl-6 space-y-3 text-base leading-relaxed">
                  <li>Alinhador de eixos com precisão a laser;</li>
                  <li>Coletor de dados vibracionais (espectral);</li>
                  <li>Maleta de calços calibrados;</li>
                  <li>Notebook Linha profissional.</li>
                </ul>
              </section>

              <p className="pt-6 text-base leading-relaxed">
                Todos os sensores estão devidamente calibrados e rastreados, conforme procedimento interno Jundpred
              </p>
            </div>
          </div>
          <ReportFooter />
        </div>

        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
            <ReportHeader />

            <div className="mt-10 space-y-8 text-foreground">
              <section>
                <h2 className="report-title text-left">3. DADOS DO CONJUNTO:</h2>

                <div className="overflow-x-auto mb-8">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      <tr className="hover:bg-secondary/30">
                        <td className="border border-gray-300 p-3 font-semibold bg-secondary/20">Descriçao Equipamento</td>
                        <td className="border border-gray-300 p-3">{conjuntoData?.equipamento || "-"}</td>
                      </tr>
                      <tr className="hover:bg-secondary/30">
                        <td className="border border-gray-300 p-3 font-semibold bg-secondary/20">Rotação</td>
                        <td className="border border-gray-300 p-3">{conjuntoData?.velocidade || "-"}</td>
                      </tr>
                      <tr className="hover:bg-secondary/30">
                        <td className="border border-gray-300 p-3 font-semibold bg-secondary/20">Potência</td>
                        <td className="border border-gray-300 p-3">{conjuntoData?.potencia || "-"}</td>
                      </tr>
                      <tr className="hover:bg-secondary/30">
                        <td className="border border-gray-300 p-3 font-semibold bg-secondary/20">Tolerância</td>
                        <td className="border border-gray-300 p-3">{conjuntoData?.tolerancia ?? "-"}</td>
                      </tr>
                      <tr className="hover:bg-secondary/30">
                        <td className="border border-gray-300 p-3 font-semibold bg-secondary/20">Nº do Ensaio</td>
                        <td className="border border-gray-300 p-3">{conjuntoData?.num_ensaio ?? "-"}</td>
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
                    <p className="vazamento-photo-title">Foto Vazamento</p>
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
                  <p className="vazamento-photo-caption">Equipamento inspecionado</p>
                </div>
              </section>
            </div>
          </div>
          <ReportFooter />
        </div>

        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
            <ReportHeader />

            <div className="mt-5 text-foreground">
              <h2 className="text-[22px] font-bold uppercase mb-2">CONDIÇÕES INICIAIS</h2>
              <div className="condition-plane-grid mb-8">
                {initialPlanes.map((plane) => <div key={plane.key}>
                    {renderConditionPlane(plane.title, plane.image, plane.primaryValue, plane.secondaryValue, "initial")}
                  </div>)}
              </div>

              <h2 className="text-[22px] font-bold uppercase mb-4 mt-8">CONDIÇÕES FINAIS</h2>

              <div className="condition-plane-grid mb-5">
                {finalPlanes.map((plane) => <div key={plane.key}>
                    {renderConditionPlane(plane.title, plane.image, plane.primaryValue, plane.secondaryValue, "final")}
                  </div>)}
              </div>

              
            </div>
          </div>
          <ReportFooter />
        </div>

            </Fragment>
          ))
        ) : null}

        {/* Final Considerations */}
        <div className="report-page print-break flex flex-col">
          <div className="flex-1">
            <ReportHeader />
          
          <h2 className="report-title">CONSIDERAÇÕES FINAIS</h2>
          
          <div className="bg-secondary/30 rounded-lg p-6 mb-8">
            <p className="text-foreground leading-relaxed mb-4">
                <p>Sugestões: </p>
                <p> 1) Recuperar os desperdícios causados pelos pontos de vazamento, elaborando um 
                planejamento de manutenção com a máxima urgência. </p>
                <p>2) Consertar unidades de conservação do Ar Comprimido (Sistema de Lubrifil / 
                Reguladores de Pressão) e manômetros que estejam danificados. </p>
                <p>3) Sugerimos que os Operadores das Máquinas, após a jornada de trabalho procurem 
                fechar os registros gerais de cada máquina, como fator de economia 
                (PROCEDIMENTOS). </p>
                <p>4) Sugerimos que os Compressores de ar sejam medidos para se diagnosticar a 
                Performance / Rendimento real. </p>
                <p>5) A eficiência de um “layout” correto na rede de distribuição de ar comprimido principal e 
                secundário, poderá contribuir muito para a redução do consumo de energia associado a 
                perda de carga (queda de pressão). ..</p>
            </p>
            <p className="text-primary font-semibold">
              Muito obrigado pela confiança.
            </p>
          </div>

          {isVibrationDone && (
            <div className="space-y-4 mb-5">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="vazamento-photo-body">
                  {conjuntoData?.foto_vibracao ? (
                    <img
                      src={conjuntoData.foto_vibracao}
                      alt="Foto da medição de vibração"
                      className="vazamento-photo"
                    />
                  ) : (
                    <div className="image-placeholder h-full w-full">
                      <span className="text-xs text-muted-foreground">Sem foto da medição de vibração</span>
                    </div>
                  )}
                </div>
                <p className="vazamento-photo-caption">Registro da medição de vibração</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-primary mb-2">Comentários</p>
                <p className="text-foreground leading-relaxed">
                  {conjuntoData?.obs_vibracao || "Sem observações informadas."}
                </p>
              </div>
            </div>
          )}

          {!shouldSplitFinalConsiderationsPage && (
            <>
              <h2 className="report-title mb-3">CONSIDERAÇÕES FINAIS</h2>

              <div className="bg-secondary/30 rounded-lg p-5 mb-5">
                <p className="text-foreground leading-relaxed mb-4">
                  {conjuntoData?.comentario || conjuntoData?.status || "-"}
                </p>
                <p className="text-primary font-semibold">
                  Muito obrigado pela confiança.
                </p>
              </div>

              {executorData && (
                <div className="mb-5">
                  <p className="mb-3">Atenciosamente,</p>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">{executorData.nome}</p>
                    <p className="text-muted-foreground text-sm">{executorData.departamento}</p>
                    <p className="text-sm mt-2">{executorData.email}</p>
                    {executorData.telefone && <p className="text-sm">Tel.: {executorData.telefone}</p>}
                  </div>
                </div>
              )}

              {aprovadorData && (
                <div className="mb-5">
                  <p className="mb-3">Aprovado por,</p>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">{aprovadorData.nome}</p>
                    <p className="text-muted-foreground text-sm">{aprovadorData.departamento}</p>
                    <p className="text-sm mt-2">{aprovadorData.email}</p>
                    {aprovadorData.telefone && <p className="text-sm">Tel.: {aprovadorData.telefone}</p>}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
          <ReportFooter />
        </div>

        {shouldSplitFinalConsiderationsPage && (
          <div className="report-page print-break flex flex-col">
            <div className="flex-1">
              <ReportHeader />

              <h2 className="report-title mb-3">CONSIDERAÇÕES FINAIS</h2>

              <div className="bg-secondary/30 rounded-lg p-5 mb-5">
                <p className="text-foreground leading-relaxed mb-4">
                  {conjuntoData?.comentario || conjuntoData?.status || "-"}
                </p>
                <p className="text-primary font-semibold">
                  Muito obrigado pela confiança.
                </p>
              </div>

              {executorData && (
                <div className="mb-5">
                  <p className="mb-3">Atenciosamente,</p>
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">{executorData.nome}</p>
                    <p className="text-muted-foreground text-sm">{executorData.departamento}</p>
                    <p className="text-sm mt-2">{executorData.email}</p>
                    {executorData.telefone && <p className="text-sm">Tel.: {executorData.telefone}</p>}
                  </div>
                </div>
              )}

              {aprovadorData && (
                <div className="mb-5">
                  <p className="mb-3">Aprovado por,</p>
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
        )}

        {/* Services Page */}
        <div className="report-page flex flex-col">
          <div className="flex-1">
            <ReportHeader />
            
            <h2 className="report-title">NOSSOS SERVIÇOS</h2>

            <ServicesGrid />
            <ReportFooter />
          </div>
        </div>

      </div>
    </div>;
};

export default Index;