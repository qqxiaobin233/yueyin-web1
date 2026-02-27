<template>
  <div class="game-scene-dialog-import">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
          >
            <el-button type="primary" :loading="importing">上传.xlsx并导入</el-button>
          </el-upload>

          <el-button type="success" :loading="ttsLoading" @click="handleBatchTts">批量生成音频</el-button>

          <el-button type="warning" :loading="regenLoading" @click="handleRegenerateTts">重新生成音频</el-button>

          <el-button type="danger" :loading="deleteLoading" @click="handleDeleteSelected">删除选中</el-button>
        </div>

        <div class="toolbar-right">
          <el-select v-model="filters.sceneId" placeholder="场景" clearable style="width: 180px" @change="handleFilterChange">
            <el-option
              v-for="s in scenes"
              :key="s.id"
              :label="`${s.sceneIndex || ''} ${s.title || ''}`.trim()"
              :value="s.id"
            />
          </el-select>

          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-alert title="Excel表头要求：场景ID | 排序号 | 粤语 | 中文" type="info" show-icon :closable="false" />
      <el-alert
        title="导入策略：同一场景 + 同一排序号，若已存在则更新文本并清空音频URL（避免音频与文本不一致）。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-top: 10px"
      />

      <div style="margin-top: 14px" v-if="lastImport.failCount">
        <el-table :data="lastImport.errors" border>
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="msg" label="导入失败明细" />
        </el-table>
      </div>
    </el-card>

    <el-card style="margin-top: 16px">
      <el-table :data="tableData" v-loading="loading" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="sceneId" label="场景ID" width="90" />
        <el-table-column prop="sortNo" label="排序号" width="80" />
        <el-table-column prop="yueText" label="粤语" min-width="260" show-overflow-tooltip />
        <el-table-column prop="zhText" label="中文" min-width="220" show-overflow-tooltip />
        <el-table-column prop="audioOssUrl" label="音频" min-width="180" show-overflow-tooltip />
      </el-table>

      <div class="pagination">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { gameAdminApi } from '@/api'

const EXPECTED_HEADERS = ['场景ID', '排序号', '粤语', '中文']

const scenes = ref([])

const loading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const importing = ref(false)
const ttsLoading = ref(false)
const regenLoading = ref(false)
const deleteLoading = ref(false)

const selectedRows = ref([])

const onSelectionChange = (rows) => {
  selectedRows.value = Array.isArray(rows) ? rows : []
}

const getSelectedDialogIds = () => {
  const rows = selectedRows.value || []
  return rows.map(r => r?.id).filter(Boolean)
}

