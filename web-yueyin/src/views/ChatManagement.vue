<template>
  <div class="chat-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>对话管理</span>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户ID或内容"
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedRegion" placeholder="选择地区" clearable>
              <el-option label="全部地区" value="" />
              <el-option label="广州" value="广州" />
              <el-option label="深圳" value="深圳" />
              <el-option label="珠海" value="珠海" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="messageType" placeholder="消息类型" clearable>
              <el-option label="全部类型" value="" />
              <el-option label="文本" value="text" />
              <el-option label="语音" value="voice" />
              <el-option label="图片" value="image" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadChatHistory">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 对话列表 -->
      <el-table :data="chatList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="消息ID" width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="200">
          <template #default="scope">
            <div class="content-cell">
              <span v-if="scope.row.type === 'user'">{{ scope.row.content }}</span>
              <div v-else-if="scope.row.isVoice" class="voice-content">
                <el-icon><Microphone /></el-icon>
                <span>语音消息</span>
              </div>
              <div v-else-if="scope.row.isImage" class="image-content">
                <el-icon><Picture /></el-icon>
                <span>图片消息</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewMessage(scope.row)">查看</el-button>
            <el-button size="small" type="danger" @click="deleteMessage(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 消息详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="消息详情"
      width="600px"
    >
      <div v-if="selectedMessage" class="message-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="消息ID">{{ selectedMessage.id }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTag(selectedMessage.type)">
              {{ getTypeText(selectedMessage.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ selectedMessage.time }}</el-descriptions-item>
          <el-descriptions-item label="语音消息">
            <el-tag :type="selectedMessage.isVoice ? 'success' : 'info'">
              {{ selectedMessage.isVoice ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="图片消息">
            <el-tag :type="selectedMessage.isImage ? 'success' : 'info'">
              {{ selectedMessage.isImage ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="message-content">
          <h4>消息内容</h4>
          <div v-if="selectedMessage.type === 'user'" class="text-content">
            {{ selectedMessage.content }}
          </div>
          <div v-else-if="selectedMessage.isVoice" class="voice-content">
            <el-icon><Microphone /></el-icon>
            <span>语音消息</span>
            <el-button size="small" type="primary">播放</el-button>
          </div>
          <div v-else-if="selectedMessage.isImage" class="image-content">
            <el-icon><Picture /></el-icon>
            <span>图片消息</span>
            <el-button size="small" type="primary">查看图片</el-button>
          </div>
        </div>
        
        <div v-if="selectedMessage.suggestions && selectedMessage.suggestions.length > 0" class="suggestions">
          <h4>建议问题</h4>
          <el-tag
            v-for="suggestion in selectedMessage.suggestions"
            :key="suggestion"
            style="margin-right: 10px; margin-bottom: 5px;"
          >
            {{ suggestion }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Microphone, Picture } from '@element-plus/icons-vue'
import { chatApi } from '@/api'

const loading = ref(false)
const searchKeyword = ref('')
const selectedRegion = ref('')
const messageType = ref('')
const dateRange = ref([])
const showDetailDialog = ref(false)
const selectedMessage = ref(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 对话列表数据
const chatList = ref([])

const getTypeTag = (type) => {
  const tagMap = {
    'user': 'primary',
    'ip': 'success'
  }
  return tagMap[type] || 'info'
}

const getTypeText = (type) => {
  const textMap = {
    'user': '用户消息',
    'ip': 'AI回复'
  }
  return textMap[type] || '未知'
}

const handleSearch = () => {
  loadChatHistory()
}

const loadChatHistory = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (selectedRegion.value) {
      params.region = selectedRegion.value
    }
    if (messageType.value) {
      params.messageType = messageType.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    
    // 调用API获取对话历史
    const response = await chatApi.getChatHistory(params)
    if (response.code === 200) {
      // 根据接口文档，messages字段包含：id, type, content, time, isVoice, isImage, suggestions
      chatList.value = response.data.messages || []
      total.value = response.data.pagination?.total || 0
    } else {
      ElMessage.error(response.message || '加载对话历史失败')
    }
  } catch (error) {
    console.error('加载对话历史失败:', error)
    ElMessage.error('加载对话历史失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchKeyword.value = ''
  selectedRegion.value = ''
  messageType.value = ''
  dateRange.value = []
  currentPage.value = 1
  loadChatHistory()
}

const viewMessage = (message) => {
  selectedMessage.value = message
  showDetailDialog.value = true
}

const deleteMessage = async (message) => {
  try {
    await ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用API删除消息
    // await messageApi.deleteMessage(message.id)
    
    const index = chatList.value.findIndex(m => m.id === message.id)
    if (index > -1) {
      chatList.value.splice(index, 1)
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadChatHistory()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadChatHistory()
}

onMounted(() => {
  loadChatHistory()
})
</script>

<style scoped>
.chat-management {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.content-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice-content,
.image-content {
  display: flex;
  align-items: center;
  gap: 5px;
}

.message-detail {
  padding: 10px 0;
}

.message-content,
.reply-content {
  margin-top: 20px;
}

.text-content {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.reply-text {
  padding: 10px;
  background-color: #e1f3d8;
  border-radius: 4px;
  margin-bottom: 10px;
}

.suggestions {
  margin-top: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
