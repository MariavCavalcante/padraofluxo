# Painel Inteligente do Fluxo Padrão da Regulação Estadual

**Secretaria de Estado da Saúde de Goiás (SES-GO)**
Superintendência de Regulação, Controle e Avaliação (SUREG)
Gerência de Regulação e Ações de Urgência

Ferramenta de apoio à decisão da Regulação Estadual: permite pesquisar uma
necessidade assistencial e identificar rapidamente **quais unidades
executantes possuem a oferta, em qual município, com quais particularidades
de atendimento e a qual distância** do Município Solicitante — sempre
ordenando a **unidade mais próxima primeiro**.

> Este painel constitui ferramenta de apoio à Regulação Estadual. As
> informações apresentadas não substituem a análise técnica e a decisão do
> profissional regulador.

---

## 1. Regra central do sistema

Entre as ofertas compatíveis com a pesquisa, **a MENOR distância (KM) vem
sempre primeiro**. O primeiro resultado válido recebe o selo **"MAIS
PRÓXIMA"**. Resultados sem distância cadastrada aparecem por último, com o
aviso "Distância não informada" — nunca são excluídos da lista.

Fluxo obrigatório da interface: **PESQUISAR → LOCALIZAR OFERTAS → COMPARAR
DISTÂNCIAS → VER A MAIS PRÓXIMA → CONSULTAR PARTICULARIDADES**.

### 1.1 Uma linha por Unidade Executante

Cada **Unidade Executante** aparece **no máximo uma vez** na tabela de
resultados, mesmo que a base tenha várias linhas compatíveis com a pesquisa
para ela (ex.: a mesma unidade com mais de um Tipo de Leito ou Complexidade
para a especialidade pesquisada). Nada é perdido nesse processo: os valores
distintos encontrados para os campos Macrorregião, Complexidade, Tipo de
Atendimento, Tipo de Leito, Fluxo Regulatório, Particularidades e Cobertura
SAD são combinados (unidos por " | ") e ficam visíveis em "Ver Detalhes". Se
uma unidade tem registro tanto em BASE_ATUALIZADA quanto em INTERMEDIAÇÃO, o
"Ver Detalhes" mostra "BASE_ATUALIZADA e INTERMEDIAÇÃO" e o selo
INTERMEDIAÇÃO aparece normalmente. Ver `Pesquisa.consolidarPorUnidade()` em
`js/pesquisa.js`.

Validado com a base real: a busca por "Goiânia + CLÍNICA MÉDICA", por
exemplo, tinha 200 linhas brutas compatíveis na planilha e resulta em 40
unidades únicas na tabela — 160 linhas duplicadas consolidadas sem perda de
informação.

### 1.2 Tabela principal enxuta

A tabela de resultados mostra apenas **Ordem, Distância, Unidade Executante,
Município Executante, Especialidade e Ação**. A **Complexidade** — assim
como Macrorregião, Tipo de Leito e Fluxo Regulatório — fica disponível
somente no painel **"Ver Detalhes"** de cada unidade (a pedido do usuário em
21/08/2026), já que a consolidação por unidade pode reunir mais de um valor
de Complexidade para a mesma linha (ex.: "MÉDIA E ALTA COMPLEXIDADE"), o que
poluiria a tabela principal.

---

## 2. Estrutura do projeto

```
painel/
├── index.html                  # Página principal (estrutura da interface)
├── config.js                   # ÚNICA fonte de configuração (URLs, mapa Unidade→Município, etc.)
├── css/
│   └── style.css                # Identidade visual institucional (cores de Goiás, responsividade)
├── js/
│   ├── normalizacao.js          # Tratamento de acentos, espaços, grafia
│   ├── utilitarios.js           # Funções genéricas (datas, CSV, cache-busting, alertas)
│   ├── distancia.js             # Índice de distância + identificação Unidade→Município
│   ├── filtros.js               # Extração dinâmica dos filtros + interdependência
│   ├── dados.js                 # Carregamento/consolidação das 3 abas (online + contingência)
│   ├── pesquisa.js              # Execução da pesquisa, ordenação por menor KM e deduplicação por unidade
│   ├── resultados.js            # Renderização da tabela, modal "Ver Detalhes" e exportações
│   ├── qualidadeDados.js        # Área administrativa "Qualidade da Base"
│   └── app.js                   # Orquestração da interface (eventos, KPIs, auto-atualização)
├── assets/
│   ├── logo-goias.png           # ⚠️ PLACEHOLDER — substituir pela logomarca oficial (ver Seção 5)
│   └── favicon.ico              # ⚠️ PLACEHOLDER — idem
└── data/                        # Cópia local de contingência das 3 abas (CSV), extraída em 21/08/2026
    ├── base_atualizada.csv      # 3.037 linhas (1.913 registros de oferta)
    ├── intermediacao.csv        # 169 linhas
    └── distancia.csv            # 8.820 linhas
```

