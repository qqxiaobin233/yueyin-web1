<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户ID"
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="userType" placeholder="用户类型" clearable>
              <el-option label="全部用户" value="" />
              <el-option label="普通用户" value="normal" />
              <el-option label="VIP用户" value="vip" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="注册开始日期"
              end-placeholder="注册结束日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadUsers">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 用户列表 -->
      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="用户ID" width="120" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="userType" label="用户类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.userType === 'vip' ? 'warning' : 'primary'">
              {{ scope.row.userType === 'vip' ? 'VIP' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dailyChatCount" label="今日对话次数" width="120" />
        <el-table-column prop="maxFreeChats" label="免费对话限制" width="120" />
        <el-table-column prop="remainingChats" label="剩余对话次数" width="120" />
        <el-table-column prop="registerTime" label="注册时间" width="160" />
        <el-table-column prop="lastActiveTime" label="最后活跃" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="viewUser(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editUser(scope.row)">编辑</el-button>
            <el-button size="small" type="warning" @click="resetChatCount(scope.row)">重置对话次数</el-button>
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
    
    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="用户详情"
      width="800px"
    >
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ selectedUser.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">
            <el-tag :type="selectedUser.userType === 'vip' ? 'warning' : 'primary'">
              {{ selectedUser.userType === 'vip' ? 'VIP' : '普通' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="今日对话次数">{{ selectedUser.dailyChatCount }}</el-descriptions-item>
          <el-descriptions-item label="免费对话限制">{{ selectedUser.maxFreeChats }}</el-descriptions-item>
          <el-descriptions-item label="剩余对话次数">{{ selectedUser.remainingChats }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ selectedUser.registerTime }}</el-descriptions-item>
          <el-descriptions-item label="最后活跃">{{ selectedUser.lastActiveTime }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="user-stats" style="margin-top: 20px;">
          <h4>用户统计</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ userStats.totalChats }}</div>
                <div class="stat-label">总对话数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ userStats.totalMessages }}</div>
                <div class="stat-label">总消息数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ userStats.collectedMessages }}</div>
                <div class="stat-label">收藏消息数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ userStats.activeDays }}</div>
                <div class="stat-label">活跃天数</div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div class="recent-activity" style="margin-top: 20px;">
          <h4>最近活动</h4>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
    
    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑用户"
      width="500px"
    >
      <el-form :model="userForm" :rules="rules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="userForm.userType">
            <el-option label="普通用户" value="normal" />
            <el-option label="VIP用户" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="免费对话限制" prop="maxFreeChats">
          <el-input-number v-model="userForm.maxFreeChats" :min="0" :max="1000" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi } from '@/api'

const loading = ref(false)
const searchKeyword = ref('')
const userType = ref('')
const dateRange = ref([])
const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const selectedUser = ref(null)
const isEdit = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 用户列表数据
const userList = ref([])

const userForm = reactive({
  id: '',
  username: '',
  email: '',
  userType: 'normal',
  maxFreeChats: 10
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  userType: [{ required: true, message: '请选择用户类型', trigger: 'change' }]
}

const userStats = ref({
  totalChats: 0,
  totalMessages: 0,
  collectedMessages: 0,
  activeDays: 0
})

const recentActivities = ref([
  {
    id: 1,
    content: '发送了语音消息',
    time: '2024-01-15 16:20:00'
  },
  {
    id: 2,
    content: '收藏了一条消息',
    time: '2024-01-15 15:30:00'
  },
  {
    id: 3,
    content: '查看了广州地区信息',
    time: '2024-01-15 14:45:00'
  }
])

const handleSearch = () => {
  loadUsers()
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 添加搜索条件
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (userType.value) {
      params.userType = userType.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    
    const response = await userApi.getUserList(params)
    
    if (response.code === 200) {
      userList.value = response.data.users || []
      total.value = response.data.total || 0
    } else {
      ElMessage.error(response.message || '加载用户列表失败')
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchKeyword.value = ''
  userType.value = ''
  dateRange.value = []
  currentPage.value = 1
  loadUsers()
}

const viewUser = async (user) => {
  try {
    const response = await userApi.getUserDetail(user.id)
    
    if (response.code === 200) {
      selectedUser.value = response.data
      
      // 设置统计数据
      userStats.value = {
        totalChats: response.data.totalChats || 0,
        totalMessages: response.data.totalMessages || 0,
        collectedMessages: response.data.collectedMessages || 0,
        activeDays: response.data.activeDays || 0
      }
      
      showDetailDialog.value = true
    } else {
      ElMessage.error(response.message || '获取用户详情失败')
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  }
}

const editUser = (user) => {
  isEdit.value = true
  Object.assign(userForm, user)
  showEditDialog.value = true
}

const saveUser = async () => {
  try {
    const response = await userApi.updateUser(userForm.id, {
      username: userForm.username,
      email: userForm.email,
      userType: userForm.userType,
      maxFreeChats: userForm.maxFreeChats
    })
    
    if (response.code === 200) {
      ElMessage.success('更新成功')
      showEditDialog.value = false
      // 重新加载用户列表
      loadUsers()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新用户失败:', error)
    ElMessage.error('更新失败')
  }
}

const resetChatCount = async (user) => {
  try {
    await ElMessageBox.confirm('确定要重置该用户的对话次数吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await userApi.resetChatCount(user.id)
    
    if (response.code === 200) {
      ElMessage.success('重置成功')
      // 重新加载用户列表
      loadUsers()
    } else {
      ElMessage.error(response.message || '重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置对话次数失败:', error)
      ElMessage.error('重置失败')
    }
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadUsers()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
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

.user-detail {
  padding: 10px 0;
}

.user-stats {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.recent-activity {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