const handleDeleteSelected = async () => {
  const ids = getSelectedDialogIds()
  if (!ids.length) {
    ElMessage.warning('请先勾选记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${ids.length} 条场景对话？`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  deleteLoading.value = true
  try {
    const res = await gameAdminApi.deleteSceneDialogsByIds({ dialogIds: ids })
    if (res?.code !== 200) throw new Error(res?.message || '删除失败')
    ElMessage.success('删除成功')
    pagination.page = 1
    await loadTable()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}

const filters = reactive({
  sceneId: null
})

const lastImport = reactive({
  total: 0,
  successCount: 0,
  failCount: 0,
  errors: []
})

const normalizeHeader = input => {
  if (input === null || input === undefined) return ''
  let s = String(input)
  s = s.replace(/\uFEFF/g, '')
  s = s.replace(/\u200B/g, '')
  s = s.replace(/\u00A0/g, ' ')
  s = s.replace(/\u3000/g, ' ')
  s = s.trim()
  s = s.replace(/\s+/g, '')
  return s
}

const validateXlsxHeaders = async file => {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', codepage: 936 })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
  const headerRow = rows?.[0] || []
  const headers = EXPECTED_HEADERS.map((_, idx) => (headerRow[idx] || '').toString())
  const expectedNormalized = EXPECTED_HEADERS.map(h => normalizeHeader(h))
  const actualNormalized = headers.map(h => normalizeHeader(h))
  const ok = JSON.stringify(actualNormalized) === JSON.stringify(expectedNormalized)
  return { ok, headers }
}

const loadScenes = async () => {
  try {
    const res = await gameAdminApi.listScenes()
    if (res?.code !== 200) throw new Error(res?.message || '获取场景失败')
    scenes.value = res.data || []
  } catch (e) {
    // ignore
  }
}

const resetFilters = () => {
  filters.sceneId = null
  pagination.page = 1
  loadTable()
}

const handleFilterChange = () => {
  pagination.page = 1
  loadTable()
}

const handlePageSizeChange = size => {
  pagination.pageSize = size
  pagination.page = 1
  loadTable()
}

const handleCurrentPageChange = page => {
  pagination.page = page
  loadTable()
}

const loadTable = async () => {
  loading.value = true
  try {
    const res = await gameAdminApi.pageSceneDialogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sceneId: filters.sceneId || undefined
    })
    if (res?.code !== 200) throw new Error(res?.message || '查询失败')

    pagination.total = res.data?.total || 0
    tableData.value = res.data?.records || []
  } catch (e) {
    ElMessage.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}

const handleFileChange = async uploadFile => {
  const file = uploadFile?.raw
  if (!file) return

  const lowerName = (file.name || '').toLowerCase()
  if (!(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))) {
    ElMessage.warning('请上传.xlsx或.xls文件')
    return
  }

  importing.value = true
  lastImport.total = 0
  lastImport.successCount = 0
  lastImport.failCount = 0
  lastImport.errors = []

  try {
    const check = await validateXlsxHeaders(file)
    if (!check.ok) {
      const actual = (check.headers || []).join(' | ')
      try {
        await ElMessageBox.confirm(
          `表头校验未通过。\n\n要求表头：\n${EXPECTED_HEADERS.join(' | ')}\n\n实际读取到的表头：\n${actual}\n\n你可以选择“继续导入”，由后端进行最终校验。`,
          '表头校验提示',
          { confirmButtonText: '继续导入', cancelButtonText: '取消', type: 'warning' }
        )
      } catch (e) {
        return
      }
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await gameAdminApi.importSceneDialogs(formData)
    if (res?.code !== 200) throw new Error(res?.message || '导入失败')

    const data = res.data || {}
    lastImport.total = data.total || 0
    lastImport.successCount = data.successCount || 0
    lastImport.failCount = data.failCount || 0
    lastImport.errors = (data.errors || []).map(msg => ({ msg }))

    ElMessage.success(`导入完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)

    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '导入失败明细', { confirmButtonText: '知道了', type: 'warning' })
    }

    pagination.page = 1
    await loadTable()
  } catch (e) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const handleBatchTts = async () => {
  ttsLoading.value = true
  try {
    const res = await gameAdminApi.batchGenerateSceneDialogAudio({
      sceneId: filters.sceneId || undefined,
      onlyMissing: true
    })
    if (res?.code !== 200) throw new Error(res?.message || '生成失败')

    const data = res.data || {}
    ElMessage.success(`生成完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)
    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '生成失败明细', { confirmButtonText: '知道了', type: 'warning' })
    }
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  } finally {
    ttsLoading.value = false
  }
}

const handleRegenerateTts = async () => {
  try {
    await ElMessageBox.confirm(
      '该操作会删除OSS中的旧音频，并按当前TTS配置重新生成并覆盖数据库音频URL。确认继续？',
      '重新生成音频',
      { type: 'warning', confirmButtonText: '继续', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  regenLoading.value = true
  try {
    const res = await gameAdminApi.regenerateSceneDialogAudio({
      sceneId: filters.sceneId || undefined
    })
    if (res?.code !== 200) throw new Error(res?.message || '重新生成失败')

    const data = res.data || {}
    ElMessage.success(`重新生成完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)
    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '重新生成失败明细', { confirmButtonText: '知道了', type: 'warning' })
    }
  } catch (e) {
    ElMessage.error(e.message || '重新生成失败')
  } finally {
    regenLoading.value = false
  }
}

onMounted(() => {
  loadScenes()
  loadTable()
})
</script>

<style scoped>
.game-scene-dialog-import {
  padding: 0;
}

.toolbar-card {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
