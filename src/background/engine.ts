import { attachPointer } from './pointer'
import { ParticlePool, KIND_DUST } from './particles'
import { StarField } from './stars'
import { Aurora } from './aurora'
import { MeteorSystem } from './meteors'

interface BgConfig {
  stars: number
  particles: number
  meteors: number
  meanGap: number // 流星平均生成间隔（秒），越小越密
  dust: number
}

// 流星：并发最多 4 颗。meanGap 按实测反推 —— 流星飞出屏幕即回收，
// 在屏寿命仅 1.5–2s，因此间隔取 1.1s 才能维持“平时 2–3 颗、偶尔满 4 颗”
const HIGH: BgConfig = { stars: 460, particles: 900, meteors: 4, meanGap: 1.1, dust: 40 }
const LOW: BgConfig = { stars: 240, particles: 340, meteors: 2, meanGap: 2.6, dust: 16 }
const STATIC: BgConfig = { stars: 220, particles: 0, meteors: 0, meanGap: 999, dust: 0 }

export interface EngineHandle {
  destroy(): void
  /** 仅用于开发期调试背景参数与实测，生产构建不会挂载 */
  debug(): Record<string, unknown>
}

// 背景总控：一个 <canvas>、一个 requestAnimationFrame 循环，按模块分发更新。
// 层级（自底向上）：夜空底色 → 极光 → 星野/北极星 → 粒子 → 流星
export function createBackgroundEngine(canvas: HTMLCanvasElement): EngineHandle {
  const ctx = canvas.getContext('2d')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  // 触屏设备（手机 + 平板）或小窗口一律降档：触屏没有鼠标交互，且性能与可视面积都更受限
  const touch = matchMedia('(pointer: coarse)').matches
  const lowPower = touch || Math.min(innerWidth, innerHeight) < 700
  let cfg: BgConfig = reduced ? STATIC : lowPower ? LOW : HIGH

  let w = 0, h = 0
  const dpr = Math.min(devicePixelRatio || 1, 2) // DPR 上限 2：4K 屏不做无谓的超采样
  const pool = new ParticlePool(Math.max(cfg.particles, 64))
  const stars = new StarField(cfg.stars)
  const aurora = new Aurora()
  const meteors = new MeteorSystem(cfg.meteors, cfg.meanGap)
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
    stars.resize(w, h)
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
      meteors.setConfig(LOW.meteors, LOW.meanGap)
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

  // 点击交互：命中流星 → 爆散；否则命中普通星星 → 轻微粒子反馈。
  // 画布 pointer-events:none，所以点击落在页面内容上；这里排除可交互元素，
  // 避免点击链接/按钮时误触发背景特效。
  const onPointerDown = (e: PointerEvent) => {
    const el = e.target as Element | null
    if (el && el.closest('a, button, input, textarea, select, [role="button"]')) return
    if (reduced) return
    const x = e.clientX, y = e.clientY
    if (meteors.handleClick(x, y, pool)) return
    const hit = stars.hitTest(x, y, 26)
    if (hit) {
      pool.burst(hit.x, hit.y, 8 + ((Math.random() * 8) | 0), {
        speedMin: 20, speedMax: 130, sizeMax: 1.1, lifeMin: 0.45, lifeMax: 0.95,
        colors: ['#dceeff', '#bfe4ff', '#8ff0d8', '#ffffff'],
      })
    }
  }
  window.addEventListener('pointerdown', onPointerDown)

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
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    },
    debug() {
      const s = meteors.states
      return {
        meteorsActive: meteors.activeCount,
        meteorsMax: cfg.meteors,
        meteorsFlying: s.flying,
        meteorsBurst: s.burst,
        meteorsRegather: s.regather,
        stars: stars.count,
        particles: pool.active,
        particleCap: pool.cap,
        fpsEma: +(1 / emaDt).toFixed(1),
        degraded: degraded ? 1 : 0,
        heads: meteors.heads(),
      }
    },
  }
}
