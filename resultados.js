/**
 * ============================================================================
 * RESULTADOS.JS
 * Renderização da tabela principal de resultados — Ordem, Distância,
 * Unidade Executante, Município Executante, Especialidade e Ação (a
 * Complexidade, assim como Macrorregião e Tipo de Leito, fica disponível
 * apenas no painel "Ver Detalhes", a pedido do usuário em 21/08/2026) —,
 * do painel de "Ver Detalhes" (Seção 29), do destaque de particularidades
 * pesquisadas (Seção 30). Botões de Exportar CSV/Excel e Imprimir foram
 * removidos a pedido do usuário em 21/08/2026.
 *
 * Os resultados já chegam consolidados por Unidade Executante (uma linha
 * por unidade — ver Pesquisa.consolidarPorUnidade), então esta camada
 * apenas exibe os campos já combinados.
 * ============================================================================
 */

const Resultados = (() => {

  let ultimosResultados = [];
  let ultimoTermoParticularidades = '';
  let ultimoMunicipioSolicitante = '';
  let tabelaDataTable = null;

  function htmlDistancia(registro) {
    if (!registro.distanciaConhecida) {
      return '<span class="badge-distancia badge-distancia--desconhecida">Distância não informada</span>';
    }
    const tempo = (registro.tempoEstimadoMin !== null && registro.tempoEstimadoMin !== undefined && !isNaN(registro.tempoEstimadoMin))
      ? `<span class="tempo-estimado"><i class="fa-solid fa-clock"></i> ~${Math.round(registro.tempoEstimadoMin)} min</span>`
      : '';
    return `<span class="badge-distancia"><i class="fa-solid fa-location-dot"></i> ${registro.distanciaTexto} KM</span>${tempo}`;
  }

  function textoOrigem(registro) {
    if (registro._temBase && registro._temIntermediacao) return 'BASE_ATUALIZADA e INTERMEDIAÇÃO';
    if (registro._temIntermediacao) return 'INTERMEDIAÇÃO';
    return 'BASE_ATUALIZADA';
  }

  function htmlSelos(registro) {
    let selos = '';
    if (registro.maisProxima) {
      selos += '<span class="selo selo--mais-proxima"><i class="fa-solid fa-star"></i> MAIS PRÓXIMA</span> ';
    }
    if (registro._temIntermediacao) {
      selos += '<span class="selo selo--intermediacao">INTERMEDIAÇÃO</span>';
    }
    return selos;
  }

  function renderizar(resultadoPesquisa, criterios) {
    ultimosResultados = resultadoPesquisa.resultados;
    ultimoTermoParticularidades = criterios.textoParticularidades || '';
    ultimoMunicipioSolicitante = criterios.municipioSolicitante || '';

    const corpo = document.getElementById('corpo-tabela-resultados');
    const areaSemResultado = document.getElementById('area-sem-resultado');
    const areaResultados = document.getElementById('area-resultados');

    if (tabelaDataTable) {
      tabelaDataTable.destroy();
      tabelaDataTable = null;
      corpo.innerHTML = '';
    }

    if (ultimosResultados.length === 0) {
      areaResultados.classList.add('d-none');
      areaSemResultado.classList.remove('d-none');
      atualizarIndicadores(resultadoPesquisa);
      return;
    }

    areaSemResultado.classList.add('d-none');
    areaResultados.classList.remove('d-none');

    corpo.innerHTML = ultimosResultados.map((r, indice) => `
      <tr class="${r.maisProxima ? 'linha-mais-proxima' : ''}">
        <td class="text-center fw-semibold">${r.ordem}</td>
        <td>${htmlDistancia(r)}</td>
        <td>
          <div class="fw-semibold">${Normalizacao.escaparHtml(r.unidadeExecutante)}</div>
          <div class="mt-1">${htmlSelos(r)}</div>
        </td>
        <td>${Normalizacao.escaparHtml(r.municipioExecutante || '—')}</td>
        <td>${Normalizacao.escaparHtml(r.especialidade)}</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-outline-primary btn-ver-detalhes" data-indice="${indice}">
            <i class="fa-solid fa-circle-info"></i> Ver Detalhes
          </button>
        </td>
      </tr>
    `).join('');

    corpo.querySelectorAll('.btn-ver-detalhes').forEach((btn) => {
      btn.addEventListener('click', () => abrirDetalhes(parseInt(btn.dataset.indice, 10)));
    });

    tabelaDataTable = $('#tabela-resultados').DataTable({
      order: [],
      ordering: false,
      pageLength: 25,
      lengthMenu: [10, 25, 50, 100],
      language: {
        search: 'Buscar dentro dos resultados:',
        lengthMenu: 'Mostrar _MENU_ resultados por página',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ resultados',
        infoEmpty: 'Nenhum resultado',
        paginate: { previous: 'Anterior', next: 'Próxima' },
        zeroRecords: 'Nenhum resultado encontrado'
      }
    });

    atualizarIndicadores(resultadoPesquisa);
  }

  function atualizarIndicadores(resultadoPesquisa) {
    document.getElementById('kpi-resultados-encontrados').textContent = resultadoPesquisa.totalEncontrados;
    const menor = resultadoPesquisa.menorDistancia;
    document.getElementById('kpi-menor-distancia').textContent = menor
      ? `${menor.distanciaTexto} KM`
      : '—';
    document.getElementById('area-kpis-pesquisa').classList.remove('d-none');
  }

  function abrirDetalhes(indice) {
    const r = ultimosResultados[indice];
    if (!r) return;

    const campo = (rotulo, valor) => `
      <div class="detalhe-campo">
        <div class="detalhe-rotulo">${rotulo}</div>
        <div class="detalhe-valor">${valor && String(valor).trim() !== '' ? Normalizacao.escaparHtml(valor) : '—'}</div>
      </div>`;

    const particularidadesHtml = r.particularidades && r.particularidades.trim() !== ''
      ? Normalizacao.destacarTermo(r.particularidades, ultimoTermoParticularidades)
      : '—';

    const corpo = document.getElementById('corpo-modal-detalhes');
    corpo.innerHTML = `
      <div class="mb-3">
        ${htmlDistancia(r)}
        ${htmlSelos(r) ? `<div class="mt-2">${htmlSelos(r)}</div>` : ''}
      </div>
      <div class="row g-3">
        <div class="col-md-6">${campo('Unidade Executante', r.unidadeExecutante)}</div>
        <div class="col-md-6">${campo('Município Executante', r.municipioExecutante || '(não identificado)')}</div>
        <div class="col-md-6">${campo('Especialidade', r.especialidade)}</div>
        <div class="col-md-6">${campo('Macrorregião', r.macrorregiao)}</div>
        <div class="col-md-6">${campo('Complexidade', r.complexidade)}</div>
        <div class="col-md-6">${campo('Tipo de Atendimento', r.tipoAtendimento)}</div>
        <div class="col-md-6">${campo('Tipo de Leito', r.tipoLeito)}</div>
        <div class="col-md-6">${campo('Fluxo Regulatório', r.fluxoRegulatorio)}</div>
        <div class="col-12">
          <div class="detalhe-rotulo">Particularidades da Solicitação por Unidade Executante</div>
          <div class="detalhe-valor detalhe-valor--longo">${particularidadesHtml}</div>
        </div>
        <div class="col-12">${campo('Cobertura SAD - Município Referência x Un. Executante', r.coberturaSad)}</div>
        <div class="col-md-6">${campo('Origem do registro', textoOrigem(r))}</div>
        <div class="col-md-6">${campo('Município Solicitante consultado', ultimoMunicipioSolicitante)}</div>
      </div>
    `;

    Utilitarios.obterModal('#modal-detalhes').show();
  }

  function limpar() {
    ultimosResultados = [];
    if (tabelaDataTable) {
      tabelaDataTable.destroy();
      tabelaDataTable = null;
    }
    document.getElementById('corpo-tabela-resultados').innerHTML = '';
    document.getElementById('area-resultados').classList.add('d-none');
    document.getElementById('area-sem-resultado').classList.add('d-none');
    document.getElementById('area-kpis-pesquisa').classList.add('d-none');
  }

  return {
    renderizar,
    abrirDetalhes,
    limpar
  };
})();
