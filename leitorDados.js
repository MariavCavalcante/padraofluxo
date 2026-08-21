window.LeitorDados = {

    async carregarCSV(url, cacheKey, dadosEmbutidos) {

        const separador =
            url.includes("?")
                ? "&"
                : "?";

        const urlSemCache =
            `${url}${separador}t=${Date.now()}`;

        try {

            const dados = await new Promise(
                (resolve, reject) => {

                    Papa.parse(
                        urlSemCache,
                        {
                            download: true,
                            header: true,
                            skipEmptyLines: "greedy",

                            complete: resultado => {

                                if (
                                    resultado.errors?.length &&
                                    !resultado.data?.length
                                ) {
                                    reject(
                                        new Error(
                                            resultado.errors[0].message
                                        )
                                    );

                                    return;
                                }

                                resolve(
                                    resultado.data || []
                                );
                            },

                            error: erro =>
                                reject(erro)
                        }
                    );
                }
            );

            if (
                !Array.isArray(dados) ||
                dados.length === 0
            ) {
                throw new Error(
                    "A base retornou vazia."
                );
            }

            localStorage.setItem(
                cacheKey,
                JSON.stringify(dados)
            );

            return {
                dados,
                origem: "online"
            };

        } catch (erro) {

            console.warn(
                "Erro na fonte online:",
                erro
            );

            const cache =
                localStorage.getItem(cacheKey);

            if (cache) {

                try {

                    const dadosCache =
                        JSON.parse(cache);

                    if (
                        Array.isArray(dadosCache) &&
                        dadosCache.length
                    ) {
                        return {
                            dados: dadosCache,
                            origem: "cache"
                        };
                    }

                } catch (erroCache) {

                    console.error(
                        "Erro ao abrir cache:",
                        erroCache
                    );
                }
            }

            if (
                Array.isArray(dadosEmbutidos) &&
                dadosEmbutidos.length
            ) {
                return {
                    dados: dadosEmbutidos,
                    origem: "embutido"
                };
            }

            throw erro;
        }
    }
};
