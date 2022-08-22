import { Pessoa } from '../entities/pessoa.entity';

import {
    IsEmail,
    IsPositive,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
export class CreatePessoaDto extends Pessoa {
    /**
   * E-mail para login
   * @example admin@email.com
    */
    @MinLength(1, { message: '$property| E-mail: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| E-mail: Máximo 250 caracteres' })
    @IsEmail(undefined, { message: '$property| E-mail: Precisa ser um endereço válido' })
    email: string;

    /**
       * Nome para exibir no app
       * @example Fulano
    */
    @IsString({ message: '$property| Nome Social: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Social: Mínimo de 4 caracteres' })
    @MaxLength(30, { message: '$property| Nome Social: Máximo 30 caracteres' })
    nome_exibicao: string;

    /**
       * Nome completo
       * @example Fulano de Zo
    */
    @IsString({ message: '$property| Nome Completo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Completo: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Nome Completo: Máximo 250 caracteres' })
    nome_completo: string;

    /**
       * ID Cargo
       * @example 1
    */
    @IsPositive()
    cargo_id?: number;

    /**
      * ID Divisão Técnica
      * @example 1
   */
    @IsPositive()
    divisao_tecnica_id?: number;

    /**
      * ID Departamento
      * @example 1
   */
    @IsPositive()
    departamento_id?: number;

    /**
      * ID Coordenadoria
      * @example 1
   */
    @IsPositive()
    coordenadoria_id?: number;

    /**
       * ID Órgão
       * @example 1
    */
    @IsPositive()
    orgao_id?: number;

}