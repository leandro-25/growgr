import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import Login from '../views/Login.vue'
import SignUp from '../views/SignUp.vue'
import TransactionPage from '../views/TransactionPage.vue'
import EstrategiasView from '@/views/EstrategiasView.vue';
import AtivosEstrategiaView from '@/views/AtivosEstrategiaView.vue';
import CarteiraView from '@/views/CarteiraView.vue';
import TabsLayout from '@/components/TabsLayout.vue';

const routes: Array<RouteRecordRaw> = [
  { 
    path: '/', 
    redirect: '/tabs/home' 
  },
  { 
    path: '/login', 
    name: 'Login', 
    component: Login 
  },
  { 
    path: '/signup', 
    name: 'SignUp', 
    component: SignUp 
  },
  
  // Rota de transações fora do layout de tabs
  {
    path: '/transaction',
    name: 'TransactionPage',
    component: TransactionPage,
    meta: { requiresAuth: true }
  },
  
  {
    path: '/tabs/',
    component: TabsLayout,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        name: 'HomePage',
        component: HomePage,
        meta: { requiresAuth: true }
      },
      {
        path: 'estrategias',
        name: 'EstrategiasView',
        component: EstrategiasView,
        meta: { requiresAuth: true }
      },
      {
        path: 'carteira',
        name: 'CarteiraView',
        component: CarteiraView,
        meta: { requiresAuth: true }
      }
    ]
  },
  
  // Rotas fora do layout de tabs
  {
    path: '/estrategias/:id/ativos',
    name: 'AtivosEstrategia',
    component: AtivosEstrategiaView,
    meta: { requiresAuth: true }
  },
  
  // Redirecionamentos para compatibilidade com rotas antigas
  { path: '/home', redirect: '/tabs/home' },
  { path: '/estrategias', redirect: '/tabs/estrategias' },
  { path: '/carteira', redirect: '/tabs/carteira' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const authRoutes = ['/login', '/signup'];

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (authRoutes.includes(to.path) && token) {
    next('/tabs/home');
  } else {
    next();
  }
});

router.onError((error) => {
  console.error('Erro de navegação:', error);
  // Se houver erro, tente redirecionar para a home
  if (localStorage.getItem('token')) {
    router.push('/tabs/home');
  } else {
    router.push('/login');
  }
});

export default router;