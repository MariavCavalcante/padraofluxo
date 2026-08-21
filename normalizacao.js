/**
 * NORMALIZAÇÃO E LIMPEZA DE DADOS
 */
window.Normalizador = {

  // Remove acentos, caracteres especiais, espaços extras; deixa maiúsculo.
  texto(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[–—-]/g, " ")
      .replace(/[^A-Za-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  },

  // Converte texto em número, aceitando formatos "1.234,5" ou "1234.5".
  numero(valor) {
    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    let texto = String(valor).trim().replace(/\s/g, "").replace(/[^\d,.-]/g, "");

    if (texto.includes(",") && texto.includes(".")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
      texto = texto.replace(",", ".");
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
  },

  // Busca um campo em um objeto testando uma lista de nomes possíveis de coluna.
  acharCampo(objeto, nomes) {
    if (!objeto) {
      return "";
    }

    const entradas = Object.entries(objeto);

    for (const nome of nomes) {
      const alvo = this.texto(nome);
      const encontrado = entradas.find(([chave]) => this.texto(chave) === alvo);

      if (encontrado && encontrado[1] !== undefined && encontrado[1] !== null) {
        return String(encontrado[1]).trim();
      }
    }

    return "";
  },

  // Extrai o nome do município a partir do nome da unidade executante,
  // que segue o padrão "SIGLA - MUNICÍPIO" (ex.: "HUGO - GOIÂNIA").
  // Aplica o mapa de aliases do CONFIG quando a grafia não bate.
  extrairMunicipioDaUnidade(nomeUnidade) {
    const texto = String(nomeUnidade ?? "").trim();

    if (!texto.includes(" - ")) {
      return "";
    }

    const partes = texto.split(" - ");
    const cidadeBruta = partes[partes.length - 1].trim();
    const chaveNormalizada = this.texto(cidadeBruta);

    const aliases = (window.CONFIG && window.CONFIG.ALIASES_MUNICIPIO_EXECUTANTE) || {};

    return aliases[chaveNormalizada]
      ? aliases[chaveNormalizada]
      : chaveNormalizada;
  },

  escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
};
