/**
 * ============================================================================
 * UTILITARIOS.JS
 * Funções genéricas reutilizadas pelos demais módulos do painel.
 * ============================================================================
 */

const Utilitarios = (() => {

  function evitarCache(url) {
    const separador = url.includes('?') ? '&' : '?';
    return `${url}${separador}_=${Date.now()}`;
  }

  function debounce(fn, atraso = 250) {
    let temporizador = null;
    return function (...args) {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => fn.apply(this, args), atraso);
    };
  }

  function formatarDataHora(data) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ` +
      `${pad(data.getHours())}:${pad(data.getMinutes())}`;
  }

  function baixarArquivoTexto(nomeArquivo, conteudo, tipoMime = 'text/csv;charset=utf-8;') {
    const blob = new Blob(['\uFEFF' + conteudo], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function paraCsv(linhas, colunas) {
    const escapar = (valor) => {
      const texto = valor === null || valor === undefined ? '' : String(valor);
      if (/[",\n;]/.test(texto)) {
        return `"${texto.replace(/"/g, '""')}"`;
      }
      return texto;
    };
    const cabecalho = colunas.map(escapar).join(';');
    const corpo = linhas.map((linha) => colunas.map((coluna) => escapar(linha[coluna])).join(';'));
    return [cabecalho, ...corpo].join('\r\n');
  }

  function obterModal(elementoOuSeletor) {
    const el = typeof elementoOuSeletor === 'string'
      ? document.querySelector(elementoOuSeletor)
      : elementoOuSeletor;
    if (!el) return null;
    return bootstrap.Modal.getOrCreateInstance(el);
  }

  function exibirAlerta(mensagem, tipo = 'warning') {
    const container = document.getElementById('area-alertas');
    if (!container) {
      console.warn(mensagem);
      return;
    }
    const id = `alerta-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
    div.role = 'alert';
    div.innerHTML = `
      <span>${Normalizacao.escaparHtml(mensagem)}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    container.appendChild(div);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) bootstrap.Alert.getOrCreateInstance(el).close();
    }, 8000);
  }

  return {
    evitarCache,
    debounce,
    formatarDataHora,
    baixarArquivoTexto,
    paraCsv,
    obterModal,
    exibirAlerta
  };
})();
