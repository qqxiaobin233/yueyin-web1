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
  }
}


export default api
