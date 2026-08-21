/**
 * ============================================================================
 * NORMALIZACAO.JS
 * Módulo específico de normalização de texto (Seção 17 do Prompt Mestre).
 * ============================================================================
 * Trata acentos, caixa alta/baixa, espaços extras/duplicados, hífens e
 * pequenas diferenças de grafia para fins de COMPARAÇÃO INTERNA (chaves de
 * índice, filtros, deduplicação).
 *
 * IMPORTANTE: a normalização é usada apenas como CHAVE de comparação.
 * Na interface, sempre que possível, preserva-se a grafia institucional
 * original da base (ver normalizarExibicao).
 * ============================================================================
 */

const Normalizacao = (() => {

  function removerAcentos(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function colapsarEspacos(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto).replace(/\s+/g, ' ').trim();
  }

  function normalizarChave(texto) {
    if (texto === null || texto === undefined) return '';
    let t = String(texto);
    t = colapsarEspacos(t);
    t = removerAcentos(t);
    t = t.toUpperCase();
    t = t.replace(/[\u2010-\u2015]/g, '-');
    t = t.replace(/\s*-\s*/g, ' - ');
    t = colapsarEspacos(t);
    return t;
  }

  function normalizarExibicao(texto) {
    if (texto === null || texto === undefined) return '';
    return colapsarEspacos(String(texto));
  }

  function paraNumero(texto) {
    if (texto === null || texto === undefined) return null;
    const limpo = String(texto).trim().replace(/\./g, '').replace(',', '.');
    if (limpo === '') return null;
    const numero = parseFloat(limpo);
    return Number.isFinite(numero) ? numero : null;
  }

  function formatarDistancia(numero) {
    if (numero === null || numero === undefined || !Number.isFinite(numero)) {
      return null;
    }
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function escaparRegex(texto) {
    return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function contemTermo(textoCompleto, termo) {
    if (!termo) return true;
    if (!textoCompleto) return false;
    const chaveTexto = normalizarChave(textoCompleto);
    const chaveTermo = normalizarChave(termo);
    if (chaveTermo === '') return true;
    return chaveTexto.indexOf(chaveTermo) !== -1;
  }

  function construirRegexAcentoInsensivel(termo) {
    const mapaEquivalencias = {
      a: 'aàáâãäAÀÁÂÃÄ',
      e: 'eèéêëEÈÉÊË',
      i: 'iìíîïIÌÍÎÏ',
      o: 'oòóôõöOÒÓÔÕÖ',
      u: 'uùúûüUÙÚÛÜ',
      c: 'cçCÇ',
      n: 'nñNÑ'
    };
    const termoLimpo = colapsarEspacos(termo);
    let padrao = '';
    for (const char of termoLimpo) {
      const baixo = char.toLowerCase();
      if (mapaEquivalencias[baixo]) {
        padrao += `[${mapaEquivalencias[baixo]}]`;
      } else if (char === ' ') {
        padrao += '\\s+';
      } else {
        padrao += escaparRegex(char);
      }
    }
    return new RegExp(padrao, 'gi');
  }

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = String(texto === null || texto === undefined ? '' : texto);
    return div.innerHTML;
  }

  function destacarTermo(textoCompleto, termo) {
    const original = String(textoCompleto || '');
    if (!termo || termo.trim() === '') return escaparHtml(original);
    const regex = construirRegexAcentoInsensivel(termo);
    return escaparHtml(original).replace(regex, (match) => `<mark>${match}</mark>`);
  }

  return {
    removerAcentos,
    colapsarEspacos,
    normalizarChave,
    normalizarExibicao,
    paraNumero,
    formatarDistancia,
    contemTermo,
    destacarTermo,
    escaparHtml
  };
})();
