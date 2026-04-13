<template>
  <div class="asset-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资源图片管理</span>
          <el-button type="primary" @click="showUploadDialog = true">
            <el-icon><Plus /></el-icon>
            上传图片
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件名或描述"
          style="width: 300px; margin-right: 10px;"
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedCategory"
          placeholder="选择分类"
          style="width: 200px; margin-right: 10px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="启动页" value="启动页" />
          <el-option label="首页" value="首页" />
          <el-option label="游戏介绍界面" value="游戏介绍界面" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-button @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
      
      <!-- 图片列表 -->
      <el-table :data="imageList" style="width: 100%" v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="预览" width="120">
          <template #default="scope">
            <el-image
              v-if="String(scope.row.contentType || '').startsWith('image/')"
              :src="scope.row.fileUrl"
              :preview-src-list="[scope.row.fileUrl]"
              fit="cover"
              style="width: 100px; height: 100px; cursor: pointer;"
              :lazy="true"
            />
            <el-link v-else :href="scope.row.fileUrl" target="_blank" type="primary">下载</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="originalName" label="文件名" width="200" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="scope">
            <el-tag>{{ scope.row.category || 'other' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="fileSize" label="文件大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" :fixed="isMobile ? false : 'right'">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editImage(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteImage(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 上传图片对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传图片"
      width="600px"
      @close="resetUploadForm"
    >
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px">
        <el-form-item label="选择图片" prop="file">
          <el-upload
            class="image-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept="image/*,.glb"
            drag
          >
            <img v-if="uploadForm.previewUrl" :src="uploadForm.previewUrl" class="image-preview" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
            <div class="upload-tip">点击或拖拽图片到此处上传</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="uploadForm.category" placeholder="请选择分类" style="width: 100%;">
            <el-option label="启动页" value="启动页" />
            <el-option label="首页" value="首页" />
            <el-option label="游戏介绍界面" value="游戏介绍界面" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入图片描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑图片对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑图片信息"
      width="600px"
      @close="resetEditForm"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="预览">
          <el-image
            v-if="String(editForm.contentType || '').startsWith('image/')"
            :src="editForm.fileUrl"
            fit="cover"
            style="width: 200px; height: 200px;"
          />
          <el-link v-else :href="editForm.fileUrl" target="_blank" type="primary">下载</el-link>
        </el-form-item>
        <el-form-item label="替换图片">
          <el-upload
            class="image-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleEditFileChange"
            :before-upload="beforeUpload"
            accept="image/*,.glb"
            drag
          >
            <img v-if="editForm.previewUrl" :src="editForm.previewUrl" class="image-preview" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
            <div class="upload-tip">点击或拖拽图片到此处替换</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="editForm.originalName" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择分类" style="width: 100%;">
            <el-option label="启动页" value="启动页" />
            <el-option label="首页" value="首页" />
            <el-option label="游戏介绍界面" value="游戏介绍界面" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入图片描述"
          />
        </el-form-item>

        <el-form-item v-if="isEditingGlb" label="3D展示配置">
          <el-collapse v-model="glbPanelOpen">
            <el-collapse-item name="glb" title="3D展示配置">
              <el-form label-width="140px">
                <el-form-item label="左偏移 model_left (rpx)">
                  <el-slider v-model="glbConfig.model_left" :min="-200" :max="400" :step="1" show-input />
                </el-form-item>
                <el-form-item label="下偏移 model_bottom (rpx)">
                  <el-slider v-model="glbConfig.model_bottom" :min="-200" :max="400" :step="1" show-input />
                </el-form-item>
                <el-form-item label="初始旋转 model_rotation (度)">
                  <el-slider v-model="glbConfig.model_rotation" :min="-180" :max="180" :step="1" show-input />
                </el-form-item>
                <el-form-item label="亮度 model_brightness">
                  <el-slider v-model="glbConfig.model_brightness" :min="0.1" :max="2.0" :step="0.1" show-input />
                </el-form-item>

                <el-form-item>
                  <el-button @click="resetGlbConfig">重置默认值</el-button>
                  <el-button type="primary" :loading="glbSaving" @click="saveGlbConfig">保存3D配置</el-button>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="updating">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { assetApi, glbConfigApi } from '@/api'

const loading = ref(false)
const uploading = ref(false)
const updating = ref(false)
const showUploadDialog = ref(false)
const showEditDialog = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('')

const imageList = ref([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const isMobile = ref(false)

const updateIsMobile = () => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
}

const isEditingGlb = ref(false)
const glbPanelOpen = ref([])
const glbSaving = ref(false)
const glbConfig = ref({
  model_left: 20,
  model_bottom: 30,
  model_rotation: 0,
  model_brightness: 0.8
})

const resetGlbConfig = () => {
  glbConfig.value = {
    model_left: 20,
    model_bottom: 30,
    model_rotation: 0,
    model_brightness: 0.8
  }
}

const loadGlbConfig = async (assetImageId) => {
  if (!assetImageId) return
  try {
    const res = await glbConfigApi.getByAssetImageId(assetImageId)
    if (res.code === 200 && res.data) {
      glbConfig.value = {
        model_left: res.data.modelLeft ?? 20,
        model_bottom: res.data.modelBottom ?? 30,
        model_rotation: res.data.modelRotation ?? 0,
        model_brightness: res.data.modelBrightness ?? 0.8
      }
    } else {
      resetGlbConfig()
    }
  } catch (e) {
    resetGlbConfig()
  }
}

const saveGlbConfig = async () => {
  if (!editForm.value.id) return
  glbSaving.value = true
  try {
    const payload = {
      modelLeft: glbConfig.value.model_left,
      modelBottom: glbConfig.value.model_bottom,
      modelRotation: glbConfig.value.model_rotation,
      modelBrightness: glbConfig.value.model_brightness
    }
    const res = await glbConfigApi.saveByAssetImageId(editForm.value.id, payload)
    if (res.code === 200) {
      ElMessage.success('3D配置已保存')
      await loadGlbConfig(editForm.value.id)
    } else {
      ElMessage.error(res.msg || res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    glbSaving.value = false
  }
}

const uploadForm = ref({
  file: null,
  previewUrl: '',
  category: '',
  description: ''
})

const editForm = ref({
  id: null,
  originalName: '',
  fileUrl: '',
  contentType: '',
  file: null,
  previewUrl: '',
  category: '',
  description: ''
})

const uploadFormRef = ref(null)
const editFormRef = ref(null)

const uploadRules = {
  file: [{ required: true, message: '请选择图片文件', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const editRules = {
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const resetEditForm = () => {
  editForm.value.file = null
  editForm.value.previewUrl = ''
  isEditingGlb.value = false
  glbPanelOpen.value = []
  if (editFormRef.value) {
    editFormRef.value.clearValidate()
  }
}

// 编辑替换文件选择
const handleEditFileChange = (file) => {
  editForm.value.file = file.raw
  if (file?.raw?.type && String(file.raw.type).startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      editForm.value.previewUrl = e.target.result
      // 预览图优先展示替换后的
      editForm.value.fileUrl = e.target.result
      editForm.value.contentType = file.raw.type
    }
    reader.readAsDataURL(file.raw)
  } else {
    editForm.value.previewUrl = ''
    editForm.value.contentType = file?.raw?.type || 'model/gltf-binary'
  }
}

// 加载图片列表
const loadImageList = async () => {
  loading.value = true
  try {
    const response = await assetApi.getImageList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      category: selectedCategory.value || undefined,
      keyword: searchKeyword.value || undefined
    })
    
    if (response.code === 200) {
      imageList.value = response.data.records || []
      pagination.value.total = response.data.total || 0
    } else {
      ElMessage.error(response.msg || '加载图片列表失败')
    }
  } catch (error) {
    console.error('加载图片列表失败:', error)
    ElMessage.error('加载图片列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadImageList()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  selectedCategory.value = ''
  handleSearch()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadImageList()
}

// 页码改变
const handlePageChange = (page) => {
  pagination.value.page = page
  loadImageList()
}

// 文件选择
const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  if (file?.raw?.type && String(file.raw.type).startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadForm.value.previewUrl = e.target.result
    }
    reader.readAsDataURL(file.raw)
  } else {
    uploadForm.value.previewUrl = ''
  }
}

// 上传前验证
const beforeUpload = (file) => {
  const name = String(file?.name || '').toLowerCase()
  const isGlb = name.endsWith('.glb')
  const isImage = file.type && String(file.type).startsWith('image/')
  const isAllowed = isImage || isGlb

  if (!isAllowed) {
    ElMessage.error('只能上传图片或glb文件!')
    return false
  }

  const maxMb = isGlb ? 50 : 10
  const isLtMax = file.size / 1024 / 1024 < maxMb
  if (!isLtMax) {
    ElMessage.error(`文件大小不能超过 ${maxMb}MB!`)
    return false
  }
  return false // 阻止自动上传
}

// 上传图片
const handleUpload = async () => {
  if (!uploadFormRef.value) return
  
  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (!uploadForm.value.file) {
      ElMessage.error('请选择图片文件')
      return
    }
    
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.value.file)
      if (uploadForm.value.category) {
        formData.append('category', uploadForm.value.category)
      }
      if (uploadForm.value.description) {
        formData.append('description', uploadForm.value.description)
      }
      
      const response = await assetApi.uploadImage(formData)
      
      if (response.code === 200) {
        ElMessage.success('上传成功')
        showUploadDialog.value = false
        resetUploadForm()
        loadImageList()
      } else {
        ElMessage.error(response.msg || '上传失败')
      }
    } catch (error) {
      console.error('上传图片失败:', error)
      ElMessage.error('上传失败')
    } finally {
      uploading.value = false
    }
  })
}

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.value = {
    file: null,
    previewUrl: '',
    category: '',
    description: ''
  }
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
}

// 编辑图片
const editImage = (row) => {
  editForm.value = {
    id: row.id,
    originalName: row.originalName,
    fileUrl: row.fileUrl,
    contentType: row.contentType,
    file: null,
    previewUrl: '',
    category: row.category || '',
    description: row.description || ''
  }

  const name = String(row.originalName || '').toLowerCase()
  const ct = String(row.contentType || '').toLowerCase()
  isEditingGlb.value = name.endsWith('.glb') || ct === 'model/gltf-binary'
  glbPanelOpen.value = isEditingGlb.value ? ['glb'] : []
  if (isEditingGlb.value) {
    loadGlbConfig(row.id)
  }
  showEditDialog.value = true
}

// 更新图片信息
const handleUpdate = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    updating.value = true
    try {
      const params = {}
      if (editForm.value.originalName) {
        params.originalName = editForm.value.originalName
      }
      if (editForm.value.category) {
        params.category = editForm.value.category
      }
      if (editForm.value.description !== undefined) {
        params.description = editForm.value.description
      }

      // 先更新文字信息
      const response = await assetApi.updateImage(editForm.value.id, params)
      if (response.code !== 200) {
        ElMessage.error(response.msg || '更新失败')
        return
      }

      // 如选择了替换图片，则调用替换接口（后端会删旧OSS+更新DB）
      if (editForm.value.file) {
        const fd = new FormData()
        fd.append('file', editForm.value.file)
        if (editForm.value.originalName) fd.append('originalName', editForm.value.originalName)
        if (editForm.value.category) fd.append('category', editForm.value.category)
        if (editForm.value.description !== undefined) fd.append('description', editForm.value.description)

        const rep = await assetApi.replaceImage(editForm.value.id, fd)
        if (rep.code !== 200) {
          ElMessage.error(rep.msg || '替换失败')
          return
        }
      }
      
      ElMessage.success('更新成功')
      showEditDialog.value = false
      loadImageList()
    } catch (error) {
      console.error('更新图片信息失败:', error)
      ElMessage.error('更新失败')
    } finally {
      updating.value = false
    }
  })
}

// 删除图片
const deleteImage = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除图片 "${row.originalName}" 吗？此操作将同时删除OSS中的文件，且不可恢复！`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await assetApi.deleteImage(row.id)
    
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadImageList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除图片失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  loadImageList()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<style scoped>
.asset-management {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .search-bar {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    gap: 10px;
    padding-bottom: 2px;
  }

  .search-bar :deep(.el-input),
  .search-bar :deep(.el-select),
  .search-bar :deep(.el-button) {
    flex-shrink: 0;
  }
}

.image-uploader {
  width: 100%;
}

.image-uploader :deep(.el-upload) {
  width: 100%;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.image-uploader :deep(.el-upload:hover) {
  border-color: #409EFF;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.image-preview {
  width: 100%;
  height: 178px;
  object-fit: cover;
  display: block;
}

.upload-tip {
  text-align: center;
  color: #606266;
  font-size: 12px;
  margin-top: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

