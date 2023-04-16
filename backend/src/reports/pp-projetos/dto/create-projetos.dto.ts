import { OmitType, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { FilterProjetoDto } from "src/pp/projeto/dto/filter-projeto.dto";


export class CreateRelProjetosDto extends OmitType(PartialType(FilterProjetoDto), ['eh_prioritario', 'arquivado']) {
    @IsOptional()
    @IsString()
    codigo?: string
}