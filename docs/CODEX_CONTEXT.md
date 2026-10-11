# Itkim Portfolio：Codex 项目交接上下文

**用途：**这是一份从用户与 Codex 的历史对话整理出的项目交接摘要，方便后续 Codex 快速理解当前最终决策、项目状态与未完成事项。它不是逐字聊天记录。更新时间：2026-10-11（Asia/Shanghai）。

## 给后续 Codex 的首要说明

* 先读取本文件，再检查当前工作区、Git 状态和项目规则；本文件中的“当前决定”优先于已被后续要求替代的旧方案。
* 用户要求以后完成的项目改动同步到 GitHub。项目仓库是 `Itkim666/portfolio`，主分支为 `main`。
* 不要恢复已删除的项目或仓库，除非用户之后明确要求。
* 工作区已经有未提交改动。先逐项查看，不要重置、覆盖或顺手提交无关文件。
* 项目详情顶部定位与刷新回到首页顶部的代码修复已在 `afe7a26` 提交并推送；后续若继续处理，先做浏览器回归，不要重复实现。

## 项目基本信息

* 本地项目：`C:\Users\SYXD\.zcode\workspace\zcode-workflow\projects\Itkim-web-designn`
* GitHub：<https://github.com/Itkim666/portfolio>
* 线上网站：<https://itkim666.github.io/portfolio/>
* 技术：React、TypeScript、Vite、Canvas 2D；以静态站点部署到 GitHub Pages，使用 hash 路由。
* 本地构建命令：`npm run build`。项目规则要求源码改动提交前先构建；推送到 `main` 会触发 `.github/workflows/deploy.yml`。

## 当前已确定的产品与设计决定

* 网站项目数据只保留 `portfolio` 对应的 Personal Website 条目，位于 `data/projects.json`。
* GitHub 账户只保留 `portfolio` 仓库；`self-improvement`、`website-design` 和 `Itkim666` 个人主页仓库已按用户明确要求删除。
* 首页 Projects 已从 3D 环形舞台恢复成普通项目卡片单行展示；卡片行保持横向，最右侧有三个点按钮，链接到 `#/all-projects`。
* 目前项目列表只有一个项目，因此单行显示 Personal Website；后续项目可沿该行横向浏览。
* 首页头像已移除，首屏文字居中。整体网站继续沿用现有深色星空风格。
* 早期关于 3D 环形轨道、堆叠展开、星系叠加和沉浸式封面转场的大量要求属于已迭代的历史方案；当前“恢复单行普通卡片”的决定取代它们，不要擅自恢复 3D 展示。

## 已完成并发布

* Projects 单行卡片和最右侧三点入口已提交，提交号 `51998b1`（`恢复 Projects 单行卡片布局`）。
* 该提交已推送到 `main`；本地 Vite/TypeScript 构建通过，GitHub Actions 的 Pages build 与 deploy 均成功。
* 最近一次部署对应提交 `51998b1665eefb323b5a137c9bdda6c955bc9f43`。
* 项目详情顶部定位与刷新落点修复提交 `afe7a26` 已位于本地 `main` 与 `origin/main`。

## 最近修复：详情页顶部定位与刷新落点

* 用户要求点击项目后详情页从顶栏/页面顶部开始，而不是看起来从底部上滑；刷新时也应从首页顶部开始，而不是从 Projects 恢复。
* 代码修复已在 `afe7a26`（`fix: open project details at page top`）提交并推送到 `origin/main`。实现涉及 hash 路由、瞬时滚动定位与刷新时规范路由；页面内部的 “Back to Home” 仍保留有意的滚动位置恢复。
* 该提交已确认存在于本地 `main` 和 `origin/main`。本次整理没有执行真实浏览器回归，因此线上视觉行为仍应按需验证：点击卡片、直接打开详情 URL、刷新首页、刷新详情 URL，以及从详情返回首页。
* 不要仅凭旧反馈重复改写路由逻辑；先检查最新代码及当前未提交差异。

## 本次整理时观察到的未提交工作区状态

以下变更在本次文档任务开始前已存在，来源和完成度未确认。它们可能与滚动、动画性能或项目舞台恢复有关；后续 Codex 应先查看差异再决定是否继续：

* 已修改：`src/background/aurora.ts`、`engine.ts`、`meteors.ts`、`particles.ts`、`stars.ts`。
* 已修改：`src/components/Navbar.tsx`、`src/hooks/useScrollSpy.ts`、`src/utils/scrollMemory.ts`。
* 已删除（尚未提交）：`src/components/ProjectStage.tsx`。
* 已大幅修改（尚未提交）：`src/styles/global.css`，差异包含移除 Projects 3D 舞台相关样式。
* 未跟踪文件：根目录 `RULE.md` 和 `docs/superpowers/specs/2026-09-16-itkim-promo-video-design.md`。不要误删或随本次交接文档一起提交。

## 协作偏好

* 对网站视觉修改，用户看重整体美观、自然、精致和清晰；只改明确指定区域，避免擅改页面其他内容。
* 用户明确要求的最新方案覆盖历史方案；如果用户说“恢复”，先参考 Git 历史中最初的实现，但以当前明确描述为准。
* 完成修改后同步 GitHub，并说明构建和部署状态；若工作区已有无关改动，只提交本次明确涉及的文件。