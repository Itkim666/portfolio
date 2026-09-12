import { pointer } from './pointer'
import { glowSprite } from './glow'

export const KIND_DUST = 0 // 常驻漂浮微粒
export const KIND_DEBRIS = 1 // 流星碎片 / 爆散粒子（可被引导聚合）
export const DEBRIS_COLORS = ['#dceeff', '#bfe4ff', '#a8d8ff', '#ffffff', '#8ff0d8']

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
  ax: number; ay: number // 聚合目标锚点（流星当前位置）
  tox: number; toy: number // 聚合目标偏移：随时间收敛到 0，让粒子以弧线而非直线归位
  swirl: number // 切向漩涡强度：给回聚过程加入自然绕行
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
        glow: 0, regather: false, ax: 0, ay: 0, tox: 0, toy: 0, swirl: 0,
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
        Object.assign(p, { kind: 0, vx: 0, vy: 0, glow: 0, regather: false, drag: 0.5, tox: 0, toy: 0, swirl: 0 }, opts)
        p.maxLife = p.life
        return p
      }
    }
    return null
  }

  // 爆散：以 (x,y) 为心生成一圈发光粒子，方向/速度/大小/寿命全部随机。
  // 返回实际生成数，池满时可能少于请求数。
  burst(x: number, y: number, count: number, opts?: {
    speedMin?: number; speedMax?: number; sizeMax?: number
    lifeMin?: number; lifeMax?: number; colors?: string[]
  }): number {
    const speedMin = opts?.speedMin ?? 60
    const speedMax = opts?.speedMax ?? 300
    const sizeMax = opts?.sizeMax ?? 2.2
    const lifeMin = opts?.lifeMin ?? 0.7
    const lifeMax = opts?.lifeMax ?? 1.8
    const colors = opts?.colors ?? DEBRIS_COLORS
    let made = 0
    for (let i = 0; i < count; i++) {
      // 黄金角分层：方向均匀铺开但步进不规律，避免明显的均匀扇面或成簇
      const a = i * 2.39996 + Math.random() * 0.9
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      const p = this.spawn({
        kind: KIND_DEBRIS,
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: lifeMin + Math.random() * (lifeMax - lifeMin),
        size: 0.6 + Math.random() * sizeMax,
        color: colors[(Math.random() * colors.length) | 0],
        drag: 0.9 + Math.random() * 1.1,
        glow: 0.8 + Math.random() * 0.2,
      })
      if (!p) break
      made++
    }
    return made
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
      // 鼠标轻微排斥：粒子被“吹开”而不是吸附。
      // 正在重组的粒子不受此影响 —— 否则会一边归位一边被吹散。
      if (mActive && !p.regather) {
        const dx = p.x - mx, dy = p.y - my
        const d2 = dx * dx + dy * dy
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2)
          const f = ((1 - d / R) * 70 * dt) / d
          p.vx += dx * f
          p.vy += dy * f
        }
      }
      // 聚合引导：粒子沿弧线归位到流星头部。
      // tox/toy 是残留偏移，指数收敛到 0，使轨迹呈弧线而非直线；
      // swirl 提供切向速度，让回聚有自然绕行感。
      if (p.regather) {
        const tx = p.ax + p.tox
        const ty = p.ay + p.toy
        const dx = tx - p.x, dy = ty - p.y
        const d = Math.hypot(dx, dy)
        if (d < 7) {
          p.active = false
          this.activeCount--
          continue
        }
        // 缓动：距离越近加速度越小，避免“撞上去”的生硬感
        const acc = (260 + 900 * Math.min(1, d / 260)) * dt / d
        p.vx += dx * acc
        p.vy += dy * acc
        if (p.swirl !== 0) {
          // 切向（垂直于指向目标的方向）
          p.vx += (-dy / d) * p.swirl * dt
          p.vy += (dx / d) * p.swirl * dt
          p.swirl *= Math.exp(-1.6 * dt)
        }
        const dk = Math.exp(-2.6 * dt)
        p.tox *= dk
        p.toy *= dk
      }
      const k = Math.exp(-p.drag * dt)
      p.vx *= k
      p.vy *= k
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const sprite = glowSprite()
    for (const p of this.parts) {
      if (!p.active) continue
      const t = p.life / p.maxLife
      // 淡入淡出：前 15% 渐显，之后随生命衰减
      const a = t > 0.85 ? (1 - t) / 0.15 : t
      const s = p.size
      if (p.glow > 0.5) {
        // 发光粒子：用预渲染贴图，尺寸随生命收缩，呈现“缩小并淡出”
        const r = s * 4 * (0.45 + 0.55 * t)
        ctx.globalAlpha = a * 0.85
        ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2)
        // 中心亮点
        ctx.globalAlpha = a
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.35, s * 0.5 * t), 0, 6.2832)
        ctx.fill()
      } else {
        ctx.globalAlpha = a * (0.35 + p.glow * 0.65)
        ctx.fillStyle = p.color
        if (s < 1) {
          ctx.fillRect(p.x - 0.5, p.y - 0.5, 1.2, 1.2)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, s * (0.5 + 0.5 * t), 0, 6.2832)
          ctx.fill()
        }
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
