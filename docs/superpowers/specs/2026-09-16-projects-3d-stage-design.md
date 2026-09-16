# All-Projects Continuous Orbit Design

## Goal

首页 Projects 直接在同一个 3D 空间中展示全部四个项目。项目先在中心堆叠，依次展开为椭圆轨道，并沿同一条连续时间轴缓慢、无缝地循环运动。

## Constraints

- 首页传入全部 `projects`；不使用 `slice(0, 3)`，不再放置 View All Projects 入口。
- 保持一行视觉舞台，不使用网格、多行卡片或传统 Carousel。
- 不引入依赖；使用 React、CSS 3D、IntersectionObserver 与 requestAnimationFrame。
- 默认只展示项目封面；文字仅在 Hover 或键盘聚焦时，延迟于卡片前移/放大后出现。
- 每张项目卡片的整个区域都是详情页链接。

## Motion Model

`ProjectStage` 为每张卡片保存 DOM 引用，并在单个 requestAnimationFrame 循环中按角度计算：

`angle = projectIndex / projectCount × 2π + elapsed / 42s × 2π`

由角度实时得到 X、Y、Z、scale、opacity、blur 与 rotateY。cosine depth 决定前后关系：中心前方达到 100% 清晰度，侧方保持约 73%，后方保持约 46%，从不完全隐藏。四个项目等距分布在同一轨道，前方、左右与后方同时存在。

## Intro Sequence

Projects 首次进入视口后：

1. 所有卡片以小幅偏移、rotation 和不同 Z 值堆叠在中心；
2. 停顿 860ms；
3. 每张卡片按索引错开 0.13 的进度，逐张向轨道位置展开；
4. 展开完成后启用 42 秒一圈的连续轨道。

## Interaction and Fallback

- 鼠标控制整个场景的轻微 rotateX/rotateY。
- Hover 目标卡平滑向前、放大、提高清晰度；其余卡片只轻微压暗，仍保持可见。轨道速度通过插值逐渐接近暂停，鼠标离开后平滑恢复。
- 项目文字的 opacity、blur、clip-path 与 translateY 比卡片 hover 延迟约 0.32–0.36 秒，保证“先靠近，再显示信息”。
- 移动端改为横向 touch 浏览，不强制使用桌面透视；减少动态效果偏好停在静态轨道初始态。

## Verification

- JSON 中四个项目都传入首页舞台。
- 源码不存在 `projects.slice(0, 3)` 或 `stage-all-link`。
- `npm run build` 与 `git diff --check` 通过。
