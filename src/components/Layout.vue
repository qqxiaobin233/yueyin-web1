<template>
  <el-container class="layout-container">
    <el-aside v-if="!isMobile" width="250px" class="sidebar">
      <div class="logo">
        <h2>粤地探索管理后台</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/regions">
          <el-icon><Location /></el-icon>
          <span>地区管理</span>
        </el-menu-item>
        <el-menu-item index="/assets">
          <el-icon><Picture /></el-icon>
          <span>资源管理</span>
        </el-menu-item>
        <el-menu-item index="/cantonese-test/questions">
          <el-icon><Document /></el-icon>
          <span>粤语测试题目</span>
        </el-menu-item>

        <el-menu-item index="/game/questions/import">
          <el-icon><Tickets /></el-icon>
          <span>游戏题库导入</span>
        </el-menu-item>

        <el-menu-item index="/game/scene-dialog/import">
          <el-icon><Tickets /></el-icon>
          <span>场景对话导入</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <div class="header-left">
            <el-button
              v-if="isMobile"
              class="menu-btn"
              :icon="Menu"
              circle
              type="primary"
              plain
              @click="drawerOpen = true"
            />
            <h3 class="page-title">{{ getPageTitle() }}</h3>
          </div>
          <div class="user-info">
            <span>管理员</span>
          </div>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <el-drawer
      v-if="isMobile"
      v-model="drawerOpen"
      direction="ltr"
      size="80%"
      :with-header="false"
    >
      <div class="drawer-wrap">
        <div class="logo">
          <h2>粤地探索管理后台</h2>
        </div>
        <el-menu
          :default-active="$route.path"
          class="sidebar-menu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          @select="drawerOpen = false"
        >
          <el-menu-item index="/regions">
            <el-icon><Location /></el-icon>
            <span>地区管理</span>
          </el-menu-item>
          <el-menu-item index="/assets">
            <el-icon><Picture /></el-icon>
            <span>资源管理</span>
          </el-menu-item>
          <el-menu-item index="/cantonese-test/questions">
            <el-icon><Document /></el-icon>
            <span>粤语测试题目</span>
          </el-menu-item>

          <el-menu-item index="/game/questions/import">
            <el-icon><Tickets /></el-icon>
            <span>游戏题库导入</span>
          </el-menu-item>

          <el-menu-item index="/game/scene-dialog/import">
            <el-icon><Tickets /></el-icon>
            <span>场景对话导入</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Location, Picture, Document, Tickets, Menu } from '@element-plus/icons-vue'

const route = useRoute()

const isMobile = ref(false)
const drawerOpen = ref(false)

const updateIsMobile = () => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
  if (!isMobile.value) {
    drawerOpen.value = false
  }
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
})

const getPageTitle = () => {
  const titleMap = {
    '/regions': '地区管理',
    '/assets': '资源管理',
    '/cantonese-test/questions': '粤语测试题目',
    '/game/questions/import': '游戏题库导入',
    '/game/scene-dialog/import': '场景对话导入'
  }
  return titleMap[route.path] || '管理后台'
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: white;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #434a50;
}

.logo h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.sidebar-menu {
  border: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
}

.page-title {
  margin: 0;
}

.menu-btn {
  flex-shrink: 0;
}

.header-content h3 {
  margin: 0;
  color: #303133;
}

.user-info {
  color: #606266;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
}

.drawer-wrap {
  height: 100%;
  background-color: #304156;
}

@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }

  .main-content {
    padding: 16px;
    overflow-x: hidden;
  }

  :deep(.toolbar) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  :deep(.toolbar-left),
  :deep(.toolbar-right) {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    overflow: visible;
    row-gap: 10px;
  }

  :deep(.toolbar .el-button),
  :deep(.toolbar .el-select),
  :deep(.toolbar .el-input) {
    flex-shrink: 0;
  }

  :deep(.toolbar-select) {
    flex: 1 1 140px;
    min-width: 140px;
    max-width: 100%;
  }

  :deep(.toolbar-select .el-select) {
    width: 100%;
  }

  :deep(.el-card__body) {
    overflow: visible;
  }
}

:deep(.toolbar-select) {
  min-width: 140px;
}

:deep(.el-menu-item) {
  min-height: 48px;
}

:deep(.el-table) {
  max-width: 100%;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

:deep(.el-dialog__body) {
  overflow-x: auto;
}
</style>
