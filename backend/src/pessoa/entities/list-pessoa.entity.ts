import { ApiHideProperty } from "@nestjs/swagger";
import { PessoaFisica } from "@prisma/client";
import { Orgao } from "src/orgao/entities/orgao.entity";

export class ListPessoa {

    id: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string

    desativado: boolean

    atualizado_em: Date
    desativado_em?: Date

    orgao_id?: number | undefined
    perfil_acesso_ids: number[]

    @ApiHideProperty()
    PessoaFisica?: PessoaFisica
}
