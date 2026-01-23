<template>
  <div class="region-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>地区管理</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加地区
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索地区名称"
          style="width: 300px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
       <!-- 地区列表 -->
       <el-table :data="filteredRegions" style="width: 100%" v-loading="loading">
         <el-table-column prop="id" label="ID" width="80" />
         <el-table-column prop="name" label="地区名称" width="120">
           <template #default="scope">
             <el-button 
               type="text" 
               @click="openRegionDetail(scope.row)"
               class="region-name-link"
             >
               {{ scope.row.name }}
             </el-button>
           </template>
         </el-table-column>
         <el-table-column prop="left" label="位置X" width="80" />
         <el-table-column prop="top" label="位置Y" width="80" />
         <el-table-column prop="isActive" label="状态" width="100">
           <template #default="scope">
             <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
               {{ scope.row.isActive ? '启用' : '禁用' }}
             </el-tag>
           </template>
         </el-table-column>
         <el-table-column label="操作" width="200">
           <template #default="scope">
             <el-button size="small" @click="viewRegion(scope.row)">查看</el-button>
             <el-button size="small" type="primary" @click="editRegion(scope.row)">编辑</el-button>
             <el-button size="small" type="danger" @click="deleteRegion(scope.row)">删除</el-button>
           </template>
         </el-table-column>
       </el-table>
    </el-card>
    
    <!-- 添加/编辑地区对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑地区' : '添加地区'"
      width="600px"
    >
      <el-form :model="regionForm" :rules="rules" ref="regionFormRef" label-width="100px">
        <el-form-item label="地区名称" prop="name">
          <el-input v-model="regionForm.name" placeholder="请输入地区名称" />
        </el-form-item>
         <el-form-item label="位置X" prop="left">
           <el-input v-model="regionForm.left" placeholder="例如: 45%" />
         </el-form-item>
         <el-form-item label="位置Y" prop="top">
           <el-input v-model="regionForm.top" placeholder="例如: 25%" />
         </el-form-item>
        <el-form-item label="地标图标" prop="icon">
          <div class="icon-upload">
            <el-upload
              class="icon-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleIconChange"
              :before-upload="beforeIconUpload"
              accept="image/*"
            >
              <img v-if="regionForm.icon" :src="regionForm.icon" class="icon-preview" />
              <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">点击选择地标图标（每个地区仅一个）</div>
          </div>
        </el-form-item>
        <el-form-item label="地区名称图片" prop="nameImage">
          <div class="icon-upload">
            <el-upload
              class="icon-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleNameImageChange"
              :before-upload="beforeIconUpload"
              accept="image/*"
            >
              <img v-if="regionForm.nameImage" :src="regionForm.nameImage" class="icon-preview" />
              <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">点击选择地区名称图片（显示在地标下方）</div>
          </div>
        </el-form-item>
        <el-form-item label="名称图片位置X" prop="nameImageLeft">
          <el-input v-model="regionForm.nameImageLeft" placeholder="例如: 52%" />
        </el-form-item>
        <el-form-item label="名称图片位置Y" prop="nameImageTop">
          <el-input v-model="regionForm.nameImageTop" placeholder="例如: 26%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="regionForm.isActive" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRegion">保存</el-button>
      </template>
    </el-dialog>
    
     <!-- 地区基本信息对话框 -->
     <el-dialog
       v-model="showDetailDialog"
       title="地区详情"
       width="600px"
     >
        <div v-if="selectedRegion" class="region-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="地区ID">{{ selectedRegion.id }}</el-descriptions-item>
            <el-descriptions-item label="地区名称">{{ selectedRegion.name }}</el-descriptions-item>
            <el-descriptions-item label="位置">{{ selectedRegion.left }}, {{ selectedRegion.top }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedRegion.isActive ? 'success' : 'danger'">
                {{ selectedRegion.isActive ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="地标图标" v-if="selectedRegion.icon" :span="2">
              <div class="icon-display">
                <img :src="selectedRegion.icon" class="region-icon" alt="地标图标" />
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="地区名称图片" v-if="selectedRegion.nameImage" :span="2">
              <div class="icon-display">
                <img :src="selectedRegion.nameImage" class="region-icon" alt="地区名称图片" />
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="名称图片位置X" v-if="selectedRegion.nameImageLeft">{{ selectedRegion.nameImageLeft }}</el-descriptions-item>
            <el-descriptions-item label="名称图片位置Y" v-if="selectedRegion.nameImageTop">{{ selectedRegion.nameImageTop }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
     
     <!-- 地区详细信息新窗口 -->
     <el-dialog
       v-model="showDetailWindow"
       :title="`${selectedRegion?.name || ''} - 详细信息`"
       width="1000px"
       :close-on-click-modal="false"
     >
       <template #header>
         <div class="dialog-header">
           <span>{{ selectedRegion?.name || '' }} - 详细信息</span>
           <div class="header-actions">
             <el-button type="primary" @click="openEditDialog">
               <el-icon><Edit /></el-icon>
               编辑
             </el-button>
           </div>
         </div>
       </template>
       <div v-if="selectedRegion" class="region-detail-window">
         <div v-loading="detailLoading" class="detail-content">
           <!-- 基本信息 -->
           <el-card class="info-card" shadow="never">
             <template #header>
               <span>基本信息</span>
             </template>
             <el-descriptions :column="2" border>
               <el-descriptions-item label="地区ID">{{ selectedRegion.id }}</el-descriptions-item>
               <el-descriptions-item label="地区名称">{{ selectedRegion.name }}</el-descriptions-item>
               <el-descriptions-item label="位置">{{ selectedRegion.left }}, {{ selectedRegion.top }}</el-descriptions-item>
               <el-descriptions-item label="状态">
                 <el-tag :type="selectedRegion.isActive ? 'success' : 'danger'">
                   {{ selectedRegion.isActive ? '启用' : '禁用' }}
                 </el-tag>
               </el-descriptions-item>
             </el-descriptions>
           </el-card>
           
           <!-- 详细信息 -->
           <div v-if="regionDetail" class="detail-sections">
             <!-- 描述和IP角色 -->
             <el-card class="info-card" shadow="never">
               <template #header>
                 <span>描述与角色</span>
               </template>
               <el-descriptions :column="1" border>
                 <el-descriptions-item label="描述">{{ regionDetail.desc || '暂无描述' }}</el-descriptions-item>
                 <el-descriptions-item label="IP角色" v-if="regionDetail.ip">
                   <div class="ip-display">
                     <img :src="regionDetail.ip" class="ip-image" alt="IP角色" />
                   </div>
                 </el-descriptions-item>
                 <el-descriptions-item label="IP角色" v-else>暂无角色信息</el-descriptions-item>
               </el-descriptions>
             </el-card>
             
             <!-- 特色手信 -->
            <el-card class="info-card" shadow="never" v-if="regionDetail.clothing && regionDetail.clothing.length > 0">
              <template #header>
                <span>特色手信</span>
              </template>
               <el-table :data="regionDetail.clothing" size="small" border>
                 <el-table-column prop="name" label="名称" width="150" />
                 <el-table-column prop="description" label="描述" />
                 <el-table-column prop="price" label="价格" width="100">
                   <template #default="scope">
                     ¥{{ scope.row.price || 0 }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="isAvailable" label="可用" width="80">
                   <template #default="scope">
                     <el-tag :type="scope.row.isAvailable ? 'success' : 'danger'">
                       {{ scope.row.isAvailable ? '是' : '否' }}
                     </el-tag>
                   </template>
                 </el-table-column>
               </el-table>
             </el-card>
             
             <!-- 工艺小物 -->
            <el-card class="info-card" shadow="never" v-if="regionDetail.food && regionDetail.food.length > 0">
              <template #header>
                <span>工艺小物</span>
              </template>
               <el-table :data="regionDetail.food" size="small" border>
                 <el-table-column prop="name" label="名称" width="150" />
                 <el-table-column prop="description" label="描述" />
                 <el-table-column prop="price" label="价格" width="100">
                   <template #default="scope">
                     ¥{{ scope.row.price || 0 }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="isAvailable" label="可用" width="80">
                   <template #default="scope">
                     <el-tag :type="scope.row.isAvailable ? 'success' : 'danger'">
                       {{ scope.row.isAvailable ? '是' : '否' }}
                     </el-tag>
                   </template>
                 </el-table-column>
               </el-table>
             </el-card>
             
             <!-- 纪念商品 -->
            <el-card class="info-card" shadow="never" v-if="regionDetail.landmarks && regionDetail.landmarks.length > 0">
              <template #header>
                <span>纪念商品</span>
              </template>
               <el-table :data="regionDetail.landmarks" size="small" border>
                 <el-table-column prop="name" label="名称" width="150" />
                 <el-table-column prop="description" label="描述" />
                 <el-table-column prop="ticketPrice" label="门票价格" width="100">
                   <template #default="scope">
                     ¥{{ scope.row.ticketPrice || 0 }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="isOpen" label="开放" width="80">
                   <template #default="scope">
                     <el-tag :type="scope.row.isOpen ? 'success' : 'danger'">
                       {{ scope.row.isOpen ? '是' : '否' }}
                     </el-tag>
                   </template>
                 </el-table-column>
               </el-table>
             </el-card>
             
             <!-- 活动信息 -->
            <el-card class="info-card" shadow="never" v-if="regionDetail.activities && regionDetail.activities.length > 0">
              <template #header>
                <span>活动信息</span>
              </template>
              <el-table :data="regionDetail.activities" size="small" border>
                <el-table-column prop="name" label="名称" width="150" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="price" label="价格" width="100">
                  <template #default="scope">
                    ¥{{ scope.row.price || 0 }}
                  </template>
                </el-table-column>
                <el-table-column prop="isAvailable" label="可用" width="80">
                  <template #default="scope">
                    <el-tag :type="scope.row.isAvailable ? 'success' : 'danger'">
                      {{ scope.row.isAvailable ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <!-- 文创产品 -->
            <el-card class="info-card" shadow="never" v-if="regionDetail.feature && regionDetail.feature.length > 0">
              <template #header>
                <span>文创产品</span>
              </template>
              <el-table :data="regionDetail.feature" size="small" border>
                <el-table-column prop="name" label="名称" width="150" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="price" label="价格" width="100">
                  <template #default="scope">
                    ¥{{ scope.row.price || 0 }}
                  </template>
                </el-table-column>
                <el-table-column prop="isAvailable" label="可用" width="80">
                  <template #default="scope">
                    <el-tag :type="scope.row.isAvailable ? 'success' : 'danger'">
                      {{ scope.row.isAvailable ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <!-- 其他 -->
            <el-card class="info-card" shadow="never" v-if="regionDetail.activity && regionDetail.activity.length > 0">
              <template #header>
                <span>其他</span>
              </template>
              <el-table :data="regionDetail.activity" size="small" border>
                <el-table-column prop="name" label="名称" width="150" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="price" label="价格" width="100">
                  <template #default="scope">
                    ¥{{ scope.row.price || 0 }}
                  </template>
                </el-table-column>
                <el-table-column prop="isAvailable" label="可用" width="80">
                  <template #default="scope">
                    <el-tag :type="scope.row.isAvailable ? 'success' : 'danger'">
                      {{ scope.row.isAvailable ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
             
             <!-- 地区特色轮播图 -->
             <el-card class="info-card" shadow="never" v-if="regionDetail.features && regionDetail.features.length > 0">
               <template #header>
                 <span>地区特色</span>
               </template>
               <div class="features-carousel">
                 <el-carousel height="300px" indicator-position="outside" arrow="hover">
                   <el-carousel-item v-for="(feature, index) in regionDetail.features" :key="index">
                     <div class="feature-item">
                       <img :src="feature.image" :alt="feature.title" class="feature-image" />
                       <div class="feature-overlay">
                         <h3 class="feature-title">{{ feature.title }}</h3>
                         <p class="feature-description">{{ feature.description }}</p>
                       </div>
                     </div>
                   </el-carousel-item>
                 </el-carousel>
               </div>
             </el-card>
           </div>
           
           <!-- 无数据提示 -->
           <div v-else-if="!detailLoading" class="no-data">
             <el-empty description="暂无详细信息" />
           </div>
         </div>
       </div>
     </el-dialog>
     
     <!-- 编辑对话框 -->
     <el-dialog
       v-model="showEditDialog"
       title="编辑地区详情"
       width="1200px"
       :close-on-click-modal="false"
     >
       <div v-loading="editLoading" class="edit-content">
         <!-- 基本信息编辑 -->
         <el-card class="edit-card" shadow="never">
           <template #header>
             <span>基本信息</span>
           </template>
           <el-form :model="editForm" label-width="100px">
             <el-form-item label="描述">
               <el-input
                 v-model="editForm.desc"
                 type="textarea"
                 :rows="3"
                 placeholder="请输入地区描述"
               />
             </el-form-item>
             <el-form-item label="IP角色">
               <div class="ip-upload">
                 <el-upload
                   class="ip-uploader"
                   :auto-upload="false"
                   :show-file-list="false"
                   :on-change="handleIpChange"
                   :before-upload="beforeIconUpload"
                   accept="image/*"
                 >
                   <img v-if="editForm.ip" :src="editForm.ip" class="ip-preview" />
                   <el-icon v-else class="ip-uploader-icon"><Plus /></el-icon>
                 </el-upload>
                 <div class="upload-tip">点击选择IP角色图片</div>
               </div>
             </el-form-item>
           </el-form>
         </el-card>
         
         <!-- 地区特色管理 -->
         <el-card class="edit-card" shadow="never">
           <template #header>
             <div class="card-header">
               <span>地区特色轮播图</span>
               <el-button type="primary" @click="addFeature">
                 <el-icon><Plus /></el-icon>
                 添加特色
               </el-button>
             </div>
           </template>
           <el-table :data="editForm.features" size="small" border>
             <el-table-column prop="title" label="标题" width="200" />
             <el-table-column prop="description" label="描述" />
             <el-table-column prop="image" label="图片" width="120">
               <template #default="scope">
                 <img v-if="scope.row.image" :src="scope.row.image" class="feature-preview-image" alt="特色图片" />
                 <span v-else>无图片</span>
               </template>
             </el-table-column>
             <el-table-column label="操作" width="150">
               <template #default="scope">
                 <el-button size="small" @click="editFeature(scope.row, scope.$index)">编辑</el-button>
                 <el-button size="small" type="danger" @click="deleteFeature(scope.$index)">删除</el-button>
               </template>
             </el-table-column>
           </el-table>
         </el-card>
         
         <!-- 大类管理 -->
         <el-card class="edit-card" shadow="never">
           <template #header>
             <div class="card-header">
               <span>内容大类管理</span>
               <el-button type="primary" @click="addCategory">
                 <el-icon><Plus /></el-icon>
                 添加大类
               </el-button>
             </div>
           </template>
           <div v-for="(category, categoryIndex) in editForm.categories" :key="categoryIndex" class="category-section">
             <el-card class="category-card" shadow="never">
               <template #header>
                 <div class="card-header">
                   <span>{{ category.name }}</span>
                   <div class="category-actions">
                     <el-button size="small" @click="editCategory(category, categoryIndex)">编辑大类</el-button>
                     <el-button size="small" type="primary" @click="addItem(category.type, categoryIndex)">
                       <el-icon><Plus /></el-icon>
                       添加项目
                     </el-button>
                     <el-button size="small" type="danger" @click="deleteCategory(categoryIndex)">删除大类</el-button>
                   </div>
                 </div>
               </template>
               <el-table :data="category.items" size="small" border>
                 <el-table-column prop="name" label="名称" width="150" />
                 <el-table-column prop="description" label="描述" />
                 <el-table-column prop="price" label="价格" width="100" v-if="category.type !== 'landmarks'">
                   <template #default="scope">
                     ¥{{ scope.row.price || 0 }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="ticketPrice" label="门票价格" width="100" v-if="category.type === 'landmarks'">
                   <template #default="scope">
                     ¥{{ scope.row.ticketPrice || 0 }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="isAvailable" label="可用" width="80" v-if="category.type !== 'landmarks'">
                   <template #default="scope">
                     <el-tag :type="scope.row.isAvailable ? 'success' : 'danger'">
                       {{ scope.row.isAvailable ? '是' : '否' }}
                     </el-tag>
                   </template>
                 </el-table-column>
                 <el-table-column prop="isOpen" label="开放" width="80" v-if="category.type === 'landmarks'">
                   <template #default="scope">
                     <el-tag :type="scope.row.isOpen ? 'success' : 'danger'">
                       {{ scope.row.isOpen ? '是' : '否' }}
                     </el-tag>
                   </template>
                 </el-table-column>
                 <el-table-column prop="image" label="图片" width="100">
                   <template #default="scope">
                     <img v-if="scope.row.image" :src="scope.row.image" class="item-image" alt="图片" />
                     <span v-else>无图片</span>
                   </template>
                 </el-table-column>
                 <el-table-column label="操作" width="150">
                   <template #default="scope">
                     <el-button size="small" @click="editItem(category.type, scope.row, scope.$index, categoryIndex)">编辑</el-button>
                     <el-button size="small" type="danger" @click="deleteItem(category.type, scope.$index, categoryIndex)">删除</el-button>
                   </template>
                 </el-table-column>
               </el-table>
             </el-card>
           </div>
         </el-card>
       </div>
       
       <template #footer>
         <el-button @click="showEditDialog = false">取消</el-button>
         <el-button type="primary" @click="saveEdit" :loading="editLoading">保存</el-button>
       </template>
     </el-dialog>
     
     
     <!-- 地区特色编辑对话框 -->
     <el-dialog
       v-model="showFeatureDialog"
       :title="`${currentFeature !== null ? '编辑' : '添加'}地区特色`"
       width="600px"
     >
       <el-form :model="featureForm" label-width="100px">
         <el-form-item label="特色标题" required>
           <el-input v-model="featureForm.title" placeholder="请输入特色标题" />
         </el-form-item>
         <el-form-item label="特色描述">
           <el-input
             v-model="featureForm.description"
             type="textarea"
             :rows="3"
             placeholder="请输入特色描述"
           />
         </el-form-item>
         <el-form-item label="特色图片">
           <el-upload
             class="feature-uploader"
             :auto-upload="false"
             :show-file-list="false"
             :on-change="handleFeatureImageUpload"
             :before-upload="beforeIconUpload"
             accept="image/*"
           >
             <img v-if="featureForm.image" :src="featureForm.image" class="feature-upload-preview" />
             <el-icon v-else class="feature-uploader-icon"><Plus /></el-icon>
           </el-upload>
           <div class="upload-tip">点击选择特色图片</div>
         </el-form-item>
       </el-form>
       
       <template #footer>
         <el-button @click="showFeatureDialog = false">取消</el-button>
         <el-button type="primary" @click="saveFeature">保存</el-button>
       </template>
     </el-dialog>
     
     <!-- 大类编辑对话框 -->
     <el-dialog
       v-model="showCategoryDialog"
       :title="`${currentCategory !== null ? '编辑' : '添加'}大类`"
       width="600px"
     >
       <el-form :model="categoryForm" label-width="100px">
         <el-form-item label="大类名称" required>
           <el-input v-model="categoryForm.name" placeholder="请输入大类名称" />
         </el-form-item>
         <el-form-item label="大类类型" required>
           <el-select v-model="categoryForm.type" placeholder="请选择大类类型">
            <el-option label="特色手信" value="clothing" />
            <el-option label="工艺小物" value="food" />
            <el-option label="纪念商品" value="landmark" />
            <el-option label="文创产品" value="feature" />
            <el-option label="其他" value="activity" />
          </el-select>
         </el-form-item>
         <el-form-item label="大类描述">
           <el-input
             v-model="categoryForm.description"
             type="textarea"
             :rows="3"
             placeholder="请输入大类描述"
           />
         </el-form-item>
       </el-form>
       
       <template #footer>
         <el-button @click="showCategoryDialog = false">取消</el-button>
         <el-button type="primary" @click="saveCategory">保存</el-button>
       </template>
     </el-dialog>
     
     <!-- 项目编辑对话框 -->
     <el-dialog
       v-model="showItemDialog"
       :title="`${currentEditItem?.index !== null && currentEditItem?.index !== undefined ? '编辑' : '添加'}${getCategoryName(currentEditCategory)}`"
       width="600px"
     >
       <el-form :model="currentEditItem" label-width="100px" v-if="currentEditItem">
         <el-form-item label="名称" required>
           <el-input v-model="currentEditItem.name" placeholder="请输入名称" />
         </el-form-item>
         <el-form-item label="描述">
           <el-input
             v-model="currentEditItem.description"
             type="textarea"
             :rows="2"
             placeholder="请输入描述"
           />
         </el-form-item>
         <el-form-item label="价格">
           <el-input-number v-model="currentEditItem.price" :min="0" :precision="2" />
         </el-form-item>
         <el-form-item label="可用" v-if="currentEditCategory !== 'landmarks'">
           <el-switch v-model="currentEditItem.isAvailable" />
         </el-form-item>
         <el-form-item label="开放" v-if="currentEditCategory === 'landmarks'">
           <el-switch v-model="currentEditItem.isOpen" />
         </el-form-item>
         <el-form-item label="门票价格" v-if="currentEditCategory === 'landmarks'">
           <el-input-number v-model="currentEditItem.ticketPrice" :min="0" :precision="2" />
         </el-form-item>
         <el-form-item label="图片">
           <el-upload
             class="item-uploader"
             :auto-upload="false"
             :show-file-list="false"
             :on-change="(file) => handleImageUpload(file, currentEditCategory, currentEditItem.index)"
             :before-upload="beforeIconUpload"
             accept="image/*"
           >
             <img v-if="currentEditItem.image" :src="currentEditItem.image" class="item-preview" />
             <el-icon v-else class="item-uploader-icon"><Plus /></el-icon>
           </el-upload>
         </el-form-item>
       </el-form>
       
       <template #footer>
         <el-button @click="showItemDialog = false">取消</el-button>
         <el-button type="primary" @click="saveItem">保存</el-button>
       </template>
     </el-dialog>
     
   </div>
 </template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit } from '@element-plus/icons-vue'
import { regionApi, uploadApi } from '@/api'

const loading = ref(false)
const searchKeyword = ref('')
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showDetailWindow = ref(false)
const showEditDialog = ref(false)
const isEdit = ref(false)
const selectedRegion = ref(null)
const regionDetail = ref(null)
const detailLoading = ref(false)
const editLoading = ref(false)

// 地区列表数据
const regions = ref([])

const regionForm = reactive({
  id: undefined,
  name: '',
  left: '',
  top: '',
  icon: '',
  nameImage: '',
  nameImageLeft: '',
  nameImageTop: '',
  description: '',
  isActive: true
})

// 编辑表单
const editForm = reactive({
  desc: '',
  ip: '',
  categories: [], // 改为动态大类数组
  features: [] // 地区特色轮播图
})

// 当前编辑的类别
const currentEditCategory = ref('clothing')
const currentEditItem = ref(null)
const showItemDialog = ref(false)

// 大类管理相关
const showCategoryDialog = ref(false)
const currentCategory = ref(null)
const categoryForm = reactive({
  name: '',
  type: '',
  description: '',
  items: []
})

// 地区特色管理相关
const showFeatureDialog = ref(false)
const currentFeature = ref(null)
const featureForm = reactive({
  title: '',
  description: '',
  image: ''
})


const rules = {
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }],
  left: [{ required: true, message: '请输入位置X', trigger: 'blur' }],
  top: [{ required: true, message: '请输入位置Y', trigger: 'blur' }]
}

// 图片上传相关
const uploadAction = ref('') // 不需要action，使用自定义上传

const filteredRegions = computed(() => {
  if (!searchKeyword.value) return regions.value
  return regions.value.filter(region => 
    region.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

// 打开地区详情窗口
const openRegionDetail = async (region) => {
  selectedRegion.value = region
  showDetailWindow.value = true
  detailLoading.value = true
  regionDetail.value = null
  
  try {
    // 调用API获取地区详情
    const response = await regionApi.getRegionDetail(region.id)
    if (response.code === 200) {
      regionDetail.value = response.data.regionInfo
    } else {
      ElMessage.error(response.message || '获取地区详情失败')
    }
  } catch (error) {
    console.error('获取地区详情失败:', error)
    ElMessage.error('获取地区详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 打开编辑对话框
const openEditDialog = async () => {
  if (!regionDetail.value) {
    // 如果没有地区详情，先加载详情
    if (!selectedRegion.value) {
      ElMessage.warning('请先选择地区')
      return
    }
    
    try {
      detailLoading.value = true
      const response = await regionApi.getRegionDetail(selectedRegion.value.id)
      if (response.code === 200) {
        regionDetail.value = response.data.regionInfo
      } else {
        ElMessage.error(response.message || '获取地区详情失败')
        return
      }
    } catch (error) {
      console.error('获取地区详情失败:', error)
      ElMessage.error('获取地区详情失败')
      return
    } finally {
      detailLoading.value = false
    }
  }
  
  // 初始化编辑表单
  editForm.desc = regionDetail.value.desc || ''
  editForm.ip = regionDetail.value.ip || ''
  editForm.features = regionDetail.value.features || []
  
  // 初始化大类数据
  editForm.categories = []
  if (regionDetail.value.clothing && regionDetail.value.clothing.length > 0) {
    editForm.categories.push({
      name: '特色手信',
      type: 'clothing',
      description: '特色手信相关项目',
      items: regionDetail.value.clothing
    })
  }
  if (regionDetail.value.food && regionDetail.value.food.length > 0) {
    editForm.categories.push({
      name: '工艺小物',
      type: 'food',
      description: '工艺小物相关项目',
      items: regionDetail.value.food
    })
  }
  if (regionDetail.value.landmarks && regionDetail.value.landmarks.length > 0) {
    editForm.categories.push({
      name: '纪念商品',
      type: 'landmark',
      description: '纪念商品相关项目',
      items: regionDetail.value.landmarks
    })
  }
  if (regionDetail.value.feature && regionDetail.value.feature.length > 0) {
    editForm.categories.push({
      name: '文创产品',
      type: 'feature',
      description: '文创产品相关项目',
      items: regionDetail.value.feature
    })
  }
  if (regionDetail.value.activity && regionDetail.value.activity.length > 0) {
    editForm.categories.push({
      name: '其他',
      type: 'activity',
      description: '其他相关项目',
      items: regionDetail.value.activity
    })
  }
  
  showEditDialog.value = true
}

// 保存编辑
const saveEdit = async () => {
  editLoading.value = true
  try {
    // 将大类数据转换为API格式
    const apiData = {
      desc: editForm.desc,
      ip: editForm.ip,
      features: editForm.features,
      clothing: [],
      food: [],
      landmarks: [],
      feature: [],
      activity: []
    }
    
    // 根据大类类型分类数据
    editForm.categories.forEach(category => {
      switch (category.type) {
        case 'clothing':
          apiData.clothing = category.items
          break
        case 'food':
          apiData.food = category.items
          break
        case 'landmark':
          apiData.landmarks = category.items
          break
        case 'feature':
          apiData.feature = category.items
          break
        case 'activity':
          apiData.activity = category.items
          break
      }
    })
    
    // 调用API保存编辑
    const response = await regionApi.updateRegionDetail(selectedRegion.value.id, apiData)
    if (response.code === 200) {
      ElMessage.success('保存成功')
      showEditDialog.value = false
      // 重新加载详情
      await openRegionDetail(selectedRegion.value)
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    editLoading.value = false
  }
}

// 地区特色管理操作
const addFeature = () => {
  currentFeature.value = null
  Object.assign(featureForm, {
    title: '',
    description: '',
    image: ''
  })
  showFeatureDialog.value = true
}

const editFeature = (feature, index) => {
  currentFeature.value = index
  Object.assign(featureForm, {
    title: feature.title,
    description: feature.description,
    image: feature.image
  })
  showFeatureDialog.value = true
}

const deleteFeature = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地区特色吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    editForm.features.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveFeature = () => {
  if (!featureForm.title) {
    ElMessage.error('请输入特色标题')
    return
  }
  
  const feature = {
    title: featureForm.title,
    description: featureForm.description,
    image: featureForm.image
  }
  
  if (currentFeature.value !== null) {
    // 编辑
    editForm.features[currentFeature.value] = feature
  } else {
    // 新增
    editForm.features.push(feature)
  }
  
  showFeatureDialog.value = false
  currentFeature.value = null
}

// 地区特色图片上传处理
const handleFeatureImageUpload = async (file) => {
  try {
    // 先显示本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      featureForm.image = e.target.result
    }
    reader.readAsDataURL(file.raw)
    
    // 然后上传到服务器
    const formData = new FormData()
    formData.append('image', file.raw)
    
    const uploadResponse = await uploadApi.uploadImage(formData, 'admin')
    if (uploadResponse.code === 200) {
      featureForm.image = uploadResponse.data.imageUrl
      ElMessage.success('特色图片上传成功')
    } else {
      ElMessage.error(uploadResponse.message || '特色图片上传失败')
    }
  } catch (error) {
    console.error('特色图片上传失败:', error)
    ElMessage.error('特色图片上传失败')
  }
}

// 大类管理操作
const addCategory = () => {
  currentCategory.value = null
  Object.assign(categoryForm, {
    name: '',
    type: '',
    description: '',
    items: []
  })
  showCategoryDialog.value = true
}

const editCategory = (category, index) => {
  currentCategory.value = index
  Object.assign(categoryForm, {
    name: category.name,
    type: category.type,
    description: category.description,
    items: category.items
  })
  showCategoryDialog.value = true
}

const deleteCategory = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这个大类吗？删除后该大类下的所有项目也会被删除！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    editForm.categories.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveCategory = () => {
  if (!categoryForm.name) {
    ElMessage.error('请输入大类名称')
    return
  }
  if (!categoryForm.type) {
    ElMessage.error('请选择大类类型')
    return
  }
  
  const category = {
    name: categoryForm.name,
    type: categoryForm.type,
    description: categoryForm.description,
    items: categoryForm.items || []
  }
  
  if (currentCategory.value !== null) {
    // 编辑
    editForm.categories[currentCategory.value] = category
  } else {
    // 新增
    editForm.categories.push(category)
  }
  
  showCategoryDialog.value = false
  currentCategory.value = null
}

// CRUD 操作
const addItem = (categoryType, categoryIndex) => {
  currentEditCategory.value = categoryType
  currentEditItem.value = {
    name: '',
    description: '',
    price: 0,
    isAvailable: true,
    image: '',
    categoryIndex: categoryIndex
  }
  if (categoryType === 'landmarks') {
    currentEditItem.value.ticketPrice = 0
    currentEditItem.value.isOpen = true
  }
  showItemDialog.value = true
}

const editItem = (categoryType, item, index, categoryIndex) => {
  currentEditCategory.value = categoryType
  currentEditItem.value = { ...item, index, categoryIndex }
  showItemDialog.value = true
}

const deleteItem = async (categoryType, index, categoryIndex) => {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    editForm.categories[categoryIndex].items.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveItem = () => {
  if (!currentEditItem.value.name) {
    ElMessage.error('请输入名称')
    return
  }
  
  const item = { ...currentEditItem.value }
  delete item.index
  delete item.categoryIndex
  
  const categoryIndex = currentEditItem.value.categoryIndex
  
  if (currentEditItem.value.index !== null && currentEditItem.value.index !== undefined) {
    // 编辑
    editForm.categories[categoryIndex].items[currentEditItem.value.index] = item
  } else {
    // 新增
    editForm.categories[categoryIndex].items.push(item)
  }
  
  showItemDialog.value = false
  currentEditItem.value = null
}

// 图片上传处理
const handleImageUpload = async (file, category, index) => {
  try {
    const formData = new FormData()
    formData.append('image', file.raw)
    
    const uploadResponse = await uploadApi.uploadImage(formData, 'admin')
    if (uploadResponse.code === 200) {
      const imageUrl = uploadResponse.data.imageUrl
      
      // 更新当前编辑项的图片（对话框中立即显示）
      if (currentEditItem.value) {
        currentEditItem.value.image = imageUrl
      }
      
      // 如果是编辑现有项目，也更新 editForm 中的数据
      if (index !== null && index !== undefined) {
        editForm[category][index].image = imageUrl
      }
      
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(uploadResponse.message || '图片上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 获取类别名称
const getCategoryName = (category) => {
  const names = {
    clothing: '特色手信',
    food: '工艺小物',
    landmark: '纪念商品',
    feature: '文创产品',
    activity: '其他'
  }
  return names[category] || category
}


// 图片上传处理
const beforeIconUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleIconChange = async (file) => {
  try {
    // 先显示本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      regionForm.icon = e.target.result
    }
    reader.readAsDataURL(file.raw)
    
    // 然后上传到服务器
    const formData = new FormData()
    formData.append('image', file.raw)
    
    const uploadResponse = await uploadApi.uploadImage(formData, 'admin')
    if (uploadResponse.code === 200) {
      regionForm.icon = uploadResponse.data.imageUrl
      ElMessage.success('图标上传成功')
    } else {
      ElMessage.error(uploadResponse.message || '图标上传失败')
    }
  } catch (error) {
    console.error('图标上传失败:', error)
    ElMessage.error('图标上传失败')
  }
}

// IP角色图片上传处理
const handleIpChange = async (file) => {
  try {
    // 先显示本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      editForm.ip = e.target.result
    }
    reader.readAsDataURL(file.raw)
    
    // 然后上传到服务器
    const formData = new FormData()
    formData.append('image', file.raw)
    
    const uploadResponse = await uploadApi.uploadImage(formData, 'admin')
    if (uploadResponse.code === 200) {
      editForm.ip = uploadResponse.data.imageUrl
      ElMessage.success('IP角色图片上传成功')
    } else {
      ElMessage.error(uploadResponse.message || 'IP角色图片上传失败')
    }
  } catch (error) {
    console.error('IP角色图片上传失败:', error)
    ElMessage.error('IP角色图片上传失败')
  }
}

// 地区名称图片上传处理
const handleNameImageChange = async (file) => {
  try {
    // 先显示本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      regionForm.nameImage = e.target.result
    }
    reader.readAsDataURL(file.raw)
    
    // 然后上传到服务器
    const formData = new FormData()
    formData.append('image', file.raw)
    
    const uploadResponse = await uploadApi.uploadImage(formData, 'admin')
    if (uploadResponse.code === 200) {
      regionForm.nameImage = uploadResponse.data.imageUrl
      ElMessage.success('地区名称图片上传成功')
    } else {
      ElMessage.error(uploadResponse.message || '地区名称图片上传失败')
    }
  } catch (error) {
    console.error('地区名称图片上传失败:', error)
    ElMessage.error('地区名称图片上传失败')
  }
}

const viewRegion = async (region) => {
  selectedRegion.value = region
  showDetailDialog.value = true
  
  // 查看按钮只显示基本信息，不需要调用API
  // 直接使用region对象中的基本信息
}

const editRegion = (region) => {
  isEdit.value = true
  regionForm.id = region.id
  regionForm.name = region.name || ''
  regionForm.left = region.left || ''
  regionForm.top = region.top || ''
  regionForm.icon = region.icon || ''
  regionForm.nameImage = region.nameImage || ''
  regionForm.nameImageLeft = region.nameImageLeft || ''
  regionForm.nameImageTop = region.nameImageTop || ''
  regionForm.description = region.description || ''
  regionForm.isActive = region.isActive !== undefined ? region.isActive : true
  showAddDialog.value = true
}

const deleteRegion = async (region) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地区吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用后端删除接口
    const response = await regionApi.deleteRegion(region.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      // 重新加载列表
      await loadRegions()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除地区失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveRegion = async () => {
  try {
    const formData = {
      name: regionForm.name,
      left: regionForm.left,
      top: regionForm.top,
      icon: regionForm.icon,
      nameImage: regionForm.nameImage || null,
      nameImageLeft: regionForm.nameImageLeft || null,
      nameImageTop: regionForm.nameImageTop || null,
      description: regionForm.description,
      isActive: regionForm.isActive
    }
    
    if (isEdit.value) {
      // 编辑地区 - 调用更新接口
      const response = await regionApi.updateRegionBasic(regionForm.id, formData)
      if (response.code === 200) {
        ElMessage.success('更新成功')
        // 重新加载列表
        await loadRegions()
      } else {
        ElMessage.error(response.message || '更新失败')
        return
      }
    } else {
      // 添加地区 - 调用创建接口
      const response = await regionApi.createRegion(formData)
      if (response.code === 200) {
        ElMessage.success('添加成功')
        // 重新加载列表
        await loadRegions()
      } else {
        ElMessage.error(response.message || '添加失败')
        return
      }
    }
    
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    console.error('保存地区失败:', error)
    ElMessage.error('保存失败')
  }
}

const resetForm = () => {
  regionForm.id = undefined
  regionForm.name = ''
  regionForm.left = ''
  regionForm.top = ''
  regionForm.icon = ''
  regionForm.nameImage = ''
  regionForm.nameImageLeft = ''
  regionForm.nameImageTop = ''
  regionForm.description = ''
  regionForm.isActive = true
  isEdit.value = false
}

// 加载地区列表
const loadRegions = async () => {
  loading.value = true
  try {
    const response = await regionApi.getRegions()
    if (response.code === 200) {
      // 根据接口文档，regions字段包含：id, name, icon, left, top, description, isActive
      regions.value = response.data.regions || []
    } else {
      ElMessage.error(response.message || '加载地区列表失败')
    }
  } catch (error) {
    console.error('加载地区列表失败:', error)
    ElMessage.error('加载地区列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRegions()
})
</script>

<style scoped>
.region-management {
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

.region-detail {
  padding: 10px 0;
}

.icon-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.icon-uploader:hover {
  border-color: #409EFF;
}

.icon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.icon-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-tip {
  margin-top: 8px;
  color: #606266;
  font-size: 12px;
  text-align: center;
}

.icon-display {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.region-icon {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.region-name-link {
  color: #409EFF !important;
  font-weight: 500;
  text-decoration: none;
  padding: 0 !important;
  height: auto !important;
}

.region-name-link:hover {
  color: #66b1ff !important;
  text-decoration: underline;
}

.region-detail-window {
  max-height: 80vh;
  overflow-y: auto;
}

.detail-content {
  padding: 0;
}

.info-card {
  margin-bottom: 20px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.detail-sections {
  margin-top: 20px;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-content {
  max-height: 70vh;
  overflow-y: auto;
}

.edit-card {
  margin-bottom: 20px;
}

.edit-card:last-child {
  margin-bottom: 0;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.item-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.item-uploader:hover {
  border-color: #409EFF;
}

.item-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.item-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ip-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ip-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.ip-uploader:hover {
  border-color: #409EFF;
}

.ip-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.ip-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ip-display {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ip-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.category-section {
  margin-bottom: 20px;
}

.category-card {
  margin-bottom: 10px;
}

.category-actions {
  display: flex;
  gap: 8px;
}

/* 地区特色轮播图样式 */
.features-carousel {
  width: 100%;
}

.feature-item {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.feature-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feature-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 20px;
}

.feature-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.feature-description {
  font-size: 16px;
  margin: 0;
  line-height: 1.4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.feature-preview-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.feature-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.feature-uploader:hover {
  border-color: #409EFF;
}

.feature-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.feature-upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


</style>
