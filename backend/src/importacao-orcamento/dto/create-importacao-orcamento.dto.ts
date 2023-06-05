import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, Validate, ValidateIf } from "class-validator";
import { EitherPdmOrPortfolio } from "src/common/dto/EitherPdmOrPortfolio";

export class CreateImportacaoOrcamentoDto {

    /**
     * Upload do XLSX, XLS, CSV, etc...
     *
     * see: https://docs.sheetjs.com/docs/miscellany/formats
     *
     */
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload: string;

    @ApiProperty({ example: 0 })
    @Validate(EitherPdmOrPortfolio)
    @Type(() => Number)
    pdm_id: number | undefined;

    @ApiProperty({ example: 0 })
    @Validate(EitherPdmOrPortfolio)
    @Type(() => Number)
    portfolio_id: number | undefined;

}

export class FilterImportacaoOrcamentoDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    pdm_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    portfolio_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    /**
     * token pra buscar proxima pagina
     */
    token_proxima_pagina?: string;

    /**
     * itens por pagina, padrão 25
     * @example "25"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: any) => (a.value === '' ? undefined : +a.value))
    ipp?: number;
}