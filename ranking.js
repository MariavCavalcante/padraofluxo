/**
 * MOTOR DE BUSCA E RANKING
 * Regra de ouro: entre as unidades compatíveis com a especialidade
 * (e demais filtros), ordenar sempre da menor para a maior distância
 * entre o município solicitante e o município executante.
 */
window.RankingMotor = {

  // Constrói um índice de distâncias por "MUNICÍPIO SOLICITANTE|MUNICÍPIO EXECUTANTE"
  // normalizados, para consulta O(1) em vez de varrer o array a cada unidade.
  indexarDistancias(distancias) {
    const indice = new Map();

    distancias.forEach(registro => {
      const origem = Normalizador.texto(LeitorCampos.municipioSolicitante(registro));
      const destino = Normalizador.texto(LeitorCampos.municipioExecutanteDistancia(registro));
      const km = Normalizador.numero(LeitorCampos.distancia(registro));

      if (!origem || !destino || km === null) {
        return;
      }

      const chave = `${origem}|${destino}`;

      // Se houver duplicidade na planilha, mantém a menor distância informada.
      if (!indice.has(chave) || indice.get(chave) > km) {
        indice.set(chave, km);
      }
    });

    return indice;
  },

  calcular(filtros, unidades, indiceDistancias) {
    const especialidade = Normalizador.texto(filtros.especialidade);
    const leito = Normalizador.texto(filtros.tipoLeito);
    const complexidade = Normalizador.texto(filtros.complexidade);
    const termo = Normalizador.texto(filtros.particularidades);
    const origem = Normalizador.texto(filtros.municipioSolicitante);

    let resultados = unidades.filter(
      unidade => Normalizador.texto(LeitorCampos.especialidade(unidade)) === especialidade
    );

    if (leito) {
      resultados = resultados.filter(
        unidade => Normalizador.texto(LeitorCampos.tipoLeito(unidade)) === leito
      );
    }

    if (complexidade) {
      resultados = resultados.filter(
        unidade => Normalizador.texto(LeitorCampos.complexidade(unidade)) === complexidade
      );
    }

    if (termo) {
      resultados = resultados.filter(unidade => {
        const alvo = Normalizador.texto(
          `${LeitorCampos.particularidades(unidade)} ${LeitorCampos.fluxo(unidade)} ${LeitorCampos.coberturaSad(unidade)}`
        );
        return alvo.includes(termo);
      });
    }

    const enriquecidos = resultados.map(unidade => {
      const nomeUnidade = LeitorCampos.unidadeExecutante(unidade);
      const municipioExecutante = Normalizador.extrairMunicipioDaUnidade(nomeUnidade);

      const chave = `${origem}|${municipioExecutante}`;
      const distanciaKm = origem && municipioExecutante && indiceDistancias.has(chave)
        ? indiceDistancias.get(chave)
        : null;

      return {
        bruto: unidade,
        unidade: nomeUnidade || "Não informada",
        municipioExecutante: municipioExecutante || "Não identificado",
        especialidade: LeitorCampos.especialidade(unidade) || "Não informada",
        tipoLeito: LeitorCampos.tipoLeito(unidade) || "Não informado",
        complexidade: LeitorCampos.complexidade(unidade) || "Não informada",
        tipoAtendimento: LeitorCampos.tipoAtendimento(unidade) || "Não informado",
        fluxo: LeitorCampos.fluxo(unidade) || "Não informado",
        particularidades: LeitorCampos.particularidades(unidade) || "Não informadas",
        coberturaSad: LeitorCampos.coberturaSad(unidade) || "Não informada",
        macrorregiao: LeitorCampos.macrorregiao(unidade) || "Não informada",
        distancia: distanciaKm
      };
    });

    // A planilha de origem tem linhas literalmente duplicadas; remove
    // duplicatas exatas (mesmo conteúdo em todos os campos exibidos).
    const vistos = new Set();
    const semDuplicatas = enriquecidos.filter(item => {
      const chave = Normalizador.texto([
        item.unidade, item.municipioExecutante, item.especialidade, item.tipoLeito,
        item.complexidade, item.tipoAtendimento, item.fluxo, item.particularidades,
        item.coberturaSad, item.distancia
      ].join("|"));

      if (vistos.has(chave)) {
        return false;
      }

      vistos.add(chave);
      return true;
    });

    // Regra de ouro: menor distância primeiro; sem distância vai para o final;
    // empate é resolvido em ordem alfabética da unidade.
    return semDuplicatas.sort((a, b) => {
      if (a.distancia === null && b.distancia !== null) return 1;
      if (a.distancia !== null && b.distancia === null) return -1;

      if (a.distancia !== null && b.distancia !== null && a.distancia !== b.distancia) {
        return a.distancia - b.distancia;
      }

      return String(a.unidade).localeCompare(String(b.unidade), "pt-BR");
    });
  }
};
