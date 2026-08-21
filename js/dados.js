/**
 * ============================================================================
 * DADOS.JS
 * Carregamento, parsing e consolidação das três abas da base
 * (BASE_ATUALIZADA, INTERMEDIAÇÃO, DISTÂNCIA), a partir da fonte online
 * (Google Sheets/CSV) com fallback automático para os arquivos locais de
 * contingência definidos em config.js (Seções 13, 15, 16, 42).
 * ============================================================================
 */

const Dados = (() => {

  const banco = {
    registros: [],
    linhasDistancia: [],
    ultimaAtualizacao: null,
    origemDados: null,
    carregando: false,
    diagnostico: {
      totalLinhasBrutasBase: 0,
      totalLinhasBrutasIntermediacao: 0,
      registrosDuplicadosRemovidos: 0
    }
  };

  function parseCsv(textoCsv) {
    const resultado = Papa.parse(textoCsv, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => Normalizacao.normalizarExibicao(h)
    });
    return (resultado.data || []).filter((linha) => {
      return Object.values(linha).some((v) => v !== null && v !== undefined && String(v).trim() !== '');
    });
  }

  async function buscarTexto(url) {
    const resposta = await fetch(Utilitarios.evitarCache(url), { cache: 'no-store' });
    if (!resposta.ok) {
      throw new Error(`Falha HTTP ${resposta.status} ao buscar ${url}`);
    }
    return resposta.text();
  }

  async function carregarAba(urlOnline, urlLocal, nomeAba) {
    try {
      const texto = await buscarTexto(urlOnline);
      const linhas = parseCsv(texto);
      if (linhas.length === 0) throw new Error('Aba online retornou vazia');
      return { linhas, origem: 'online' };
    } catch (erroOnline) {
      console.warn(`[Dados] Falha ao carregar "${nomeAba}" da fonte online, usando contingência local.`, erroOnline);
      try {
        const texto = await buscarTexto(urlLocal);
        const linhas = parseCsv(texto);
        return { linhas, origem: 'local' };
      } catch (erroLocal) {
        console.error(`[Dados] Falha também na fonte local de "${nomeAba}".`, erroLocal);
        throw new Error(`Não foi possível carregar a aba ${nomeAba} (online nem local).`);
      }
    }
  }

  function construirRegistroBase(linha) {
    return {
      origem: 'BASE_ATUALIZADA',
      macrorregiao: Normalizacao.normalizarExibicao(linha['MACRORREGIÃO']),
      unidadeExecutante: Normalizacao.normalizarExibicao(linha['UNIDADES EXECUTANTES']),
      complexidade: Normalizacao.normalizarExibicao(linha['COMPLEXIDADE']),
      tipoAtendimento: Normalizacao.normalizarExibicao(linha['TIPO DE ATENDIMENTO']),
      tipoLeito: Normalizacao.normalizarExibicao(linha['TIPO DE LEITO']),
      especialidade: Normalizacao.normalizarExibicao(linha['ESPECIALIDADES']),
      fluxoRegulatorio: Normalizacao.normalizarExibicao(linha['FLUXO REGULATÓRIO']),
      particularidades: Normalizacao.normalizarExibicao(linha['PARTICULARIDADES DA SOLICITAÇÃO POR UNIDADE EXECUTANTE']),
      coberturaSad: Normalizacao.normalizarExibicao(linha['COBERTURA SAD - MUNICÍPIO REFERÊNCIA X UN. EXECUTANTE']),
      municipioExecutante: null,
      distanciaKm: null,
      distanciaTexto: null,
      distanciaConhecida: false
    };
  }

  function construirRegistroIntermediacao(linha) {
    return {
      origem: 'INTERMEDIACAO',
      macrorregiao: '',
      unidadeExecutante: Normalizacao.normalizarExibicao(linha['UNIDADES EXECUTANTES']),
      complexidade: '',
      tipoAtendimento: '',
      tipoLeito: Normalizacao.normalizarExibicao(linha['TIPO DE LEITO']),
      especialidade: Normalizacao.normalizarExibicao(linha['ESPECIALIDADES']),
      fluxoRegulatorio: Normalizacao.normalizarExibicao(linha['FLUXO REGULATÓRIO']),
      particularidades: Normalizacao.normalizarExibicao(linha['PARTICULARIDADES DA SOLICITAÇÃO POR UNIDADE EXECUTANTE']),
      coberturaSad: Normalizacao.normalizarExibicao(linha['COBERTURA SAD - MUNICÍPIO REFERÊNCIA X UN. EXECUTANTE']),
      municipioExecutante: null,
      distanciaKm: null,
      distanciaTexto: null,
      distanciaConhecida: false
    };
  }

  function deduplicarRegistros(registros) {
    const vistos = new Set();
    const unicos = [];
    for (const r of registros) {
      const chave = [
        r.origem, Normalizacao.normalizarChave(r.unidadeExecutante),
        Normalizacao.normalizarChave(r.especialidade),
        Normalizacao.normalizarChave(r.tipoLeito),
        Normalizacao.normalizarChave(r.complexidade),
        Normalizacao.normalizarChave(r.macrorregiao),
        Normalizacao.normalizarChave(r.fluxoRegulatorio),
        Normalizacao.normalizarChave(r.particularidades)
      ].join('|');
      if (!vistos.has(chave)) {
        vistos.add(chave);
        unicos.push(r);
      }
    }
    return unicos;
  }

  async function carregarTudo() {
    if (banco.carregando) return banco;
    banco.carregando = true;

    try {
      const [respBase, respInter, respDist] = await Promise.all([
        carregarAba(CONFIG.URL_BASE_ATUALIZADA, CONFIG.URL_BASE_ATUALIZADA_LOCAL, 'BASE_ATUALIZADA'),
        carregarAba(CONFIG.URL_INTERMEDIACAO, CONFIG.URL_INTERMEDIACAO_LOCAL, 'INTERMEDIAÇÃO'),
        carregarAba(CONFIG.URL_DISTANCIA, CONFIG.URL_DISTANCIA_LOCAL, 'DISTÂNCIA')
      ]);

      const registrosBase = respBase.linhas.map(construirRegistroBase);
      const registrosInter = respInter.linhas.map(construirRegistroIntermediacao);
      const totalAntesDedup = registrosBase.length + registrosInter.length;
      let registros = deduplicarRegistros([...registrosBase, ...registrosInter]);

      banco.diagnostico.totalLinhasBrutasBase = registrosBase.length;
      banco.diagnostico.totalLinhasBrutasIntermediacao = registrosInter.length;
      banco.diagnostico.registrosDuplicadosRemovidos = totalAntesDedup - registros.length;

      banco.registros = registros;
      banco.linhasDistancia = respDist.linhas;
      banco.origemDados = (respBase.origem === 'online' && respInter.origem === 'online' && respDist.origem === 'online')
        ? 'online' : 'local (contingência)';
      banco.ultimaAtualizacao = new Date();

      Distancia.construirIndice(banco.linhasDistancia);
      banco.registros.forEach((r) => {
        r.municipioExecutante = Distancia.obterMunicipioDaUnidade(r.unidadeExecutante);
      });
      Distancia.aplicarDistancias(banco.registros);

      Filtros.construirIndices(banco.registros);

      return banco;
    } finally {
      banco.carregando = false;
    }
  }

  return {
    banco,
    carregarTudo
  };
})();
