import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PlayerDetailView from '@/views/PlayerDetailView.vue'
import AdminAddMatchView from '@/views/AdminAddMatchView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/player/:id',
      name: 'player-detail',
      component: PlayerDetailView,
      props: true
    },
    {
      path: '/admin/add-match',
      name: 'admin-add-match',
      component: AdminAddMatchView
    }
  ]
})

export default router