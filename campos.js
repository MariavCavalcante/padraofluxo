/**
 * ACESSO PADRONIZADO AOS CAMPOS DAS DUAS PLANILHAS
 * (unidades/fluxo e distâncias), usando o mapeamento de CONFIG.COLUNAS.
 */
window.LeitorCampos = {

  campo(registro, chaveConfig) {
    const nomes = (window.CONFIG.COLUNAS && window.CONFIG.COLUNAS[chaveConfig]) || [];
    return Normalizador.acharCampo(registro, nomes);
  },

  // ---- Planilha de unidades / fluxo ----
  macrorregiao(registro) { return this.campo(registro, "MACRORREGIAO"); },
  unidadeExecutante(registro) { return this.campo(registro, "UNIDADE_EXECUTANTE"); },
  complexidade(registro) { return this.campo(registro, "COMPLEXIDADE"); },
  tipoAtendimento(registro) { return this.campo(registro, "TIPO_ATENDIMENTO"); },
  tipoLeito(registro) { return this.campo(registro, "TIPO_LEITO"); },
  especialidade(registro) { return this.campo(registro, "ESPECIALIDADE"); },
  fluxo(registro) { return this.campo(registro, "FLUXO_REGULATORIO"); },
  particularidades(registro) { return this.campo(registro, "PARTICULARIDADES"); },
  coberturaSad(registro) { return this.campo(registro, "COBERTURA_SAD"); },

  // ---- Planilha de distâncias ----
  municipioSolicitante(registro) { return this.campo(registro, "MUNICIPIO_SOLICITANTE"); },
  municipioExecutanteDistancia(registro) { return this.campo(registro, "MUNICIPIO_EXECUTANTE"); },
  distancia(registro) { return this.campo(registro, "DISTANCIA_KM"); }
};
