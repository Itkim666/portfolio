import { pointer } from './pointer'

export const KIND_DUST = 0 // 常驻漂浮微粒
export const KIND_DEBRIS = 1 // 流星碎片（可被引导聚合）

export interface Particle {
  active: boolean
  kind: number
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
  color: string // 预生成，避免每帧拼接字符串
  drag: number // 指数衰减系数
  glow: number // 发光强度（叠加混合下更亮）
  regather: boolean // 是否正被引导回流星
  ax: number; ay: number // 聚合目标点
}

// 固定容量对象池：粒子对象只创建一次，循环复用，运行时零 GC 压力
export class ParticlePool {
  readonly parts: Particle[]
  cap: number
  private cursor = 0
  private activeCount = 0

  constructor(cap: number) {
    this.cap = cap
    this.parts = new Array(cap)
    for (let i = 0; i < cap; i++) {
      this.parts[i] = {
        active: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, size: 1, color: '#fff', drag: 0,
        glow: 0, regather: false, ax: 0, ay: 0,
      }
    }
  }

  get active(): number {
    return this.activeCount
  }

  spawn(opts: Partial<Particle>): Particle | null {
    if (this.activeCount >= this.cap) return null
    // 轮询游标找空位：池内大多是短命粒子，均摊接近 O(1)
    for (let i = 0; i < this.cap; i++) {
      const idx = (this.cursor + i) % this.cap
      const p = this.parts[idx]
      if (!p.active) {
        this.cursor = (idx + 1) % this.cap
        p.active = true
        this.activeCount++
        Object.assign(p, { kind: 0, vx: 0, vy: 0, glow: 0, regather: false, drag: 0.5 }, opts)
        p.maxLife = p.life
        return p
      }
    }
    return null
  }

  update(dt: number) {
    const { x: mx, y: my, active: mActive } = pointer
    const R = 110 // 鼠标扰动半径
    const R2 = R * R
    for (const p of this.parts) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        this.activeCount--
        continue
      }
      // 鼠标轻微排斥：粒子被“吹开”而不是吸附
      if (mActive) {
        const dx = p.x - mx, dy = p.y - my
        const d2 = dx * dx + dy * dy
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2)
          const f = ((1 - d / R) * 70 * dt) / d
          p.vx += dx * f
          p.vy += dy * f
        }
      }
      // 聚合引导：流星重聚时把碎片拉回头部
      if (p.regather) {
        const dx = p.ax - p.x, dy = p.ay - p.y
        const d = Math.hypot(dx, dy)
        if (d < 9) {
          p.active = false
          this.activeCount--
          continue
        }
        const acc = 620 * dt / d
        p.vx += dx * acc
        p.vy += dy * acc
      }
      const k = Math.exp(-p.drag * dt)
      p.vx *= k
      p.vy *= k
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.parts) {
      if (!p.active) continue
      const t = p.life / p.maxLife
      // 淡入淡出：前 15% 渐显，之后随生命衰减
      const a = t > 0.85 ? (1 - t) / 0.15 : t
      ctx.globalAlpha = a * (0.35 + p.glow * 0.65)
      ctx.fillStyle = p.color
      const s = p.size
      if (s < 1) {
        ctx.fillRect(p.x - 0.5, p.y - 0.5, 1.2, 1.2)
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, s * (0.5 + 0.5 * t), 0, 6.2832)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  countKind(kind: number): number {
    let n = 0
    for (const p of this.parts) if (p.active && p.kind === kind) n++
    return n
  }
}
