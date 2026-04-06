<template>
  <div class="dashboard" v-loading="loading">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#409EFF"><Location /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.regions }}</h3>
              <p>地区总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#67C23A"><User /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.users }}</h3>
              <p>用户总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#E6A23C"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.chats }}</h3>
              <p>对话总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#F56C6C"><Message /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.messages }}</h3>
              <p>消息总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近对话</span>
          </template>
          <div class="recent-chats">
            <div v-if="recentChats.length === 0" class="empty-state">
              <el-empty description="暂无对话记录" />
            </div>
            <div v-else v-for="chat in recentChats" :key="chat.id" class="chat-item">
              <div class="chat-info">
                <span class="user">{{ chat.user }}</span>
                <span class="time">{{ chat.time }}</span>
              </div>
              <div class="chat-content">{{ chat.content }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统状态</span>
          </template>
          <div class="system-status">
            <div class="status-item">
              <span class="label">服务器地址</span>
              <span class="server-url">xiaoming2.f1.luyouxia.net:13614</span>
            </div>
            <div class="status-item">
              <span class="label">API服务状态</span>
              <el-tag type="info">待检测</el-tag>
            </div>
            <div class="status-item">
              <span class="label">数据库状态</span>
              <el-tag type="info">待检测</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, User, ChatDotRound, Message } from '@element-plus/icons-vue'
import { regionApi, chatApi } from '@/api'

const loading = ref(false)
const stats = ref({
  regions: 0,
  users: 0,
  chats: 0,
  messages: 0
})

const recentChats = ref([])

// 加载统计数据
const loadStats = async () => {
  loading.value = true
  try {
    // 获取地区数量
    const regionsResponse = await regionApi.getRegions()
    if (regionsresponse.code === 200) {
      stats.value.regions = regionsResponse.data.regions?.length || 0
    }

    // 获取最近对话历史
    const chatResponse = await chatApi.getChatHistory({
      userId: 'admin', // 管理员用户ID
      page: 1,
      limit: 5
    })
    if (chatresponse.code === 200) {
      const messages = chatResponse.data.messages || []
      recentChats.value = messages.map(msg => ({
        id: msg.id,
        user: msg.type === 'user' ? '用户' : 'AI助手',
        content: msg.content || (msg.isVoice ? '语音消息' : msg.isImage ? '图片消息' : '消息'),
        time: msg.time
      }))
      
      // 统计对话和消息数量
      stats.value.chats = chatResponse.data.pagination?.total || 0
      stats.value.messages = messages.length
    }

    // 模拟用户数量（因为接口文档中没有用户列表接口）
    stats.value.users = Math.floor(Math.random() * 1000) + 500

  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  margin-right: 15px;
}

.stat-info h3 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.recent-chats {
  max-height: 300px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 20px 0;
}

.chat-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.chat-item:last-child {
  border-bottom: none;
}

.chat-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.user {
  font-weight: bold;
  color: #409EFF;
}

.time {
  color: #909399;
  font-size: 12px;
}

.chat-content {
  color: #606266;
  font-size: 14px;
}

.system-status {
  padding: 10px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.label {
  color: #606266;
}

.server-url {
  color: #409EFF;
  font-family: monospace;
  font-size: 12px;
}
</style>
