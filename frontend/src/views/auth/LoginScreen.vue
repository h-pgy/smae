<script setup>
import { autenticação as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';
import { Field, Form } from 'vee-validate';

async function onSubmit(values) {
  const authStore = useAuthStore();
  await authStore.login(values);
}
</script>
<template>
  <div class="login">
    <div class="login-form">
      <div class="wrap flex column spacebetween">
        <div>
          <img
            src="@/assets/logo.svg"
            alt="SMAE"
          >
          <p class="tamarelo">
            Sistema de Monitoramento e Acompanhamento Estratégico
          </p>
        </div>
        <Form
          v-slot="{ errors, isSubmitting, setFieldValue }"
          :validation-schema="schema"
          @submit="onSubmit"
        >
          <div class="form-group">
            <label class="label tc300">Login</label>
            <Field
              name="email"
              placeholder="seu_email@provedor.com"
              type="text"
              class="inputtext tc500 mb1"
              :class="{ 'error': errors.email }"
              @change="($e) => { setFieldValue('email', $e.target.value.trim()); }"
            />
            <div class="error-msg">
              {{ errors.username }}
            </div>
          </div>
          <div class="form-group">
            <label class="label tc300">Senha</label>
            <Field
              name="senha"
              placeholder="*******"
              type="password"
              class="inputtext tc500 mb1"
              :class="{ 'error': errors.senha }"
              @change="($e) => { setFieldValue('senha', $e.target.value.trim()); }"
            />
            <div class="error-msg">
              {{ errors.password }}
            </div>
          </div>
          <div class="form-group">
            <router-link
              to="esqueci-minha-senha"
              class="link tamarelo w700 mb2 block"
            >
              Esqueci minha senha
            </router-link>
            <button
              class="btn amarelo block mb2"
              :disabled="isSubmitting"
            >
              <span
                v-show="isSubmitting"
                class="spinner"
              />
              Acessar sistema
            </button>
          </div>
        </Form>
        <div class="flex">
          <img
            src="@/assets/sp.svg"
            class="mr2"
          >
          <img src="@/assets/fgv.svg">
        </div>
      </div>
    </div>
  </div>
</template>
