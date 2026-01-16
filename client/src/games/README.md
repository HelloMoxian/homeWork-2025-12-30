# 游戏目录结构说明

## 目录组织
```
games/
  ├── types.ts              # 游戏类型定义和基础类
  ├── api.ts                # 游戏相关API
  ├── game2048/             # 2048游戏
  │   ├── index.tsx         # 游戏主组件
  │   ├── Game2048.ts       # 游戏逻辑
  │   ├── Settings.tsx      # 设置界面
  │   ├── styles/           # 样式资源
  │   └── assets/           # 图片资源
  ├── followDance/          # 跟随跳舞
  │   ├── index.tsx
  │   ├── FollowDance.ts
  │   └── ...
  └── mathBattle/           # 数字大战
      ├── index.tsx
      ├── MathBattle.ts
      └── ...
```

## 开发规范

### 1. 每个游戏必须实现
- 继承 `BaseGame` 类
- 实现 `init()` 和 `reset()` 方法
- 在游戏开始时调用 `start()`
- 在游戏结束时调用 `end()`
- 需要存档时调用 `saveGame()`
- 需要读档时调用 `loadGame()`

### 2. 组件导出
每个游戏的 `index.tsx` 应该导出：
- 默认组件：游戏主界面
- GameSettings：游戏设置组件（可选）

### 3. 数据上报
游戏结束时会自动上报：
- 游戏ID
- 本局分数
- 游戏时长

后端会自动更新：
- 游戏次数
- 累计游戏时间
- 今日游戏时间
- 历史最高分
- 今日最高分
