import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import RegionManagement from '@/views/RegionManagement.vue'
import AssetManagement from '@/views/AssetManagement.vue'
import CantoneseTestQuestionManagement from '@/views/CantoneseTestQuestionManagement.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        redirect: '/regions'
      },
      {
        path: '/regions',
        name: 'RegionManagement',
        component: RegionManagement
      },
      {
        path: '/assets',
        name: 'AssetManagement',
        component: AssetManagement
      },
      {
        path: '/cantonese-test/questions',
        name: 'CantoneseTestQuestionManagement',
        component: CantoneseTestQuestionManagement
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
