import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { CreateProjetoDto, CreateProjetoSeiDto } from './create-projeto.dto';

export class PPfonteRecursoDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    @Transform((a: any) => (a.value === undefined ? undefined : +a.value))
    id?: number;

    /**
     * código da fonte de recurso no SOF, no ano escolhido
     */
    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2)
    fonte_recurso_cod_sof: string;

    @IsInt()
    @Max(3000)
    @Min(2003)
    @Transform((a: any) => +a.value)
    fonte_recurso_ano: number;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: any) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    valor_percentual?: number | null;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: any) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    valor_nominal?: number | null;
}

export class PPpremissaDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2048)
    premissa: string;
}

export class PPrestricaoDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2048)
    restricao: string;
}

export class UpdateProjetoRegistroSeiDto extends PartialType(CreateProjetoSeiDto) {}

// esses campos serão updated apenas via sistema (pelas tarefas)
//    @IsOptional()
//    @IsOnlyDate()
//    @Type(() => Date)
//    @ValidateIf((object, value) => value !== null)
//    realizado_inicio?: Date
//
//    @IsOptional()
//    @IsOnlyDate()
//    @Type(() => Date)
//    @ValidateIf((object, value) => value !== null)
//    realizado_termino?: Date
//
//    @IsOptional()
//    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custo até duas casas decimais' })
//    @Min(0, { message: '$property| Custo precisa ser positivo' })
//    @Transform((a: any) => (a.value === null ? null : +a.value))
//    @ValidateIf((object, value) => value !== null)
//    realizado_custo?: number

export class UpdateProjetoDto extends OmitType(PartialType(CreateProjetoDto), ['portfolio_id', 'orgao_gestor_id']) {
    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPpremissaDto)
    premissas?: PPpremissaDto[];

    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPrestricaoDto)
    restricoes?: PPrestricaoDto[];

    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPfonteRecursoDto)
    fonte_recursos?: PPfonteRecursoDto[];

    @IsOptional()
    @ApiProperty({
        deprecated: true,
        description: 'Não é mais possível escrever o codigo',
    })
    codigo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    objeto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    objetivo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    publico_alvo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    nao_escopo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    @ValidateIf((object, value) => value !== null)
    secretario_executivo?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    @ValidateIf((object, value) => value !== null)
    secretario_responsavel?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    @ValidateIf((object, value) => value !== null)
    coordenador_ue?: string | null;

    /**
     * texto que representa a versão
     * @example "..."
     */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    @ValidateIf((object, value) => value !== null)
    versao: string | null;

    /**
     * data_aprovacao
     * @example "2022-01-20"
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_aprovacao?: Date | null;

    /**
     * data_revisao
     * @example "2022-01-20"
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_revisao?: Date | null;

    /**
     * Executa uma mudança de status, sem atualizar os campos (pode retroceder)
     */
    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    status?: ProjetoStatus;
}

export class UpdateProjetoDocumentDto {
    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    descricao?: string | null;
}