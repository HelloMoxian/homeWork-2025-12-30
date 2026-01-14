# 家庭成员功能实现文档

## 功能概述

本文档描述了"家庭成员"功能模块的完整实现，包括前端界面、后端API、数据存储设计等。

## 1. 数据存储设计

### 1.1 存储方式

家庭成员功能使用 JSON 文件存储，所有数据位于 `fileDB/familyMembers/` 目录下：

- `members.json` - 成员基本信息
- `attributeDefinitions.json` - 属性定义
- `attributeValues.json` - 属性值

### 1.2 成员数据结构 (members.json)

```json
{
  "members": [
    {
      "id": "1",
      "nickname": "木木",           // 昵称（必选，唯一）
      "name": "张木木",             // 姓名
      "birthday_text": "2020年5月", // 生日文本
      "birthday_date": "2020-05-15", // 生日日期
      "zodiac_sign": "金牛座",      // 星座
      "chinese_zodiac": "鼠",       // 属相
      "avatar_path": "uploadFiles/members/avatars/xxx.jpg", // 头像路径
      "gender": "男",               // 性别
      "sort_weight": 0,             // 排序权重
      "created_at": "2026-01-12T00:00:00.000Z",
      "updated_at": "2026-01-12T00:00:00.000Z"
    }
  ],
  "last_member_id": 1
}
```

### 1.3 属性定义数据结构 (attributeDefinitions.json)

```json
{
  "definitions": [
    {
      "id": "1",
      "attribute_name": "身高",                    // 属性名（必选）
      "attribute_type": "decimal",                 // 属性类型
      "options": null,                             // 可选项（JSON字符串）
      "attribute_logo": "uploadFiles/members/logos/xxx.png", // 属性图标
      "sort_weight": 0,                            // 排序权重
      "created_at": "2026-01-12T00:00:00.000Z",
      "updated_at": "2026-01-12T00:00:00.000Z"
    }
  ],
  "last_definition_id": 1
}
```

**属性类型说明：**
- `integer` - 整数
- `string` - 字符串
- `decimal` - 小数
- `checkbox` - 复选框
- `image` - 图片

### 1.4 属性值数据结构 (attributeValues.json)

```json
{
  "values": [
    {
      "id": "1",
      "member_id": "1",        // 成员ID
      "attribute_id": "1",     // 属性定义ID
      "value_text": null,      // 文本值
      "value_number": 110.5,   // 数字值
      "value_boolean": null,   // 布尔值
      "value_image": null,     // 图片路径
      "created_at": "2026-01-12T00:00:00.000Z",
      "updated_at": "2026-01-12T00:00:00.000Z"
    }
  ],
  "last_value_id": 1
}
```

## 2. 后端API接口

### 2.1 家庭成员接口

- `GET /api/family-members` - 获取所有成员（按权重排序）
- `GET /api/family-members/:id` - 获取单个成员
- `POST /api/family-members` - 创建成员
- `PUT /api/family-members/:id` - 更新成员
- `DELETE /api/family-members/:id` - 删除成员

### 2.2 属性定义接口

- `GET /api/member-attributes` - 获取所有属性定义
- `POST /api/member-attributes` - 创建属性定义
- `PUT /api/member-attributes/:id` - 更新属性定义
- `DELETE /api/member-attributes/:id` - 删除属性定义

### 2.3 属性值接口

- `GET /api/family-members/:memberId/attributes` - 获取成员的属性值
- `GET /api/member-attribute-values` - 获取所有属性值
- `POST /api/member-attribute-values` - 设置或更新属性值
- `DELETE /api/member-attribute-values/:id` - 删除属性值

### 2.4 文件上传接口

- `POST /api/upload/avatar` - 上传成员头像
- `POST /api/upload/logo` - 上传属性图标
- `POST /api/upload/attribute` - 上传属性值图片

## 3. 后端实现

### 3.1 文件管理器

文件管理器位于 `server/src/utils/familyMembersFileManager.ts`，提供以下功能：

**成员管理：**
- `getAllMembers()` - 获取所有成员
- `getMemberById(id)` - 按ID获取成员
- `getMemberByNickname(nickname)` - 按昵称获取成员
- `createMember(data)` - 创建成员
- `updateMember(id, data)` - 更新成员
- `deleteMember(id)` - 删除成员

**属性定义管理：**
- `getAllAttributeDefinitions()` - 获取所有属性定义
- `getAttributeDefinitionById(id)` - 按ID获取属性定义
- `getAttributeDefinitionByName(name)` - 按名称获取属性定义
- `createAttributeDefinition(data)` - 创建属性定义
- `updateAttributeDefinition(id, data)` - 更新属性定义
- `deleteAttributeDefinition(id)` - 删除属性定义

**属性值管理：**
- `getAllAttributeValues()` - 获取所有属性值
- `getAttributeValuesByMember(memberId)` - 获取成员的属性值
- `getAllAttributeValuesWithDetails()` - 获取所有属性值（含详情）
- `setAttributeValue(data)` - 设置或更新属性值
- `deleteAttributeValue(id)` - 删除属性值

### 3.2 路由文件

路由文件位于 `server/src/routes/familyMembers.ts`，注册所有 API 端点。

## 4. 前端组件

### 4.1 主页面组件 (FamilyMembersPage.tsx)

- 显示"添加成员"和"添加属性"按钮
- 表格展示所有成员及其属性
- 支持内联编辑属性值

### 4.2 添加成员对话框 (AddMemberDialog.tsx)

- 输入昵称（必选）
- 输入姓名、生日、性别等信息
- 上传头像

### 4.3 添加属性对话框 (AddAttributeDialog.tsx)

- 输入属性名（必选）
- 选择属性类型
- 上传属性图标

### 4.4 单元格编辑器 (CellEditor.tsx)

- 根据属性类型展示不同的编辑器
- 支持实时保存

## 5. 数据迁移

### 5.1 备份数据

```bash
cp -r fileDB/familyMembers/ backup/familyMembers/
cp -r uploadFiles/members/ backup/members/
```

### 5.2 还原数据

```bash
cp -r backup/familyMembers/ fileDB/familyMembers/
cp -r backup/members/ uploadFiles/members/
```

## 6. 与旧版本的差异

### 旧版本 (SQLite)
- 使用 SQLite 数据库存储
- 需要 better-sqlite3 依赖
- 数据库迁移较复杂

### 新版本 (JSON 文件)
- 使用 JSON 文件存储
- 无需数据库依赖
- 数据迁移只需复制文件
- 更容易进行 Git 版本控制
