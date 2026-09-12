# Itkim — Personal Portfolio

个人计算机专业简历 + 项目作品集 + GitHub 展示 + 项目技术文档。

**技术栈**：React 18 + TypeScript + Vite · 零第三方动画/路由/图标库 · 背景 = 原生 Canvas 2D

## 快速开始

```bash
npm install       # 首次安装依赖
npm run dev       # 开发模式（http://localhost:5173）
npm run build     # 构建纯静态产物到 dist/
npm run preview   # 本地预览构建产物（输入地址即可访问）
```

构建产物是**纯静态 HTML/JS/CSS**（hash 路由 + 相对路径），可部署到 GitHub Pages、
Netlify、Vercel 或任意静态服务器的任意子路径。

## 目录结构

```
├── index.html                  # SEO（title / description / OG）
├── data/
│   └── projects.json           # ★ 项目数据库：加项目只改这里
├── public/
│   ├── favicon.svg
│   └── projects/<slug>/        # ★ 项目图片：cover.svg/png + screenshots/
├── src/
│   ├── background/             # 背景动画引擎（与 UI 完全分离）
│   │   ├── engine.ts           #   总控：单 rAF 循环 / resize / DPR / 降级 / 配置
│   │   ├── pointer.ts          #   全局指针状态（唯一监听点）
│   │   ├── glow.ts             #   预渲染发光贴图（共用，替代每帧建渐变）
│   │   ├── particles.ts        #   粒子对象池 + 爆散 + 弧线重组
│   │   ├── stars.ts            #   分层星野 + 北极星 + 闪烁 + 点击命中
│   │   ├── aurora.ts           #   极光（1/4 分辨率离屏渲染）
│   │   └── meteors.ts          #   流星雨 + 点击爆散→重组状态机
│   ├── components/             # UI 组件（不含动画逻辑）
│   ├── components/project/     # 详情页 + 动态大纲
│   ├── data/site.ts            # ★ 个人信息：名字/简介/技能/教育
│   ├── hooks/                  # hash 路由、滚动监听
│   └── styles/global.css
```

## 如何添加一个新项目（3 步）

1. **建图片目录**：`public/projects/<新项目slug>/cover.svg`（或 cover.png），
   截图放 `screenshots/01.png …`
2. **加数据**：在 `data/projects.json` 数组里加一个对象：

```json
{
  "slug": "my-new-project",
  "name": "项目名",
  "description": "一句话简介",
  "cover": "projects/my-new-project/cover.svg",
  "technologies": ["C++"],
  "date": "2026-10",
  "github": "https://github.com/Itkim666/你的仓库",
  "demo": "",
  "status": "Completed",
  "tags": ["Game"],
  "details": {
    "background": "项目背景…",
    "goals": "项目目标…",
    "features": ["功能1", "功能2"],
    "architecture": "系统架构…",
    "process": "开发过程…",
    "problems": [{ "problem": "遇到的问题", "solution": "怎么解决的" }],
    "results": "项目成果…",
    "screenshots": ["projects/my-new-project/screenshots/01.png"]
  }
}
```

3. 完成。首页卡片、详情页、大纲（自动按 details 里存在的字段生成）全部自动出现。

> `github` / `demo` 留空字符串时对应按钮自动隐藏；`details` 里省略的字段对应章节
> 不渲染 —— 缺什么都不会崩。

## 需要替换的占位信息

- `src/data/site.ts`：教育经历（`My University`）、简介、邮箱（填上即显示）
- `data/projects.json`：两个示例项目的真实信息与仓库链接

## 背景动画说明

- 全部效果共用**一个 canvas、一个 requestAnimationFrame 循环**（性能最优解）
- 极光渲染到 1/4 分辨率离屏画布再放大，天然柔化且每帧只有 4 次填充
- **流星**：并发上限 4 颗，平均同屏约 2 颗、偶尔满 4 颗。用指数分布生成间隔，因此成簇出现
  而非固定节奏；每颗流星的位置、角度（16°–58°）、速度（150–570 px/s）、长度、宽度、透明度独立随机
- **点击流星**（核心交互）：命中检测用点到尾迹线段的最短距离，只影响被点中的那一颗。
  被点击后立即停止原运动 → 爆散 70–120 颗粒子向四周飞散 → 约 0.5s 后粒子被引导回头部
  （带切向漩涡 + 残余偏移，轨迹呈弧线而非直线）→ 重新成形并恢复巡航
- **悬停**流星只做轻微粒子化（上限 0.5）并轻微偏转，不打断运动；点击才是完全爆散
- **点击普通星星**产生一次小型粒子闪烁反馈（8–15 颗），不抢占流星点击效果
- 点击落在链接/按钮上时不触发背景特效
- **星野**：分层大小（大量小星作底、中等星增加层次、少量大星带光晕作焦点）；
  用「抖动网格」分布 —— 位置在格内随机，保证无空洞也不成堆聚集
- **闪烁**：约 1/4 星星稳定发光，其余各有独立的频率与相位；正弦整形后偏向暗部，
  形成「亮→最亮→暗→几乎消失→再出现」；少量大中星会以极慢周期偶尔闪一次
- **粒子**来自固定容量对象池，运行时零对象分配；发光粒子用预渲染贴图绘制（避免每帧建渐变）
- 自动降级：触屏设备（手机+平板）或小窗口自动降档；帧时长 EMA 持续超标再降一档（单向）
- `prefers-reduced-motion: reduce` → 渲染一帧静态夜空，不启动循环、禁用点击交互
- 页面隐藏（切换标签页）时暂停循环

### 调参入口

常用参数集中在 `src/background/engine.ts` 顶部的 `HIGH` / `LOW` / `STATIC` 三组配置：

| 字段 | 含义 |
|---|---|
| `stars` | 星星数量 |
| `meteors` | 流星并发上限 |
| `meanGap` | 流星平均生成间隔（秒），越小越密 |
| `particles` | 粒子池容量 |
| `dust` | 常驻漂浮微粒数量 |

开发模式下（`npm run dev`）控制台可访问 `window.__bg.debug()` 查看实时状态
（并发流星数、粒子数、帧率、是否降级），生产构建会自动剥离该调试句柄。
