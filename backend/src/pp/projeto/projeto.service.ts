import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { PortfolioDto } from '../portfolio/entities/portfolio.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CreateProjetoDocumentDto, CreateProjetoDto, WriteReturnProjetoDto } from './dto/create-projeto.dto';
import { FilterProjetoDto } from './dto/filter-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoDetailDto, ProjetoDocumentoDto, ProjetoDto, ProjetoPermissoesDto } from './entities/projeto.entity';

const StatusParaFase: Record<ProjetoStatus, ProjetoFase> = {
    Registrado: 'Registro',
    Selecionado: 'Planejamento',
    EmPlanejamento: 'Planejamento',
    Planejado: 'Planejamento',
    Validado: 'Acompanhamento',
    EmAcompanhamento: 'Acompanhamento',
    Suspenso: 'Acompanhamento',
    Fechado: 'Encerramento'
} as const;

export class ProjetoOrgaoParticipante {
    projeto_id: number
    orgao_id: number
}

@Injectable()
export class ProjetoService {
    constructor(private readonly prisma: PrismaService, private readonly portfolioService: PortfolioService, private readonly uploadService: UploadService) { }

    private async processaOrigem(dto: CreateProjetoDto | UpdateProjetoDto, currentOrigemTipo?: ProjetoOrigemTipo) {
        let meta_id: number | null = dto.meta_id ? dto.meta_id : null;
        let iniciativa_id: number | null = dto.iniciativa_id ? dto.iniciativa_id : null;
        let atividade_id: number | null = dto.atividade_id ? dto.atividade_id : null;
        let origem_outro: string | null = dto.origem_outro ? dto.origem_outro : null;
        let meta_codigo: string | null = dto.meta_codigo ? dto.meta_codigo : null;
        let origem_tipo: ProjetoOrigemTipo | undefined = dto.origem_tipo ? dto.origem_tipo : undefined;

        if ((origem_tipo && origem_tipo === ProjetoOrigemTipo.PdmSistema) || (!origem_tipo && currentOrigemTipo && currentOrigemTipo === ProjetoOrigemTipo.PdmSistema)) {
            await this.assertOrigemTipoPdmSistema(meta_id, iniciativa_id, atividade_id, origem_outro, meta_codigo);
        } else if ((origem_tipo && origem_tipo === ProjetoOrigemTipo.PdmAntigo) || (!origem_tipo && currentOrigemTipo && currentOrigemTipo === ProjetoOrigemTipo.PdmAntigo)) {
            await this.assertOrigemTipoPdmAntigo(meta_id, iniciativa_id, atividade_id, origem_outro, meta_codigo);
        } else if ((origem_tipo && origem_tipo === ProjetoOrigemTipo.Outro) || (!origem_tipo && currentOrigemTipo && currentOrigemTipo === ProjetoOrigemTipo.Outro)) {
            await this.assertOrigemTipoOutro(meta_id, iniciativa_id, atividade_id, origem_outro, meta_codigo);
        }

        return {
            origem_tipo,
            meta_id,
            atividade_id,
            iniciativa_id,
            origem_outro,
            meta_codigo
        };
    }

    private async assertOrigemTipoPdmSistema(meta_id: number | null, atividade_id: number | null, iniciativa_id: number | null, origem_outro: string | null, meta_codigo: string | null) {
        if (!(atividade_id || iniciativa_id || meta_id))
            throw new HttpException('meta| é obrigatório enviar meta|iniciativa|atividade quando origem_tipo for PdmSistema', 400);

        if (atividade_id !== null) {
            const atv = await this.prisma.atividade.findFirstOrThrow({ where: { id: atividade_id, removido_em: null }, select: { iniciativa_id: true } });
            const ini = await this.prisma.iniciativa.findFirstOrThrow({ where: { id: atv.iniciativa_id, removido_em: null }, select: { meta_id: true } });
            await this.prisma.iniciativa.findFirstOrThrow({ where: { id: ini.meta_id, removido_em: null }, select: { id: true } });

            iniciativa_id = ini.meta_id;
            meta_id = ini.meta_id;
        } else if (iniciativa_id !== null) {
            const ini = await this.prisma.iniciativa.findFirstOrThrow({ where: { id: iniciativa_id, removido_em: null }, select: { meta_id: true } });
            await this.prisma.iniciativa.findFirstOrThrow({ where: { id: ini.meta_id, removido_em: null }, select: { id: true } });

            meta_id = ini.meta_id;
        } else if (meta_id !== null) {
            await this.prisma.meta.findFirstOrThrow({ where: { id: meta_id, removido_em: null }, select: { id: true } });
        }

        if (origem_outro) throw new HttpException('origem_outro| Não deve ser enviado caso origem_tipo seja PdmSistema', 400);
        if (meta_codigo) throw new HttpException('meta_codigo| Não deve ser enviado caso origem_tipo seja PdmSistema', 400);

        return {
            meta_id,
            atividade_id,
            iniciativa_id,
            origem_outro,
            meta_codigo
        };
    }

