import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 使用相对路径，通过Vite代理转发
  timeout: 15000 // 增加超时时间
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 如果是 FormData，删除 Content-Type，让浏览器自动设置（包括 boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else if (!config.headers['Content-Type']) {
      // 如果不是 FormData 且没有设置 Content-Type，默认使用 application/json
      config.headers['Content-Type'] = 'application/json'
    }
    config.headers['Accept'] = 'application/json'
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // console.error('API Error:', error)
    
    // // 处理不同类型的错误
    // if (error.code === 'ERR_NETWORK') {
    //   console.error('网络错误：无法连接到服务器')
    //   console.error('请检查：1. 后端服务器是否启动 2. 网络连接是否正常 3. 防火墙设置')
    // } else if (error.response?.status === 502) {
    //   console.error('服务器错误：502 Bad Gateway')
    //   console.error('可能原因：1. 后端服务器未启动 2. 服务器崩溃 3. 端口配置错误')
    // } else if (error.response?.status === 404) {
    //   console.error('接口不存在：404 Not Found')
    // } else if (error.response?.status === 500) {
    //   console.error('服务器内部错误：500 Internal Server Error')
    // }
    
    return Promise.reject(error)
  }
)

// 地区管理API
export const regionApi = {
  // 获取地区列表
  getRegions() {
    return api.get('/regions')
  },
  
  // 创建地区
  createRegion(data) {
    return api.post('/regions', data)
  },
  
  // 获取地区详情
  getRegionDetail(id) {
    return api.get(`/regions/${id}/detail`)
  },
  
  // 更新地区基本信息
  updateRegionBasic(id, data) {
    return api.put(`/regions/${id}`, data)
  },
  
  // 更新地区详情
  updateRegionDetail(id, data) {
    return api.put(`/regions/${id}/detail`, data)
  },
  
  // 删除地区
  deleteRegion(id) {
    return api.delete(`/regions/${id}`)
  },
  
  // 获取地区引导消息
  getRegionGuide(region) {
    return api.get(`/regions/${region}/guide`)
  }
}

// 对话管理API
export const chatApi = {
  // 发送消息
  sendMessage(data) {
    return api.post('/chat/send', data)
  },
  
  // 分析语音发音
  analyzePronunciation(data) {
    return api.post('/chat/pronunciation/analyze', data)
  },
  
  // 获取对话历史
  getChatHistory(params) {
    return api.get('/chat/history', { params })
  }
}

// 用户管理API
export const userApi = {
  // 获取用户对话限制
  getChatLimit(userId) {
    return api.get('/user/chat-limit', { params: { userId } })
  },
  
  // 更新对话次数
  updateChatCount(data) {
    return api.post('/user/update-chat-count', data)
  },
  
  // 获取用户列表（分页）
  getUserList(params) {
    return api.get('/user/list', { params })
  },
  
  // 获取用户详情
  getUserDetail(id) {
    return api.get(`/user/${id}`)
  },
  
  // 更新用户信息
  updateUser(id, data) {
    return api.put(`/user/${id}`, data)
  },
  
  // 重置对话次数
  resetChatCount(id) {
    return api.post(`/user/${id}/reset-chat-count`)
  }
}

// 消息管理API
export const messageApi = {
  // 收藏消息
  collectMessage(data) {
    return api.post('/messages/collect', data)
  },
  
  // 获取收藏列表
  getCollectedMessages(params) {
    return api.get('/messages/collected', { params })
  }
}

// 文件上传API
export const uploadApi = {
  // 上传图片
  uploadImage(formData, userId = 'admin') {
    return api.post('/upload/image', formData, {
      params: { userId }
      // 不要手动设置 Content-Type，让 Axios 自动处理 multipart/form-data
    })
  },
  
  // 上传语音
  uploadVoice(formData, userId = 'admin') {
    return api.post('/upload/voice', formData, {
      params: { userId }
      // 不要手动设置 Content-Type，让 Axios 自动处理 multipart/form-data
    })
  }
}

