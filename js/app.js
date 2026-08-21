/**
 * ============================================================================
 * APP.JS
 * Orquestração da interface: carregamento inicial, preenchimento dos
 * filtros dinâmicos, ligação dos eventos de tela e atualização automática.
 * ============================================================================
 */

(() => {

  let intervaloAtualizacao = null;

  function elementos() {
    return {
      selectMunicipioSolicitante: document.getElementById('input-municipio-solicitante'),
      datalistMunicipios: document.getElementById('lista-municipios-solicitantes'),
      selectEspecialidade: document.getElementById('select-especialidade'),
      selectTipoLeito: document.getElementById('select-tipo-leito'),
      selectMacrorregiao: document.getElementById('select-macrorregiao'),
      selectComplexidade: document.getElementById('select-complexidade'),
      inputParticularidades: document.getElementById('input-particularidades'),
      formPesquisa: document.getElementById('form-pesquisa'),
      btnLimparFiltros: document.getElementById('btn-limpar-filtros'),
      btnAtualizarBase: document.getElementById('btn-atualizar-base'),
      btnExportarCsv: document.getElementById('btn-exportar-csv'),
      btnExportarExcel: document.getElementById('btn-exportar-excel'),
      btnImprimir: document.getElementById('btn-imprimir'),
      statusBase: document.getElementById('status-base'),
      ultimaSincronizacao: document.getElementById('ultima-sincronizacao'),
      btnAbrirQualidade: document.getElementById('btn-abrir-qualidade'),
      btnExportarQualidade: document.getElementById('btn-exportar-qualidade')
    };
  }

  function preencherSelect(select, opcoes, rotuloVazio) {
    const valorAtual = select.value;
    select.innerHTML = `<option value="">${rotuloVazio}</option>` +
      opcoes.map((v) => `<option value="${Normalizacao.escaparHtml(v)}">${Normalizacao.escaparHtml(v)}</option>`).join('');
    if (opcoes.includes(valorAtual)) {
      select.value = valorAtual;
    }
  }

  function atualizarFiltrosInterdependentes() {
    const el = elementos();
    const selecaoAtual = {
      especialidade: el.selectEspecialidade.value,
      tipoLeito: el.selectTipoLeito.value,
      macrorregiao: el.selectMacrorregiao.value,
      complexidade: el.selectComplexidade.value
    };
    const opcoes = Filtros.opcoesDisponiveis(selecaoAtual);
    preencherSelect(el.selectEspecialidade, opcoes.especialidade, 'Selecione a especialidade...');
    preencherSelect(el.selectTipoLeito, opcoes.tipoLeito, 'Todos');
    preencherSelect(el.selectMacrorregiao, opcoes.macrorregiao, 'Todas');
    preencherSelect(el.selectComplexidade, opcoes.complexidade, 'Todas');
  }

  function preencherAutocompleteMunicipios() {
    const el = elementos();
    const municipios = Distancia.listarMunicipiosSolicitantes();
    el.datalistMunicipios.innerHTML = municipios.map((m) => `<option value="${Normalizacao.escaparHtml(m)}"></option>`).join('');
  }

  function atualizarKpisIniciais() {
    const registros = Dados.banco.registros;
    const unidades = new Set(registros.map((r) => Normalizacao.normalizarChave(r.unidadeExecutante)).filter(Boolean));
    const especialidades = new Set(registros.map((r) => Normalizacao.normalizarChave(r.especialidade)).filter(Boolean));
    const municipiosSolicitantes = new Set(Distancia.listarMunicipiosSolicitantes());
    const municipiosExecutantes = new Set(registros.map((r) => Normalizacao.normalizarChave(r.municipioExecutante)).filter(Boolean));

    document.getElementById('kpi-unidades').textContent = unidades.size;
    document.getElementById('kpi-especialidades').textContent = especialidades.size;
    document.getElementById('kpi-municipios-solicitantes').textContent = municipiosSolicitantes.size;
    document.getElementById('kpi-municipios-executantes').textContent = municipiosExecutantes.size;
    document.getElementById('kpi-ofertas').textContent = registros.length;
  }

  function atualizarStatusBase(estado) {
    const el = elementos();
    if (estado === 'atualizando') {
      el.statusBase.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Atualizando dados...';
      el.statusBase.className = 'status-base status-base--atualizando';
      return;
    }
    if (estado === 'erro') {
      el.statusBase.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Falha ao atualizar — exibindo última base carregada';
      el.statusBase.className = 'status-base status-base--erro';
      return;
    }
    const origem = Dados.banco.origemDados === 'online' ? '' : ' (fonte de contingência local)';
    el.statusBase.innerHTML = `<i class="fa-solid fa-circle-check"></i> Base atualizada${origem}`;
    el.statusBase.className = 'status-base status-base--ok';
    el.ultimaSincronizacao.textContent = `Última sincronização: ${Utilitarios.formatarDataHora(Dados.banco.ultimaAtualizacao)}`;
  }

  async function carregarBase(mostrarAlertaSucesso) {
    atualizarStatusBase('atualizando');
    try {
      await Dados.carregarTudo();
      preencherAutocompleteMunicipios();
      atualizarFiltrosInterdependentes();
      atualizarKpisIniciais();
      atualizarStatusBase('ok');
      if (mostrarAlertaSucesso) {
        Utilitarios.exibirAlerta('Base de dados atualizada com sucesso.', 'success');
      }
    } catch (erro) {
      console.error('[App] Erro ao carregar a base:', erro);
      atualizarStatusBase('erro');
      Utilitarios.exibirAlerta(
        'Não foi possível atualizar os dados agora. O painel continua funcionando com a última base disponível.',
        'danger'
      );
    }
  }

  function coletarCriteriosPesquisa() {
    const el = elementos();
    return {
      municipioSolicitante: el.selectMunicipioSolicitante.value.trim(),
      especialidade: el.selectEspecialidade.value,
      tipoLeito: el.selectTipoLeito.value,
      macrorregiao: el.selectMacrorregiao.value,
      complexidade: el.selectComplexidade.value,
      textoParticularidades: el.inputParticularidades.value
    };
  }

  function executarPesquisa(evento) {
    if (evento) evento.preventDefault();
    const criterios = coletarCriteriosPesquisa();
    const resultado = Pesquisa.executar(criterios);

    if (!resultado.ok) {
      resultado.erros.forEach((msg) => Utilitarios.exibirAlerta(msg, 'warning'));
      return;
    }

    Resultados.renderizar(resultado, criterios);
  }

  function limparFiltros() {
    const el = elementos();
    el.selectMunicipioSolicitante.value = '';
    el.inputParticularidades.value = '';
    el.selectEspecialidade.value = '';
    el.selectTipoLeito.value = '';
    el.selectMacrorregiao.value = '';
    el.selectComplexidade.value = '';
    atualizarFiltrosInterdependentes();
    Resultados.limpar();
  }

  function ligarEventos() {
    const el = elementos();

    el.formPesquisa.addEventListener('submit', executarPesquisa);
    el.btnLimparFiltros.addEventListener('click', limparFiltros);
    el.btnAtualizarBase.addEventListener('click', () => carregarBase(true));
    el.btnExportarCsv.addEventListener('click', () => Resultados.exportarCsv());
    el.btnExportarExcel.addEventListener('click', () => Resultados.exportarExcel());
    el.btnImprimir.addEventListener('click', () => Resultados.imprimir());
    el.btnExportarQualidade.addEventListener('click', () => QualidadeDados.exportarRelatorio());
    el.btnAbrirQualidade.addEventListener('click', () => {
      QualidadeDados.renderizar();
      Utilitarios.obterModal('#modal-qualidade-base').show();
    });

    [el.selectEspecialidade, el.selectTipoLeito, el.selectMacrorregiao, el.selectComplexidade]
      .forEach((select) => select.addEventListener('change', atualizarFiltrosInterdependentes));
  }

  function iniciarAtualizacaoAutomatica() {
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    const ms = CONFIG.INTERVALO_ATUALIZACAO_MINUTOS * 60 * 1000;
    intervaloAtualizacao = setInterval(() => carregarBase(false), ms);
  }

  function preencherTextosInstitucionais() {
    document.title = CONFIG.TITULO_PAINEL;
    document.getElementById('texto-titulo-painel').textContent = CONFIG.TITULO_PAINEL;
    document.getElementById('texto-orgao-1').textContent = CONFIG.ORGAO_1;
    document.getElementById('texto-orgao-2').textContent = CONFIG.ORGAO_2;
    document.getElementById('texto-orgao-3').textContent = CONFIG.ORGAO_3;
    document.getElementById('texto-aviso-institucional').textContent = CONFIG.AVISO_INSTITUCIONAL;
    const logo = document.getElementById('logo-goias');
    if (logo) logo.src = CONFIG.LOGO_PATH;
  }

  async function iniciar() {
    preencherTextosInstitucionais();
    ligarEventos();
    await carregarBase(false);
    iniciarAtualizacaoAutomatica();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
