# 🏥 Painel Inteligente do Fluxo Padrão da Regulação Estadual

**Secretaria de Estado da Saúde de Goiás**
Superintendência de Regulação, Controle e Avaliação
Gerência de Regulação de Internações (GERINT)

---

## 📋 Descrição

Sistema web responsivo para consultar o Fluxo Padrão da Regulação Estadual: a partir do município solicitante e da especialidade necessária, o painel lista as unidades executantes compatíveis e ordena os resultados sempre da menor para a maior distância (a "regra de ouro" da regulação).

**Nota importante**: este painel é uma ferramenta de apoio à Regulação Estadual. As informações apresentadas não substituem a análise técnica e a decisão do profissional regulador.

---

## 🏗️ Arquitetura

Aplicação 100% frontend (sem backend), em arquivos soltos na raiz do projeto:

```
GERINT/
├── index.html        # Página principal
├── config.js          # URLs das fontes de dados e mapeamento de colunas
├── normalizacao.js    # Normalização de texto/números e extração de município
├── campos.js           # Acesso padronizado aos campos das duas planilhas
├── leitorDados.js      # Carregamento de CSV (com cache local de fallback)
├── ranking.js           # Motor de busca e ordenação por distância
├── dashboard.js         # Indicadores (KPIs) do topo da página
├── app.js                # Orquestração: filtros, autocomplete, tabela, modais, exportação
├── style.css              # Estilos (identidade visual SES-GO)
└── vercel.json             # Configuração de deploy na Vercel
```

---

## 🔌 Fontes de Dados

O painel combina **duas planilhas do Google Sheets**, publicadas em CSV e configuradas em `config.js`:

1. **`URL_BASE_UNIDADES`** — fluxo padrão: para cada unidade executante, quais especialidades/leitos/complexidades ela atende, o fluxo regulatório, particularidades da solicitação e cobertura SAD.
2. **`URL_BASE_DISTANCIAS`** — distância (KM) entre cada município solicitante e cada município executante.

O município executante de cada unidade é **extraído automaticamente do nome da unidade** (padrão `"SIGLA - MUNICÍPIO"`, ex.: `HUGO - GOIÂNIA`). Quando a grafia do nome não bate com a planilha de distâncias (abreviações como `AP. DE GOIÂNIA`), há um mapa de correção em `CONFIG.ALIASES_MUNICIPIO_EXECUTANTE`.

### Como atualizar as URLs

1. Abra `config.js`.
2. Publique a aba desejada do Google Sheets em **Arquivo → Compartilhar → Publicar na web**, formato CSV.
3. Substitua `URL_BASE_UNIDADES` e/ou `URL_BASE_DISTANCIAS`.

---

## 📊 Estrutura de Dados Esperada

### Planilha de unidades / fluxo

| Coluna | Obrigatório | Descrição |
|---|---|---|
| quem | Não | Macrorregião de referência da unidade |
| UNIDADES EXECUTANTES | Sim | Nome da unidade, no padrão `SIGLA - MUNICÍPIO` |
| COMPLEXIDADE | Não | Nível de complexidade |
| TIPO DE ATENDIMENTO | Não | Tipo de atendimento |
| TIPO DE LEITO | Não | Tipo de leito |
| ESPECIALIDADES | Sim | Especialidade atendida |
| FLUXO REGULATÓRIO | Não | Regras de encaminhamento |
| PARTICULARIDADES DA SOLICITAÇÃO POR UNIDADE EXECUTANTE | Não | Detalhes/critérios da unidade |
| COBERTURA SAD - MUNICÍPIO REFERÊNCIA X UN. EXECUTANTE | Não | Cobertura do Serviço de Atenção Domiciliar |

### Planilha de distâncias

| Coluna | Obrigatório | Descrição |
|---|---|---|
| Município Solicitante | Sim | Município que solicita a internação |
| Município Executante | Sim | Município onde fica a unidade |
| Distancia | Sim | Distância em KM entre os dois municípios |

Os nomes exatos de coluna são configuráveis em `CONFIG.COLUNAS` (a busca ignora acentos, maiúsculas/minúsculas e espaços extras).

---

## 🚀 Como Usar Localmente

```bash
# Python 3.x
python -m http.server 8000
# Acesse http://localhost:8000
```

Ou instale a extensão **Live Server** do VS Code e clique com o botão direito em `index.html`.

---

## 📤 Publicação

### Vercel (recomendado)

```bash
npm install -g vercel
vercel login
vercel --prod
```

O `vercel.json` já está configurado como projeto estático.

### GitHub Pages

1. Configure em **Settings → Pages** o deploy a partir da branch `main`, pasta `/ (root)`.
2. O painel ficará disponível em `https://seu-usuario.github.io/GERINT`.

---

## 🔍 Regras de Busca

1. **Município Solicitante** (obrigatório, com autocomplete) e **Especialidade** (obrigatório) são os filtros mínimos.
2. **Tipo de Leito**, **Complexidade** e busca textual (particularidades/fluxo/cobertura SAD) são opcionais.
3. Resultados são **sempre ordenados da menor para a maior distância** — a regra de ouro. Unidades sem distância cadastrada aparecem por último.
4. A primeira unidade da lista recebe o destaque **"MAIS PRÓXIMA"**.

---

## 📈 Indicadores

- **Especialidades / Unidades Executantes / Municípios Executantes**: totais da base completa.
- **Resultados Encontrados** e **Menor Distância**: da pesquisa atual.
- **Última Atualização**: data/hora da última sincronização com o Google Sheets.

---

## 🔄 Atualização da Base

- Automática a cada `CONFIG.INTERVALO_ATUALIZACAO_MINUTOS` (padrão: 10 minutos).
- Manual pelo botão **Atualizar Base**.
- Se a fonte online falhar, o painel usa o último cache salvo no navegador e sinaliza "Usando cache local".

---

## 📊 Qualidade da Base

O botão **Qualidade da Base** (rodapé) mostra:

- Total de registros em cada planilha.
- Combinações duplicadas (unidade + especialidade + leito + complexidade).
- Registros sem unidade ou sem especialidade.
- Distâncias com valor inválido.
- Municípios executantes (extraídos do nome da unidade) sem distância cadastrada — útil para identificar unidades cujo nome não segue o padrão `SIGLA - MUNICÍPIO` ou cujo município ainda não está na planilha de distâncias.

As inconsistências podem ser exportadas em CSV.

---

## 💾 Exportação

- **CSV** dos resultados da pesquisa atual.
- **Impressão** otimizada da tabela de resultados.

---

## 🔒 Segurança e Privacidade

- Sem persistência de dados pessoais.
- Sem backend: todo o processamento ocorre no navegador.
- Acesso apenas às planilhas públicas do Google Sheets configuradas.
- Cache local (localStorage) apenas dos dados públicos das planilhas.

---

## ⚠️ Limitações Conhecidas

- A extração automática do município a partir do nome da unidade depende do padrão `SIGLA - MUNICÍPIO`. Unidades fora desse padrão (ex.: nomes sem cidade) ficam sem distância calculada — verifique em **Qualidade da Base**.
- Não há, na fonte de dados atual, uma coluna de macrorregião por município solicitante; por isso o painel não classifica resultados como "dentro/fora da macrorregião".

---

## 👥 Suporte

Secretaria de Estado da Saúde de Goiás
Superintendência de Regulação, Controle e Avaliação
Gerência de Regulação de Internações (GERINT)

---

## 📄 Licença

Sistema desenvolvido para a Secretaria de Estado da Saúde de Goiás.
