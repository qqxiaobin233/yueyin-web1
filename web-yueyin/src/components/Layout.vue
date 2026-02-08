<template>
  <el-container class="layout-container">
    <el-aside width="250px" class="sidebar">
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
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h3>{{ getPageTitle() }}</h3>
          <div class="user-info">
            <span>管理员</span>
          </div>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Location, Picture, Document } from '@element-plus/icons-vue'

const route = useRoute()

const getPageTitle = () => {
  const titleMap = {
    '/regions': '地区管理',
    '/assets': '资源管理',
    '/cantonese-test/questions': '粤语测试题目'
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
</style>
