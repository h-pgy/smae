import type { PainelEstrategicoGeoLocalizacaoDto } from '@back/gestao-projetos/painel-estrategico/entities/painel-estrategico-responses.dto';
import { jwtDecode } from 'jwt-decode';
import { camelCase } from 'lodash';
import type { StoreGeneric } from 'pinia';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  dados: boolean;
  projetosParaMapa: boolean;
  projetosPaginados: boolean;
  orcamentosPaginados: boolean;
};

type Erros = {
  dados: unknown;
  projetosParaMapa: unknown;
  projetosPaginados: unknown;
  orcamentosPaginados: unknown;
};

type ItemGenerico = Record<string, (unknown[] | Record<string, unknown>)>;

type Estado = ItemGenerico & {
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
  grandesNumeros: {
    total_projetos?: number;
    total_orgaos?: number;
    total_metas?: number;
  };
  paginacaoProjetos: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
    validoAte: number;
  };
  paginacaoOrcamentos: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
    validoAte: number;
  };
};

export const usePainelEstrategicoStore = (prefixo: string): StoreGeneric => defineStore(prefixo
  ? `${prefixo}.painelEstrategico`
  : 'painelEstrategico', {
  state: (): Estado => ({
    anosMapaCalorConcluidos: [],
    anosMapaCalorPlanejados: [],
    execucaoOrcamentariaAno: [],
    grandesNumeros: {},
    projetoEtapas: [],
    projetoOrgaoResponsavel: [],
    projetoStatus: [],
    projetosConcluidosAno: [],
    projetosConcluidosMes: [],
    projetosPlanejadosAno: [],
    projetosPlanejadosMes: [],
    quantidadesProjeto: [],
    resumoOrcamentario: [],
    projetosParaMapa: [],
    chamadasPendentes: {
      dados: false,
      projetosParaMapa: false,
      projetosPaginados: false,
      orcamentosPaginados: false,
    },
    erros: {
      dados: null,
      projetosParaMapa: null,
      projetosPaginados: null,
      orcamentosPaginados: null,
    },
    // lista de projetos paginados
    projetosPaginados: [],
    paginacaoProjetos: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
      validoAte: 0,
    },
    // lista de orcamentos paginados
    orcamentosPaginados: [],
    paginacaoOrcamentos: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: true,
      totalRegistros: 0,
      validoAte: 0,
    },
  }),
  actions: {
    async buscarDados(params = {}): Promise<void> {
      this.chamadasPendentes.dados = true;
      this.erros.dados = null;
      try {
        const resposta = await this.requestS.post(`${baseUrl}/painel-estrategico`, params);

        Object.keys(resposta).forEach((chave) => {
          const chaveConvertida = camelCase(chave);

          if (this[chaveConvertida]) {
            this[chaveConvertida] = resposta[chave];
          }
        });
      } catch (erro: unknown) {
        this.erros.dados = erro;
      }
      this.chamadasPendentes.dados = false;
    },

    async buscarProjetosParaMapa(params = {}): Promise<void> {
      this.chamadasPendentes.projetosParaMapa = true;
      this.erros.projetosParaMapa = null;

      try {
        const { linhas } = await this.requestS.post(
          `${baseUrl}/painel-estrategico/geo-localizacao/v2`,
          params,
        ) as PainelEstrategicoGeoLocalizacaoDto;

        this.projetosParaMapa = linhas;
      } catch (error: unknown) {
        this.erros.projetosParaMapa = error;
      }
    },

    async buscarProjetos(params = {}): Promise<void> {
      this.chamadasPendentes.projetosPaginados = true;
      this.erros.projetosPaginados = null;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.post(`${baseUrl}/painel-estrategico/lista-projeto-paginado`, params);
        this.projetosPaginados = linhas;
        this.paginacaoProjetos.tokenPaginacao = tokenPaginacao;
        this.paginacaoProjetos.paginas = paginas;
        this.paginacaoProjetos.paginaCorrente = paginaCorrente;
        this.paginacaoProjetos.temMais = temMais;
        this.paginacaoProjetos.totalRegistros = totalRegistros;

        if (!params.pagina || params.pagina === 1) {
          try {
            const { exp, iat } = jwtDecode(tokenPaginacao);

            if (exp && iat) {
              this.paginacaoProjetos.validoAte = Date.now() + (exp - iat);
            }
          } catch (erro) {
            this.erros.projetosPaginados = erro;
          }
        }
      } catch (erro: unknown) {
        this.erros.projetosPaginados = erro;
      }
      this.chamadasPendentes.projetosPaginados = false;
    },

    async buscarOrcamentos(params = {}): Promise<void> {
      this.chamadasPendentes.orcamentosPaginados = true;
      this.erros.orcamentosPaginados = null;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.post(`${baseUrl}/painel-estrategico/lista-execucao-orcamentaria`, params);
        this.orcamentosPaginados = linhas;
        this.paginacaoOrcamentos.tokenPaginacao = tokenPaginacao;
        this.paginacaoOrcamentos.paginas = paginas;
        this.paginacaoOrcamentos.paginaCorrente = paginaCorrente;
        this.paginacaoOrcamentos.temMais = temMais;
        this.paginacaoOrcamentos.totalRegistros = totalRegistros;

        if (!params.pagina || params.pagina === 1) {
          try {
            const { exp, iat } = jwtDecode(tokenPaginacao);

            if (exp && iat) {
              this.paginacaoOrcamentos.validoAte = Date.now() + (exp - iat);
            }
          } catch (erro) {
            this.erros.orcamentosPaginados = erro;
          }
        }
      } catch (erro: unknown) {
        this.erros.orcamentosPaginados = erro;
      }
      this.chamadasPendentes.orcamentosPaginados = false;
    },
  },
})();
