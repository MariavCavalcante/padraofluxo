/**
 * CONFIGURAÇÃO CENTRALIZADA DO PAINEL INTELIGENTE
 * Secretaria de Estado da Saúde de Goiás
 * Superintendência de Regulação, Controle e Avaliação
 * Gerência de Regulação de Internações (GERINT)
 */

window.CONFIG = {
  // ============================================
  // FONTES OFICIAIS DE DADOS (Google Sheets, publicado em CSV)
  // ============================================
  // Planilha 1: fluxo padrão (unidades executantes por especialidade)
  URL_BASE_UNIDADES: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRak5nVb3L35cJeEi_CsL1qs60Y8OfCaf8u3jG7vBmb0VbjJCCR5QhA6f4lBPiLX-SnHJP0mwRMp7A9/pub?output=csv",

  // Planilha 2: distâncias entre município solicitante e município executante
  URL_BASE_DISTANCIAS: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRak5nVb3L35cJeEi_CsL1qs60Y8OfCaf8u3jG7vBmb0VbjJCCR5QhA6f4lBPiLX-SnHJP0mwRMp7A9/pub?gid=53459734&single=true&output=csv",

  // ============================================
  // INTERVALO DE ATUALIZAÇÃO AUTOMÁTICA (minutos)
  // ============================================
  INTERVALO_ATUALIZACAO_MINUTOS: 10,

  // ============================================
  // CHAVES DE CACHE LOCAL (usadas se a fonte online falhar)
  // ============================================
  CACHE_KEY_UNIDADES: "gerint_cache_unidades",
  CACHE_KEY_DISTANCIAS: "gerint_cache_distancias",

  // ============================================
  // IDENTIDADE DO SISTEMA
  // ============================================
  TITULO_SISTEMA: "Painel Inteligente do Fluxo Padrão da Regulação Estadual",
  INSTITUICAO: "Secretaria de Estado da Saúde de Goiás",
  SUPERINTENDENCIA: "Superintendência de Regulação, Controle e Avaliação",
  GERENCIA: "Gerência de Regulação de Internações (GERINT)",
  AVISO_INSTITUCIONAL: "Este painel constitui ferramenta de apoio à Regulação Estadual. As informações apresentadas não substituem a análise técnica e a decisão do profissional regulador.",

  // ============================================
  // MAPEAMENTO DE COLUNAS
  // Cada campo lógico aceita uma lista de nomes possíveis de coluna,
  // pois as duas planilhas usam grafias diferentes. A busca ignora
  // acentos, maiúsculas/minúsculas e espaços extras.
  // ============================================
  COLUNAS: {
    // Planilha de unidades / fluxo
    MACRORREGIAO: ["quem"],
    UNIDADE_EXECUTANTE: ["UNIDADES EXECUTANTES", "Unidade Executante"],
    COMPLEXIDADE: ["COMPLEXIDADE", "Complexidade"],
    TIPO_ATENDIMENTO: ["TIPO DE ATENDIMENTO", "Tipo de Atendimento"],
    TIPO_LEITO: ["TIPO DE LEITO", "Tipo de Leito"],
    ESPECIALIDADE: ["ESPECIALIDADES", "Especialidade"],
    FLUXO_REGULATORIO: ["FLUXO REGULATÓRIO", "Fluxo Regulatório"],
    PARTICULARIDADES: ["PARTICULARIDADES DA SOLICITAÇÃO POR UNIDADE EXECUTANTE", "Particularidades"],
    COBERTURA_SAD: ["COBERTURA SAD - MUNICÍPIO REFERÊNCIA X UN. EXECUTANTE", "Cobertura SAD"],

    // Planilha de distâncias
    MUNICIPIO_SOLICITANTE: ["Município Solicitante"],
    MUNICIPIO_EXECUTANTE: ["Município Executante"],
    DISTANCIA_KM: ["Distancia", "Distância", "Distância (KM)"]
  },

  // ============================================
  // ALIASES DE MUNICÍPIO EXECUTANTE
  // O nome da cidade é extraído do nome da unidade (após o último " - ").
  // Alguns nomes de unidade usam abreviações que não batem com o nome
  // completo do município na planilha de distâncias — este mapa corrige isso.
  // Chaves e valores já normalizados (sem acento, maiúsculas) na hora do uso.
  // ============================================
  // Chaves já sem pontuação, pois a normalização (Normalizador.texto)
  // remove pontos e outros caracteres especiais antes da busca.
  ALIASES_MUNICIPIO_EXECUTANTE: {
    "AP DE GOIANIA": "APARECIDA DE GOIANIA",
    "PIRINOPOLIS": "PIRENOPOLIS",
    "SANTA HELENA": "SANTA HELENA DE GOIAS",
    "S LUIS DE M BELOS": "SAO LUIS DE MONTES BELOS",
    "AGUAS LINDAS": "AGUAS LINDAS DE GOIAS"
  },

  // ============================================
  // VALIDAÇÃO / QUALIDADE DA BASE
  // ============================================
  CAMPOS_OBRIGATORIOS_UNIDADES: ["UNIDADE_EXECUTANTE", "ESPECIALIDADE"],
  CAMPOS_OBRIGATORIOS_DISTANCIAS: ["MUNICIPIO_SOLICITANTE", "MUNICIPIO_EXECUTANTE", "DISTANCIA_KM"]
};