Nenhuma URL de fonte de dados está espalhada pelo código: tudo é centralizado
em `config.js` (Seção 14 do Prompt Mestre).

---

## 3. Como os dados são estruturados

O sistema usa **as três abas reais da planilha**, sem criar estrutura
paralela:

| Aba | Campos |
|---|---|
| `BASE_ATUALIZADA` | Macrorregião; Unidades Executantes; Complexidade; Tipo de Atendimento; Tipo de Leito; Especialidades; Fluxo Regulatório; Particularidades da Solicitação por Unidade Executante; Cobertura SAD |
| `INTERMEDIAÇÃO` | Unidades Executantes; Tipo de Leito; Especialidades; Fluxo Regulatório; Particularidades da Solicitação por Unidade Executante; Cobertura SAD |
| `DISTÂNCIA` | Município Solicitante; Município Executante; Distancia |

Registros da aba `INTERMEDIAÇÃO` recebem o selo **"INTERMEDIAÇÃO"** nos
resultados e participam normalmente da ordenação por distância.

A distância é **sempre** obtida por **Município Solicitante × Município
Executante** — nunca por hospital × hospital ou endereço × endereço.

### 3.1 Identificação de Município Executante (config.js)

A maioria das unidades segue o padrão `SIGLA - MUNICÍPIO`, mas isso **não é
confiável em 100% dos casos** — a análise da planilha real identificou 6
exceções na aba `BASE_ATUALIZADA` (abreviações e uma grafia divergente,
`HEELJ - PIRINÓPOLIS` → `Pirenópolis`) e 20 unidades da aba
`INTERMEDIAÇÃO` que não seguem padrão hífen algum. Todas foram mapeadas
explicitamente em `CONFIG.UNIDADE_MUNICIPIO_MAP`, dentro de `config.js`.
Ao incluir uma nova unidade na planilha cujo nome não siga o padrão
`SIGLA - MUNICÍPIO`, adicione uma nova entrada nesse mapa.

**Achado confirmado pela Qualidade da Base:** a unidade `SYLVIO DE MELLO -
MORRINHOS` não possui distância cadastrada na aba DISTÂNCIA (o município
"Morrinhos" não aparece lá como Município Executante) — aparecerá sempre
como "Distância não informada", ao final da lista, até que a planilha seja
corrigida.

---

## 4. Configurando a fonte de dados online (Google Sheets)

O painel já está configurado para ler a planilha:

```
https://docs.google.com/spreadsheets/d/1WB9gJC05gYu1IUlbgJbSnYV4Dw04Alv7-zNanWSvgf8/edit
```

Para que a leitura funcione em produção, a planilha precisa estar
compartilhada como **"Qualquer pessoa com o link pode visualizar"**.

**Atenção:** como o painel lê a planilha ao vivo a cada carregamento e a
cada "Atualizar Base", se alguém estiver **editando as abas BASE_ATUALIZADA
ou INTERMEDIAÇÃO no momento exato da leitura**, o painel pode capturar um
estado intermediário e incompleto da edição. Evite editar a planilha durante
o horário de uso intenso do painel, ou publique as alterações e clique em
"Atualizar Base" somente depois de concluir a edição.

### 4.1 Trocando de planilha

Edite apenas `config.js`:

```js
GOOGLE_SHEET_ID: 'SEU_NOVO_ID_AQUI',
NOME_ABA_BASE_ATUALIZADA: 'BASE_ATUALIZADA',
NOME_ABA_INTERMEDIACAO: 'INTERMEDIAÇÃO',
NOME_ABA_DISTANCIA: 'DISTÂNCIA',
```

### 4.2 Contingência local

Se a fonte online falhar, o painel automaticamente recorre aos arquivos CSV
em `data/` (extraídos em 21/08/2026, com a planilha já estabilizada).
Atualize esses arquivos periodicamente exportando cada aba do Google Sheets
como CSV.

### 4.3 Atualização automática

Configurável em `config.js` via `INTERVALO_ATUALIZACAO_MINUTOS` (padrão: 30
minutos). O painel também atualiza ao abrir e quando o usuário clica em
**"Atualizar Base"**.

---

## 5. Logomarca oficial (ação necessária antes de publicar)

