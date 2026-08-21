/**
 * ============================================================================
 * PESQUISA.JS
 * Execução da pesquisa (Seção 23) seguindo estritamente a Regra de Ouro do
 * Desenvolvimento (Seção 47):
 *   1) Pesquise a necessidade.
 *   2) Localize as ofertas compatíveis (BASE_ATUALIZADA + INTERMEDIAÇÃO).
 *   3) Identifique o Município Executante (já resolvido no carregamento).
 *   4) Consulte a distância Município Solicitante x Município Executante.
 *   5) Ordene obrigatoriamente do MENOR KM para o MAIOR KM (Seção 24, 25).
 *   6) Destaque a unidade MAIS PRÓXIMA (Seção 27).
 *   7) Permita consultar particularidades (Seção 7, 30).
 *
 * REGRA ADICIONAL (pedido do usuário em 21/08/2026): cada UNIDADE
 * EXECUTANTE aparece NO MÁXIMO UMA VEZ no resultado, mesmo que existam
 * várias linhas na base compatíveis com a pesquisa para a mesma unidade
 * (ex.: mais de um Tipo de Leito ou Complexidade para a especialidade
 * pesquisada). Nenhuma informação é perdida nesse processo: os valores
 * distintos encontrados para os campos descritivos são combinados — ver
 * consolidarPorUnidade().
 * ============================================================================
 */

const Pesquisa = (() => {

  function validar(criterios) {
    const erros = [];
    if (!criterios.municipioSolicitante || criterios.municipioSolicitante.trim() === '') {
      erros.push('Selecione o Município Solicitante.');
    }
    if (!criterios.especialidade || criterios.especialidade.trim() === '') {
      erros.push('Selecione a Especialidade.');
    }
    return erros;
  }

  /**
   * Agrupa os candidatos por Unidade Executante (chave normalizada) e
   * retorna UM único registro por unidade. Campos descritivos que
   * divergem entre as linhas agrupadas (Macrorregião, Complexidade, Tipo
   * de Atendimento, Tipo de Leito, Fluxo Regulatório, Particularidades,
   * Cobertura SAD) são combinados — valores distintos são unidos com
   * " | ", sem perder nenhuma informação da base. A distância é a mesma
   * para todas as linhas de uma unidade (depende só do Município
   * Executante, já resolvido no carregamento).
   */
  function consolidarPorUnidade(registros) {
    const grupos = new Map(); // chave normalizada da unidade -> array de registros

    registros.forEach((r) => {
      const chave = Normalizacao.normalizarChave(r.unidadeExecutante);
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(r);
    });

    const camposParaCombinar = [
      'macrorregiao', 'complexidade', 'tipoAtendimento', 'tipoLeito',
      'fluxoRegulatorio', 'particularidades', 'coberturaSad'
    ];

    const resultado = [];
    grupos.forEach((linhas) => {
      const primaria = linhas[0];
      const consolidada = { ...primaria };

      camposParaCombinar.forEach((campo) => {
        const valoresUnicos = Array.from(
          new Set(linhas.map((l) => (l[campo] || '').trim()).filter((v) => v !== ''))
        );
        consolidada[campo] = valoresUnicos.join(' | ');
      });

      consolidada._temBase = linhas.some((l) => l.origem === 'BASE_ATUALIZADA');
      consolidada._temIntermediacao = linhas.some((l) => l.origem === 'INTERMEDIACAO');

      resultado.push(consolidada);
    });

    return resultado;
  }

  function executar(criterios) {
    const erros = validar(criterios);
    if (erros.length > 0) {
      return { ok: false, erros, resultados: [] };
    }

    // 1) Localiza ofertas compatíveis por especialidade (índice em memória)
    let candidatos = Filtros.registrosPorEspecialidade(criterios.especialidade);

    // 2) Aplica filtros opcionais quando informados (Seção 23)
    if (criterios.tipoLeito) {
      candidatos = candidatos.filter((r) => Filtros.registroCompativel(r, 'tipoLeito', criterios.tipoLeito));
    }
    if (criterios.macrorregiao) {
      candidatos = candidatos.filter((r) => Filtros.registroCompativel(r, 'macrorregiao', criterios.macrorregiao));
    }
    if (criterios.complexidade) {
      candidatos = candidatos.filter((r) => Filtros.registroCompativel(r, 'complexidade', criterios.complexidade));
    }
    if (criterios.textoParticularidades && criterios.textoParticularidades.trim() !== '') {
      const termo = criterios.textoParticularidades.trim();
      candidatos = candidatos.filter((r) => Normalizacao.contemTermo(r.particularidades, termo));
    }

    // 3) Município Executante já foi identificado no carregamento da base.

    // 4) Consulta a distância Município Solicitante x Município Executante
    //    exclusivamente por essa chave (Seção 10).
    let comDistancia = Distancia.aplicarDistanciasParaSolicitante(candidatos, criterios.municipioSolicitante);

    // 4.5) Consolida por Unidade Executante — uma linha por unidade,
    //    combinando os campos descritivos divergentes (ver função acima).
    let resultados = consolidarPorUnidade(comDistancia);

    // 5) Ordenação obrigatória: MENOR -> MAIOR distância; sem distância
    //    conhecida sempre por último (Seção 24, 25).
    resultados.sort((a, b) => {
      if (a.distanciaConhecida && b.distanciaConhecida) return a.distanciaKm - b.distanciaKm;
      if (a.distanciaConhecida && !b.distanciaConhecida) return -1;
      if (!a.distanciaConhecida && b.distanciaConhecida) return 1;
      return a.unidadeExecutante.localeCompare(b.unidadeExecutante, 'pt-BR');
    });

    // 6) Selo "MAIS PRÓXIMA": primeiro resultado válido (Seção 27).
    let jaAtribuiuMaisProxima = false;
    resultados = resultados.map((r, indice) => {
      let maisProxima = false;
      if (!jaAtribuiuMaisProxima && r.distanciaConhecida) {
        maisProxima = true;
        jaAtribuiuMaisProxima = true;
      }
      return { ...r, ordem: indice + 1, maisProxima };
    });

    return {
      ok: true,
      erros: [],
      resultados,
      menorDistancia: resultados.find((r) => r.distanciaConhecida) || null,
      totalEncontrados: resultados.length
    };
  }

  return {
    validar,
    executar,
    consolidarPorUnidade
  };
})();
