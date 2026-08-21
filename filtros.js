/**
 * ============================================================================
 * FILTROS.JS
 * Extração DINÂMICA dos valores de filtro a partir da base carregada
 * (Seção 6) e FILTROS INTERDEPENDENTES (Seção 22).
 * ============================================================================
 */

const Filtros = (() => {

  let todosRegistros = [];
  let indiceEspecialidade = {};

  function construirIndices(registros) {
    todosRegistros = registros;
    indiceEspecialidade = {};
    for (const r of registros) {
      const chave = Normalizacao.normalizarChave(r.especialidade);
      if (!chave) continue;
      if (!indiceEspecialidade[chave]) indiceEspecialidade[chave] = [];
      indiceEspecialidade[chave].push(r);
    }
  }

  function valoresUnicosOrdenados(registros, campo) {
    const vistos = new Map();
    for (const r of registros) {
      const valor = r[campo];
      if (!valor) continue;
      const chave = Normalizacao.normalizarChave(valor);
      if (!vistos.has(chave)) vistos.set(chave, valor);
    }
    return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function registroCompativel(registro, campo, valorSelecionado) {
    if (!valorSelecionado) return true;
    return Normalizacao.normalizarChave(registro[campo]) === Normalizacao.normalizarChave(valorSelecionado);
  }

  function opcoesDisponiveis(selecaoAtual) {
    const campos = ['especialidade', 'tipoLeito', 'macrorregiao', 'complexidade'];
    const resultado = {};

    for (const campoAlvo of campos) {
      const subconjunto = todosRegistros.filter((r) => {
        return campos.every((campo) => {
          if (campo === campoAlvo) return true;
          return registroCompativel(r, campo, selecaoAtual[campo]);
        });
      });
      resultado[campoAlvo] = valoresUnicosOrdenados(subconjunto, campoAlvo);
    }

    return resultado;
  }

  function registrosPorEspecialidade(especialidade) {
    const chave = Normalizacao.normalizarChave(especialidade);
    return indiceEspecialidade[chave] || [];
  }

  return {
    construirIndices,
    opcoesDisponiveis,
    registrosPorEspecialidade,
    valoresUnicosOrdenados,
    registroCompativel
  };
})();