    private async assertOrigemTipoPdmAntigo(meta_id: number | null, atividade_id: number | null, iniciativa_id: number | null, origem_outro: string | null, meta_codigo: string | null) {
        if (!meta_codigo) throw new HttpException('meta_codigo| Deve ser enviado quando origem_tipo for PdmAntigo', 400);

        if (meta_id) throw new HttpException('meta_id| Não deve ser enviado caso origem_tipo seja PdmAntigo', 400);
        if (iniciativa_id) throw new HttpException('iniciativa_id| Não deve ser enviado caso origem_tipo seja PdmAntigo', 400);
        if (atividade_id) throw new HttpException('atividade_id| Não deve ser enviado caso origem_tipo seja PdmAntigo', 400);
        if (origem_outro) throw new HttpException('origem_outro| Não deve ser enviado caso origem_tipo seja PdmAntigo', 400);

        return {
            meta_id,
            atividade_id,
            iniciativa_id,
            origem_outro,
            meta_codigo
        };
    }

    private async assertOrigemTipoOutro(meta_id: number | null, atividade_id: number | null, iniciativa_id: number | null, origem_outro: string | null, meta_codigo: string | null) {
        if (!origem_outro || origem_outro.length < 1) throw new HttpException('origem_outro| Deve ser enviado quando origem_tipo for Outro', 400);

        if (meta_id) throw new HttpException('meta_id| Não deve ser enviado caso origem_tipo seja Outro', 400);
        if (iniciativa_id) throw new HttpException('iniciativa_id| Não deve ser enviado caso origem_tipo seja Outro', 400);
        if (atividade_id) throw new HttpException('atividade_id| Não deve ser enviado caso origem_tipo seja Outro', 400);
        if (meta_codigo) throw new HttpException('meta_codigo| Não deve ser enviado caso origem_tipo seja Outro', 400);

        return {
            meta_id,
            atividade_id,
            iniciativa_id,
            origem_outro,
            meta_codigo
        };
    }

