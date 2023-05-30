import { IdNomeDto } from "src/common/dto/IdNome.dto"
import { IdTituloDto } from "src/common/dto/IdTitulo.dto"
import { IdNomeExibicao } from "src/variavel/entities/variavel.entity"

export class InOutArquivoDto {
    token: string
    tamanho_bytes: number
    id: number
}

export class ImportacaoOrcamentoDto {
    id: number
    arquivo: InOutArquivoDto
    saida_arquivo: InOutArquivoDto | null
    pdm: IdNomeDto | null
    portfolio: IdTituloDto | null
    criado_por: IdNomeExibicao | null
    criado_em: Date
    processado_em: Date | null
    processado_errmsg: string | null
    linhas_importadas: number | null
}

export class ListImportacaoOrcamentoDto {
    linhas: ImportacaoOrcamentoDto[]
}
