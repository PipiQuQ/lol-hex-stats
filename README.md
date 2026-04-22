# LOL海克斯乱斗战绩统计系统

为LOL国服海克斯乱斗自定义5v5对局设计的自动统计战绩、计算玩家评级的H5网页系统。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **样式**: TailwindCSS 3.4
- **图表**: ECharts 5
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **后端 API**: Vercel Serverless Functions (Node.js)
- **数据库**: Supabase (PostgreSQL)

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
├── api/              # Vercel Serverless Functions
│   ├── players.ts    # 玩家API
│   ├── matches.ts    # 对局API
│   ├── rankings.ts   # 排行榜API
│   ├── daily-best.ts # 每日最佳API
│   └── refresh.ts    # 数据刷新API
├── src/
│   ├── api/          # 前端API封装
│   ├── components/   # Vue组件
│   ├── views/        # 页面视图
│   ├── utils/        # 工具函数(评分算法等)
│   ├── stores/       # Pinia状态管理
│   └── types/        # TypeScript类型定义
└── public/
```

## 核心功能

- 战绩排行榜（综合评分排序）
- 每日最佳玩家评选
- 玩家详情页（英雄TOP5、趋势图、详细数据）
- 综合评分算法（胜率分+表现分+稳定性分，按英雄定位加权）
- 时间范围筛选（7天/30天/全部）

## 部署

项目部署到 Vercel，Serverless Functions 自动运行。

## License

MIT
