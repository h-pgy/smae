import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { JOB_IMPORTACAO_ORCAMENTO_LOCK } from 'src/common/dto/locks';
import { Stream2Buffer } from 'src/common/helpers/Stream2Buffer';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { MetaService } from 'src/meta/meta.service';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoDto, LinhaCsvInputDto } from './entities/importacao-orcamento.entity';
import { read, utils, writeFile } from "xlsx";
import { ColunasNecessarias, OrcamentoImportacaoHelpers, OutrasColumns } from './importacao-orcamento.common';
import { AuthService } from 'src/auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ImportacaoOrcamentoService {
    private readonly logger = new Logger(ImportacaoOrcamentoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,

        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService,
    ) { }

    async create(dto: CreateImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const arquivo_id = this.uploadService.checkUploadToken(dto.upload);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

                const importacao = await prismaTxn.importacaoOrcamento.create({
                    data: {
                        criado_por: user.id,
                        arquivo_id: arquivo_id,
                        pdm_id: dto.pdm_id,
                        portfolio_id: dto.portfolio_id,
                    },
                    select: { id: true },
                });

                return importacao;
            }
        );

        this.executaImportacaoOrcamento(created.id);

        return { id: created.id }
    }

    async findAll(filters: FilterImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<ImportacaoOrcamentoDto[]> {

        const filtros: Prisma.Enumerable<Prisma.ImportacaoOrcamentoWhereInput> = [];

        if (user.hasSomeRoles(['Projeto.orcamento'])) {
            const projetos = await this.projetoService.findAllIds(user);

            filtros.push({
                portfolio: {
                    Projeto: {
                        some: {
                            id: {
                                in: projetos.map(r => r.id)
                            }
                        }
                    }
                }
            });
        } else {
            filtros.push({ portfolio_id: null })
        }

        if (user.hasSomeRoles(['CadastroMeta.orcamento'])) {
            const metas = await this.metaService.findAllIds(user);

            filtros.push({
                pdm: {
                    Meta: {
                        some: {
                            id: {
                                in: metas.map(r => r.id)
                            }
                        }
                    }
                }
            });
        } else {
            filtros.push({ portfolio_id: null })
        }

        const registros = await this.prisma.importacaoOrcamento.findMany({
            where: {
                portfolio_id: filters.portfolio_id,
                pdm_id: filters.pdm_id,
                AND: [...filtros]
            },
            include: {
                arquivo: {
                    select: { tamanho_bytes: true }
                },
                criador: { select: { id: true, nome_exibicao: true } },
                pdm: { select: { id: true, nome: true } },
                portfolio: { select: { id: true, titulo: true } },
            }
        });

        return registros.map((r) => {

            return {
                id: r.id,
                arquivo: {
                    id: r.arquivo_id,
                    tamanho_bytes: r.arquivo.tamanho_bytes,
                    token: (this.uploadService.getDownloadToken(r.arquivo_id, '1d')).download_token,
                },
                saida_arquivo: null,
                pdm: r.pdm,
                portfolio: r.portfolio,
                criado_por: r.criador,
                criado_em: r.criado_em,
                processado_em: r.processado_em ?? null,
                processado_errmsg: r.processado_errmsg,
                linhas_importadas: r.linhas_importadas,
            }

        });

    }


    @Cron('* * * * *')
    async handleCron() {
        if (Boolean(process.env['DISABLE_IMPORTACAO_ORCAMENTO_CRONTAB'])) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação de upload do orçamento`);
                const locked: {
                    locked: boolean;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_IMPORTACAO_ORCAMENTO_LOCK}) as locked
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                await this.verificaImportacaoOrcamento();

            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            },
        );
    }

    async executaImportacaoOrcamento(filaId: number) {
        try {
            await this.verificaImportacaoOrcamento(filaId);
        } catch (error) {
            this.logger.error(`Falha ao executar verificaImportacaoOrcamento(${filaId}): ${error}`);
        }
    }

    private async verificaImportacaoOrcamento(filtroId?: number | undefined) {
        const pending = await this.prisma.importacaoOrcamento.findMany({
            where: {
                processado_em: null,
                AND: [
                    {
                        OR: [
                            { id: filtroId },
                            { congelado_em: null },
                            {
                                congelado_em: {
                                    lt: DateTime.now().minus({ hour: 1 }).toJSDate(),
                                }
                            },
                        ]
                    }
                ]
            },
            select: {
                id: true
            }
        });

        for (const job of pending) {

            await this.prisma.importacaoOrcamento.update({
                where: { id: job.id },
                data: {
                    congelado_em: new Date(Date.now())
                }
            });

            try {

                await this.processaArquivo(job.id)
            } catch (error) {
                console.log(error);
                this.logger.error(error);

                await this.prisma.importacaoOrcamento.update({
                    where: { id: job.id },
                    data: {
                        linhas_importadas: 0,
                        processado_errmsg: `Erro ao processar arquivo: ${error}`,
                        processado_em: new Date(Date.now())
                    }
                });

            }
        }
    }

    private async processaArquivo(id: number) {

        const job = await this.prisma.importacaoOrcamento.findUniqueOrThrow({
            where: { id: +id }
        });

        const inputBuffer = await Stream2Buffer((await this.uploadService.getReadableStreamById(job.arquivo_id)).stream);

        const inputXLSX = read(inputBuffer, {
            type: 'buffer'

        });

        const sheetName = inputXLSX.SheetNames[0];
        const sheet = inputXLSX.Sheets[sheetName];
        const range = utils.decode_range(sheet['!ref']!);

        const colunaHeaderIndex = OrcamentoImportacaoHelpers.createColumnHeaderIndex(sheet, [...ColunasNecessarias, ...OutrasColumns]);

        console.log(colunaHeaderIndex)

        const outputXLSX = utils.book_new();
        const outputSheet = utils.aoa_to_sheet([[...ColunasNecessarias, ...OutrasColumns, 'feedback']]);
        utils.book_append_sheet(outputXLSX, outputSheet, sheetName);

        let projetosIds: number[] = [];
        let metasIds: number[] = [];

        // se foi criado sem dono, pode todos Meta|Projeto, os metodos foram findAllIds
        // foram adaptados pra retornar todos os ids dos items não removidos
        const user = job.criado_por ? await this.authService.pessoaJwtFromId(job.criado_por) : undefined;

        if (job.pdm_id) {
            const projetosDoUser = await this.projetoService.findAllIds(user);
            projetosIds.push(...projetosDoUser.map(r => r.id));
        }

        if (job.portfolio_id) {
            const metasDoUser = await this.metaService.findAllIds(user);

            metasIds.push(...metasDoUser.map(r => r.id));
        }

        for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
            const row = [];
            let col2row: any = {};

            [...ColunasNecessarias, ...OutrasColumns].forEach((columnName) => {

                const colIndex = colunaHeaderIndex[columnName];
                console.log(columnName, colIndex)

                if (colIndex >= 0) {
                    const cellAddress = utils.encode_cell({ c: colIndex, r: rowIndex });
                    const cellValue = sheet[cellAddress]?.v;

                    // traduzindo algumas colunas do excel pro DTO
                    if (columnName === 'ano') {
                        col2row['ano_referencia'] = cellValue;
                    } else {
                        col2row[columnName] = cellValue;
                    }

                    row.push(cellValue);
                } else {
                    row.push(undefined);
                }
            });

            const feedback = await this.processaRow(col2row, metasIds, projetosIds);
            console.log(col2row)

            row.push(feedback);

            const newRow = [row];
            console.log(newRow)
            utils.sheet_add_aoa(outputSheet, newRow, { origin: 'A' + (rowIndex + 1) });
        }


        // Write the output file
        writeFile(outputXLSX, '/tmp/output_file.xlsx');

    }

    async processaRow(col2row: any, metasIds: number[], projetosIds: number[]): Promise<string> {

        const validatorObject = plainToInstance(LinhaCsvInputDto, col2row);
        const validations = await validate(validatorObject);
        if (validations.length) {
            return 'Linha inválida: ' + validations.reduce((acc, curr) => {
                return [...acc, ...Object.values(curr.constraints as any)];
            }, []);
        }

        return '';
    }



}