Por exigência do Prompt Mestre (Seção 35), **a logomarca oficial do Governo
do Estado de Goiás não pode ser gerada, redesenhada ou alterada por IA**.
Os arquivos `assets/logo-goias.png` e `assets/favicon.ico` entregues neste
projeto são **placeholders neutros** — **substitua-os pelo arquivo oficial
fornecido pela SES-GO/Governo de Goiás antes de publicar o painel**.

---

## 6. Executando localmente

```bash
python3 -m http.server 8080
# ou: npx http-server -p 8080
```

Acesse `http://localhost:8080`. Prefira sempre servir por HTTP (não abrir o
`index.html` direto via `file://`), para que o `fetch()` dos CSVs locais de
contingência funcione em todos os navegadores.

---

## 7. Publicação

### 7.1 GitHub

```bash
git init
git add .
git commit -m "Painel Inteligente do Fluxo Padrão da Regulação Estadual"
git branch -M main
git remote add origin https://github.com/SUA-ORGANIZACAO/painel-fluxo-padrao-regulacao-estadual.git
git push -u origin main
```

### 7.2 Vercel (publicação prioritária — Seção 44)

1. Importe o repositório do GitHub em [vercel.com](https://vercel.com).
2. Projeto 100% estático — a Vercel detecta automaticamente (Framework
   Preset: **Other**).
3. Deploy.

### 7.3 Compatibilidade com GitHub Pages e Netlify

- **GitHub Pages**: Settings → Pages → Deploy from branch → `main` → `/root`.
- **Netlify**: arraste a pasta ou conecte o repositório; Build command:
  (vazio), Publish directory: `.`.

---

## 8. Área "Qualidade da Base"

Acessível pelo cartão **"Qualidade da Base"** na tela inicial. Detecta, em
tempo real:

- Registros duplicados removidos na consolidação;
- Especialidades e Unidades Executantes duplicadas por grafia;
- Unidades sem Município Executante identificado;
- Municípios Executantes sem nenhuma distância cadastrada (ex.: Morrinhos);
- Pares de distância duplicados (deduplicados automaticamente) e distâncias
  conflitantes;
- Distâncias inválidas (não numéricas ou negativas);
- Campos obrigatórios vazios;
- Registros sem Particularidades e sem Fluxo Regulatório preenchidos.

Relatório exportável em CSV.

---

## 9. Testes realizados

Validados manualmente e via automação (Playwright) contra a planilha real
em 21/08/2026, após a planilha ter estabilizado:

- [x] Carregamento online: 1.913 linhas de BASE_ATUALIZADA + 169 de
      INTERMEDIAÇÃO → 1.602 registros consolidados, 66 unidades, 45
      especialidades, zero erros de console
- [x] Pesquisa por Município Solicitante + Especialidade
- [x] **Deduplicação por Unidade Executante**: "Goiânia + CLÍNICA MÉDICA"
      tinha 200 linhas brutas compatíveis → 40 unidades únicas no resultado,
      com Tipo de Leito/Complexidade combinados no "Ver Detalhes"
- [x] Especialidade + Tipo de Leito / Macrorregião (filtros interdependentes)
- [x] Pesquisa textual em Particularidades, com destaque do termo
- [x] Registro de INTERMEDIAÇÃO com selo correto
- [x] Distância exclusivamente por Município Solicitante × Município
      Executante
- [x] Ordenação sempre do menor para o maior KM; selo "MAIS PRÓXIMA" só no
      primeiro válido
- [x] Unidade sem distância cadastrada (Morrinhos) → "Distância não
      informada", listada por último
- [x] Macrorregião, Tipo de Leito e Complexidade ausentes da tabela principal
- [x] Fluxo Regulatório ausente dos filtros de busca
- [x] Detalhes completos no modal "Ver Detalhes"
- [x] Qualidade da Base populada corretamente

**Tomografia não foi implementada em nenhuma camada do sistema**, conforme
Seção 21 do Prompt Mestre.

---

## 10. Tecnologias utilizadas

HTML5 · CSS3 · JavaScript ES6+ · Bootstrap 5.3 · DataTables 1.13 ·
Papa Parse **5.6.0** (a versão 5.4.1 tem um bug de parsing confirmado que
corrompia silenciosamente registros com particularidades longas — ex.: o
registro da unidade BATUÍRA era perdido) · Font Awesome 6.5 · SheetJS 0.18 —
todas via CDN, sem necessidade de `npm install` ou backend.

---

## 11. Suporte e manutenção

Para dúvidas sobre a estrutura da base de dados, adicionar novas unidades
executantes ou corrigir o mapeamento Unidade → Município, edite **apenas**
`config.js`. Para ajustes visuais, edite `css/style.css`. Nenhuma lógica de
negócio deve ser duplicada fora dos módulos em `js/`.
