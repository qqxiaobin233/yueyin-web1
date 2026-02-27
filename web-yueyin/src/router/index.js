import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import RegionManagement from '@/views/RegionManagement.vue'
import AssetManagement from '@/views/AssetManagement.vue'
import CantoneseTestQuestionManagement from '@/views/CantoneseTestQuestionManagement.vue'
import GameQuestionImport from '@/views/GameQuestionImport.vue'
import GameSceneDialogImport from '@/views/GameSceneDialogImport.vue'

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
      },
      {
        path: '/game/questions/import',
        name: 'GameQuestionImport',
        component: GameQuestionImport
      },
      {
        path: '/game/scene-dialog/import',
        name: 'GameSceneDialogImport',
        component: GameSceneDialogImport
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
