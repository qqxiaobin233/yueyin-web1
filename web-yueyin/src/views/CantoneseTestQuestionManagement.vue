<template>
  <div class="cantonese-question-management">
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

          <el-button
            type="success"
            :loading="ttsLoading"
            @click="handleBatchTts"
          >
            批量生成音频
          </el-button>

          <el-button
            type="warning"
            :loading="regenLoading"
            @click="handleRegenerateTts"
          >
            重新生成音频
          </el-button>
        </div>

        <div class="toolbar-right">
          <el-select v-model="filters.level" placeholder="等级" clearable style="width: 140px" @change="loadData">
            <el-option label="定级测试" value="定级测试" />
            <el-option label="Level1" value="Level1" />
            <el-option label="Level2" value="Level2" />
            <el-option label="Level3" value="Level3" />
            <el-option label="Level4" value="Level4" />
          </el-select>

          <el-select v-model="filters.questionType" placeholder="题型" clearable style="width: 140px" @change="loadData">
            <el-option label="听力" value="听力" />
            <el-option label="词汇" value="词汇" />
            <el-option label="语法" value="语法" />
            <el-option label="口语" value="口语" />
            <el-option label="文化" value="文化" />
          </el-select>

          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="sourceQuestionId" label="题目ID" width="120" />
        <el-table-column prop="level" label="等级" width="90" />
        <el-table-column prop="questionType" label="题型" width="90" />
        <el-table-column prop="questionText" label="题目文本" min-width="260" show-overflow-tooltip />

        <el-table-column label="音频状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.questionType !== '听力'" type="info">非听力</el-tag>
            <el-tag v-else-if="scope.row.audioOssUrl" type="success">已生成</el-tag>
            <el-tag v-else type="warning">未生成</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openView(scope.row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog v-model="viewDialog.visible" title="题目详情" width="720px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ viewDialog.data?.id }}</el-descriptions-item>
        <el-descriptions-item label="题目ID">{{ viewDialog.data?.sourceQuestionId }}</el-descriptions-item>
        <el-descriptions-item label="等级">{{ viewDialog.data?.level }}</el-descriptions-item>
        <el-descriptions-item label="题型">{{ viewDialog.data?.questionType }}</el-descriptions-item>
        <el-descriptions-item label="题目文本">{{ viewDialog.data?.questionText }}</el-descriptions-item>
        <el-descriptions-item label="选项A">{{ viewDialog.data?.optionA }}</el-descriptions-item>
        <el-descriptions-item label="选项B">{{ viewDialog.data?.optionB }}</el-descriptions-item>
        <el-descriptions-item label="选项C">{{ viewDialog.data?.optionC }}</el-descriptions-item>
        <el-descriptions-item label="选项D">{{ viewDialog.data?.optionD }}</el-descriptions-item>
        <el-descriptions-item label="正确答案">{{ viewDialog.data?.correctAnswer }}</el-descriptions-item>
        <el-descriptions-item label="音频URL">{{ viewDialog.data?.audioOssUrl }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="editDialog.visible" title="编辑题目" width="720px">
      <el-form :model="editDialog.form" label-width="90px">
        <el-form-item label="等级">
          <el-select v-model="editDialog.form.level" placeholder="等级" style="width: 200px">
            <el-option label="定级测试" value="定级测试" />
            <el-option label="Level1" value="Level1" />
            <el-option label="Level2" value="Level2" />
            <el-option label="Level3" value="Level3" />
            <el-option label="Level4" value="Level4" />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="editDialog.form.questionType" placeholder="题型" style="width: 200px">
            <el-option label="听力" value="听力" />
            <el-option label="词汇" value="词汇" />
            <el-option label="语法" value="语法" />
            <el-option label="口语" value="口语" />
            <el-option label="文化" value="文化" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目文本">
          <el-input v-model="editDialog.form.questionText" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="选项A">
          <el-input v-model="editDialog.form.optionA" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="选项B">
          <el-input v-model="editDialog.form.optionB" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="选项C">
          <el-input v-model="editDialog.form.optionC" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="选项D">
          <el-input v-model="editDialog.form.optionD" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="正确答案">
          <el-input v-model="editDialog.form.correctAnswer" placeholder="A/B/C/D" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="editDialog.saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { cantoneseTestApi } from '@/api'

const EXPECTED_HEADERS = ['题目ID', '等级', '题型', '题目文本', '选项A', '选项B', '选项C', '选项D', '正确答案']

const loading = ref(false)
const importing = ref(false)
const ttsLoading = ref(false)
const regenLoading = ref(false)

const filters = reactive({
  level: '',
  questionType: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const viewDialog = reactive({
  visible: false,
  data: null
})

const editDialog = reactive({
  visible: false,
  saving: false,
  id: null,
  form: {
    level: '',
    questionType: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: ''
  }
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await cantoneseTestApi.pageQuestions({
      page: pagination.page,
      pageSize: pagination.pageSize,
      level: filters.level || undefined,
      questionType: filters.questionType || undefined
    })

    if (res?.code !== 200) {
      throw new Error(res?.message || '查询失败')
    }

    pagination.total = res.data?.total || 0
    tableData.value = res.data?.records || []
  } catch (e) {
    ElMessage.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = size => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleCurrentPageChange = page => {
  pagination.page = page
  loadData()
}

const resetFilters = () => {
  filters.level = ''
  filters.questionType = ''
  pagination.page = 1
  loadData()
}

const handleBatchTts = async () => {
  ttsLoading.value = true
  try {
    const res = await cantoneseTestApi.batchGenerateListeningAudio({
      level: filters.level || undefined,
      onlyMissing: true
    })
    if (res?.code !== 200) {
      throw new Error(res?.message || '生成失败')
    }
    const data = res.data || {}
    ElMessage.success(`生成完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)
    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '生成失败明细', {
        confirmButtonText: '知道了',
        type: 'warning'
      })
    }
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  } finally {
    ttsLoading.value = false
  }
}

const handleRegenerateTts = async () => {
  if (filters.questionType && filters.questionType !== '听力') {
    ElMessage.warning('重新生成音频仅针对“听力”题型')
    return
  }

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
    const res = await cantoneseTestApi.regenerateListeningAudio({
      level: filters.level || undefined
    })
    if (res?.code !== 200) {
      throw new Error(res?.message || '重新生成失败')
    }
    const data = res.data || {}
    ElMessage.success(`重新生成完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)
    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '重新生成失败明细', {
        confirmButtonText: '知道了',
        type: 'warning'
      })
    }
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '重新生成失败')
  } finally {
    regenLoading.value = false
  }
}

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

const handleFileChange = async uploadFile => {
  const file = uploadFile?.raw
  if (!file) return

  const lowerName = (file.name || '').toLowerCase()
  if (!(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))) {
    ElMessage.warning('请上传.xlsx或.xls文件')
    return
  }

  importing.value = true
  try {
    const check = await validateXlsxHeaders(file)
    if (!check.ok) {
      const actual = (check.headers || []).join(' | ')
      try {
        await ElMessageBox.confirm(
          `表头校验未通过。\n\n要求表头：\n${EXPECTED_HEADERS.join(' | ')}\n\n实际读取到的表头：\n${actual}\n\n如果你的Excel表头肉眼正确，但这里显示乱码/不一致，通常是浏览器端解析兼容问题。你可以选择“继续导入”，由后端进行最终校验。`,
          '表头校验提示',
          {
            confirmButtonText: '继续导入',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (e) {
        return
      }
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await cantoneseTestApi.importQuestions(formData)
    if (res?.code !== 200) {
      throw new Error(res?.message || '导入失败')
    }

    const data = res.data || {}
    ElMessage.success(`导入完成：总计${data.total || 0}，成功${data.successCount || 0}，失败${data.failCount || 0}`)

    if (data.errors?.length) {
      ElMessageBox.alert(data.errors.join('\n'), '导入失败明细', {
        confirmButtonText: '知道了',
        type: 'warning'
      })
    }

    pagination.page = 1
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const openView = async row => {
  try {
    const res = await cantoneseTestApi.getQuestionDetail(row.id)
    if (res?.code !== 200) {
      throw new Error(res?.message || '获取失败')
    }
    viewDialog.data = res.data
    viewDialog.visible = true
  } catch (e) {
    ElMessage.error(e.message || '获取失败')
  }
}

const openEdit = async row => {
  try {
    const res = await cantoneseTestApi.getQuestionDetail(row.id)
    if (res?.code !== 200) {
      throw new Error(res?.message || '获取失败')
    }

    editDialog.id = row.id
    editDialog.form.level = res.data?.level || ''
    editDialog.form.questionType = res.data?.questionType || ''
    editDialog.form.questionText = res.data?.questionText || ''
    editDialog.form.optionA = res.data?.optionA || ''
    editDialog.form.optionB = res.data?.optionB || ''
    editDialog.form.optionC = res.data?.optionC || ''
    editDialog.form.optionD = res.data?.optionD || ''
    editDialog.form.correctAnswer = res.data?.correctAnswer || ''
    editDialog.visible = true
  } catch (e) {
    ElMessage.error(e.message || '获取失败')
  }
}

const handleSave = async () => {
  if (!editDialog.id) return
  editDialog.saving = true
  try {
    const res = await cantoneseTestApi.updateQuestion(editDialog.id, { ...editDialog.form })
    if (res?.code !== 200) {
      throw new Error(res?.message || '保存失败')
    }
    ElMessage.success('保存成功')
    editDialog.visible = false
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}

const handleDelete = async row => {
  try {
    await ElMessageBox.confirm('确认删除该题目吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await cantoneseTestApi.deleteQuestion(row.id)
    if (res?.code !== 200) {
      throw new Error(res?.message || '删除失败')
    }

    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.toolbar-card {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
