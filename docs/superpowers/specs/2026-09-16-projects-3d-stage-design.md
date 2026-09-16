# Projects 3D Stage Design

## Goal

把首页 Projects 从普通卡片网格改造成一个以三个精选项目为主体的 3D 作品展示舞台，同时保留“View All Projects”入口查看全部四个项目。

## Scope

- 首页正式展示 `projects.slice(0, 3)`，第 4 个项目只出现在全部项目页。
- 不修改项目数据模型、项目详情路由或全部项目页的数据来源。
- 不引入 GSAP、Three.js 或其他新依赖；沿用 React + CSS 3D + 原生浏览器 API。
- 不改变 Projects 之外的页面结构、文字内容和全站背景系统。

## Experience

1. Projects 舞台进入视口时，三个项目从不同方向聚拢到中心。
2. 三个项目短暂堆叠，形成明确的前后景深。
3. 项目从堆叠展开为三个 3D 轨道位置：前方、左后方、右后方。
4. 舞台进入循环展示状态，每隔一段时间切换前方项目；切换使用 `translate3d`、`scale`、`rotateY`、`opacity` 与 `filter: blur()` 的连续过渡。
5. 前方项目显示封面、名称、状态/标签、简介和 View Project；后方项目只保持弱化的封面与有限信息。
6. 鼠标在舞台内移动时，通过 rAF 平滑驱动轻微的 rotateX/rotateY 倾斜；离开时回到零点。
7. Hover 前方或后方项目时，项目轻微靠近、放大、变清晰；点击任意项目仍进入原有 hash 详情页。
8. 桌面端使用完整 3D 舞台；平板降低位移和倾斜；手机端关闭鼠标倾斜，改成可横向滑动/点击切换的单卡 Carousel。

## Component Design

### `ProjectStage`

新建 `src/components/ProjectStage.tsx`，只负责精选项目的舞台状态、视口触发、自动切换、指针平滑和项目卡片渲染。它接收 `Project[]`，不读取或改变项目数据源。

舞台阶段为 `entering`、`stacked`、`orbit`。阶段由 IntersectionObserver 首次进入视口触发，定时器负责从 entering 过渡到 stacked，再过渡到 orbit。orbit 阶段用定时器顺序切换 activeIndex；组件卸载或离开页面时清理所有 observer、timer 和 rAF。

每个项目根据 `(index - activeIndex + count) % count` 映射到 front/right/left 三个槽位。槽位只表达布局状态，视觉动画由 CSS transition 与 CSS custom properties 完成，避免每帧写布局属性。

### `ProjectsSection`

把 `projects.map` 替换为 `projects.slice(0, 3)` 传给 `ProjectStage`。保留现有 Section 外壳和说明文字，在舞台下方放置低调的 `View All Projects →` 文字入口，链接仍为 `#/all-projects`。

### CSS

在 `src/styles/global.css` 增加独立的 `project-stage-*` 样式块，避免继续复用普通 `.pcard` 网格定位规则。舞台卡片使用 absolute positioning、`perspective`、`transform-style: preserve-3d` 和统一过渡曲线；前景信息使用 opacity、translateY、clip-path 和 blur 过渡。保留普通 `.pcard` 样式供全部项目页使用。

## Accessibility and Performance

- 所有项目仍使用语义化 article、链接和可见的 View Project 入口。
- `prefers-reduced-motion: reduce` 时取消阶段动画、轨道自动切换和指针倾斜，直接显示前方项目。
- 指针处理使用一个 requestAnimationFrame 循环和 passive 事件，不在 mousemove 中触发 React state 更新。
- 自动切换只在舞台进入视口后启动，页面卸载时清理资源。
- 图片继续使用当前数据中的 cover 路径和 lazy loading。

## Acceptance Criteria

- 首页 Projects 只有一行 3D 舞台，不出现 2×2 或多行精选项目网格。
- 页面滚动到 Projects 后能看到聚拢、堆叠、展开和循环切换。
- 当前项目具有明显的前景、放大和完整信息层级，后方项目有缩小、透明度和模糊差异。
- 鼠标交互轻微且可恢复；手机端没有强制桌面鼠标效果。
- `View All Projects` 进入原有全部项目页，并能看到全部 4 个项目。
- `npm run build` 通过，且不新增依赖。
