import regEx from '@/consts/patterns';
import { boolean, number, object, string } from 'yup';

const relatórioOrçamentário = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    inicio: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    fim: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    tipo: string().required('Escolha o tipo'),
  })
});

const relatórioSemestralOuAnual = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    ano: number().min(2003, 'A partir de 2003').required('Escolha um ano válido'),
    semestre: string()
      .when('periodo', {
        is: 'Semestral',
        then: (schema) => schema.required('Escolha o semestre')
      })
      .matches(regEx['^(:?Primeiro|Segundo)$'], 'Valor inválido'),
    periodo: string().required('Escolha o período').matches(regEx['^(:?Anual|Semestral)$'], 'Valor inválido'),
    tipo: string().required('Escolha o tipo'),
  })
});

export { relatórioOrçamentário, relatórioSemestralOuAnual };
