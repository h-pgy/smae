import { Transform, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsPositive } from "class-validator";

export class FilterPessoaDto {
    /**
   * Filtrar pessoa com privilegio PDM.coordenador_responsavel_cp?
   *  true filtra quem tem a PDM.coordenador_responsavel_cp; false filtra quem não tem
   * @example "true"
    */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    coordenador_responsavel_cp?: boolean;

    /**
   * Filtrar por órgão?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id?: number;

    /*
    versão alternativa para aceitar números negativos, e vazio como undefined caso seja adicionado @IsOptional()
    @IsNumber()
    @Transform((a: any) => a.value === '' ? undefined : +a.value)
    XXXX?: number;
    */

}