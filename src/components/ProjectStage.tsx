import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { Project } from '../types'
import { rememberScrollFromCard } from '../utils/scrollMemory'
import { startProjectTransition } from '../utils/projectTransition'

type StagePhase = 'idle' | 'stacked' | 'unfolding' | 'orbit'

interface Props {
  projects: Project[]
}

const TAU = Math.PI * 2
const ORBIT_SECONDS = 42
const GALAXY_TONES = ['cyan', 'indigo', 'violet', 'amber'] as const
const GALAXY_POSITIONS = ['upper-right', 'lower-left', 'upper-left', 'lower-right'] as const
const COPY_LAYOUTS = ['right-split', 'right-split', 'top-right', 'right-split'] as const

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function easeOutExpo(value: number) {
  return value >= 1 ? 1 : 1 - 2 ** (-10 * value)
}

export default function ProjectStage({ projects }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const timersRef = useRef<number[]>([])
  const startedRef = useRef(false)
  const phaseRef = useRef<StagePhase>('idle')
  const unfoldStartedAt = useRef(0)
  const hoverRef = useRef<number | null>(null)
  const transitioningRef = useRef<number | null>(null)
  const hoverStrength = useRef<number[]>([])
  const pointer = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 })
  const [phase, setPhase] = useState<StagePhase>('idle')
  const [entered, setEntered] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [transitioningIndex, setTransitioningIndex] = useState<number | null>(null)
  const [coverErrors, setCoverErrors] = useState<Record<string, boolean>>({})

  const setStagePhase = (next: StagePhase) => {
    phaseRef.current = next
    setPhase(next)
  }

  useEffect(() => {
    hoverStrength.current = projects.map(() => 0)
  }, [projects.length])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || projects.length === 0) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startSequence = () => {
      if (startedRef.current) return
      startedRef.current = true
      setEntered(true)
      if (reduced) {
        setStagePhase('orbit')
        return
      }

      setStagePhase('stacked')
      const unfoldTimer = window.setTimeout(() => {
        unfoldStartedAt.current = performance.now()
        setStagePhase('unfolding')
      }, 860)
      timersRef.current = [unfoldTimer]
    }

    if (!('IntersectionObserver' in window)) {
      startSequence()
      return () => timersRef.current.forEach((timer) => window.clearTimeout(timer))
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        startSequence()
        observer.disconnect()
      }
    }, { threshold: 0.26 })
    observer.observe(stage)

    return () => {
      observer.disconnect()
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [projects.length])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || projects.length === 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let previous = performance.now()
    let orbitElapsed = 0
    let orbitVelocity = 1

    const drawCard = (card: HTMLAnchorElement, index: number, unfold: number) => {
      const angle = (index / projects.length) * TAU + (orbitElapsed / (ORBIT_SECONDS * 1000)) * TAU
      // 卡片在两侧仍要完整留在舞台内，不能让封面自带文字被容器裁切。
      const halfStageWidth = (stageRef.current?.clientWidth ?? 960) / 2
      const orbitRadiusX = Math.min(420, Math.max(0, halfStageWidth - 210))
      const orbitX = Math.sin(angle) * orbitRadiusX
      // 前、左、后、右分布到不同的平面位置，避免可见封面彼此遮挡。
      const orbitY = (1 - Math.cos(angle)) * 150
      const orbitDepth = Math.cos(angle)
      const orbitZ = orbitDepth * 166
      const orbitScale = 0.68 + ((orbitDepth + 1) / 2) * 0.25
      const orbitBlur = ((1 - orbitDepth) / 2) * 1.15
      const orbitRotation = -Math.sin(angle) * 24
      const stackOffset = index - (projects.length - 1) / 2
      const stackX = stackOffset * 8
      const stackY = stackOffset * -6
      const stackZ = 56 - index * 18
      const stackScale = 0.77 - index * 0.025
      const stackRotation = stackOffset * 2.4
      const individualUnfold = clamp((unfold - index * 0.13) / 0.72)
      const reveal = easeOutExpo(individualUnfold)
      const hoverTarget = hoverRef.current === index ? 1 : 0
      hoverStrength.current[index] += (hoverTarget - hoverStrength.current[index]) * 0.095
      const hover = hoverStrength.current[index]
      const isBackgroundCard = hoverRef.current !== null && hoverRef.current !== index
      const isTransitioning = transitioningRef.current !== null
      const isOpening = transitioningRef.current === index
      const hoverInward = Math.sign(orbitX) * hover * 16
      const x = stackX + (orbitX - stackX) * reveal - hoverInward
      const y = stackY + (orbitY - stackY) * reveal - hover * 10
      const z = stackZ + (orbitZ - stackZ) * reveal + hover * 64
      const scale = stackScale + (orbitScale - stackScale) * reveal + hover * 0.055
      const blur = orbitBlur * reveal * (1 - hover)
      const rotation = stackRotation + (orbitRotation - stackRotation) * reveal

      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)}) rotateY(${rotation.toFixed(2)}deg)`
      const depthProgress = (orbitDepth + 1) / 2
      // 封面和文字分开处理：远处项目的图片降低存在感，但信息层始终可阅读。
      card.style.opacity = String(clamp(isTransitioning ? (isOpening ? 0 : 0.16) : 1, 0, 1))
      card.style.filter = 'none'
      card.style.setProperty('--cover-opacity', String(clamp(0.58 + depthProgress * 0.42 + hover * 0.08, 0.58, 1)))
      card.style.setProperty('--cover-blur', `${(blur * (1 - hover)).toFixed(2)}px`)
      card.style.setProperty('--cover-saturation', (0.82 + reveal * 0.18 + hover * 0.08).toFixed(2))
      card.style.setProperty('--cover-brightness', String(isBackgroundCard ? 0.84 : 1))
      card.style.setProperty('--copy-strength', String(clamp(0.7 + depthProgress * 0.3 + hover * 0.08, 0.7, 1)))
      card.style.zIndex = String(Math.round((orbitDepth + 1) * 100 + hover * 100))
      card.style.setProperty('--orbital-depth', String((orbitDepth + 1) / 2))
      card.style.setProperty('--hovered-glow', String(hover))
    }

    const tick = (now: number) => {
      const delta = Math.min(48, now - previous)
      previous = now
      const state = pointer.current
      state.currentX += (state.targetX - state.currentX) * 0.075
      state.currentY += (state.targetY - state.currentY) * 0.075
      scene.style.setProperty('--stage-tilt-x', `${state.currentX.toFixed(2)}deg`)
      scene.style.setProperty('--stage-tilt-y', `${state.currentY.toFixed(2)}deg`)

      const currentPhase = phaseRef.current
      let unfold = currentPhase === 'orbit' ? 1 : 0
      if (currentPhase === 'unfolding') {
        unfold = clamp((now - unfoldStartedAt.current) / 1520)
        if (unfold >= 1) setStagePhase('orbit')
      }

      if (currentPhase === 'orbit' || phaseRef.current === 'orbit') {
        if (reduced) {
          orbitVelocity = 0
          orbitElapsed = 0
        } else {
          // Hover 时只进入电影式慢动作，永远不让轨道停住。
          const velocityTarget = hoverRef.current === null ? 1 : 0.14
          orbitVelocity += (velocityTarget - orbitVelocity) * 0.035
          orbitElapsed += delta * orbitVelocity
        }
        unfold = 1
      }

      if (entered || phaseRef.current !== 'idle') {
        cardRefs.current.forEach((card, index) => {
          if (card) drawCard(card, index, reduced ? 1 : unfold)
        })
      }
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [entered, projects.length])

  const updateHovered = (index: number | null) => {
    hoverRef.current = index
    setHoveredIndex(index)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    pointer.current.targetX = (0.5 - y) * 3.4
    pointer.current.targetY = (x - 0.5) * 4.2

    // 3D 变换下有时鼠标会落在舞台空层，而不是后方可见卡片的 DOM 命中区域。
    if (!(event.target as HTMLElement).closest('.stage-card')) {
      updateHovered(findVisibleCardIndex(event.clientX, event.clientY))
    }
  }

  const handlePointerLeave = () => {
    pointer.current.targetX = 0
    pointer.current.targetY = 0
    updateHovered(null)
  }

  const findVisibleCardIndex = (clientX: number, clientY: number) => {
    const candidates = cardRefs.current
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => {
        if (!card || card.style.opacity === '0') return false
        const rect = card.getBoundingClientRect()
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      })

    if (candidates.length === 0) return null
    // 同一点存在多张卡片时优先取视觉层级最高的一张。
    return candidates.reduce((front, candidate) => {
      const frontDepth = Number.parseInt(front.card?.style.zIndex || '0', 10)
      const candidateDepth = Number.parseInt(candidate.card?.style.zIndex || '0', 10)
      return candidateDepth > frontDepth ? candidate : front
    }).index
  }

  const launchProject = (project: Project, index: number) => {
    const card = cardRefs.current[index]
    if (!card) return

    rememberScrollFromCard()
    transitioningRef.current = index
    setTransitioningIndex(index)
    updateHovered(null)
    const started = startProjectTransition({
      source: card,
      cover: project.cover,
      onNavigate: () => { window.location.hash = `/project/${project.slug}` },
    })
    if (!started) {
      transitioningRef.current = null
      setTransitioningIndex(null)
    }
  }

  const openProject = (event: ReactMouseEvent<HTMLAnchorElement>, project: Project, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    launchProject(project, index)
  }

  const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.stage-card')) return
    const index = findVisibleCardIndex(event.clientX, event.clientY)
    if (index === null) return
    event.preventDefault()
    launchProject(projects[index], index)
  }

  if (projects.length === 0) return null

  return (
    <div
      ref={stageRef}
      className={`project-stage is-${phase}${entered ? ' is-entered' : ''}${transitioningIndex !== null ? ' is-transitioning' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleStageClick}
    >
      <div className="project-stage__scene" ref={sceneRef}>
        <div className="project-stage__aura" aria-hidden="true" />
        <div className="project-stage__orbit-line" aria-hidden="true" />
        <div className="project-stage__cards">
          {projects.map((project, index) => {
            const hasCoverError = coverErrors[project.slug]
            const isHovered = hoveredIndex === index
            const galaxyTone = GALAXY_TONES[index % GALAXY_TONES.length]
            const galaxyPosition = GALAXY_POSITIONS[index % GALAXY_POSITIONS.length]
            const copyLayout = COPY_LAYOUTS[index % COPY_LAYOUTS.length]

            return (
              <a
                key={project.slug}
                ref={(node) => { cardRefs.current[index] = node }}
                className={`stage-card stage-card--galaxy-${galaxyPosition}${isHovered ? ' is-hovered' : ''}${transitioningIndex === index ? ' is-opening' : ''}`}
                href={`#/project/${project.slug}`}
                aria-label={`查看 ${project.name}`}
                data-tone={galaxyTone}
                data-copy-layout={copyLayout}
                onClick={(event) => openProject(event, project, index)}
                onMouseEnter={() => updateHovered(index)}
                onMouseLeave={() => updateHovered(null)}
                onFocus={() => updateHovered(index)}
                onBlur={() => updateHovered(null)}
              >
                <div className="stage-card__cover">
                  {hasCoverError || !project.cover ? (
                    <div className="stage-card__fallback"><span>{project.name[0]}</span></div>
                  ) : (
                    <img
                      src={project.cover}
                      alt={`${project.name} 封面`}
                      loading="lazy"
                      onError={() => setCoverErrors((current) => ({ ...current, [project.slug]: true }))}
                    />
                  )}
                  <span className="stage-card__cover-glow" aria-hidden="true" />
                  <span className="stage-card__galaxy" aria-hidden="true">
                    <span className="stage-card__galaxy-core" />
                    <span className="stage-card__galaxy-ring" />
                    <span className="stage-card__galaxy-stars" />
                  </span>
                  <span className="stage-card__hint mono" aria-hidden="true">VIEW PROJECT ↗</span>
                </div>
                <div className="stage-card__body">
                  <div className="stage-card__copy-head">
                    <p className="stage-card__eyebrow mono">{project.tags[0] ?? 'PROJECT'}</p>
                    <h3 className="stage-card__name">{project.name}</h3>
                  </div>
                  <div className="stage-card__copy-foot">
                    <p className="stage-card__desc">{project.description}</p>
                    <time className="stage-card__date mono">{project.date}</time>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
      <p className="project-stage__caption mono" aria-hidden="true">ALL PROJECTS / {projects.length} IN ORBIT</p>
    </div>
  )
}
