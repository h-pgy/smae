<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <Field
          name="descricao"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="descricao"
        />
      </div>
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { defineOptions } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTemasPsStore } from '@/stores/temasPs.store';
import { useAlertStore } from '@/stores/alert.store';
import { tema as schema } from '@/consts/formSchemas';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();
const temasStore = useTemasPsStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(temasStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = route.params?.temaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values, pdm_id: Number(route.params.planoSetorialId) };

    if (route.params?.temaId) {
      response = await temasStore.salvarItem(
        dataToSend,
        route.params?.temaId,
      );
    } else {
      response = await temasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      temasStore.$reset();
      router.push({ name: `${route.meta.entidadeMãe}.planosSetoriaisTemas` });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

temasStore.$reset();
// não foi usada a prop.temaId pois estava vazando do edit na hora de criar uma nova
if (route.params?.temaId) {
  temasStore.buscarItem(route.params?.temaId);
}
</script>

<style></style>
