import { attachPointer } from './pointer'
import { ParticlePool, KIND_DUST } from './particles'
import { StarField } from './stars'
import { Aurora } from './aurora'
import { MeteorSystem } from './meteors'

interface BgConfig {
  stars: number
  particles: number
  meteors: number
  spawnEvery: [number, number]
  dust: number
}

const HIGH: BgConfig = { stars: 220, particles: 700, meteors: 3, spawnEvery: [4, 11], dust: 34 }
const LOW: BgConfig = { stars: 110, particles: 260, meteors: 1, spawnEvery: [9, 20], dust: 14 }
const STATIC: BgConfig = { stars: 160, particles: 0, meteors: 0, spawnEvery: [999, 999], dust: 0 }

export interface EngineHandle {
  destroy(): void
}

// 背景总控：一个 <canvas>、一个 requestAnimationFrame 循环，按模块分发更新。
// 层级（自底向上）：夜空底色 → 极光 → 星野/北极星 → 粒子 → 流星
export function createBackgroundEngine(canvas: HTMLCanvasElement): EngineHandle {
  const ctx = canvas.getContext('2d')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarse = matchMedia('(pointer: coarse)').matches
  const smallScreen = Math.min(innerWidth, innerHeight) < 820
  let cfg: BgConfig = reduced ? STATIC : coarse && smallScreen ? LOW : HIGH

  let w = 0, h = 0
  const dpr = Math.min(devicePixelRatio || 1, 2) // DPR 上限 2：4K 屏不做无谓的超采样
  const pool = new ParticlePool(Math.max(cfg.particles, 64))
  const stars = new StarField(cfg.stars)
  const aurora = new Aurora()
  const meteors = new MeteorSystem(cfg.meteors, cfg.spawnEvery)
  let dustTimer = 0
  let raf = 0
  let last = 0
  let emaDt = 0.016
  let frames = 0
  let degraded = reduced
  let bgGrad: CanvasGradient | null = null

  function resize() {
    w = innerWidth
    h = innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    aurora.resize(w, h)
    meteors.resize(w, h)
    bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, '#04060d')
    bgGrad.addColorStop(0.55, '#0a1020')
    bgGrad.addColorStop(1, '#0c1226')
  }

  // 常驻漂浮微粒：数量不足时缓慢补充
  function topUpDust(dt: number) {
    if (cfg.dust === 0) return
    dustTimer -= dt
    if (dustTimer > 0) return
    dustTimer = 0.4
    if (pool.countKind(KIND_DUST) >= cfg.dust) return
    pool.spawn({
      kind: KIND_DUST,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      life: 5 + Math.random() * 6,
      size: Math.random() < 0.8 ? 0.7 : 1.3,
      color: Math.random() < 0.7 ? '#9fc4e8' : '#7de8c8',
      drag: 0.15,
      glow: 0.35,
    })
  }

  // 帧时长 EMA 持续超标 → 一次性降级到低配（单向，不来回抖动）
  function adapt(dt: number) {
    if (degraded) return
    emaDt = emaDt * 0.96 + dt * 0.04
    if (++frames > 300 && emaDt > 0.034) {
      degraded = true
      cfg = LOW
      stars.trim(LOW.stars)
      pool.cap = LOW.particles
      meteors.setConfig(LOW.meteors, LOW.spawnEvery)
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const t = now / 1000
    const dt = Math.min(0.05, Math.max(0.001, t - last))
    last = t
    adapt(dt)

    stars.update(dt)
    meteors.update(dt, pool)
    pool.update(dt)
    topUpDust(dt)

    render(t)
  }

  function render(t: number) {
    ctx.fillStyle = bgGrad!
    ctx.fillRect(0, 0, w, h)
    aurora.render(t, w)
    aurora.draw(ctx, w, h)
    stars.draw(ctx, w, h, t)
    ctx.globalCompositeOperation = 'lighter'
    pool.draw(ctx)
    meteors.draw(ctx)
    ctx.globalCompositeOperation = 'source-over'
  }

  resize()
  const detachPointer = attachPointer()
  const onResize = () => resize()
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
    } else if (!reduced && raf === 0) {
      last = performance.now() / 1000
      raf = requestAnimationFrame(frame)
    }
  }
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVis)

  if (reduced) {
    // 减少动态效果：渲染一帧静态夜空（极光 + 星野 + 北极星），不启动循环
    render(0)
  } else {
    last = performance.now() / 1000
    raf = requestAnimationFrame(frame)
  }

  return {
    destroy() {
      cancelAnimationFrame(raf)
      detachPointer()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    },
  }
}
