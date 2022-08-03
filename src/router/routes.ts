import { RouteRecordRaw, RouteComponent } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: (): RouteComponent => import('layouts/MainLayout.vue'),
    children: [
      { name: 'importKey', path: '/importKey', component: (): RouteComponent => import('pages/ImportKey.vue') },
      { name: 'dashboard', path: '/dashboard', component: (): RouteComponent => import('pages/Dashboard.vue') },
      { name: 'plottingProgress', path: '/plottingProgress', component: (): RouteComponent => import('pages/PlottingProgress.vue') },
      { name: 'setupPlot', path: '/setupPlot', component: (): RouteComponent => import('pages/SetupPlot.vue') },
      { name: 'index', path: '', component: (): RouteComponent => import('pages/Index.vue') },
      { name: 'errorPage', path: '/errorPage', component: (): RouteComponent => import('pages/ErrorPage.vue') },
    ],
  },
];

export default routes;
