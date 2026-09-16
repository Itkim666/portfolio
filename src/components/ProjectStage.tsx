import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Project } from '../types'
import { rememberScrollFromCard } from '../utils/scrollMemory'

type StagePhase = 'entering' | 'stacked' | 'orbit'
type StageSlot = 'front' | 'right' | 'left'

interface Props {
  projects: Project[]
}

function getSlot(index: number, activeIndex: number, count: number): StageSlot {
  const relative = (index - activeIndex + count) % count
  if (relative === 0) return 'front'
  if (relative === 1) return 'right'
  return 'left'
}

export default function ProjectStage({ projects }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const phaseTimers = useRef<number[]>([])
  const hasStarted = useRef(false)
  const pointer = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0, frame: 0 })
  const [phase, setPhase] = useState<StagePhase>('entering')
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [entered, setEntered] = useState(false)
  const [coverErrors, setCoverErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || projects.length === 0) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startSequence = () => {
      if (hasStarted.current) return
      hasStarted.current = true
      setEntered(true)
      if (reduced) {
        setPhase('orbit')
        return
      }

      setPhase('entering')
      const stackTimer = window.setTimeout(() => setPhase('stacked'), 720)
      const orbitTimer = window.setTimeout(() => setPhase('orbit'), 1420)
      phaseTimers.current = [stackTimer, orbitTimer]
    }

    if (!('IntersectionObserver' in window)) {
      startSequence()
      return () => phaseTimers.current.forEach((timer) => window.clearTimeout(timer))
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        startSequence()
        observer.disconnect()
      }
    }, { threshold: 0.24 })
    observer.observe(stage)

    return () => {
      observer.disconnect()
      phaseTimers.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [projects.length])

  useEffect(() => {
    if (phase !== 'orbit' || hoveredIndex !== null || projects.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % projects.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [hoveredIndex, phase, projects.length])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tick = () => {
      const state = pointer.current
      state.currentX += (state.targetX - state.currentX) * 0.08
      state.currentY += (state.targetY - state.currentY) * 0.08
      scene.style.setProperty('--stage-tilt-x', `${state.currentX}deg`)
      scene.style.setProperty('--stage-tilt-y', `${state.currentY}deg`)
      state.frame = window.requestAnimationFrame(tick)
    }

    pointer.current.frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(pointer.current.frame)
  }, [])

  useEffect(() => {
    const cards = cardsRef.current
    if (!cards || phase !== 'orbit' || window.innerWidth > 640) return
    const active = cardRefs.current[activeIndex]
    if (!active) return
    cards.scrollTo({
      left: Math.max(0, active.offsetLeft - (cards.clientWidth - active.clientWidth) / 2),
      behavior: 'smooth',
    })
  }, [activeIndex, phase])

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    pointer.current.targetX = (0.5 - y) * 4.2
    pointer.current.targetY = (x - 0.5) * 5.2
  }

  const handlePointerLeave = () => {
    pointer.current.targetX = 0
    pointer.current.targetY = 0
  }

  const handleCardsScroll = () => {
    const cards = cardsRef.current
    if (!cards || window.innerWidth > 640) return
    const center = cards.scrollLeft + cards.clientWidth / 2
    let nearest = activeIndex
    let distance = Number.POSITIVE_INFINITY
    cardRefs.current.forEach((card, index) => {
      if (!card) return
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const nextDistance = Math.abs(cardCenter - center)
      if (nextDistance < distance) {
        distance = nextDistance
        nearest = index
      }
    })
    if (nearest !== activeIndex) setActiveIndex(nearest)
  }

  if (projects.length === 0) return null

  return (
    <div
      ref={stageRef}
      className={`project-stage is-${phase}${entered ? ' is-entered' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="project-stage__scene" ref={sceneRef}>
        <div className="project-stage__aura" aria-hidden="true" />
        <div className="project-stage__orbit-line" aria-hidden="true" />
        <div className="project-stage__cards" ref={cardsRef} onScroll={handleCardsScroll}>
          {projects.map((project, index) => {
            const slot = getSlot(index, activeIndex, projects.length)
            const isActive = index === activeIndex
            const isHovered = index === hoveredIndex
            const hasCoverError = coverErrors[project.slug]

            return (
              <article
                key={project.slug}
                ref={(node) => { cardRefs.current[index] = node }}
                className={`stage-card stage-card--${slot}${isActive ? ' is-active' : ''}${isHovered ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                aria-current={isActive ? 'true' : undefined}
              >
                <a
                  className="stage-card__cover-link"
                  href={`#/project/${project.slug}`}
                  aria-label={`查看 ${project.name}`}
                  onClick={rememberScrollFromCard}
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
                  </div>
                </a>
                <div className="stage-card__body">
                  <p className="stage-card__eyebrow mono">{project.tags[0] ?? 'PROJECT'} <span>/ {project.date}</span></p>
                  <div className="stage-card__head">
                    <h3 className="stage-card__name">
                      <a href={`#/project/${project.slug}`} onClick={rememberScrollFromCard}>{project.name}</a>
                    </h3>
                    <span className={`status status-${project.status.replace(/\s/g, '').toLowerCase()}`}>{project.status}</span>
                  </div>
                  <p className="stage-card__tags mono">{project.technologies.slice(0, 4).join('  /  ')}</p>
                  <p className="stage-card__desc">{project.description}</p>
                  <a className="stage-card__link" href={`#/project/${project.slug}`} onClick={rememberScrollFromCard}>
                    View Project <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <p className="project-stage__caption mono" aria-hidden="true">SELECTED WORK / 0{activeIndex + 1} — 0{projects.length}</p>
    </div>
  )
}
