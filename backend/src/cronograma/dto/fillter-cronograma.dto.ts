import { ApiHideProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterCronogramaDto {
    /**
   * Filtrar por meta_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
   * Filtrar por iniciativa_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
  * Filtrar por atividade_id?
  * @example "1"
   */
    @IsOptional()
    @IsPositive({ message: '$property| atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    /**
    * Filtrar apenas cronogramas que os ids derem match
    */
    @ApiHideProperty()
    cronograma_etapa_ids?: number[]
}
