---
name: lol-hex-stats-implementation
overview: 基于Vue 3 + Vite + Supabase实现LOL海克斯乱斗战绩统计H5系统，包含排行榜、玩家详情、评分算法、每日最佳等核心功能
design:
  architecture:
    framework: vue
  styleKeywords:
    - Cyberpunk Gaming
    - Dark Theme
    - Neon Accent
    - Glassmorphism
    - Neumorphism Light
    - Mobile First
    - Gradient Glow
  fontSystem:
    fontFamily: Roboto Condensed
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#00D9FF"
      - "#00FF88"
      - "#7B68EE"
    background:
      - "#0A0E17"
      - "#111827"
      - "#1A2332"
    text:
      - "#E8ECF0"
      - "#9CA3AF"
      - "#FFFFFF"
    functional:
      - "#00FF88"
      - "#FF4757"
      - "#FFBE0B"
todos:
  - id: init-project
    content: 初始化Vue3+Vite+TS+TailwindCSS项目脚手架，配置package.json/vite.config/tailwind/tsconfig/vercel.json
    status: completed
  - id: setup-types-utils
    content: 创建TypeScript类型定义(src/types/)、评分算法(src/utils/scoring.ts)、常量和格式化工具函数
    status: completed
  - id: setup-api-layer
    content: 搭建前端API层(src/api/)和Vercel Serverless Functions后端API(api/players/matches/rankings/daily-best/refresh)
    status: completed
  - id: build-home-page
    content: 实现首页视图及核心组件：排行榜、每日最佳卡片、时间筛选器、评分徽章、排名卡片
    status: completed
  - id: build-player-detail
    content: 实现玩家详情页及组件：头部信息、统计网格、英雄TOP5、ECharts趋势图表、详细数据表
    status: completed
---

## Product Overview

为LOL国服海克斯乱斗自定义5v5对局设计的自动统计战绩、计算玩家评级的H5网页系统。目标用户约20人的玩家群体，通过微信群分享链接查看战绩。

## Core Features

- **首页排行榜**: 展示所有玩家的总排行（排名/玩家名/场次/胜率/综合评分），每日最佳玩家卡片，时间范围筛选（最近7天/30天/全部），手动触发数据更新按钮
- **玩家详情页**: 基础统计数据（场次/胜率/MVP次数），常用英雄TOP5及对应胜率，近期趋势折线图（最近20场胜率变化），表现数据（场均KDA/伤害/承伤/助攻）
- **综合评分算法**: 胜率分(40%) + 表现分(40%) + 稳定性分(20%)，表现分按英雄定位（输出/坦克/辅助/刺客）加权计算，不足5场显示"样本不足"
- **每日最佳评选**: 当日场次>=2才有资格，当日胜率分(50%) + 当日表现分(50%)
- **数据模型**: 玩家表(players)、对局表(matches)、对局玩家详情表(match_players)
- **数据抓取**: 支持自动抓取(腾讯掌盟API)与降级方案(手动录入管理后台)

## Tech Stack

- **前端框架**: Vue 3 + TypeScript + Vite
- **样式**: TailwindCSS 4
- **图表**: ECharts 5
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **后端 API**: Vercel Serverless Functions (Node.js)
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel 全栈托管

## Tech Architecture

### 系统架构

```
用户(微信H5) --> Vue 3 SPA前端 --> Vercel Serverless Functions API --> Supabase PostgreSQL
                                                    |
                                            腾讯战绩API / 手动录入
```

采用前后端分离架构，前端为Vue 3单页应用，后端使用Vercel Serverless Functions提供RESTful API，Supabase作为持久化存储。

### 模块划分

- **API模块** (`src/api/`): 封装所有后端API调用，含类型定义
- **组件模块** (`src/components/`): 可复用UI组件（排名卡片、英雄标签、图表容器等）
- **视图模块** (`src/views/`): 页面级组件（首页排行榜、玩家详情页）
- **工具模块** (`src/utils/`): 评分算法、数据格式化、常量定义
- **状态管理** (`src/stores/`): Pinia stores管理全局状态（玩家列表、筛选条件等）
- **Serverless函数** (`api/`): Vercel Functions目录，处理数据CRUD和评分计算

