# All-Projects Continuous Orbit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement and verify this plan task-by-task.

**Goal:** Replace the former three-card, discrete stage with a four-project continuous 3D orbit.

**Architecture:** `ProjectStage` owns the viewport intro and one rAF loop. Each loop calculates a card's continuous orbital position and writes only transform-related DOM styles, while React state is reserved for phase and hover text visibility.

**Tech Stack:** React 18, TypeScript, Vite, CSS 3D transforms, IntersectionObserver, requestAnimationFrame.

**Spec:** `docs/superpowers/specs/2026-09-16-projects-3d-stage-design.md`

## Global Constraints

- Render all `projects` in the home stage; do not use a featured slice.
- Keep all card images medium sized and simultaneously visible.
- Do not add dependencies.
- Preserve direct hash links to each project detail page.
- Do not stage `RULE.md`.

### Task 1: Continuous orbital stage

**Files:**
- Modify: `src/components/ProjectStage.tsx`

**Interfaces:**
- Consumes: `projects: Project[]`.
- Produces: one full-project stage with `idle`, `stacked`, `unfolding`, and `orbit` phases.

- [ ] Use IntersectionObserver to begin the central stack on first visibility, wait 860ms, then begin unfolding.
- [ ] Use a single requestAnimationFrame loop to calculate angle, X/Y/Z, scale, opacity, blur, rotateY and z-index for all cards.
- [ ] Use a 42-second orbital period and cosine-derived depth so rear cards retain at least 42% visibility.
- [ ] Use per-card hover interpolation to slow the orbit, raise the hovered card and defer copy reveal.
- [ ] Keep each card as one anchor to `#/project/<slug>` and call `rememberScrollFromCard` on click.

### Task 2: Home integration and visual rules

**Files:**
- Modify: `src/components/ProjectsSection.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: the complete `projects` array.
- Produces: one-row desktop 3D stage plus mobile touch fallback.

- [ ] Pass `projects` directly to `ProjectStage` and remove the separate all-projects control.
- [ ] Set medium card width, ambient ellipse, depth-responsive shadow, and no default body copy.
- [ ] Reveal concise copy only after hover's transform transition delay.
- [ ] Add max-width 640px horizontal touch layout and reduced-motion static layout.

### Task 3: Verification and delivery

**Files:**
- Verify: `src/components/ProjectStage.tsx`, `src/components/ProjectsSection.tsx`, `src/styles/global.css`, `data/projects.json`

- [ ] Run `npm run build` and expect a successful TypeScript and Vite build.
- [ ] Assert `data/projects.json` has four entries and the home component contains `projects={projects}` with no `slice(0, 3)`.
- [ ] Run `git diff --check`, review staged files, commit, and push `main`.
