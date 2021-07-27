import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: "saveKeys", path: '/saveKeys', component: () => import('pages/SaveKeys.vue') },
      { name: "setPassword", path: '/setPassword', component: () => import('pages/SetPassword.vue') },
      { name: "index", path: '', component: () => import('pages/Index.vue') },
      { name: "accountSetup", path: '/AccountSetup', component: () => import('pages/AccountSetup.vue') }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