### 数据流

```
用户操作 --> Vue Component --> Pinia Store --> API调用 --> Vercel Function --> Supabase
                                                                    -->
                                                              腾讯战绩API(可选)
```

## Implementation Details

### 核心目录结构

```
lol-hex-stats/
├── api/                          # Vercel Serverless Functions
│   ├── players.ts                # [NEW] 玩家相关API: GET列表/详情, POST添加玩家
│   ├── matches.ts                # [NEW] 对局API: GET对局列表, POST手动录入对局
│   ├── rankings.ts               # [NEW] 排行榜API: 计算并返回排行数据(含评分算法)
│   ├── daily-best.ts             # [NEW] 每日最佳API: 计算当日最佳玩家
│   └── refresh.ts                # [NEW] 数据刷新API: 触发数据更新/抓取
├── src/
│   ├── api/                      # [NEW] 前端API封装层
│   │   ├── index.ts              # [NEW] Axios实例配置, 拦截器, 基础URL
│   │   ├── player.ts             # [NEW] 玩家API调用方法
│   │   ├── match.ts              # [NEW] 对局API调用方法
│   │   └── ranking.ts            # [NEW] 排行榜/每日最佳API调用
│   ├── components/               # [NEW] 可复用Vue组件
│   │   ├── RankCard.vue          # [NEW] 排行榜单个玩家卡片组件
│   │   ├── DailyBestCard.vue     # [NEW] 每日最佳玩家展示卡片
│   │   ├── HeroTag.vue           # [NEW] 英雄标签(名称+胜率)
│   │   ├── TrendChart.vue        # [NEW] ECharts趋势折线图封装
│   │   ├── StatCard.vue          # [NEW] 统计数据展示卡片
│   │   ├── ScoreBadge.vue        # [NEW] 评分徽章(星级显示,样本不足灰显)
│   │   └── TimeFilter.vue        # [NEW] 时间范围筛选器(7天/30天/全部)
│   ├── views/                    # [NEW] 页面视图
│   │   ├── HomeView.vue          # [NEW] 首页: 排行榜+每日最佳+筛选
│   │   └── PlayerDetailView.vue  # [NEW] 玩家详情页: 数据+英雄+趋势图
│   ├── utils/                    # [NEW] 工具函数
│   │   ├── scoring.ts            # [NEW] 核心评分算法(综合评分+每日最佳+定位加权)
│   │   ├── constants.ts          # [NEW] 常量定义(英雄定位分类映射等)
│   │   └── formatters.ts         # [NEW] 数据格式化(KDA计算,时间格式化等)
│   ├── stores/                   # [NEW] Pinia状态管理
│   │   ├── playerStore.ts        # [NEW] 玩家数据状态
│   │   └── uiStore.ts            # [NEW] UI状态(筛选范围,加载态等)
│   ├── types/                    # [NEW] TypeScript类型定义
│   │   ├── player.ts             # [NEW] Player, HeroRole等类型
│   │   ├── match.ts              # [NEW] Match, MatchPlayer类型
│   │   └── ranking.ts            # [NEW] RankingEntry, DailyBest类型
│   ├── App.vue                   # [NEW] 根组件
│   ├── main.ts                   # [NEW] 应用入口
│   └── router.ts                 # [NEW] Vue Router路由配置
├── public/                       # [NEW] 静态资源
├── package.json                  # [NEW] 项目依赖配置
├── vite.config.ts                # [NEW] Vite构建配置
├── tailwind.config.js            # [NEW] TailwindCSS配置
├── tsconfig.json                 # [NEW] TypeScript配置
├── vercel.json                   # [NEW] Vercel部署配置(函数路由/重定向)
├── .env.example                  # [NEW] 环境变量模板(Supabase URL/Key等)
└── index.html                    # [NEW] HTML入口
```

