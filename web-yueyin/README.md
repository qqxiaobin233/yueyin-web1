# 粤地探索后台管理系统

基于Vue 3 + Element Plus开发的简约后台管理系统，用于管理粤地探索相关功能。

## 功能特性

- 🏠 **仪表盘** - 系统概览和统计数据
- 🗺️ **地区管理** - 大湾区地区的增删改查
- 💬 **对话管理** - 查看和管理用户对话历史
- 👥 **用户管理** - 用户信息管理和对话次数控制
- 📨 **消息管理** - 消息的查看、收藏和删除

## 技术栈

- Vue 3
- Vue Router 4
- Element Plus
- Axios
- Vite

## 安装和运行

### 1. 安装依赖

```bash
cd web-yueyin
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── api/                 # API接口配置
│   └── index.js
├── components/          # 公共组件
│   └── Layout.vue       # 布局组件
├── router/             # 路由配置
│   └── index.js
├── views/              # 页面组件
│   ├── Dashboard.vue           # 仪表盘
│   ├── RegionManagement.vue   # 地区管理
│   ├── ChatManagement.vue      # 对话管理
│   ├── UserManagement.vue      # 用户管理
│   └── MessageManagement.vue  # 消息管理
├── App.vue             # 根组件
└── main.js             # 入口文件
```

## API接口

系统基于提供的API文档设计，主要接口包括：

- 地区管理：`/api/regions`
- 对话历史：`/api/chat/history`
- 用户管理：`/api/user/chat-limit`
- 消息管理：`/api/messages`

## 功能说明

### 地区管理
- 查看所有大湾区地区信息
- 添加、编辑、删除地区
- 查看地区详细信息（服饰、美食、地标）
- 支持地区状态管理

### 对话管理
- 查看所有用户对话历史
- 支持按地区、消息类型、时间筛选
- 查看消息详情和AI回复
- 删除对话记录

### 用户管理
- 查看用户列表和详细信息
- 编辑用户信息
- 管理用户VIP状态
- 重置用户对话次数
- 查看用户统计和活动记录

### 消息管理
- 查看所有消息记录
- 支持消息收藏和取消收藏
- 按类型和内容筛选消息
- 查看发音分析结果
- 删除消息记录

## 注意事项

1. 当前使用模拟数据，需要连接真实API
2. 所有接口调用都在对应的API文件中配置
3. 系统采用响应式设计，支持不同屏幕尺寸
4. 使用Element Plus组件库，界面简洁美观

## 开发说明

- 使用Vue 3 Composition API
- 采用Element Plus UI组件库
- 支持路由导航和状态管理
- 响应式设计，适配移动端