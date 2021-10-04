import { RouteRecordRaw,RouteComponent } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: ():RouteComponent => import('layouts/MainLayout.vue'),
    children: [
      { name: "importKey", path: '/importKey', component: ():RouteComponent => import('pages/ImportKey.vue') },
      { name: "advanced", path: '/advanced', component: ():RouteComponent => import('pages/Advanced.vue') },
      { name: "dashboard", path: '/dashboard', component: ():RouteComponent => import('pages/Dashboard.vue') },
      { name: "plottingProgress", path: '/plottingProgress', component: ():RouteComponent => import('pages/PlottingProgress.vue') },
      { name: "setupPlot", path: '/setupPlot', component: ():RouteComponent => import('pages/SetupPlot.vue') },
      { name: "setPassword", path: '/setPassword', component: ():RouteComponent => import('pages/SetPassword.vue') },
      { name: "index", path: '', component: ():RouteComponent => import('pages/Index.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: ():RouteComponent => import('pages/Error404.vue'),
  },
];

export default routes;
