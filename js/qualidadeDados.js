/**
 * ============================================================================
 * QUALIDADEDADOS.JS
 * Área administrativa "QUALIDADE DA BASE" (Seção 33): detecta e reporta
 * inconsistências na base carregada, sem impedir o uso normal do painel.
 * ============================================================================
 */

const QualidadeDados = (() => {

  function encontrarDuplicadosPorGrafia(registros, campo) {
    const grupos = new Map();
    for (const r of registros) {
      const valor = r[campo];
      if (!valor) continue;
      const chave = Normalizacao.normalizarChave(valor);
      if (!grupos.has(chave)) grupos.set(chave, new Set());
      grupos.get(chave).add(valor);
    }
    const duplicados = [];
    for (const [chave, variantes] of grupos.entries()) {
      if (variantes.size > 1) {
        duplicados.push({ chave, variantes: [...variantes] });
      }
    }
    return duplicados;
  }

  function gerarRelatorio() {
    const registros = Dados.banco.registros;
    const diag = Dados.banco.diagnostico;
    const ocorrenciasDistancia = Distancia.obterOcorrenciasQualidade();

    const especialidadesDuplicadas = encontrarDuplicadosPorGrafia(registros, 'especialidade');
    const unidadesDuplicadas = encontrarDuplicadosPorGrafia(registros, 'unidadeExecutante');

    const unidadesSemMunicipio = registros.filter((r) => !r.municipioExecutante);

    const camposObrigatoriosVazios = registros.filter((r) => !r.unidadeExecutante || !r.especialidade);

    const semParticularidades = registros.filter((r) => !r.particularidades || r.particularidades.trim() === '');
    const semFluxoRegulatorio = registros.filter((r) => !r.fluxoRegulatorio || r.fluxoRegulatorio.trim() === '');

    const unidadesCompativeisSemDistancia = [];
    const chavesMunicipioTestadas = new Set();
    for (const r of registros) {
      if (!r.municipioExecutante) continue;
      const chaveMunicipio = Normalizacao.normalizarChave(r.municipioExecutante);
      if (chavesMunicipioTestadas.has(chaveMunicipio)) continue;
      chavesMunicipioTestadas.add(chaveMunicipio);
      const { distanciaKm } = Distancia.obterDistancia(r.municipioExecutante, r.municipioExecutante);
      if (distanciaKm === null) {
        unidadesCompativeisSemDistancia.push(r.municipioExecutante);
      }
    }

    return {
      geradoEm: new Date(),
      totais: {
        registrosConsolidados: registros.length,
        linhasBrutasBaseAtualizada: diag.totalLinhasBrutasBase,
        linhasBrutasIntermediacao: diag.totalLinhasBrutasIntermediacao,
        registrosDuplicadosRemovidos: diag.registrosDuplicadosRemovidos,
        linhasDistanciaTotal: Dados.banco.linhasDistancia.length
      },
      especialidadesDuplicadasPorGrafia: especialidadesDuplicadas,
      unidadesDuplicadasPorGrafia: unidadesDuplicadas,
      unidadesSemMunicipioExecutante: unidadesSemMunicipio,
      camposObrigatoriosVazios,
      registrosSemParticularidades: semParticularidades.length,
      registrosSemFluxoRegulatorio: semFluxoRegulatorio.length,
      paresDistanciaDuplicados: ocorrenciasDistancia.paresDuplicados,
      distanciasConflitantes: ocorrenciasDistancia.distanciasConflitantes,
      distanciasInvalidas: ocorrenciasDistancia.distanciasInvalidas,
      municipiosExecutantesSemCoberturaDeDistancia: unidadesCompativeisSemDistancia
    };
  }

  function renderizar() {
    const relatorio = gerarRelatorio();
    const container = document.getElementById('conteudo-qualidade-base');

    const linhaResumo = (rotulo, valor) => `
      <tr><th scope="row">${rotulo}</th><td class="text-end">${valor}</td></tr>`;

    const listaOuVazio = (itens, montarLinha) => itens.length
      ? `<ul class="lista-qualidade">${itens.map(montarLinha).join('')}</ul>`
      : '<p class="text-success mb-0"><i class="fa-solid fa-circle-check"></i> Nenhuma ocorrência encontrada.</p>';

    container.innerHTML = `
      <p class="text-muted small mb-4">Relatório gerado em ${Utilitarios.formatarDataHora(relatorio.geradoEm)}</p>

      <h6 class="titulo-secao-qualidade">Resumo Geral</h6>
      <table class="table table-sm table-bordered mb-4">
        <tbody>
          ${linhaResumo('Registros consolidados (BASE_ATUALIZADA + INTERMEDIAÇÃO)', relatorio.totais.registrosConsolidados)}
          ${linhaResumo('Linhas brutas BASE_ATUALIZADA', relatorio.totais.linhasBrutasBaseAtualizada)}
          ${linhaResumo('Linhas brutas INTERMEDIAÇÃO', relatorio.totais.linhasBrutasIntermediacao)}
          ${linhaResumo('Registros duplicados removidos na consolidação', relatorio.totais.registrosDuplicadosRemovidos)}
          ${linhaResumo('Linhas na aba DISTÂNCIA', relatorio.totais.linhasDistanciaTotal)}
          ${linhaResumo('Registros sem Particularidades preenchidas', relatorio.registrosSemParticularidades)}
          ${linhaResumo('Registros sem Fluxo Regulatório preenchido', relatorio.registrosSemFluxoRegulatorio)}
        </tbody>
      </table>

      <h6 class="titulo-secao-qualidade">Especialidades duplicadas por grafia</h6>
      ${listaOuVazio(relatorio.especialidadesDuplicadasPorGrafia, (g) =>
        `<li>${g.variantes.map((v) => `"${Normalizacao.escaparHtml(v)}"`).join(' / ')}</li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Unidades Executantes duplicadas por grafia</h6>
      ${listaOuVazio(relatorio.unidadesDuplicadasPorGrafia, (g) =>
        `<li>${g.variantes.map((v) => `"${Normalizacao.escaparHtml(v)}"`).join(' / ')}</li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Unidades sem Município Executante identificado</h6>
      ${listaOuVazio(relatorio.unidadesSemMunicipioExecutante, (r) =>
        `<li>${Normalizacao.escaparHtml(r.unidadeExecutante)} <span class="text-muted">(${r.origem})</span></li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Municípios Executantes sem nenhuma distância cadastrada</h6>
      ${listaOuVazio(relatorio.municipiosExecutantesSemCoberturaDeDistancia, (m) => `<li>${Normalizacao.escaparHtml(m)}</li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Pares de distância duplicados (deduplicados automaticamente)</h6>
      ${listaOuVazio(relatorio.paresDistanciaDuplicados, (p) =>
        `<li>${Normalizacao.escaparHtml(p.solicitante)} → ${Normalizacao.escaparHtml(p.executante)}: ${Normalizacao.formatarDistancia(p.distancia)} km</li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Distâncias conflitantes (mesmo par, valores diferentes)</h6>
      ${listaOuVazio(relatorio.distanciasConflitantes, (c) =>
        `<li>${Normalizacao.escaparHtml(c.solicitante)} → ${Normalizacao.escaparHtml(c.executante)}: ${Normalizacao.formatarDistancia(c.distanciaA)} km vs ${Normalizacao.formatarDistancia(c.distanciaB)} km (menor valor mantido no índice)</li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Distâncias inválidas (não numéricas ou negativas)</h6>
      ${listaOuVazio(relatorio.distanciasInvalidas, (d) =>
        `<li>${Normalizacao.escaparHtml(d.solicitante)} → ${Normalizacao.escaparHtml(d.executante)}: "${Normalizacao.escaparHtml(d.valor)}"</li>`)}

      <h6 class="titulo-secao-qualidade mt-4">Campos obrigatórios vazios (Unidade Executante ou Especialidade)</h6>
      ${listaOuVazio(relatorio.camposObrigatoriosVazios, (r) =>
        `<li>Unidade: "${Normalizacao.escaparHtml(r.unidadeExecutante || '(vazio)')}" · Especialidade: "${Normalizacao.escaparHtml(r.especialidade || '(vazio)')}"</li>`)}
    `;

    window.__ultimoRelatorioQualidade = relatorio;
  }

  function exportarRelatorio() {
    const relatorio = window.__ultimoRelatorioQualidade || gerarRelatorio();
    const linhas = [];

    const adicionar = (categoria, descricao) => linhas.push({ Categoria: categoria, Descrição: descricao });

    relatorio.especialidadesDuplicadasPorGrafia.forEach((g) =>
      adicionar('Especialidade duplicada por grafia', g.variantes.join(' / ')));
    relatorio.unidadesDuplicadasPorGrafia.forEach((g) =>
      adicionar('Unidade duplicada por grafia', g.variantes.join(' / ')));
    relatorio.unidadesSemMunicipioExecutante.forEach((r) =>
      adicionar('Unidade sem Município Executante identificado', `${r.unidadeExecutante} (${r.origem})`));
    relatorio.municipiosExecutantesSemCoberturaDeDistancia.forEach((m) =>
      adicionar('Município Executante sem distância cadastrada', m));
    relatorio.paresDistanciaDuplicados.forEach((p) =>
      adicionar('Par de distância duplicado', `${p.solicitante} -> ${p.executante}: ${p.distancia} km`));
    relatorio.distanciasConflitantes.forEach((c) =>
      adicionar('Distância conflitante', `${c.solicitante} -> ${c.executante}: ${c.distanciaA} km vs ${c.distanciaB} km`));
    relatorio.distanciasInvalidas.forEach((d) =>
      adicionar('Distância inválida', `${d.solicitante} -> ${d.executante}: "${d.valor}"`));
    relatorio.camposObrigatoriosVazios.forEach((r) =>
      adicionar('Campo obrigatório vazio', `Unidade: "${r.unidadeExecutante || ''}" / Especialidade: "${r.especialidade || ''}"`));

    if (linhas.length === 0) {
      Utilitarios.exibirAlerta('Nenhuma ocorrência de qualidade para exportar.', 'success');
      return;
    }

    const csv = Utilitarios.paraCsv(linhas, ['Categoria', 'Descrição']);
    Utilitarios.baixarArquivoTexto(`qualidade-base-fluxo-padrao-${Date.now()}.csv`, csv);
  }

  return {
    gerarRelatorio,
    renderizar,
    exportarRelatorio
  };
})();
