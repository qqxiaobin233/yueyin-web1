<template>
  <div class="game-question-import">
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

          <el-dropdown trigger="click" @command="handleTtsCommand">
            <el-button type="success" :loading="ttsLoading">
              生成音频<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="missing_all">按筛选生成</el-dropdown-item>
                <el-dropdown-item command="missing_selected">按选择生成</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click" @command="handleRegenCommand">
            <el-button type="warning" :loading="regenLoading">
              重新生成音频<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="regen_all">按筛选生成</el-dropdown-item>
                <el-dropdown-item command="regen_selected">按选择生成</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button type="danger" :loading="deleteLoading" @click="handleDeleteSelected">删除选中题目</el-button>
        </div>

        <div class="toolbar-right">
          <el-select v-model="filters.sceneId" placeholder="场景" clearable style="width: 160px" @change="handleFilterChange">
            <el-option
              v-for="s in scenes"
              :key="s.id"
              :label="`${s.sceneIndex || ''} ${s.title || ''}`.trim()"
              :value="s.id"
            />
          </el-select>

          <el-select v-model="filters.levelNo" placeholder="关卡" clearable style="width: 140px" @change="handleFilterChange">
            <el-option label="第1关" :value="1" />
            <el-option label="第2关" :value="2" />
            <el-option label="第3关" :value="3" />
          </el-select>

          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-alert
        title="Excel表头要求：场景ID | 关卡号 | 题型 | 题干中文 | 题干粤语 | 选项JSON | 正确答案 | 需要TTS"
        type="info"
        show-icon
        :closable="false"
      />
      <el-alert
        :title="'题型为数字 1-6；选项JSON 为数组字符串，如：[A,B] 或 [{key:A,text:...}]；需要TTS：1/0'"
        type="warning"
        show-icon
        :closable="false"
        style="margin-top: 10px"
      />

      <div style="margin-top: 14px">
        <el-table :data="lastImport.errors" v-if="lastImport.errors.length" border>
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
        <el-table-column prop="levelNo" label="关卡" width="70" />
        <el-table-column prop="questionType" label="题型" width="70" />
        <el-table-column prop="stemZh" label="题干中文" min-width="200" show-overflow-tooltip />
        <el-table-column prop="stemYue" label="题干粤语" min-width="200" show-overflow-tooltip />
        <el-table-column prop="audioOssUrl" label="题干音频" min-width="180" show-overflow-tooltip />
        <el-table-column prop="imageUrlsJson" label="图片" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.questionType === 1"
              size="small"
              type="primary"
              :loading="uploadingRowId === scope.row.id"
              @click="openImageUploadDialog(scope.row)"
            >
              上传图片
            </el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="imageUploadDialogVisible" title="题型1：按选项上传图片" width="720px">
      <div v-if="imageUploadRow" class="img-upload-dialog">
        <div class="img-upload-grid">
          <div v-for="slot in imageUploadSlots" :key="slot.key" class="img-upload-slot">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="(file) => handleSingleSlotImageChange(file, slot.key)"
            >
              <div class="img-upload-box">
                <div v-if="imageUploadUrls[slot.key]" class="img-preview">
                  <img :src="imageUploadUrls[slot.key]" />
                </div>
                <div v-else class="img-plus">+</div>
              </div>
            </el-upload>
            <div class="img-upload-meta">
              <div class="img-upload-key">选项{{ slot.key }}</div>
              <div class="img-upload-text">{{ slot.text }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="imageUploadDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { gameAdminApi, uploadApi } from '@/api'

const EXPECTED_HEADERS = ['场景ID', '关卡号', '题型', '题干中文', '题干粤语', '选项JSON', '正确答案', '需要TTS']

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

const uploadingRowId = ref(null)
const selectedRows = ref([])

const imageUploadDialogVisible = ref(false)
const imageUploadRow = ref(null)
const imageUploadSlots = ref([])
const imageUploadUrls = reactive({ A: '', B: '', C: '', D: '' })

const onSelectionChange = (rows) => {
  selectedRows.value = Array.isArray(rows) ? rows : []
}

const handleTtsCommand = (cmd) => {
  if (cmd === 'missing_all') return handleBatchTts()
  if (cmd === 'missing_selected') return handleSelectedBatchTts()
}

const handleRegenCommand = (cmd) => {
  if (cmd === 'regen_all') return handleRegenerateTts()
  if (cmd === 'regen_selected') return handleSelectedRegenerateTts()
}

const handleDeleteSelected = async () => {
  const ids = getSelectedQuestionIds()
  if (!ids.length) {
    ElMessage.warning('请先勾选题目')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${ids.length} 道题目？删除后可重新导入并重新生成音频。`,
      '批量删除题目',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  deleteLoading.value = true
  try {
    const res = await gameAdminApi.deleteGameQuestionsByIds({ questionIds: ids })
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

const safeJsonParse = (s, fallback) => {
  try {
    const v = JSON.parse(s)
    return v == null ? fallback : v
  } catch (e) {
    return fallback
  }
}

const normalizeOptionText = (opt) => {
  if (!opt) return ''
  if (typeof opt === 'string' || typeof opt === 'number') return String(opt)
  if (typeof opt === 'object') return String(opt.zh || opt.text || opt.yue || opt.label || opt.name || '')
  return ''
}

const openImageUploadDialog = (row) => {
  if (!row?.id) return
  imageUploadRow.value = row

  const optionsArr = safeJsonParse(row.optionsJson || '[]', [])
  const opts = Array.isArray(optionsArr) ? optionsArr : []
  const keys = ['A', 'B', 'C', 'D']
  imageUploadSlots.value = keys.map((k, idx) => {
    const opt = opts.find(o => String(o?.key || '').toUpperCase() === k) || opts[idx]
    return { key: k, text: normalizeOptionText(opt) }
  })

  const urlsArr = safeJsonParse(row.imageUrlsJson || '[]', [])
  const urls = Array.isArray(urlsArr) ? urlsArr.map(u => String(u || '')) : []
  imageUploadUrls.A = urls[0] || ''
  imageUploadUrls.B = urls[1] || ''
  imageUploadUrls.C = urls[2] || ''
  imageUploadUrls.D = urls[3] || ''

  imageUploadDialogVisible.value = true
}

const persistImageUrlsForRow = async () => {
  const row = imageUploadRow.value
  if (!row?.id) return
  const json = JSON.stringify([imageUploadUrls.A || '', imageUploadUrls.B || '', imageUploadUrls.C || '', imageUploadUrls.D || ''])
  const up = await gameAdminApi.updateQuestionImageUrls({ questionId: row.id, imageUrlsJson: json })
  if (up?.code !== 200) throw new Error(up?.message || '写回失败')
  row.imageUrlsJson = json
}

const handleSingleSlotImageChange = async (uploadFile, key) => {
  const row = imageUploadRow.value
  if (!row?.id) return
  if (!['A', 'B', 'C', 'D'].includes(String(key))) return
  const raw = uploadFile?.raw
  if (!raw) return

  try {
    uploadingRowId.value = row.id
    const fd = new FormData()
    fd.append('image', raw)
    const res = await uploadApi.uploadImage(fd)
    const url = res?.data?.imageUrl || res?.imageUrl
    if (!url) throw new Error('上传图片失败：未返回URL')
    imageUploadUrls[key] = url
    await persistImageUrlsForRow()
    ElMessage.success(`已上传并保存：选项${key}`)
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    uploadingRowId.value = null
  }
}

const filters = reactive({
  sceneId: null,
  levelNo: null
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

const handleRowImageChange = async (uploadFile, uploadFiles, row) => {
  if (!row?.id) return

  try {
    uploadingRowId.value = row.id

    const files = Array.isArray(uploadFiles) ? uploadFiles : []
    const raws = files.map(f => f?.raw).filter(Boolean)
    if (raws.length !== 4) {
      ElMessage.info('请一次选择4张图片（按A/B/C/D顺序选择），选择满4张后会自动上传并覆盖保存')
      return
    }

    const urls = []
    for (const f of raws) {
      const fd = new FormData()
      fd.append('image', f)
      const res = await uploadApi.uploadImage(fd)
      const url = res?.data?.imageUrl || res?.imageUrl
      if (!url) throw new Error('上传图片失败：未返回URL')
      urls.push(url)
    }

    // 覆盖保存：按上传顺序写回，避免追加导致“图片-文字错位”
    const json = JSON.stringify(urls.slice(0, 4))

    const up = await gameAdminApi.updateQuestionImageUrls({ questionId: row.id, imageUrlsJson: json })
    if (up?.code !== 200) throw new Error(up?.message || '写回失败')

    row.imageUrlsJson = json
    ElMessage.success('已上传并覆盖保存 4/4 张')
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    uploadingRowId.value = null
  }
}

const getSelectedQuestionIds = () => {
  const rows = selectedRows.value || []
  return rows.map(r => r?.id).filter(Boolean)
}

const handleSelectedBatchTts = async () => {
  const ids = getSelectedQuestionIds()
  if (!ids.length) {
    ElMessage.warning('请先勾选题目')
    return
  }
  ttsLoading.value = true
  try {
    const res = await gameAdminApi.batchGenerateGameQuestionAudioByIds({ questionIds: ids, onlyMissing: true })
    if (res?.code !== 200) throw new Error(res?.message || '生成失败')
    const data = res.data || {}
    ElMessage.success(`生成完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)
    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '生成失败明细', { confirmButtonText: '知道了', type: 'warning' })
    }
    await loadTable()
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  } finally {
    ttsLoading.value = false
  }
}

