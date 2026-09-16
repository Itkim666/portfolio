# Projects 3D Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home-page Projects grid with a three-project 3D stage that gathers, stacks, unfolds into an orbit-like carousel, and keeps all four projects available on the existing all-projects page.

**Architecture:** Keep `data/projects.json` and `Project` unchanged. Add a focused `ProjectStage` component that owns stage timing and pointer smoothing, render only the first three projects from `ProjectsSection`, and use a dedicated CSS stage layer for 3D slot transforms and progressive information reveal.

**Tech Stack:** React 18, TypeScript, Vite, CSS 3D transforms, IntersectionObserver, requestAnimationFrame; no new dependency.

**Spec:** `docs/superpowers/specs/2026-09-16-projects-3d-stage-design.md`

## Global Constraints

- 首页正式展示 `projects.slice(0, 3)`，第 4 个项目只出现在全部项目页。
- 不引入 GSAP、Three.js 或其他新依赖；沿用 React + CSS 3D + 原生浏览器 API。
- `prefers-reduced-motion: reduce` 时取消阶段动画、轨道自动切换和指针倾斜。
- 源码改动后提交前先运行 `npm run build`。
- 只提交本功能文件和设计/计划文档，不提交未跟踪的 `RULE.md`。

### Task 1: Add the stateful 3D stage component

**Files:**
- Create: `src/components/ProjectStage.tsx`
- Reference: `src/types.ts`, `src/utils/scrollMemory.ts`, `src/components/GitHubIcon.tsx`

**Interfaces:**
- Consumes: `projects: Project[]` with exactly three featured projects from `ProjectsSection`.
- Produces: `<ProjectStage projects={featuredProjects} />`; project links preserve `#/project/<slug>` and call `rememberScrollFromCard()` before navigation.

- [ ] **Step 1: Define stage phases and slot values.**

  Use the exact types `type StagePhase = 'entering' | 'stacked' | 'orbit'` and `type StageSlot = 'front' | 'right' | 'left'`. Add a `getSlot(index: number, activeIndex: number, count: number): StageSlot` helper that returns `front` for relative index `0`, `right` for `1`, and `left` for the remaining index.

- [ ] **Step 2: Add viewport-triggered phase timing.**

  Observe the stage root with `IntersectionObserver({ threshold: 0.24 })`. On the first intersection, set `entering`, schedule `stacked` after `720ms`, then `orbit` after another `700ms`; disconnect after triggering. Clear both timers in the effect cleanup.

- [ ] **Step 3: Add orbit autoplay and hover state.**

  When phase is `orbit`, schedule `setActiveIndex((current) => (current + 1) % projects.length)` every `5200ms`. Pause the interval while a card is hovered and resume it when hover ends. Track `hoveredIndex` only for rendering class names; do not use it for pointer tilt.

- [ ] **Step 4: Add smoothed pointer tilt.**

  Store target and current pointer values in refs. On pointer move, normalize the stage-local coordinates to `[-1, 1]`; on pointer leave, target zero. Use one rAF loop to approach the target with `current += (target - current) * 0.08`, then write `--stage-tilt-x` and `--stage-tilt-y` to the scene element. Cancel the rAF on cleanup.

- [ ] **Step 5: Render accessible stage cards.**

  Render an `article` per project with the classes `stage-card`, `stage-card--<slot>`, `is-active` and `is-hovered` as applicable. Keep each cover as a link to `#/project/${p.slug}` and include a visible front-card body containing name, status, tags, clamped description, and `View Project`. Use `loading="lazy"` and the existing cover fallback behavior. Render `View All Projects →` outside the stage in `ProjectsSection`, not inside this component.

### Task 2: Replace the home Projects grid with the stage

**Files:**
- Modify: `src/components/ProjectsSection.tsx`

**Interfaces:**
- Consumes: `projects` from `src/data/projects.ts`.
- Produces: one `ProjectStage` with `projects.slice(0, 3)` and a low-emphasis `#/all-projects` link.

- [ ] **Step 1: Import and render only the featured slice.**

  Replace the `.project-grid` map with:

  ```tsx
  <ProjectStage projects={projects.slice(0, 3)} />
  ```

  This leaves the fourth project in the shared data source so `AllProjectsPage` continues to render all four.