    private async processaOrgaoGestor(dto: CreateProjetoDto, portfolio: PortfolioDto) {
        const orgao_gestor_id: number = +dto.orgao_gestor_id;
        const responsaveis_no_orgao_gestor: number[] = dto.responsaveis_no_orgao_gestor;

        if (portfolio.orgaos.map(r => r.id).includes(orgao_gestor_id) == false) throw new HttpException('orgao_gestor_id| não faz parte do Portfolio', 400);

        // TODO verificar se cada [responsaveis_no_orgao_gestor] existe realmente
        // e se tem o privilegio gestor_de_projeto

        return {
            orgao_gestor_id,
            responsaveis_no_orgao_gestor,
        };
    }
    /**
     *
     * orgao_gestor_id tem que ser um dos órgãos que fazem parte do portfólio escolhido pro projeto ¹,
     * esse campo é required (por enquanto eu estou deixando mudar, não está afetando tanta coisa assim a mudança dele)
     * responsaveis_no_orgao_gestor é a lista de pessoas dentro do órgão escolhido, que tem a permissão SMAE.gestor_de_projeto² e
     * quem for escolhido aqui poderá visualizar o projeto mesmo não sendo um Projeto.administrador, esse campo pode ficar vazio,
     * pois na criação os PMO não sabem exatamente quem vai acompanhar o projeto
     *
     * Esses dois campos acima são referentes as pessoas que estão administrando o projeto, não necessariamente estão envolvidas no projeto.
     *
     *
     * orgaos_participantes são a lista dos órgãos que participam do projeto em si
     * (por exemplo, se for pra construir escola em Itaquera, um dos órgãos participantes pode ser a "Subprefeitura Itaquera"³ e
     * mais um órgão "Secretaria Municipal de Educação")
     *
     * E o órgão responsável, tem que escolher a partir do órgão pra ser o responsável,
     * e dentro desse órgão responsável uma pessoa (e apenas uma) pra cuidar do registro e planejamento desse projeto,
     * essa pessoa é quem tem a permissão SMAE.colaborador_de_projeto
     * ¹: as pessoas que fazem parte desse órgão (e tiver a permissão de SMAE.gestor_de_projeto) e gestoras, poderão visualizar o projeto, mesmo não fazendo parte do mesmo.
     * ²: tem em algum card aqui os novos filtros que entrou pra essa parte do sistema, mas ta tudo nos filtros do GET /pessoa Swagger UI
     * ³: chute total, pode ser totalmente diferente o uso ou a secretaria
     * *: essa pessoa tem acesso de escrita até a hora que o status do projeto passar de "EmPlanejamento", depois disso vira read-only
     * */
    async create(dto: CreateProjetoDto, user: PessoaFromJwt): Promise<WriteReturnProjetoDto> {
        // pra criar, verifica se a pessoa pode realmente acessar o portfolio, então
        // começa listando todos os portfolios
        const portfolios = await this.portfolioService.findAll(user);

        const portfolio = portfolios.filter(r => r.id == dto.portfolio_id)[0];
        if (!portfolio) throw new HttpException('portfolio_id| Portfolio não está liberado para criação de projetos para seu usuário', 400);

        const { origem_tipo, meta_id, atividade_id, iniciativa_id, origem_outro } = await this.processaOrigem(dto);
        const { orgao_gestor_id, responsaveis_no_orgao_gestor } = await this.processaOrgaoGestor(dto, portfolio);

        console.log(dto);

        if (!origem_tipo) throw new Error('origem_tipo deve estar definido no create de Projeto');

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const row = await prismaTx.projeto.create({
                data: {
                    registrado_por: user.id,
                    registrado_em: new Date(Date.now()),
                    portfolio_id: dto.portfolio_id,
                    orgao_gestor_id: orgao_gestor_id,
                    responsaveis_no_orgao_gestor: responsaveis_no_orgao_gestor,

                    orgaos_participantes: {
                        createMany: {
                            data: dto.orgaos_participantes.map(o => {
                                return { orgao_id: o };
                            }),
                        },
                    },
                    orgao_responsavel_id: dto.orgao_responsavel_id,
                    responsavel_id: dto.responsavel_id,
                    nome: dto.nome,
                    resumo: dto.resumo,
                    previsao_inicio: dto.previsao_inicio,
                    previsao_termino: dto.previsao_termino,

                    origem_tipo: origem_tipo,
                    origem_outro: origem_outro,
                    meta_id: meta_id,
                    iniciativa_id: iniciativa_id,
                    atividade_id: atividade_id,

                    previsao_custo: dto.previsao_custo,
                    escopo: dto.escopo,
                    principais_etapas: dto.principais_etapas,
                    versao: dto.versao,
                    data_aprovacao: dto.data_aprovacao,
                    data_revisao: dto.data_revisao,

                    objetivo: '',
                    objeto: '',
                    publico_alvo: '',
                    status: 'Registrado',
                    fase: StatusParaFase['Registrado'],
                },
                select: { id: true, portfolio_id: true },
            });

            return row;
        });

        return created;
    }

    async findAll(filters: FilterProjetoDto, user: PessoaFromJwt): Promise<ProjetoDto[]> {
        const ret: ProjetoDto[] = [];

        const permissionsSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = [];
        if (!user.hasSomeRoles(['Projeto.administrador'])) {

            if (user.hasSomeRoles(['SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto']) === false)
                throw new HttpException('Necessário SMAE.gestor_de_projeto, SMAE.colaborador_de_projeto ou Projeto.administrador para listar os projetos', 400);

            if (user.hasSomeRoles(['SMAE.gestor_de_projeto'])) {
                permissionsSet.push({
                    responsaveis_no_orgao_gestor: { has: user.id }
                });
            }

            if (user.hasSomeRoles(['SMAE.colaborador_de_projeto'])) {
                permissionsSet.push({
                    responsavel_id: user.id
                });
            }
        }

        const rows = await this.prisma.projeto.findMany({
            where: {
                removido_em: null,
                eh_prioritario: filters.eh_prioritario,
                orgao_responsavel_id: filters.orgao_responsavel_id,
                arquivado: filters.arquivado,
                status: filters.status,
                portfolio: { removido_em: null },
                AND: permissionsSet.length > 0 ? [
                    {
                        OR: permissionsSet
                    }
                ] : undefined,
            },
            select: {
                id: true,
                nome: true,
                status: true,

                atividade: {
                    select: {
                        iniciativa: {
                            select: {
                                meta: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                    },
                },

                iniciativa: {
                    select: {
                        meta: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                            },
                        },
                    },
                },

                meta: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                    },
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                portfolio: {
                    select: { id: true, titulo: true }
                }
            },
        });

        for (const row of rows) {
            let meta: IdCodTituloDto | null;

            if (row.atividade) {
                meta = { ...row.atividade.iniciativa.meta };
            } else if (row.iniciativa) {
                meta = { ...row.iniciativa.meta };
            } else if (row.meta) {
                meta = row.meta;
            } else {
                meta = null;
            }

            ret.push({
                id: row.id,
                nome: row.nome,
                status: row.status,
                meta: meta,
                orgao_responsavel: row.orgao_responsavel ? { ...row.orgao_responsavel } : null,
                portfolio: row.portfolio
            });
        }

        return ret;
    }

    async findOne(id: number, user: PessoaFromJwt | undefined, readonly: boolean): Promise<ProjetoDetailDto> {

        console.log({ id, user, readonly });

        const projeto = await this.prisma.projeto.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                id: true,
                arquivado: true,
                origem_tipo: true,
                meta_id: true,
                iniciativa_id: true,
                atividade_id: true,
                origem_outro: true,
                meta_codigo: true,
                nome: true,
                status: true,
                resumo: true,
                codigo: true,
                objeto: true,
                objetivo: true,
                data_aprovacao: true,
                data_revisao: true,
                versao: true,
                publico_alvo: true,
                previsao_inicio: true,
                previsao_custo: true,
                previsao_duracao: true,
                previsao_termino: true,
                realizado_inicio: true,
                realizado_termino: true,
                realizado_custo: true,
                escopo: true,
                nao_escopo: true,
                principais_etapas: true,
                responsaveis_no_orgao_gestor: true,
                responsavel_id: true,

                orgao_gestor: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },

                premissas: {
                    select: {
                        id: true,
                        premissa: true,
                    },
                },

                restricoes: {
                    select: {
                        id: true,
                        restricao: true,
                    },
                },

                recursos: {
                    select: {
                        id: true,
                        fonte_recurso_cod_sof: true,
                        fonte_recurso_ano: true,
                        valor_percentual: true,
                        valor_nominal: true,
                    },
                },

                responsavel: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    },
                },

                orgaos_participantes: {
                    select: {
                        orgao: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                    },
                },
            },
        });

        const permissoes = await this.calcPermissions(projeto, user, readonly);

        return {
            ...projeto,
            permissoes: permissoes,
            orgaos_participantes: projeto.orgaos_participantes.map(o => {
                return {
                    id: o.orgao.id,
                    sigla: o.orgao.sigla,
                    descricao: o.orgao.descricao,
                };
            }),
        };
    }


    private async calcPermissions(
        projeto: {
            arquivado: boolean;
            status: ProjetoStatus;
            id: number;
            responsaveis_no_orgao_gestor: number[],
            responsavel_id: number | null
        },
        user: PessoaFromJwt | undefined,
        readonly: boolean
    ): Promise<ProjetoPermissoesDto> {
        const permissoes: ProjetoPermissoesDto = {
            acao_arquivar: false,
            acao_restaurar: false,
            acao_selecionar: false,
            // acao_iniciar_planejamento: não existe, é automático quando insere o código
            acao_finalizar_planejamento: false,
            acao_validar: false,
            acao_iniciar: false,
            acao_suspender: false,
            acao_reiniciar: false,
            acao_cancelar: false,
            acao_terminar: false,
            campo_codigo_liberado: false,
            campo_premissas: false,
            campo_restricoes: false,
        };

        // se o projeto está arquivado, não podemos arquivar novamente
        // mas podemos restaurar (retornar para o status e fase anterior)
        if (projeto.arquivado == true) {
            permissoes.acao_restaurar = true;
        } else {
            permissoes.acao_arquivar = true;
        }

        let pessoaPodeEscrever = false;
        if (user) {
            if (user.hasSomeRoles(['Projeto.administrador'])) {
                pessoaPodeEscrever = true;
            } else if (
                user.hasSomeRoles(['SMAE.gestor_de_projeto'])
                && projeto.responsaveis_no_orgao_gestor.includes(+user.id)
            ) {
                pessoaPodeEscrever = true;
            } else if (
                user.hasSomeRoles(['SMAE.colaborador_de_projeto'])
                && projeto.responsavel_id
                && projeto.responsavel_id == +user.id
            ) {
                pessoaPodeEscrever = (['Registrado', 'Selecionado'] as ProjetoStatus[]).includes(projeto.status);
            } else {
                throw new HttpException('Não foi possível calcular a permissão de acesso para o projeto.', 400);
            }

        } else {
            // user null == sistema puxando o relatório, então se precisar só mudar pra pessoaPodeEscrever=true
        }

        if (projeto.arquivado == false) {
            // se já saiu da fase de registro, então está liberado preencher o campo
            // de código, pois esse campo de código, quando preenchido durante o status "Selecionado" irá automaticamente
            // migrar o status para "EmPlanejamento"
            if (projeto.status !== 'Registrado') {
                permissoes.campo_codigo_liberado = true;
                permissoes.campo_premissas = true;
                permissoes.campo_restricoes = true;
            }

            if (pessoaPodeEscrever) {

                switch (projeto.status) {
                    case 'Registrado': permissoes.acao_selecionar = true; break;
                    case 'EmPlanejamento': permissoes.acao_finalizar_planejamento = true; break;
                    case 'Planejado': permissoes.acao_validar = true; break;
                    case 'Validado': permissoes.acao_iniciar = true; break;
                    case 'EmAcompanhamento': permissoes.acao_suspender = permissoes.acao_terminar = true; break;
                    case 'Suspenso': permissoes.acao_cancelar = permissoes.acao_reiniciar = true; break;
                    // redundante, pq pode sempre arquivar
                    case 'Fechado': permissoes.acao_arquivar = true; break;
                }

            }
        }

        if (user && (readonly == false && pessoaPodeEscrever == false)) {
            throw new HttpException('Você não pode mais executar ações neste projeto.', 400);
        }

        return permissoes;
    }

    async update(projetoId: number, dto: UpdateProjetoDto, user: PessoaFromJwt): Promise<WriteReturnProjetoDto> {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        const projeto = await this.findOne(projetoId, user, false);

        let moverStatusParaPlanejamento: boolean = false;
        if (dto.codigo) {
            if (projeto.permissoes.campo_codigo_liberado == false)
                throw new HttpException('Campo "Código" não pode ser preenchido ou alterado no momento', 400);

            if (projeto.status == 'Selecionado') {
                moverStatusParaPlanejamento = true;

                const countInUse = await this.prisma.projeto.count({
                    where: {
                        codigo: { equals: dto.codigo, mode: 'insensitive' },
                        NOT: {
                            id: projeto.id
                        },
                    }
                });
                if (countInUse)
                    throw new HttpException('codigo| Código informado já está em uso em outro projeto.', 400);

            }
        }

        let origem_tipo: ProjetoOrigemTipo | undefined;
        let meta_id: number | null | undefined;
        let iniciativa_id: number | null | undefined;
        let atividade_id: number | null | undefined;
        let origem_outro: string | null | undefined;
        let meta_codigo: string | null | undefined;

        if ("origem_tipo" in dto) {
            const origemVerification = await this.processaOrigem(dto, projeto.origem_tipo);

            origem_tipo = origemVerification.origem_tipo;
            meta_id = origemVerification.meta_id;
            iniciativa_id = origemVerification.iniciativa_id;
            atividade_id = origemVerification.atividade_id;
            origem_outro = origemVerification.origem_outro;
            meta_codigo = origemVerification.meta_codigo;
        }

        const updated = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await this.upsertPremissas(dto, prismaTx, projetoId);
            await this.upsertRestricoes(dto, prismaTx, projetoId);
            await this.upsertFonteRecurso(dto, prismaTx, projetoId);

            const novoStatus: ProjetoStatus | undefined = moverStatusParaPlanejamento ? 'EmPlanejamento' : undefined;
            if (novoStatus) {
                await prismaTx.projetoRelatorioFila.create({ data: { projeto_id: projeto.id } });
            }

            await prismaTx.projetoOrgaoParticipante.deleteMany({ where: { projeto_id: projetoId } });
            const updated = await prismaTx.projeto.update({
                where: { id: projetoId },
                select: { id: true, portfolio_id: true },
                data: {
                    meta_id,
                    atividade_id,
                    iniciativa_id,
                    origem_outro,
                    meta_codigo,
                    origem_tipo,
                    nome: dto.nome,
                    resumo: dto.resumo,
                    codigo: dto.codigo,
                    objeto: dto.objeto,
                    objetivo: dto.objetivo,
                    publico_alvo: dto.publico_alvo,
                    previsao_inicio: dto.previsao_inicio,
                    previsao_custo: dto.previsao_custo,
                    previsao_termino: dto.previsao_termino,
                    escopo: dto.escopo,
                    nao_escopo: dto.nao_escopo,
                    principais_etapas: dto.principais_etapas,
                    responsaveis_no_orgao_gestor: dto.responsaveis_no_orgao_gestor,
                    versao: dto.versao,
                    data_aprovacao: dto.data_aprovacao,
                    data_revisao: dto.data_revisao,
                    // por padrão undefined, não faz nenhuma alteração
                    status: novoStatus,
                    fase: novoStatus ? StatusParaFase[novoStatus] : undefined,

                    orgaos_participantes: {
                        createMany: {
                            data: dto.orgaos_participantes!.map(o => {
                                return { orgao_id: o };
                            }),
                        },
                    },
                }
            })

            return updated;
        });

        return updated;
    }

    private async upsertPremissas(dto: UpdateProjetoDto, prismaTx: Prisma.TransactionClient, projetoId: number) {
        if (Array.isArray(dto.premissas) == false) return;

        const keepIds: number[] = [];
        for (const premissa of dto.premissas!) {
            if ('id' in premissa && premissa.id) {
                await prismaTx.projetoPremissa.findFirstOrThrow({
                    where: { projeto_id: projetoId, id: premissa.id },
                });
                await prismaTx.projetoPremissa.update({
                    where: { id: premissa.id },
                    data: { premissa: premissa.premissa },
                });
                keepIds.push(premissa.id);
            } else {
                const row = await prismaTx.projetoPremissa.create({
                    data: { premissa: premissa.premissa, projeto_id: projetoId },
                });
                keepIds.push(row.id);
            }
        }
        await prismaTx.projetoPremissa.deleteMany({
            where: { projeto_id: projetoId, id: { notIn: keepIds } },
        });
    }

    private async upsertRestricoes(dto: UpdateProjetoDto, prismaTx: Prisma.TransactionClient, projetoId: number) {
        if (Array.isArray(dto.restricoes) == false) return;

        const keepIds: number[] = [];
        for (const restricao of dto.restricoes!) {
            if ('id' in restricao && restricao.id) {
                await prismaTx.projetoRestricao.findFirstOrThrow({
                    where: { projeto_id: projetoId, id: restricao.id },
                });
                await prismaTx.projetoRestricao.update({
                    where: { id: restricao.id },
                    data: { restricao: restricao.restricao },
                });
                keepIds.push(restricao.id);
            } else {
                const row = await prismaTx.projetoRestricao.create({
                    data: { restricao: restricao.restricao, projeto_id: projetoId },
                });
                keepIds.push(row.id);
            }
        }
        await prismaTx.projetoRestricao.deleteMany({
            where: { projeto_id: projetoId, id: { notIn: keepIds } },
        });
    }

    private async upsertFonteRecurso(dto: UpdateProjetoDto, prismaTx: Prisma.TransactionClient, projetoId: number) {
        if (Array.isArray(dto.fonte_recursos) == false) return;

        const byYearFonte: Record<string, Record<string, boolean>> = {};

        for (const fr of dto.fonte_recursos!) {
            if (!byYearFonte[fr.fonte_recurso_ano]) byYearFonte[fr.fonte_recurso_ano] = {};
            if (!byYearFonte[fr.fonte_recurso_ano][fr.fonte_recurso_cod_sof])
                byYearFonte[fr.fonte_recurso_ano][fr.fonte_recurso_cod_sof] = true;
        }

        const resultsFonte: Record<string, Record<string, string>> = {};
        for (const ano in byYearFonte) {
            const codigos = Object.keys(byYearFonte[ano]);
            const rows: {
                codigo: string;
                descricao: string;
            }[] = await this.prisma.$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'fonte_recursos'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;
            if (!resultsFonte[ano]) resultsFonte[ano] = {};
            for (const r of rows) {
                resultsFonte[ano][r.codigo] = r.descricao;
            }
        }

        const keepIds: number[] = [];
        for (const fr of dto.fonte_recursos!) {
            const valor_nominal = fr.valor_nominal !== undefined ? fr.valor_nominal : null;
            const valor_percentual = fr.valor_percentual !== undefined ? fr.valor_percentual : null;
            if (valor_nominal == null && valor_percentual == null) throw new HttpException('Valor Percentual e Valor Nominal não podem ser ambos nulos', 400);
            if (valor_nominal !== null && valor_percentual !== null) throw new HttpException('Valor Percentual e Valor Nominal são mutuamente exclusivos', 400);

            if (resultsFonte[fr.fonte_recurso_ano][fr.fonte_recurso_cod_sof] == undefined) {
                throw new HttpException(`Fonte de recurso ${fr.fonte_recurso_cod_sof} não foi encontrada para o ano ${fr.fonte_recurso_ano}.`, 400);
            }

            if ('id' in fr && fr.id) {
                await prismaTx.projetoFonteRecurso.findFirstOrThrow({
                    where: { projeto_id: projetoId, id: fr.id },
                });
                await prismaTx.projetoFonteRecurso.update({
                    where: { id: fr.id },
                    data: {
                        fonte_recurso_ano: fr.fonte_recurso_ano,
                        fonte_recurso_cod_sof: fr.fonte_recurso_cod_sof,
                        valor_nominal: valor_nominal,
                        valor_percentual: valor_percentual,
                    },
                });
                keepIds.push(fr.id);
            } else {
                const row = await prismaTx.projetoFonteRecurso.create({
                    data: {
                        fonte_recurso_ano: fr.fonte_recurso_ano,
                        fonte_recurso_cod_sof: fr.fonte_recurso_cod_sof,
                        valor_nominal: valor_nominal,
                        valor_percentual: valor_percentual,
                        projeto_id: projetoId,
                    },
                });
                keepIds.push(row.id);
            }
        }
        await prismaTx.projetoFonteRecurso.deleteMany({
            where: { projeto_id: projetoId, id: { notIn: keepIds } },
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.projeto.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
        return;
    }

    async append_document(projetoId: number, createPdmDocDto: CreateProjetoDocumentDto, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(projetoId, user, false);

        const arquivoId = this.uploadService.checkUploadToken(createPdmDocDto.upload_token);

        const arquivo = await this.prisma.projetoDocumento.create({
            data: {
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                arquivo_id: arquivoId,
                projeto_id: projetoId,
            },
            select: {
                id: true,
            },
        });

        return { id: arquivo.id };
    }

    async list_document(projetoId: number, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(projetoId, user, false);

        const arquivos: ProjetoDocumentoDto[] = await this.prisma.projetoDocumento.findMany({
            where: { projeto_id: projetoId, removido_em: null },
            select: {
                id: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true,
                    },
                },
            },
        });
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos;
    }

    async remove_document(projetoId: number, projetoDocId: number, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(projetoId, user, false);

        await this.prisma.projetoDocumento.updateMany({
            where: { projeto_id: projetoId, removido_em: null, id: projetoDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

}
