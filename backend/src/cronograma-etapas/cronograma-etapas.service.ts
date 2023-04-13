import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CalculaAtraso } from '../common/CalculaAtraso';
import { SYSTEM_TIMEZONE } from '../common/date2ymd';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';
import { CECronogramaEtapaDto } from './entities/cronograma-etapa.entity';

@Injectable()
export class CronogramaEtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: FilterCronogramaEtapaDto | undefined = undefined) {
        const cronogramaId = filters!.cronograma_id;

        const etapaId = filters?.etapa_id;
        const inativo = filters?.inativo;

        if (filters && filters.cronograma_etapa_ids && etapaId) {
            if (filters.cronograma_etapa_ids.includes(etapaId)) {
                filters.cronograma_etapa_ids = [etapaId];
            } else {
                filters.cronograma_etapa_ids = [-1];
            }
        }

        const cronogramaEtapas = await this.prisma.cronogramaEtapa.findMany({
            where: {
                cronograma_id: cronogramaId,
                etapa_id: filters && filters.cronograma_etapa_ids ? { in: filters.cronograma_etapa_ids } : etapaId,
                inativo: inativo,
                etapa: { removido_em: null },
            },
            select: {
                id: true,
                cronograma_id: true,
                etapa_id: true,
                inativo: true,
                ordem: true,

                etapa: {
                    select: {
                        id: true,
                        etapa_pai_id: true,
                        regiao_id: true,
                        nivel: true,
                        descricao: true,
                        inicio_previsto: true,
                        termino_previsto: true,
                        inicio_real: true,
                        termino_real: true,
                        prazo: true,
                        titulo: true,
                        responsaveis: {
                            select: {
                                pessoa: {
                                    select: {
                                        id: true,
                                        nome_exibicao: true,
                                    },
                                },
                            },
                        },

                        cronograma: {
                            select: {
                                id: true,
                                meta_id: true,
                                iniciativa_id: true,
                                atividade_id: true,
                                descricao: true,

                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,
                                    },
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,

                                        meta: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                                codigo: true,
                                            },
                                        },
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,

                                        iniciativa: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                                codigo: true,

                                                meta: {
                                                    select: {
                                                        id: true,
                                                        titulo: true,
                                                        codigo: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        etapa_filha: {
                            where: {
                                removido_em: null,
                            },
                            select: {
                                id: true,
                                etapa_pai_id: true,
                                regiao_id: true,
                                nivel: true,
                                descricao: true,
                                inicio_previsto: true,
                                termino_previsto: true,
                                inicio_real: true,
                                termino_real: true,
                                prazo: true,
                                titulo: true,
                                responsaveis: {
                                    select: {
                                        pessoa: {
                                            select: {
                                                id: true,
                                                nome_exibicao: true,
                                            },
                                        },
                                    },
                                },
                                CronogramaEtapa: {
                                    orderBy: { ordem: 'asc' },
                                },

                                etapa_filha: {
                                    where: {
                                        removido_em: null,
                                    },
                                    select: {
                                        id: true,
                                        etapa_pai_id: true,
                                        regiao_id: true,
                                        nivel: true,
                                        descricao: true,
                                        inicio_previsto: true,
                                        termino_previsto: true,
                                        inicio_real: true,
                                        termino_real: true,
                                        prazo: true,
                                        titulo: true,
                                        responsaveis: {
                                            select: {
                                                pessoa: {
                                                    select: {
                                                        id: true,
                                                        nome_exibicao: true,
                                                    },
                                                },
                                            },
                                        },

                                        CronogramaEtapa: {
                                            orderBy: { ordem: 'asc' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [{ ordem: 'asc' }],
        });

        const ret: CECronogramaEtapaDto[] = [];
        let first_level_ordem = 0;
        let second_level_ordem = 0;
        let third_level_ordem = 0;

        for (const cronogramaEtapa of cronogramaEtapas) {
            if (cronogramaEtapa.etapa.etapa_pai_id) {
                const firstLevelParentIndex = cronogramaEtapas.map(e => e.etapa_id).indexOf(cronogramaEtapa.etapa.etapa_pai_id);
                if (firstLevelParentIndex >= 0) continue;
            }

            first_level_ordem = await this.getOrdem(cronogramaEtapa.ordem, first_level_ordem);

            ret.push({
                id: cronogramaEtapa.id,
                cronograma_id: cronogramaEtapa.cronograma_id,
                etapa_id: cronogramaEtapa.etapa_id,
                inativo: cronogramaEtapa.inativo,
                ordem: first_level_ordem,

                etapa: {
                    CronogramaEtapa: [
                        {
                            id: cronogramaEtapa.id,
                            cronograma_id: cronogramaEtapa.cronograma_id,
                            ordem: first_level_ordem,
                        },
                    ],

                    id: cronogramaEtapa.etapa.id,
                    etapa_id: cronogramaEtapa.etapa.id,
                    etapa_pai_id: cronogramaEtapa.etapa.etapa_pai_id,
                    regiao_id: cronogramaEtapa.etapa.regiao_id,
                    nivel: cronogramaEtapa.etapa.nivel,
                    descricao: cronogramaEtapa.etapa.descricao,
                    inicio_previsto: cronogramaEtapa.etapa.inicio_previsto,
                    termino_previsto: cronogramaEtapa.etapa.termino_previsto,
                    inicio_real: cronogramaEtapa.etapa.inicio_real,
                    termino_real: cronogramaEtapa.etapa.termino_real,
                    prazo: cronogramaEtapa.etapa.prazo,
                    titulo: cronogramaEtapa.etapa.titulo,
                    ordem: first_level_ordem,

                    // Cálculo de duração e atraso
                    duracao: await this.getDuracao(cronogramaEtapa.etapa.inicio_real, cronogramaEtapa.etapa.termino_real),
                    atraso: await this.getAtraso(cronogramaEtapa.etapa.termino_previsto, cronogramaEtapa.etapa.termino_real),

                    responsaveis: cronogramaEtapa.etapa.responsaveis.map(r => {
                        return {
                            id: r.pessoa.id,
                            nome_exibicao: r.pessoa.nome_exibicao,
                        };
                    }),

                    etapa_filha: await Promise.all(
                        cronogramaEtapa.etapa.etapa_filha.map(async f => {
                            second_level_ordem = await this.getOrdem(f.CronogramaEtapa[0].ordem, second_level_ordem);

                            return {
                                CronogramaEtapa: f.CronogramaEtapa.map(x => {
                                    return {
                                        id: x.id,
                                        cronograma_id: x.cronograma_id,
                                        ordem: second_level_ordem,
                                    };
                                }),

                                id: f.id,
                                etapa_id: f.id,
                                etapa_pai_id: f.etapa_pai_id,
                                regiao_id: f.regiao_id,
                                nivel: f.nivel,
                                descricao: f.descricao,
                                inicio_previsto: f.inicio_previsto,
                                termino_previsto: f.termino_previsto,
                                inicio_real: f.inicio_real,
                                termino_real: f.termino_real,
                                prazo: f.prazo,
                                titulo: f.titulo,
                                ordem: second_level_ordem,
                                duracao: await this.getDuracao(f.inicio_real, f.termino_real),
                                atraso: await this.getAtraso(f.termino_previsto, f.termino_real),

                                responsaveis: f.responsaveis.map(r => {
                                    return {
                                        id: r.pessoa.id,
                                        nome_exibicao: r.pessoa.nome_exibicao,
                                    };
                                }),

                                etapa_filha: await Promise.all(
                                    f.etapa_filha.map(async ff => {
                                        third_level_ordem = await this.getOrdem(ff.CronogramaEtapa[0].ordem, third_level_ordem);

                                        return {
                                            CronogramaEtapa: ff.CronogramaEtapa.map(x => {
                                                return { id: x.id, cronograma_id: x.cronograma_id, ordem: third_level_ordem };
                                            }),

                                            id: ff.id,
                                            etapa_id: ff.id,
                                            etapa_pai_id: ff.etapa_pai_id,
                                            regiao_id: ff.regiao_id,
                                            nivel: ff.nivel,
                                            descricao: ff.descricao,
                                            inicio_previsto: ff.inicio_previsto,
                                            termino_previsto: ff.termino_previsto,
                                            inicio_real: ff.inicio_real,
                                            termino_real: ff.termino_real,
                                            prazo: ff.prazo,
                                            titulo: ff.titulo,
                                            ordem: third_level_ordem,
                                            duracao: await this.getDuracao(ff.inicio_real, ff.termino_real),
                                            atraso: await this.getAtraso(ff.termino_previsto, ff.termino_real),

                                            responsaveis: ff.responsaveis.map(r => {
                                                return {
                                                    id: r.pessoa.id,
                                                    nome_exibicao: r.pessoa.nome_exibicao,
                                                };
                                            }),
                                        };
                                    }),
                                ),
                            };
                        }),
                    ),
                },

                cronograma_origem_etapa: {
                    ...cronogramaEtapa.etapa.cronograma,
                },
            });
        }

        return await this.sortReturn(ret);
    }

    private async getOrdem(ordem_config: number | null, last_ordem: number): Promise<number> {
        if (ordem_config) return ordem_config;

        return last_ordem + 1;
    }

    private async sortReturn(ret_arr: CECronogramaEtapaDto[]): Promise<CECronogramaEtapaDto[]> {
        ret_arr.sort((a, b) => a.ordem - b.ordem);
        ret_arr.forEach(r => {
            if (r.etapa?.etapa_filha && r.etapa.etapa_filha.length > 0) {
                r.etapa.etapa_filha.sort((a, b) => a.ordem - b.ordem);

                r.etapa.etapa_filha.forEach(rr => {
                    if (rr.etapa_filha && rr.etapa_filha.length > 0) {
                        rr.etapa_filha.sort((a, b) => a.ordem - b.ordem);
                    }
                });
            }
        });

        return ret_arr;
    }

    async update(updateCronogoramaEtapaDto: UpdateCronogramaEtapaDto, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroCronograma.editar', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        let id;
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const cronogramaEtapa = await prisma.cronogramaEtapa.upsert({
                where: {
                    CronogramaEtapaUniq: {
                        cronograma_id: updateCronogoramaEtapaDto.cronograma_id,
                        etapa_id: updateCronogoramaEtapaDto.etapa_id,
                    },
                },
                update: {
                    ordem: updateCronogoramaEtapaDto.ordem,
                    inativo: updateCronogoramaEtapaDto.inativo,
                },
                create: {
                    ...updateCronogoramaEtapaDto,
                },
                select: { id: true },
            });

            id = cronogramaEtapa.id;
            return cronogramaEtapa;
        });

        return { id };
    }

    async delete(id: number, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroCronograma.editar', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        const deleted = await this.prisma.cronogramaEtapa.delete({
            where: { id: id },
        });

        return deleted;
    }

    async getDuracao(inicio_real: Date | null, termino_real: Date | null): Promise<string> {
        if (!inicio_real) return '';

        const start: DateTime = DateTime.fromJSDate(inicio_real);
        const end: DateTime = termino_real ? DateTime.fromJSDate(termino_real) : DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');

        const duration = end.diff(start).as('days');

        return await this.durationInDaysHuman(duration);
    }

    async getAtraso(termino_previsto: Date | null, termino_real: Date | null): Promise<string> {
        const hoje = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');
        const duration = CalculaAtraso.emDias(hoje, termino_previsto, termino_real);

        return await this.durationInDaysHuman(duration);
    }

    async durationInDaysHuman(duration: number | null): Promise<string> {
        if (duration == null) return '';
        duration = Math.ceil(duration);

        if (duration === 1 || duration === 0) {
            return `${duration} dia`;
        }

        return duration + ' dias';
    }
}
