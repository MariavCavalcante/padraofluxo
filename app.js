/**
 * APLICAÇÃO PRINCIPAL
 * Orquestra carregamento de dados, filtros, pesquisa, tabela,
 * exportação e qualidade da base.
 */
window.App = {

  unidades: [],
  distancias: [],
  indiceDistancias: new Map(),
  municipiosSolicitantes: [],
  resultadosAtuais: [],
  _ultimaQualidade: null,

  async init() {
    this.vincularEventos();
    await this.carregarBase();
    setInterval(() => this.carregarBase(), CONFIG.INTERVALO_ATUALIZACAO_MINUTOS * 60 * 1000);
  },

  vincularEventos() {
    document.getElementById("btnAtualizarBase").addEventListener("click", () => this.carregarBase());
    document.getElementById("btnPesquisar").addEventListener("click", () => this.pesquisar());
    document.getElementById("btnLimparFiltros").addEventListener("click", () => this.limparFiltros());
    document.getElementById("btnExportarResultados").addEventListener("click", () => this.exportarCSV());
    document.getElementById("btnImprimirResultados").addEventListener("click", () => window.print());
    document.getElementById("btnQualidadeDados").addEventListener("click", () => this.abrirQualidadeDados());
    document.getElementById("btnExportarQualidade").addEventListener("click", () => this.exportarQualidade());

    const inputMunicipio = document.getElementById("municipioSolicitante");
    inputMunicipio.addEventListener("input", () => this.filtrarSugestoesMunicipio());
    inputMunicipio.addEventListener("focus", () => this.filtrarSugestoesMunicipio());

    document.addEventListener("click", evento => {
      const container = document.getElementById("sugestoesMunicipio");
      if (!container.contains(evento.target) && evento.target !== inputMunicipio) {
        container.style.display = "none";
      }
    });

    document.getElementById("formularioBusca").addEventListener("submit", evento => {
      evento.preventDefault();
      this.pesquisar();
    });
  },

  async carregarBase() {
    this.mostrarCarregando(true);
    this.mostrarErro(null);
    this.atualizarStatus("carregando");

    try {
      const embutidos = window.DADOS_EMBUTIDOS || {};

      const [respUnidades, respDistancias] = await Promise.all([
        LeitorDados.carregarCSV(CONFIG.URL_BASE_UNIDADES, CONFIG.CACHE_KEY_UNIDADES, embutidos.unidades),
        LeitorDados.carregarCSV(CONFIG.URL_BASE_DISTANCIAS, CONFIG.CACHE_KEY_DISTANCIAS, embutidos.distancias)
      ]);

      this.unidades = respUnidades.dados.filter(u => LeitorCampos.unidadeExecutante(u));
      this.distancias = respDistancias.dados.filter(d => LeitorCampos.municipioSolicitante(d));
      this.indiceDistancias = RankingMotor.indexarDistancias(this.distancias);

      this.popularFiltros();
      Dashboard.atualizarBase(this.unidades, this.indiceDistancias);

      const usouEmbutido = respUnidades.origem === "embutido" || respDistancias.origem === "embutido";
      const usouCache = respUnidades.origem === "cache" || respDistancias.origem === "cache";
      this.atualizarStatus(usouEmbutido ? "embutido" : (usouCache ? "cache" : "ok"));
      document.getElementById("dataUltima").textContent = this.horarioAtual();

    } catch (erro) {
      console.error(erro);
      this.atualizarStatus("erro");
      this.mostrarErro("Não foi possível atualizar a base de dados. " + (erro?.message || ""));
    } finally {
      this.mostrarCarregando(false);
    }
  },

  horarioAtual() {
    const agora = new Date();
    return agora.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  },

  atualizarStatus(estado) {
    const badge = document.getElementById("statusBase");
    const mapa = {
      carregando: { classe: "bg-secondary", icone: "fa-spinner fa-spin", texto: "Atualizando..." },
      ok: { classe: "bg-success", icone: "fa-circle", texto: "Atualizada" },
      cache: { classe: "bg-warning text-dark", icone: "fa-triangle-exclamation", texto: "Usando cache local" },
      embutido: { classe: "bg-warning text-dark", icone: "fa-plug-circle-xmark", texto: "Modo offline (dados de exemplo)" },
      erro: { classe: "bg-danger", icone: "fa-circle-exclamation", texto: "Erro na atualização" }
    };
    const info = mapa[estado] || mapa.erro;
    badge.className = `badge ${info.classe}`;
    badge.innerHTML = `<i class="fas ${info.icone}"></i> ${info.texto}`;
  },

  mostrarCarregando(mostrar) {
    document.getElementById("mensagemCarregamento").style.display = mostrar ? "block" : "none";
  },

  mostrarErro(mensagem) {
    const bloco = document.getElementById("mensagemErro");
    if (!mensagem) {
      bloco.style.display = "none";
      return;
    }
    document.getElementById("textoErro").textContent = mensagem;
    bloco.style.display = "block";
  },

  popularFiltros() {
    this.municipiosSolicitantes = Array.from(new Set(
      this.distancias.map(d => LeitorCampos.municipioSolicitante(d)).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const especialidades = Array.from(new Set(
      this.unidades.map(u => LeitorCampos.especialidade(u)).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const leitos = Array.from(new Set(
      this.unidades.map(u => LeitorCampos.tipoLeito(u)).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const complexidades = Array.from(new Set(
      this.unidades.map(u => LeitorCampos.complexidade(u)).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, "pt-BR"));

    this.popularSelect("especialidade", especialidades, "-- Selecione uma especialidade --");
    this.popularSelect("tipoLeito", leitos, "-- Todos --");
    this.popularSelect("complexidade", complexidades, "-- Todas --");
  },

  popularSelect(id, valores, rotuloPadrao) {
    const select = document.getElementById(id);
    const valorAtual = select.value;
    select.innerHTML = `<option value="">${rotuloPadrao}</option>` +
      valores.map(v => `<option value="${Normalizador.escaparHtml(v)}">${Normalizador.escaparHtml(v)}</option>`).join("");
    if (valores.includes(valorAtual)) {
      select.value = valorAtual;
    }
  },

  filtrarSugestoesMunicipio() {
    const input = document.getElementById("municipioSolicitante");
    const termo = Normalizador.texto(input.value);
    const container = document.getElementById("sugestoesMunicipio");
    const lista = document.getElementById("listaMunicipios");

    const encontrados = termo
      ? this.municipiosSolicitantes.filter(m => Normalizador.texto(m).includes(termo)).slice(0, 12)
      : this.municipiosSolicitantes.slice(0, 12);

    if (!encontrados.length) {
      container.style.display = "none";
      return;
    }

    lista.innerHTML = encontrados
      .map(m => `<li data-valor="${Normalizador.escaparHtml(m)}">${Normalizador.escaparHtml(m)}</li>`)
      .join("");
    container.style.display = "block";

    lista.querySelectorAll("li").forEach(item => {
      item.addEventListener("click", () => {
        input.value = item.dataset.valor;
        container.style.display = "none";
      });
    });
  },

  pesquisar() {
    const municipioSolicitante = document.getElementById("municipioSolicitante").value.trim();
    const especialidade = document.getElementById("especialidade").value;
    const tipoLeito = document.getElementById("tipoLeito").value;
    const complexidade = document.getElementById("complexidade").value;
    const particularidades = document.getElementById("particularidades").value.trim();

    this.mostrarErro(null);

    if (!municipioSolicitante || !especialidade) {
      this.mostrarErro("Selecione o Município Solicitante e a Especialidade para pesquisar.");
      return;
    }

    const municipioValido = this.municipiosSolicitantes.some(
      m => Normalizador.texto(m) === Normalizador.texto(municipioSolicitante)
    );

    if (!municipioValido) {
      this.mostrarErro("Município Solicitante não encontrado na base de distâncias. Selecione um item da lista de sugestões.");
      return;
    }

    const resultados = RankingMotor.calcular(
      { municipioSolicitante, especialidade, tipoLeito, complexidade, particularidades },
      this.unidades,
      this.indiceDistancias
    );

    this.resultadosAtuais = resultados;
    this.renderizarResultados(resultados);
    Dashboard.atualizarResultados(resultados);
  },

  renderizarResultados(resultados) {
    const container = document.getElementById("containerResultados");
    const vazio = document.getElementById("nenhumResultado");
    const corpo = document.getElementById("corpoTabela");
    const rotulo = document.getElementById("rotuloResultados");

    document.getElementById("btnExportarResultados").style.display = resultados.length ? "inline-flex" : "none";
    document.getElementById("btnImprimirResultados").style.display = resultados.length ? "inline-flex" : "none";

    if (!resultados.length) {
      container.style.display = "none";
      vazio.style.display = "block";
      return;
    }

    vazio.style.display = "none";
    container.style.display = "block";
    rotulo.textContent = `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`;

    corpo.innerHTML = resultados.map((resultado, indice) => {
      const posicao = indice + 1;
      const distanciaTexto = Number.isFinite(resultado.distancia)
        ? `<span class="distance-pill">${resultado.distancia.toFixed(1)} km</span>`
        : `<span class="distance-pill sem-dado">Não informada</span>`;

      const rankBadge = posicao === 1
        ? `<span class="badge badge-mais-proxima">1º · MAIS PRÓXIMA</span>`
        : `<span class="badge bg-secondary">${posicao}º</span>`;

      return `
        <tr>
          <td>${rankBadge}</td>
          <td>${distanciaTexto}</td>
          <td>${Normalizador.escaparHtml(resultado.unidade)}</td>
          <td>${Normalizador.escaparHtml(resultado.municipioExecutante)}</td>
          <td>${Normalizador.escaparHtml(resultado.especialidade)}</td>
          <td>${Normalizador.escaparHtml(resultado.complexidade)}</td>
          <td><button type="button" class="btn btn-sm btn-outline-primary btn-detalhes" data-indice="${indice}"><i class="fas fa-eye"></i> Detalhes</button></td>
        </tr>
      `;
    }).join("");

    corpo.querySelectorAll(".btn-detalhes").forEach(botao => {
      botao.addEventListener("click", () => this.abrirDetalhes(Number(botao.dataset.indice)));
    });
  },

  abrirDetalhes(indice) {
    const resultado = this.resultadosAtuais[indice];
    if (!resultado) return;

    const campos = [
      ["Unidade Executante", resultado.unidade],
      ["Município Executante", resultado.municipioExecutante],
      ["Especialidade", resultado.especialidade],
      ["Tipo de Leito", resultado.tipoLeito],
      ["Complexidade", resultado.complexidade],
      ["Tipo de Atendimento", resultado.tipoAtendimento],
      ["Distância", Number.isFinite(resultado.distancia) ? `${resultado.distancia.toFixed(1)} km` : "Não informada"],
      ["Macrorregião da Unidade", resultado.macrorregiao]
    ];

    const camposLongos = [
      ["Fluxo Regulatório", resultado.fluxo],
      ["Particularidades da Solicitação", resultado.particularidades],
      ["Cobertura SAD", resultado.coberturaSad]
    ];

    const grid = campos.map(([rotulo, valor]) => `
      <div class="detail-item">
        <span class="detail-label">${Normalizador.escaparHtml(rotulo)}</span>
        <span class="detail-value">${Normalizador.escaparHtml(valor)}</span>
      </div>
    `).join("") + camposLongos.map(([rotulo, valor]) => `
      <div class="detail-item full">
        <span class="detail-label">${Normalizador.escaparHtml(rotulo)}</span>
        <span class="detail-value">${Normalizador.escaparHtml(valor)}</span>
      </div>
    `).join("");

    document.getElementById("conteudoModalParticularidades").innerHTML = `<div class="detail-grid">${grid}</div>`;

    const modal = new bootstrap.Modal(document.getElementById("modalParticularidades"));
    modal.show();
  },

  limparFiltros() {
    document.getElementById("formularioBusca").reset();
    document.getElementById("sugestoesMunicipio").style.display = "none";
    document.getElementById("containerResultados").style.display = "none";
    document.getElementById("nenhumResultado").style.display = "none";
    document.getElementById("btnExportarResultados").style.display = "none";
    document.getElementById("btnImprimirResultados").style.display = "none";
    document.getElementById("totalResultados").textContent = "0";
    document.getElementById("menorDistancia").textContent = "--";
    this.resultadosAtuais = [];
    this.mostrarErro(null);
  },

  exportarCSV() {
    if (!this.resultadosAtuais.length) return;

    const cabecalho = ["Ranking", "Distância (KM)", "Unidade Executante", "Município Executante", "Especialidade", "Tipo de Leito", "Complexidade", "Tipo de Atendimento", "Fluxo Regulatório", "Particularidades", "Cobertura SAD"];

    const linhas = this.resultadosAtuais.map((r, i) => [
      i + 1,
      Number.isFinite(r.distancia) ? r.distancia.toFixed(1) : "",
      r.unidade, r.municipioExecutante, r.especialidade, r.tipoLeito, r.complexidade, r.tipoAtendimento, r.fluxo, r.particularidades, r.coberturaSad
    ]);

    this.baixarCSV("resultados_regulacao.csv", cabecalho, linhas);
  },

  baixarCSV(nomeArquivo, cabecalho, linhas) {
    const escapar = valor => `"${String(valor ?? "").replaceAll('"', '""')}"`;
    const conteudo = [cabecalho, ...linhas].map(linha => linha.map(escapar).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  analisarQualidade() {
    const duplicadosMapa = new Map();
    this.unidades.forEach(u => {
      const chave = Normalizador.texto([
        LeitorCampos.unidadeExecutante(u), LeitorCampos.especialidade(u),
        LeitorCampos.tipoLeito(u), LeitorCampos.complexidade(u)
      ].join("|"));
      duplicadosMapa.set(chave, (duplicadosMapa.get(chave) || 0) + 1);
    });
    const duplicados = Array.from(duplicadosMapa.values()).filter(v => v > 1).length;

    const semUnidade = this.unidades.filter(u => !LeitorCampos.unidadeExecutante(u)).length;
    const semEspecialidade = this.unidades.filter(u => !LeitorCampos.especialidade(u)).length;

    const semMunicipioIdentificado = this.unidades.filter(
      u => !Normalizador.extrairMunicipioDaUnidade(LeitorCampos.unidadeExecutante(u))
    );

    const distanciasInvalidas = this.distancias.filter(
      d => Normalizador.numero(LeitorCampos.distancia(d)) === null
    ).length;

    const municipiosSemDistancia = this.unidades.filter(u => {
      const municipio = Normalizador.extrairMunicipioDaUnidade(LeitorCampos.unidadeExecutante(u));
      if (!municipio) return false;
      const existeDestino = this.distancias.some(
        d => Normalizador.texto(LeitorCampos.municipioExecutanteDistancia(d)) === Normalizador.texto(municipio)
      );
      return !existeDestino;
    });

    return {
      totalUnidades: this.unidades.length,
      totalDistancias: this.distancias.length,
      duplicados,
      semUnidade,
      semEspecialidade,
      semMunicipioIdentificado,
      distanciasInvalidas,
      municipiosSemDistancia
    };
  },

  abrirQualidadeDados() {
    const q = this.analisarQualidade();

    const linhaSemMunicipio = q.semMunicipioIdentificado.slice(0, 20)
      .map(u => `<li>${Normalizador.escaparHtml(LeitorCampos.unidadeExecutante(u))}</li>`).join("");

    const nomesUnidadesSemDistancia = Array.from(new Set(
      q.municipiosSemDistancia.map(u => Normalizador.extrairMunicipioDaUnidade(LeitorCampos.unidadeExecutante(u)))
    ));

    document.getElementById("conteudoQualidadeDados").innerHTML = `
      <div class="detail-grid mb-3">
        <div class="detail-item"><span class="detail-label">Registros na base de unidades</span><span class="detail-value">${q.totalUnidades}</span></div>
        <div class="detail-item"><span class="detail-label">Registros na base de distâncias</span><span class="detail-value">${q.totalDistancias}</span></div>
        <div class="detail-item"><span class="detail-label">Combinações duplicadas (unidade+especialidade+leito+complexidade)</span><span class="detail-value">${q.duplicados}</span></div>
        <div class="detail-item"><span class="detail-label">Registros sem Unidade Executante</span><span class="detail-value">${q.semUnidade}</span></div>
        <div class="detail-item"><span class="detail-label">Registros sem Especialidade</span><span class="detail-value">${q.semEspecialidade}</span></div>
        <div class="detail-item"><span class="detail-label">Distâncias com valor inválido</span><span class="detail-value">${q.distanciasInvalidas}</span></div>
      </div>
      ${nomesUnidadesSemDistancia.length ? `
        <p class="fw-bold mb-1">Municípios executantes sem distância cadastrada (${nomesUnidadesSemDistancia.length}):</p>
        <p class="text-muted small">${nomesUnidadesSemDistancia.map(v => Normalizador.escaparHtml(v)).join(", ")}</p>
      ` : ""}
      ${linhaSemMunicipio ? `
        <p class="fw-bold mb-1">Unidades sem município identificável no nome:</p>
        <ul class="small">${linhaSemMunicipio}</ul>
      ` : ""}
    `;

    this._ultimaQualidade = q;

    const modal = new bootstrap.Modal(document.getElementById("modalQualidadeDados"));
    modal.show();
  },

  exportarQualidade() {
    const q = this._ultimaQualidade || this.analisarQualidade();

    const cabecalho = ["Tipo de Inconsistência", "Item"];
    const linhas = [];

    q.municipiosSemDistancia.forEach(u => {
      linhas.push(["Município sem distância cadastrada", LeitorCampos.unidadeExecutante(u)]);
    });

    q.semMunicipioIdentificado.forEach(u => {
      linhas.push(["Unidade sem município identificável", LeitorCampos.unidadeExecutante(u)]);
    });

    if (!linhas.length) {
      linhas.push(["Nenhuma inconsistência encontrada", ""]);
    }

    this.baixarCSV("qualidade_base_regulacao.csv", cabecalho, linhas);
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
