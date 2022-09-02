import { ForbiddenException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Pessoa, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';

@Injectable()
export class PdmService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createPdmDto: CreatePdmDto, user: PessoaFromJwt) {
        const created = await this.prisma.pdm.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createPdmDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.pdm.findMany({
            select: {
                id: true,
                nome: true,
                descricao: true,
                ativo: true,
                data_inicio: true,
                data_fim: true,
                equipe_tecnica: true,
                prefeito: true,
                data_publicacao: true,
                periodo_do_ciclo_participativo_inicio: true,
                periodo_do_ciclo_participativo_fim: true,
            }
        });

        /*
         conversar com o erico se ele realmente precisa receber de volta em yyyy-mm-dd
        const nListActive = listActive.map((r: any) => {
            r.data_fim = r.data_fim.toISOString().substring(0, 10)
            return r
        });
        return nListActive;
        */
        return listActive;
    }

    async getDetail(id: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.findFirst({
            where: {
                id: id
            }
        });
        if (!pdm) throw new HttpException('PDM não encontrado', 404)

        return pdm;
    }

    async verificarPrivilegiosEdicao(updatePdmDto: UpdatePdmDto, user: PessoaFromJwt) {
        if (
            updatePdmDto.ativo === true &&
            user.hasSomeRoles(['CadastroPdm.ativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode ativar Plano de Metas`);
        } else if (
            updatePdmDto.ativo === false &&
            user.hasSomeRoles(['CadastroPdm.inativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode inativar Plano de Metas`);
        }

    }

    async update(id: number, updatePdmDto: UpdatePdmDto, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        updatePdmDto.id = id
        await this.verificarPrivilegiosEdicao(updatePdmDto, user);

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {

            if (updatePdmDto.ativo === true) {
                // desativa outros planos
                prisma.pdm.updateMany({
                    where: {
                        ativo: true
                    },
                    data: {
                        ativo: false,
                        desativado_em: new Date(Date.now()),
                        desativado_por: user.id,
                    }
                });
            } else if (updatePdmDto.ativo === false) {
                await prisma.pdm.update({
                    where: { id: id },
                    data: {
                        ativo: false,
                        desativado_em: new Date(Date.now()),
                        desativado_por: user.id,
                    },
                    select: { id: true }
                });
            }

            await prisma.pdm.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updatePdmDto,
                },
                select: { id: true }
            });

        });

        return { id: id };
    }


}
