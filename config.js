/**
 * ============================================================================
 * CONFIG.JS
 * Painel Inteligente do Fluxo Padrão da Regulação Estadual
 * SES-GO / SUREG
 * ============================================================================
 * Este arquivo centraliza TODAS as configurações do painel: fontes de dados,
 * intervalo de atualização, associação Unidade Executante -> Município
 * Executante e parâmetros gerais de identidade visual/textos institucionais.
 *
 * Nenhuma URL de fonte de dados deve ser escrita em nenhum outro arquivo do
 * projeto além deste (Seção 14 do Prompt Mestre).
 * ============================================================================
 */

const CONFIG = {

  // --------------------------------------------------------------------
  // IDENTIFICAÇÃO DO PAINEL
  // --------------------------------------------------------------------
  TITULO_PAINEL: 'Painel Inteligente do Fluxo Padrão da Regulação Estadual',
  ORGAO_1: 'Governo do Estado de Goiás',
  ORGAO_2: 'Secretaria de Estado da Saúde',
  ORGAO_3: 'Gerência de Regulação de Internações',
  AVISO_INSTITUCIONAL: 'Este painel constitui ferramenta de apoio à Regulação Estadual. ' +
    'As informações apresentadas não substituem a análise técnica e a decisão do profissional regulador.',

  // --------------------------------------------------------------------
  // FONTE DE DADOS ONLINE (GOOGLE SHEETS) — FONTE OFICIAL EM PRODUÇÃO
  // --------------------------------------------------------------------
  // A planilha deve estar publicada/compartilhada como "Qualquer pessoa
  // com o link pode visualizar". O painel lê cada aba via exportação CSV
  // do Google Sheets (endpoint gviz), o que dispensa qualquer backend.
  //
  // Para trocar de planilha, altere apenas GOOGLE_SHEET_ID abaixo.
  // --------------------------------------------------------------------
  GOOGLE_SHEET_ID: '1WB9gJC05gYu1IUlbgJbSnYV4Dw04Alv7-zNanWSvgf8',

  NOME_ABA_BASE_ATUALIZADA: 'BASE_ATUALIZADA',
  NOME_ABA_INTERMEDIACAO: 'INTERMEDIAÇÃO',
  NOME_ABA_DISTANCIA: 'DISTÂNCIA',

  // Construtor de URL CSV a partir do ID da planilha + nome da aba.
  // Mantido aqui (não em dados.js) para que TODA a lógica de fonte de
  // dados fique centralizada neste único arquivo.
  montarUrlCsv(nomeAba) {
    const base = `https://docs.google.com/spreadsheets/d/${this.GOOGLE_SHEET_ID}/gviz/tq`;
    const params = `?tqx=out:csv&sheet=${encodeURIComponent(nomeAba)}`;
    return base + params;
  },

  get URL_BASE_ATUALIZADA() {
    return this.montarUrlCsv(this.NOME_ABA_BASE_ATUALIZADA);
  },
  get URL_INTERMEDIACAO() {
    return this.montarUrlCsv(this.NOME_ABA_INTERMEDIACAO);
  },
  get URL_DISTANCIA() {
    return this.montarUrlCsv(this.NOME_ABA_DISTANCIA);
  },

  // --------------------------------------------------------------------
  // FONTE DE DADOS LOCAL (CONTINGÊNCIA)
  // --------------------------------------------------------------------
  URL_BASE_ATUALIZADA_LOCAL: 'data/base_atualizada.csv',
  URL_INTERMEDIACAO_LOCAL: 'data/intermediacao.csv',
  URL_DISTANCIA_LOCAL: 'data/distancia.csv',

  // --------------------------------------------------------------------
  // ATUALIZAÇÃO AUTOMÁTICA
  // --------------------------------------------------------------------
  INTERVALO_ATUALIZACAO_MINUTOS: 30,

  // --------------------------------------------------------------------
  // ASSOCIAÇÃO UNIDADE EXECUTANTE -> MUNICÍPIO EXECUTANTE
  // --------------------------------------------------------------------
  // Regra geral automática: nome da unidade segue o padrão
  // "SIGLA - MUNICÍPIO" e o município é extraído após o primeiro " - ".
  // As chaves abaixo SOBRESCREVEM a regra automática para os casos em que
  // ela falha (abreviações, grafias divergentes da aba DISTÂNCIA, ou
  // unidades de INTERMEDIAÇÃO que não seguem o padrão "SIGLA - MUNICÍPIO").
  //
  // Mapeamento validado em 20/08/2026 contra a planilha
  // "BASE DE DADOS - FLUXO PADRÃO 28-07-26".
  // --------------------------------------------------------------------
  UNIDADE_MUNICIPIO_MAP: {
    // --- Exceções da aba BASE_ATUALIZADA (split simples falha) ---
    'HEAL - ÁGUAS LINDAS': 'Águas Lindas de Goiás',
    'HEAPA - AP. DE GOIÂNIA': 'Aparecida de Goiânia',
    'HEELJ - PIRINÓPOLIS': 'Pirenópolis',
    'HERSO - SANTA HELENA': 'Santa Helena de Goiás',
    'HESLMB - S. LUIS DE M. BELOS': 'São Luís de Montes Belos',
    'SYLVIO DE MELLO - MORRINHOS': 'Morrinhos',

    // --- Unidades da aba INTERMEDIAÇÃO (não seguem "SIGLA - MUNICÍPIO") ---
    'HMAP - AP. DE GOIÂNIA  / INTERMEDIAÇÃO': 'Aparecida de Goiânia',
    'HOSPITA CORAÇÃO DE JESUS GOIÂNIA  / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL DAS CLÍNICAS GOIÂNIA / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL EVANGÉLICO - ANÁPOLIS / INTERMEDIAÇÃO': 'Anápolis',
    'HOSPITAL GARAVELO - AP. DE GOIÂNIA / INTERMEDIAÇÃO': 'Aparecida de Goiânia',
    'HOSPITAL SANTA LUCIA - GOIÂNIA / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL SANTA MÔNICA  - AP. DE GOIÂNIA / INTERMEDIAÇÃO': 'Aparecida de Goiânia',
    'HOSPITAL SANTA ROSA - GOIÂNIA / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL SANTA SÃO JUDAS TADEU - GOIÂNIA / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL SANTA SÃO JUDAS TADEU GOIÂNIA  / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL SÃO DOMINGOS - GOIÂNIA  / INTERMEDIAÇÃO': 'Goiânia',
    'HOSPITAL SÃO SILVESTRE - AP. DE GOIÂNIA / INTERMEDIAÇÃO': 'Aparecida de Goiânia',
    'INTERMEDIAÇÃO GYN SISCV HOSPITAL ARAUJO JORGE GOIÂNIA': 'Goiânia',
    'INTERMEDIAÇÃO GYN SISCV HOSPITAL ARAUJO JORGE GOIÂNIA (INTERMEDIAÇÃO SISCV)': 'Goiânia',
    'INTERMEDIAÇÃO GYN SISCV HOSPITAL E MATERNIDADE CÉLIA CÂMARA GOIÂNIA': 'Goiânia',
    'INTERMEDIAÇÃO GYN SISCV HOSPITAL JACOB FACURY GOIÂNIA': 'Goiânia',
    'INTERMEDIAÇÃO GYN SISCV HOSPITAL RUY AZEREDO GOIÂNIA': 'Goiânia',
    'INTERMEDIAÇÃO GYN SISCV HOSPITAL SANTA ROSA GOIÂNIA': 'Goiânia',
    'PAX CLÍNICA - AP. DE GOIÂNIA / INTERMEDIAÇÃO': 'Aparecida de Goiânia',
    'SANTA CASA DE MISERICORDIA DE GOIÂNIA / INTERMEDIAÇÃO': 'Goiânia'
  },

  // --------------------------------------------------------------------
  // IDENTIDADE VISUAL — CORES OFICIAIS DO ESTADO DE GOIÁS
  // --------------------------------------------------------------------
  CORES: {
    verde: '#19A32A',
    amarelo: '#FFDE00',
    azul: '#00509F',
    branco: '#FFFFFF'
  },

  // --------------------------------------------------------------------
  // CAMINHOS DE ASSETS
  // --------------------------------------------------------------------
  LOGO_PATH: 'assets/logo-goias.png',
  FAVICON_PATH: 'assets/favicon.ico'
};

// Congela o objeto de configuração para evitar alterações acidentais em
// tempo de execução (config.js é a única fonte de verdade do projeto).
Object.freeze(CONFIG.CORES);
Object.freeze(CONFIG.UNIDADE_MUNICIPIO_MAP);