const handleSelectedRegenerateTts = async () => {
  const ids = getSelectedQuestionIds()
  if (!ids.length) {
    ElMessage.warning('请先勾选题目')
    return
  }
  try {
    await ElMessageBox.confirm(
      '该操作会删除OSS中的旧音频，并按当前TTS配置重新生成并覆盖数据库音频URL。确认继续？',
      '重新生成选中题目音频',
      { type: 'warning', confirmButtonText: '继续', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }

  regenLoading.value = true
  try {
    const res = await gameAdminApi.regenerateGameQuestionAudioByIds({ questionIds: ids })
    if (res?.code !== 200) throw new Error(res?.message || '重新生成失败')
    const data = res.data || {}
    ElMessage.success(`重新生成完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)
    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '重新生成失败明细', { confirmButtonText: '知道了', type: 'warning' })
    }
    await loadTable()
  } catch (e) {
    ElMessage.error(e.message || '重新生成失败')
  } finally {
    regenLoading.value = false
  }
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

const loadTable = async () => {
  loading.value = true
  try {
    const res = await gameAdminApi.pageGameQuestions({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sceneId: filters.sceneId || undefined,
      levelNo: filters.levelNo || undefined
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

const resetFilters = () => {
  filters.sceneId = null
  filters.levelNo = null
  pagination.page = 1
  loadTable()
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

    const res = await gameAdminApi.importGameQuestions(formData)
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
    const res = await gameAdminApi.batchGenerateGameQuestionAudio({
      sceneId: filters.sceneId || undefined,
      levelNo: filters.levelNo || undefined,
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
    const res = await gameAdminApi.regenerateGameQuestionAudio({
      sceneId: filters.sceneId || undefined,
      levelNo: filters.levelNo || undefined
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
.game-question-import {
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

.img-upload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.img-upload-slot {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 12px;
}

.img-upload-box {
  width: 100%;
  height: 180px;
  border: 1px dashed #cfcfcf;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fafafa;
}

.img-plus {
  font-size: 44px;
  color: #999;
  line-height: 1;
}

.img-preview {
  width: 100%;
  height: 100%;
}

.img-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-upload-meta {
  margin-top: 10px;
}

.img-upload-key {
  font-weight: 700;
  color: #333;
}

.img-upload-text {
  margin-top: 4px;
  color: #666;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-all;
}
</style>
