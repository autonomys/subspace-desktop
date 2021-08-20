import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: "importKey", path: '/importKey', component: () => import('pages/ImportKey.vue') },
      { name: "advanced", path: '/advanced', component: () => import('pages/Advanced.vue') },
      { name: "dashboard", path: '/dashboard', component: () => import('pages/Dashboard.vue') },
      { name: "plottingProgress", path: '/plottingProgress', component: () => import('pages/PlottingProgress.vue') },
      { name: "setupPlot", path: '/setupPlot', component: () => import('pages/SetupPlot.vue') },
      { name: "setPassword", path: '/setPassword', component: () => import('pages/SetPassword.vue') },
      { name: "index", path: '', component: () => import('pages/Index.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
