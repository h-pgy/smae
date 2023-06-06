import LoadingComponent from '@/components/LoadingComponent.vue';
import MenuSecundário from '@/components/MenuSecundario.vue';
import EnviosRaiz from '@/views/envios/EnviosRaiz.vue';
import { defineAsyncComponent } from 'vue';
const EnviosLista = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviosLista.vue'),
  loadingComponent: LoadingComponent,
});
const EnviosMetas = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviosMetas.vue'),
  loadingComponent: LoadingComponent,
});
const EnviosProjetos = defineAsyncComponent({
  loader: () => import('@/views/envios/EnviosProjetos.vue'),
  loadingComponent: LoadingComponent,
});

export default {
  path: '/envios',
  name: 'envios',
  component: EnviosRaiz,
  props: {
    submenu: MenuSecundário,
  },

  meta: {
    requerAutenticação: true,

    presenteNoMenu: true,
    título: 'Envio de arquivos',
    títuloParaMenu: 'Envio de arquivos',
    íconeParaMenu: '',
    rotasParaMenuSecundário: [
      {
        títuloParaGrupoDeLinksNoMenu: 'Orçamentos',
        rotas: [
          'EnviosOrçamentosMetas',
          'EnviosOrçamentosProjetos',
        ],
      },
    ],
  },
  children: [
    {
      name: 'enviosOrçamentos',
      path: 'orcamentos',
      meta: {
        título: 'Envios ativos',
        títuloParaMenu: 'Ativos',
      },
    },
    {
      path: 'orcamentos/metas',
      component: EnviosMetas,
      meta: {
        título: 'Envio de orçamento para metas',
        títuloParaMenu: 'Metas',
      },
      children: [
        {
          path: '',
          name: 'EnviosOrçamentosMetas',
          component: EnviosLista,
        },
      ],
    },
    {
      path: 'orcamentos/projetos',
      component: EnviosProjetos,
      meta: {
        título: 'Envio de orçamento para projetos',
        títuloParaMenu: 'Projetos',
      },
      children: [
        {
          path: '',
          name: 'EnviosOrçamentosProjetos',
          component: EnviosLista,
        },
      ],
    },
  ],
};