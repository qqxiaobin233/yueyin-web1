import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Dashboard from '@/views/Dashboard.vue'
import RegionManagement from '@/views/RegionManagement.vue'
import ChatManagement from '@/views/ChatManagement.vue'
import UserManagement from '@/views/UserManagement.vue'
import MessageManagement from '@/views/MessageManagement.vue'
import AssetManagement from '@/views/AssetManagement.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: '/regions',
        name: 'RegionManagement',
        component: RegionManagement
      },
      {
        path: '/chats',
        name: 'ChatManagement',
        component: ChatManagement
      },
      {
        path: '/users',
        name: 'UserManagement',
        component: UserManagement
      },
      {
        path: '/messages',
        name: 'MessageManagement',
        component: MessageManagement
      },
      {
        path: '/assets',
        name: 'AssetManagement',
        component: AssetManagement
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
