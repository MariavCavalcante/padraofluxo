/**
 * ============================================================================
 * DISTANCIA.JS
 * Módulo responsável pela REGRA CENTRAL DO SISTEMA (Seção 4): a distância
 * entre Município Solicitante x Município Executante é a informação de
 * maior destaque do painel e determina SEMPRE a ordenação dos resultados.
 * ============================================================================
 */

const Distancia = (() => {

  let indice = {};
  let municipiosExecutantesConhecidos = {};
  let municipiosSolicitantesConhecidos = {};

  let paresDuplicados = [];
  let distanciasConflitantes = [];
  let distanciasInvalidas = [];

  function construirIndice(linhasDistancia) {
    indice = {};
    municipiosExecutantesConhecidos = {};
    municipiosSolicitantesConhecidos = {};
    paresDuplicados = [];
    distanciasConflitantes = [];
    distanciasInvalidas = [];

    const valoresVistosPorPar = {};

    for (const linha of linhasDistancia) {
      const solicitanteOriginal = Normalizacao.normalizarExibicao(linha['Município Solicitante']);
      const executanteOriginal = Normalizacao.normalizarExibicao(linha['Município Executante']);
      const distanciaTextoOriginal = Normalizacao.normalizarExibicao(linha['Distancia']);

      if (!solicitanteOriginal || !executanteOriginal) continue;

      const chaveSol = Normalizacao.normalizarChave(solicitanteOriginal);
      const chaveExe = Normalizacao.normalizarChave(executanteOriginal);
      const chavePar = `${chaveSol}::${chaveExe}`;

      const numero = Normalizacao.paraNumero(distanciaTextoOriginal);
      if (numero === null || numero < 0) {
        distanciasInvalidas.push({ solicitante: solicitanteOriginal, executante: executanteOriginal, valor: distanciaTextoOriginal });
        continue;
      }

      municipiosSolicitantesConhecidos[chaveSol] = solicitanteOriginal;
      municipiosExecutantesConhecidos[chaveExe] = executanteOriginal;

      if (!valoresVistosPorPar[chavePar]) {
        valoresVistosPorPar[chavePar] = new Set();
      }
      const jaTinhaEsseValor = valoresVistosPorPar[chavePar].has(numero);
      valoresVistosPorPar[chavePar].add(numero);

      if (jaTinhaEsseValor) {
        paresDuplicados.push({ solicitante: solicitanteOriginal, executante: executanteOriginal, distancia: numero });
        continue;
      }

      if (!indice[chaveSol]) indice[chaveSol] = {};

      if (indice[chaveSol][chaveExe] && indice[chaveSol][chaveExe].distanciaKm !== numero) {
        distanciasConflitantes.push({
          solicitante: solicitanteOriginal,
          executante: executanteOriginal,
          distanciaA: indice[chaveSol][chaveExe].distanciaKm,
          distanciaB: numero
        });
        if (numero < indice[chaveSol][chaveExe].distanciaKm) {
          indice[chaveSol][chaveExe] = { distanciaKm: numero, solicitanteOriginal, executanteOriginal };
        }
        continue;
      }

      indice[chaveSol][chaveExe] = { distanciaKm: numero, solicitanteOriginal, executanteOriginal };
    }
  }

  function obterDistancia(municipioSolicitante, municipioExecutante) {
    if (!municipioSolicitante || !municipioExecutante) {
      return { distanciaKm: null, distanciaTexto: null };
    }
    const chaveSol = Normalizacao.normalizarChave(municipioSolicitante);
    const chaveExe = Normalizacao.normalizarChave(municipioExecutante);
    const entrada = indice[chaveSol] && indice[chaveSol][chaveExe];
    if (!entrada) return { distanciaKm: null, distanciaTexto: null };
    return {
      distanciaKm: entrada.distanciaKm,
      distanciaTexto: Normalizacao.formatarDistancia(entrada.distanciaKm)
    };
  }

  function obterMunicipioDaUnidade(unidadeExecutante) {
    if (!unidadeExecutante) return null;
    const chaveUnidade = Normalizacao.normalizarChave(unidadeExecutante);

    for (const [unidadeConfig, municipio] of Object.entries(CONFIG.UNIDADE_MUNICIPIO_MAP)) {
      if (Normalizacao.normalizarChave(unidadeConfig) === chaveUnidade) {
        return municipio;
      }
    }

    const partes = unidadeExecutante.split(' - ');
    if (partes.length >= 2) {
      let candidato = partes[partes.length - 1];
      candidato = candidato.split('/')[0];
      candidato = Normalizacao.normalizarExibicao(candidato);
      if (candidato) {
        return candidato;
      }
    }

    return null;
  }

  function aplicarDistanciasParaSolicitante(registros, municipioSolicitante) {
    return registros.map((r) => {
      const { distanciaKm, distanciaTexto } = obterDistancia(municipioSolicitante, r.municipioExecutante);
      return {
        ...r,
        distanciaKm,
        distanciaTexto,
        distanciaConhecida: distanciaKm !== null
      };
    });
  }

  function aplicarDistancias(registros) {
    registros.forEach((r) => {
      r.distanciaKm = null;
      r.distanciaTexto = null;
      r.distanciaConhecida = false;
    });
  }

  function listarMunicipiosSolicitantes() {
    return Object.values(municipiosSolicitantesConhecidos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function obterOcorrenciasQualidade() {
    return {
      paresDuplicados,
      distanciasConflitantes,
      distanciasInvalidas
    };
  }

  return {
    construirIndice,
    obterDistancia,
    obterMunicipioDaUnidade,
    aplicarDistanciasParaSolicitante,
    aplicarDistancias,
    listarMunicipiosSolicitantes,
    obterOcorrenciasQualidade
  };
})();