- [ ] **Step 2: Add the all-projects control.**

  Add an anchor with class `stage-all-link`, `href="#/all-projects"`, and accessible label `查看全部项目`, with visible text `View All Projects <span aria-hidden="true">→</span>`. Keep it after the stage and outside the 3D transform context.

### Task 3: Implement the 3D stage visual system and responsive fallback

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `project-stage`, `project-stage__scene`, `stage-card--front/right/left`, `is-entering`, `is-stacked`, `is-orbit`, `is-active`, `is-hovered` class names from Tasks 1–2.
- Produces: desktop 3D stage, reduced-motion behavior, tablet damping, and mobile touch-friendly presentation.

- [ ] **Step 1: Add stage geometry.**

  Create a dedicated block with a minimum height around `590px`, `perspective: 1300px`, and an isolated scene. Set the scene transform to `rotateX(var(--stage-tilt-x, 0deg)) rotateY(var(--stage-tilt-y, 0deg))` with a transition only when pointer target is reset. The card layer uses `transform-style: preserve-3d`.

- [ ] **Step 2: Add entering and stacked states.**

  Position cards at the center and use different initial transforms for the three cards while `.is-entering` is active. When `.is-stacked` is active, bring all cards to near-center with descending translateZ values and z-indexes. Use a shared `cubic-bezier(0.22, 1, 0.36, 1)` transition with durations between `0.75s` and `1.1s`.

- [ ] **Step 3: Add orbit slot transforms.**

  Define the front card around `translate3d(0, 0, 150px) scale(1) rotateY(0deg)`, the right card around `translate3d(260px, -22px, -90px) scale(.76) rotateY(-28deg)`, and the left card around `translate3d(-260px, 18px, -90px) scale(.76) rotateY(28deg)`. Set rear cards to lower opacity and small blur; the active card gets the highest z-index and full clarity.

- [ ] **Step 4: Add progressive information reveal.**

  Keep the cover visible for all slots. For non-front cards, hide body copy using opacity, translateY, blur, and `clip-path: inset(0 0 100% 0)`. For `.is-active`, reveal in order with CSS transition delays for name, tags/metadata, description, and View Project link. Do not use `display: none` for the animated content.

- [ ] **Step 5: Add hover, lighting, and all-projects link.**

  Add a restrained pointer glow using a pseudo-element, raise hovered cards by about `24px`, and sharpen their cover without exceeding the front card scale. Style `stage-all-link` as a quiet text control with arrow translation and underline reveal on hover.

- [ ] **Step 6: Add tablet, mobile, and reduced-motion rules.**

  At `max-width: 960px`, reduce orbit X offsets and perspective. At `max-width: 640px`, disable scene tilt, use one centered card with a short horizontal overflow strip for touch movement, preserve active-card reveal, and keep the all-projects link below. In `prefers-reduced-motion: reduce`, set transitions/animations to near-zero, force orbit state, and keep the front card readable.

### Task 4: Verify behavior and production build

**Files:**
- Verify: `src/components/ProjectStage.tsx`, `src/components/ProjectsSection.tsx`, `src/styles/global.css`, `data/projects.json`

- [ ] **Step 1: Run the project build.**

  Run `npm run build`.

  Expected: TypeScript emits no errors and Vite reports a successful production build.

- [ ] **Step 2: Verify project count and links.**

  Run a PowerShell JSON check that asserts `data/projects.json` contains four records, while the component source contains `projects.slice(0, 3)` and `#/all-projects`.

  Expected: four records remain in data, three are passed to the stage, and the all-projects link is present.

- [ ] **Step 3: Run whitespace validation.**

  Run `git diff --check`.

  Expected: no whitespace errors.

- [ ] **Step 4: Review the diff and commit.**

  Review `git diff --stat` and `git status --short`; stage only the feature files plus the spec and plan docs, never `RULE.md`. Commit with `git commit -m "重构 Projects 为 3D 展示舞台"`.

- [ ] **Step 5: Push the verified commit.**

  Run `git push origin main` and verify the remote reports the new `main` commit.
