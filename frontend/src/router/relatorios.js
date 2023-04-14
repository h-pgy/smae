import MenuSecundario from '@/components/MenuSecundario.vue';
import NovoMensal from '@/views/relatorios/NovoMensal.vue';
import NovoOrcamentario from '@/views/relatorios/NovoOrcamentario.vue';
import NovoSemestralOuAnual from '@/views/relatorios/NovoSemestralOuAnual.vue';
import RelatoriosMensais from '@/views/relatorios/RelatoriosMensais.vue';
import RelatoriosOrcamentarios from '@/views/relatorios/RelatoriosOrcamentarios.vue';
import RelatoriosRaiz from '@/views/relatorios/RelatoriosRaiz.vue';
import RelatoriosSemestraisOuAnuais from '@/views/relatorios/RelatoriosSemestraisOuAnuais.vue';

export default {
  path: '/relatorios',
  component: RelatoriosRaiz,
  props: {
    submenu: MenuSecundario,
  },

  meta: {
    presenteNoMenu: true,

    títuloParaMenu: 'Relatórios',
    íconeParaMenu: `<svg width="18" height="22" viewBox="0 0 18 22">
<path fill-rule="evenodd" clip-rule="evenodd" d="M10 2.01991C9.8143 2.00299 9.53915 2.00006 9.01178 2.00006H5.8C4.94342 2.00006 4.36113 2.00084 3.91104 2.03761C3.47262 2.07343 3.24842 2.13836 3.09202 2.21805C2.7157 2.4098 2.40973 2.71576 2.21799 3.09208C2.1383 3.24848 2.07337 3.47269 2.03755 3.9111C2.00078 4.36119 2 4.94348 2 5.80006V16.2001C2 17.0566 2.00078 17.6389 2.03755 18.089C2.07337 18.5274 2.1383 18.7516 2.21799 18.908C2.40973 19.2844 2.7157 19.5903 3.09202 19.7821C3.24842 19.8618 3.47262 19.9267 3.91104 19.9625C4.36113 19.9993 4.94342 20.0001 5.8 20.0001H12.2C13.0566 20.0001 13.6389 19.9993 14.089 19.9625C14.5274 19.9267 14.7516 19.8618 14.908 19.7821C15.2843 19.5903 15.5903 19.2844 15.782 18.908C15.8617 18.7516 15.9266 18.5274 15.9624 18.089C15.9992 17.6389 16 17.0566 16 16.2001V8.98829C16 8.46099 15.9971 8.18583 15.9802 8.00013L12.5681 8.00014C12.3157 8.00017 12.0699 8.0002 11.8618 7.98319C11.6332 7.96451 11.3634 7.92044 11.092 7.78215C10.7157 7.5904 10.4097 7.28444 10.218 6.90812C10.0797 6.63669 10.0356 6.36696 10.0169 6.13836C9.99994 5.9302 9.99997 5.6844 10 5.43202L10 2.01991ZM11.3936 0.350029C11.1677 0.248769 10.9326 0.168544 10.6911 0.110583C10.2284 -0.000499591 9.74865 -0.000271186 9.11366 3.08906e-05C9.08014 4.68646e-05 9.04618 6.30771e-05 9.01178 6.30771e-05L5.7587 6.26003e-05C4.95373 4.98449e-05 4.28937 3.9354e-05 3.74817 0.0442567C3.18608 0.0901819 2.66937 0.188746 2.18404 0.436037C1.43139 0.81953 0.819468 1.43145 0.435975 2.1841C0.188684 2.66944 0.0901197 3.18614 0.0441945 3.74824C-2.28137e-05 4.28943 -1.23241e-05 4.95379 4.31292e-07 5.75876V16.2414C-1.23241e-05 17.0463 -2.28137e-05 17.7107 0.0441945 18.2519C0.0901197 18.814 0.188684 19.3307 0.435975 19.816C0.819468 20.5687 1.43139 21.1806 2.18404 21.5641C2.66937 21.8114 3.18608 21.9099 3.74817 21.9559C4.28936 22.0001 4.95372 22.0001 5.75868 22.0001H12.2413C13.0463 22.0001 13.7106 22.0001 14.2518 21.9559C14.8139 21.9099 15.3306 21.8114 15.816 21.5641C16.5686 21.1806 17.1805 20.5687 17.564 19.816C17.8113 19.3307 17.9099 18.814 17.9558 18.2519C18 17.7107 18 17.0463 18 16.2414V8.98829C18 8.95389 18 8.91994 18 8.88642C18.0003 8.25142 18.0006 7.77162 17.8895 7.30892C17.8317 7.06819 17.7518 6.83372 17.6509 6.60843C17.6447 6.59375 17.6381 6.57925 17.6311 6.56494C17.5658 6.42355 17.4922 6.28589 17.4106 6.15271C17.1619 5.74698 16.8225 5.40788 16.3733 4.95907C16.3496 4.93539 16.3255 4.91139 16.3012 4.88707L13.113 1.69884C13.0887 1.67452 13.0647 1.6505 13.041 1.62678C12.5922 1.17756 12.2531 0.838129 11.8474 0.589502C11.7136 0.507556 11.5754 0.433665 11.4334 0.368139C11.4203 0.361822 11.407 0.355783 11.3936 0.350029ZM12 3.41428V5.40014C12 5.69666 12.0008 5.85892 12.0103 5.9755C12.0107 5.98014 12.0111 5.98454 12.0114 5.98869C12.0156 5.98907 12.02 5.98945 12.0246 5.98983C12.1412 5.99936 12.3035 6.00013 12.6 6.00013H14.5859L12 3.41428ZM9 8.50006C9.55229 8.50006 10 8.94778 10 9.50006V17.0001C10 17.5523 9.55229 18.0001 9 18.0001C8.44772 18.0001 8 17.5523 8 17.0001V9.50006C8 8.94778 8.44772 8.50006 9 8.50006ZM13 11.0001C13.5523 11.0001 14 11.4478 14 12.0001V17.0001C14 17.5523 13.5523 18.0001 13 18.0001C12.4477 18.0001 12 17.5523 12 17.0001V12.0001C12 11.4478 12.4477 11.0001 13 11.0001ZM5 13.0001C5.55229 13.0001 6 13.4478 6 14.0001V17.0001C6 17.5523 5.55229 18.0001 5 18.0001C4.44772 18.0001 4 17.5523 4 17.0001V14.0001C4 13.4478 4.44772 13.0001 5 13.0001Z" />
</svg>
`,
    restringirÀsPermissões: [
      'Reports.executar',
      'Reports.remover',
    ],
    rotasParaMenuSecundário: [
      'RelatóriosMensais',
      'RelatóriosSemestraisOuAnuais',
      'RelatóriosOrçamentários',
    ],
  },

  children: [
    {
      path: '',
      redirect: '/relatorios/mensal',
    },
    {
      name: 'RelatóriosMensais',
      path: 'mensal',
      meta: {
        título: 'Relatórios Mensais',
        títuloParaMenu: 'Relatório Mensal',
      },
      children: [
        {
          path: '',
          component: RelatoriosMensais,
        },
        {
          component: NovoMensal,
          path: 'novo',
          name: 'novoRelatórioMensal',
          meta: {
            título: 'Novo relatório mensal',
          },
        },
      ],
    },
    {
      name: 'RelatóriosSemestraisOuAnuais',
      path: 'semestral-ou-anual',
      meta: {
        título: 'Relatórios Semestrais e Anuais',
        títuloParaMenu: 'Relatório Semestral/Anual',
      },
      children: [
        {
          path: '',
          component: RelatoriosSemestraisOuAnuais,
        },
        {
          component: NovoSemestralOuAnual,
          path: 'novo',
          name: 'novoRelatórioSemestralOuAnual',
          meta: {
            título: 'Novo relatório semestral ou anual',
          },
        },
      ],
    },
    {
      name: 'RelatóriosOrçamentários',
      path: 'orcamentarios',
      meta: {
        título: 'Relatórios orçamentários',
        títuloParaMenu: 'Relatório Orçamento',
      },
      children: [
        {
          path: '',
          component: RelatoriosOrcamentarios,
        },
        {
          component: NovoOrcamentario,
          path: 'novo',
          name: 'novoRelatórioOrçamentário',
          meta: {
            título: 'Novo relatório de orçamentos',
          },
        },
      ],
    },
  ],
};