### 关键实现要点

1. **评分算法**: `scoring.ts` 实现纯函数，支持按hero_role选择不同权重系数，前后端共用同一套逻辑保证一致性
2. **ECharts趋势图**: `TrendChart.vue` 封装ECharts实例，传入最近20场的胜率数组，响应式自适应容器尺寸
3. **Vercel Functions**: 使用TypeScript编写，每个API一个文件，通过vercel.json配置路由
4. **Supabase连接**: 使用@supabase/supabase-js客户端库，环境变量管理连接信息
5. **H5适配**: TailwindCSS确保移动端响应式布局，针对微信内置浏览器优化viewport
6. **性能**: 排行榜数据缓存策略，评分结果增量计算避免全量重算

## 设计风格

采用**游戏电竞风格(Gaming/Cyberpunk Neon)**设计语言，以深色背景为主基调，搭配霓虹蓝绿色调的强调色，营造LOL游戏氛围感。界面具有科技感和竞技感，适合年轻玩家群体在移动端浏览。

## 页面设计

### 页面一：首页 - 战绩排行榜

这是系统的核心页面，展示完整的玩家排行榜和每日最佳信息。

#### 区块1 - 顶部导航栏

固定顶部导航栏，左侧显示"LOL海克斯乱斗"标题和游戏图标，右侧放置数据更新按钮。使用渐变深色背景，底部带微光分割线。导航栏高度56px，移动端友好。

#### 区块2 - 每日最佳玩家卡片

页面首屏焦点区域，使用大号卡片设计展示当日MVP玩家。包含玩家头像、昵称、当日评分（大字号高亮）、当日战绩摘要（如3胜0负）。卡片使用玻璃拟态效果(glassmorphism)，半透明背景加模糊，边框带霓虹光晕效果。

#### 区块3 - 时间范围筛选器

横向排列的筛选按钮组（最近7天/30天/全部），选中态使用主题色填充高亮，未选中态为描边样式。按钮下方跟随下划线滑动动画指示当前选项。

#### 区块4 - 排行榜列表

垂直滚动的玩家排名列表，每行展示：排名序号（前三名用金银铜特殊标识）、玩家头像和昵称、场次、胜率百分比条形指示、综合评分星标。列表项之间用细线分隔，点击整行可跳转到玩家详情页。交替行使用微妙的背景色差异增强可读性。

### 页面二：玩家详情页

深入展示单个玩家的完整数据和表现分析。

#### 区块1 - 玩家头部信息区

返回按钮 + 玩家头像(大圆形) + 昵称 + 综合评分大字展示。背景使用从上到下的深色渐变，头像周围带光环效果表示评级等级。

#### 区块2 - 基础统计数据网格

2x2或4列网格布局的数据卡片区，每张卡片展示一个核心指标：总场次、胜率(带进度环)、MVP次数、平均评分。卡片使用微凸起效果(neumorphism轻量版)，数值使用等宽字体突出显示。

#### 区块3 - 常用英雄TOP5

横向排列的英雄标签列表，每个标签显示英雄名称和该英雄下的胜率百分比，胜率高的标签用绿色调强调。标签可点击展开更多该英雄数据。

#### 区块4 - 近期表现趋势图

ECharts折线图区域，X轴为最近20场对局的序号，Y轴为当场的评分/表现值，折线带面积渐变填充。图表上方提供KDA切换/评分切换的tab。整体区域使用圆角卡片包裹，深色内背景衬托图表。

#### 区块5 - 详细表现数据

表格形式展示详细数据：场均击杀/死亡/助攻(KDA)、场均造成伤害、场均承受伤害、场均治疗量、场均金币收入。每项数据附带迷你柱状对比条。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在实现过程中探索项目代码结构、验证文件引用关系、检查代码一致性
- Expected outcome: 确保各模块间依赖正确，导入路径无误，代码规范统一