// 资源图片管理API
export const assetApi = {
  // 上传图片
  uploadImage(formData) {
    return api.post('/assets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取图片列表（分页）
  getImageList(params) {
    return api.get('/assets/images', { params })
  },
  
  // 根据ID获取图片信息
  getImageById(id) {
    return api.get(`/assets/images/${id}`)
  },
  
  // 删除图片
  deleteImage(id) {
    return api.delete(`/assets/images/${id}`)
  },
  
  // 批量删除图片
  batchDeleteImages(ids) {
    return api.delete('/assets/images/batch', { data: ids })
  },
  
  // 更新图片信息
  updateImage(id, params) {
    return api.put(`/assets/images/${id}`, null, {
      params: params
    })
  },

  // 替换图片文件（同时删除OSS中的旧文件）
  replaceImage(id, formData) {
    return api.post(`/assets/images/${id}/replace`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// GLB 展示配置 API（仅配置，不包含上传逻辑）
export const glbConfigApi = {
  getByAssetImageId(assetImageId) {
    return api.get('/assets/glb-config', { params: { assetImageId } })
  },

  saveByAssetImageId(assetImageId, data) {
    return api.put('/assets/glb-config', data, { params: { assetImageId } })
  },

  deleteByAssetImageId(assetImageId) {
    return api.delete('/assets/glb-config', { params: { assetImageId } })
  }
}

// 粤语测试题目管理API
export const cantoneseTestApi = {
  importQuestions(formData) {
    return api.post('/cantonese-test/questions/import', formData)
  },

  pageQuestions(params) {
    return api.get('/cantonese-test/questions/page', { params })
  },

  getQuestionDetail(id) {
    return api.get(`/cantonese-test/questions/${id}`)
  },

  updateQuestion(id, data) {
    return api.put(`/cantonese-test/questions/${id}`, data)
  },

  deleteQuestion(id) {
    return api.delete(`/cantonese-test/questions/${id}`)
  },

  batchDeleteQuestions(ids) {
    return api.delete('/cantonese-test/questions/batch', { data: ids })
  },

  batchGenerateListeningAudio(params) {
    return api.post('/cantonese-test/audio/tts/batch', null, { params })
  },

  regenerateListeningAudio(params) {
    return api.post('/cantonese-test/audio/tts/batch', null, { params: { ...(params || {}), force: true, onlyMissing: false } })
  }
}

// 粤趣学习（游戏化模块）管理端API
export const gameAdminApi = {
  listScenes() {
    return api.get('/game/admin/scenes')
  },

  pageGameQuestions(params) {
    return api.get('/game/admin/questions/page', { params })
  },

  pageSceneDialogs(params) {
    return api.get('/game/admin/scene-dialog/page', { params })
  },

  importGameQuestions(formData) {
    return api.post('/game/admin/questions/import', formData)
  },

  updateQuestionImageUrls(params) {
    return api.post('/game/admin/questions/image-urls/update', null, { params })
  },

  batchGenerateGameQuestionAudio(params) {
    return api.post('/game/admin/questions/tts/batch', null, { params })
  },

  regenerateGameQuestionAudio(params) {
    return api.post('/game/admin/questions/tts/batch', null, { params: { ...(params || {}), force: true, onlyMissing: false } })
  },

  batchGenerateGameQuestionAudioByIds(params) {
    return api.post('/game/admin/questions/tts/by-ids', {
      questionIds: (params && params.questionIds) || [],
      onlyMissing: params && typeof params.onlyMissing === 'boolean' ? params.onlyMissing : true,
      force: params && typeof params.force === 'boolean' ? params.force : false
    })
  },

  regenerateGameQuestionAudioByIds(params) {
    return api.post('/game/admin/questions/tts/by-ids', {
      questionIds: (params && params.questionIds) || [],
      onlyMissing: false,
      force: true
    })
  },

  deleteGameQuestionsByIds(params) {
    return api.post('/game/admin/questions/delete/by-ids', {
      questionIds: (params && params.questionIds) || []
    })
  },

  importSceneDialogs(formData) {
    return api.post('/game/admin/scene-dialog/import', formData)
  },

  batchGenerateSceneDialogAudio(params) {
    return api.post('/game/admin/scene-dialog/tts/batch', null, { params })
  },

  regenerateSceneDialogAudio(params) {
    return api.post('/game/admin/scene-dialog/tts/batch', null, { params: { ...(params || {}), force: true, onlyMissing: false } })
  },

  deleteSceneDialogsByIds(params) {
    return api.post('/game/admin/scene-dialog/delete/by-ids', {
      dialogIds: (params && params.dialogIds) || []
    })
  }
}


export default api
