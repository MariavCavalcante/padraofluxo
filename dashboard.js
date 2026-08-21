/**
 * INDICADORES (KPIs) DO PAINEL
 */
window.Dashboard = {

  // Indicadores gerais da base completa (independem de pesquisa).
  atualizarBase(unidades, indiceDistancias) {
    const especialidades = new Set(
      unidades.map(u => Normalizador.texto(LeitorCampos.especialidade(u))).filter(Boolean)
    ).size;

    const unidadesUnicas = new Set(
      unidades.map(u => Normalizador.texto(LeitorCampos.unidadeExecutante(u))).filter(Boolean)
    ).size;

    const municipios = new Set(
      unidades
        .map(u => Normalizador.extrairMunicipioDaUnidade(LeitorCampos.unidadeExecutante(u)))
        .filter(Boolean)
    ).size;

    document.getElementById("totalEspecialidades").textContent = especialidades;
    document.getElementById("totalUnidades").textContent = unidadesUnicas;
    document.getElementById("totalMunicipios").textContent = municipios;
  },

  // Indicadores da pesquisa atual.
  atualizarResultados(resultados) {
    const distancias = resultados.map(r => r.distancia).filter(Number.isFinite);

    document.getElementById("totalResultados").textContent = resultados.length;
    document.getElementById("menorDistancia").textContent = distancias.length
      ? `${Math.min(...distancias).toFixed(1)} km`
      : "--";
  }
};
