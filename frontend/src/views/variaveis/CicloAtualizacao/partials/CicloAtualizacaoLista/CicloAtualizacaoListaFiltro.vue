<script setup lang="ts">
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
import { cicloAtualizacaoFiltrosSchema as schema } from '@/consts/formSchemas';
import maskMonth from '@/helpers/maskMonth';
import truncate from '@/helpers/texto/truncate';
import { useEquipesStore } from '@/stores/equipes.store';
import type { ArvoreDeIniciativas, AtividadesPorId } from '@/stores/helpers/mapIniciativas';
import { usePsMetasStore } from '@/stores/metasPs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import type { EquipeRespItemDto } from '@back/equipe-resp/entities/equipe-resp.entity.ts';
import type { MetaItemDto } from '@back/meta/entities/meta.entity';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  computed, onMounted, onUnmounted, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

type FieldsProps = {
  class?: string
  nome: string
  tipo: string
  opcoes?: EquipeRespItemDto[]
  | MetaItemDto[]
  | ArvoreDeIniciativas
  | AtividadesPorId
  ariaDisabled?: boolean
  placeholder?: string
  mask?: (el: HTMLInputElement) => void
  onChange?: () => void
};

const route = useRoute();
const router = useRouter();

const valoresIniciais = {
  aba: 'Preenchimento',
};

const equipesStore = useEquipesStore();
const metasStore = usePsMetasStore(route.meta.entidadeMãe);
const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);

const { lista: listaDeMetas, metasPorPlano } = storeToRefs(metasStore);
const {
  lista: listaDePlanos,
  arvoreDeMetas,
} = storeToRefs(planosSetoriaisStore);

const {
  handleSubmit, isSubmitting, setValues, setFieldValue, values,
} = useForm({
  validationSchema: schema,
  initialValues: route.query,
});

const equipes = computed(() => (equipesStore.lista as EquipeRespItemDto[])
  .filter((item) => {
    switch (route.query.aba) {
      case 'Preenchimento':
        return item.perfil === 'Medicao';

      case 'Validacao':
        return item.perfil === 'Validacao';

      case 'Liberacao':
        return item.perfil === 'Liberacao';

      default:
        return true;
    }
  }));

const campos = computed<FieldsProps[]>(() => [
  { class: 'fb20em', nome: 'codigo', tipo: 'text' },
  { class: 'fb20em', nome: 'palavra_chave', tipo: 'text' },
  {
    class: 'fb20em', nome: 'equipe_id', tipo: 'select', opcoes: equipes.value,
  },
  {
    class: 'fb20em', nome: 'referencia', tipo: 'text', mask: maskMonth, placeholder: '01/2024',
  },
  {
    class: 'fb20em',
    nome: 'pdm_id',
    tipo: 'select',
    opcoes: listaDePlanos.value,
    onChange: () => {
      setFieldValue('meta_id', null);
      setFieldValue('iniciativa_id', null);
      setFieldValue('atividade_id', null);
    },
  },
  {
    class: 'fb20em',
    nome: 'meta_id',
    tipo: 'select',
    opcoes: (values.pdm_id && metasPorPlano.value[Number(values.pdm_id)]) || [],
    ariaDisabled: !metasPorPlano.value[Number(values.pdm_id)]?.length,
    onChange: () => {
      setFieldValue('iniciativa_id', null);
      setFieldValue('atividade_id', null);
    },
  },
  {
    class: 'fb20em',
    nome: 'iniciativa_id',
    tipo: 'select',
    opcoes: (values.meta_id && arvoreDeMetas.value[Number(values.meta_id)]?.iniciativas) || [],
    ariaDisabled: !arvoreDeMetas.value[Number(values.meta_id)]?.iniciativas
      || !Object.keys(arvoreDeMetas.value[Number(values.meta_id)]?.iniciativas)?.length,
    onChange: () => {
      setFieldValue('atividade_id', null);
    },
  },
  {
    class: 'fb20em',
    nome: 'atividade_id',
    tipo: 'select',
    opcoes: (values.meta_id && values.iniciativa_id && arvoreDeMetas
      .value[Number(values.meta_id)]?.iniciativas?.[Number(values.iniciativa_id)]?.atividades)
      || [],
    ariaDisabled: !arvoreDeMetas.value[Number(values.meta_id)]?.iniciativas
      || !Object.keys(arvoreDeMetas.value[Number(values.meta_id)]?.iniciativas)?.length,
  },
]);

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const parametros = Object.keys(valoresControlados).reduce((amount, item) => {
    amount[item] = valoresControlados[item] ? String(valoresControlados[item]) : undefined;
    return amount;
  }, {} as Record<string, string | undefined>);

  router.replace({
    query: {
      ...route.query,
      ...parametros,
    },
  });
});

watch(() => route.query, (val) => {
  setValues(val);
}, { deep: true });

watch(() => values.meta_id, (val) => {
  if (val && !arvoreDeMetas.value[Number(val)]) {
    planosSetoriaisStore.buscarArvoreDeMetas({ meta_ids: [val] });
    setFieldValue('iniciativa_id', null);
    setFieldValue('atividade_id', null);
  }
}, { immediate: true });

onMounted(() => {
  // Redefinir porque carregaremos com filtragem no backend
  equipesStore.$reset();

  if (!listaDeMetas.value.length) {
    metasStore.buscarTudo();
  }

  if (!listaDePlanos.value.length) {
    planosSetoriaisStore.buscarTudo();
  }

  equipesStore.buscarTudo({ remover_participantes: true });
});

onUnmounted(() => {
  // Redefinir porque carregamos com filtragem no backend
  equipesStore.$reset();
});
</script>
<template>
  <section class="comunicados-gerais-filtro">
    <FormularioQueryString
      :valores-iniciais="valoresIniciais"
    >
      <form
        class="flex center g2"
        @submit="onSubmit"
      >
        <div class="flex g1 fg999 flexwrap">
          <div
            v-for="campo in campos"
            :key="campo.nome"
            :class="['f1', campo.class]"
          >
            <LabelFromYup
              :name="campo.nome"
              :schema="schema"
            />

            <Field
              v-if="campo.tipo !== 'select'"
              class="inputtext light mb1"
              :name="campo.nome"
              :type="campo.tipo"
              :placeholder="campo.placeholder"
              :maxlength="campo.mask && 7"
              @keyup="campo.mask"
              @change="campo.onChange"
            />
            <Field
              v-else
              class="inputtext light mb1"
              :name="campo.nome"
              as="select"
              :aria-disabled="campo.ariaDisabled"
              @change="campo.onChange"
            >
              <option value="">
                -
              </option>

              <option
                v-for="opcao in campo.opcoes"
                :key="`ciclo-atualizacao-equipe--${opcao.id}`"
                :value="opcao.id"
                :title="opcao.titulo?.length > 36 ? opcao.titulo : undefined"
              >
                <template v-if="'orgao' in opcao && opcao.orgao?.sigla">
                  {{ opcao.orgao?.sigla }} -
                </template>
                {{ 'nome' in opcao ? opcao.nome : truncate(opcao.titulo, 36) }}
              </option>
            </Field>

            <ErrorMessage
              class="error-msg mb1"
              :name="campo.nome"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn"
          :disabled="isSubmitting"
        >
          Filtrar
        </button>
      </form>
    </FormularioQueryString>
  </section>
</template>
