import { pointer } from './pointer'
import { glowSprite } from './glow'

interface Star {
  bx: number; by: number // 0..1 相对坐标，resize 天然适配
  r: number // 半径
  base: number // 基础亮度
  tw: number // 闪烁频率（0 = 不闪烁，保持稳定发光）
  ph: number // 闪烁相位
  color: string
  flash: boolean // 是否会偶尔来一次明显闪光
  ftw: number // 闪光频率（很慢）
  fph: number // 闪光相位
  ox: number; oy: number // 当前鼠标避让偏移（缓动）
}

const COLORS = ['#d7e6ff', '#d7e6ff', '#d7e6ff', '#aac8ff', '#aac8ff', '#ffe9c9', '#ffffff']

export class StarField {
  private stars: Star[] = []
  private w = 1
  private h = 1

  constructor(count: number) {
    this.generate(count)
  }

  // 分层抖动网格：把屏幕切成略多于星星数的格子，每格至多放一颗，位置在格内随机。
  // 这样既保证“位置完全随机”，又不会出现明显的空洞或成堆聚集。
  private generate(count: number) {
    this.stars = []
    const cols = Math.max(1, Math.ceil(Math.sqrt(count * 1.8)))
    const rows = Math.max(1, Math.ceil(count / cols))
    for (let r = 0; r < rows && this.stars.length < count; r++) {
      for (let c = 0; c < cols && this.stars.length < count; c++) {
        // 抖动限制在格子内，跨格不会越界，因此分布均匀
        const bx = (c + 0.12 + Math.random() * 0.76) / cols
        const by = (r + 0.12 + Math.random() * 0.76) / rows
        this.stars.push(this.make(bx, by))
      }
    }
  }

  private make(bx: number, by: number): Star {
    // 分层大小：大量小星作底、中等星增加层次、少量大星作焦点
    const roll = Math.random()
    let r: number
    if (roll < 0.78) r = 0.35 + Math.random() * 0.55   // 小：背景
    else if (roll < 0.965) r = 0.9 + Math.random() * 0.5 // 中：层次
    else r = 1.5 + Math.random() * 0.9                  // 大：焦点
    // 约 1/4 星星稳定发光，其余各自独立闪烁；大星更容易闪烁
    const twinkle = r > 1.4 ? Math.random() < 0.9 : Math.random() < 0.72
    return {
      bx, by, r,
      base: 0.22 + Math.random() * 0.5 + (r > 1.4 ? 0.18 : 0),
      tw: twinkle ? 0.35 + Math.random() * 2.1 : 0,
      ph: Math.random() * 6.2832,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      flash: r > 1.1 && Math.random() < 0.14, // 少量大中星偶尔来一次明显闪光
      ftw: 0.035 + Math.random() * 0.06,
      fph: Math.random() * 6.2832,
      ox: 0, oy: 0,
    }
  }

  trim(n: number) {
    if (n < this.stars.length) this.stars.length = n
  }

  get count(): number {
    return this.stars.length
  }

  resize(w: number, h: number) {
    this.w = w
    this.h = h
  }

  update(dt: number) {
    const { x: mx, y: my, active } = pointer
    const R = 100
    for (const s of this.stars) {
      let tx = 0, ty = 0
      if (active) {
        const dx = s.bx * this.w - mx
        const dy = s.by * this.h - my
        const d = Math.hypot(dx, dy)
        if (d < R && d > 0.01) {
          const f = ((1 - d / R) * 7) / d
          tx = dx * f
          ty = dy * f
        }
      }
      const k = Math.min(1, dt * 3.2)
      s.ox += (tx - s.ox) * k
      s.oy += (ty - s.oy) * k
    }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const sprite = glowSprite()
    for (const s of this.stars) {
      let a = s.base
      if (s.tw > 0) {
        // 平滑闪烁：正弦整形后偏向暗部，形成“亮→最亮→暗→几乎消失→再出现”
        const v = (Math.sin(t * s.tw + s.ph) + 1) * 0.5
        const shaped = Math.pow(v, 1.7)
        a = s.base * (0.18 + 0.82 * shaped)
      }
      if (s.flash) {
        // 极慢的周期性尖峰：短暂闪光后恢复
        const fv = Math.sin(t * s.ftw + s.fph)
        const spike = fv > 0.995 ? (fv - 0.995) / 0.005 : 0
        a += spike * 0.85
      }
      if (a < 0.02) continue
      const x = s.bx * w + s.ox
      const y = s.by * h + s.oy
      ctx.globalAlpha = Math.min(1, a)
      if (s.r > 1.1) {
        // 较大星星带一点光晕，成为视觉焦点
        const gr = s.r * 5
        ctx.globalAlpha = Math.min(1, a) * 0.5
        ctx.drawImage(sprite, x - gr, y - gr, gr * 2, gr * 2)
        ctx.globalAlpha = Math.min(1, a)
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(x, y, s.r, 0, 6.2832)
        ctx.fill()
      } else {
        ctx.fillStyle = s.color
        if (s.r < 0.75) {
          ctx.fillRect(x - 0.5, y - 0.5, 1.15, 1.15)
        } else {
          ctx.beginPath()
          ctx.arc(x, y, s.r, 0, 6.2832)
          ctx.fill()
        }
      }
    }
    ctx.globalAlpha = 1
    this.drawNorthStar(ctx, w, h, t)
  }

  // 命中检测：返回距离 (x,y) 最近且在 radius 内的星星屏幕坐标，用于点击反馈
  hitTest(x: number, y: number, radius: number): { x: number; y: number; r: number } | null {
    let best: { x: number; y: number; r: number } | null = null
    let bestD = radius
    for (const s of this.stars) {
      const sx = s.bx * this.w + s.ox
      const sy = s.by * this.h + s.oy
      const d = Math.hypot(sx - x, sy - y)
      if (d < bestD) {
        bestD = d
        best = { x: sx, y: sy, r: s.r }
      }
    }
    return best
  }

  // 北极星：视觉锚点。小而亮，恒定位置，轻微呼吸光晕 + 四向星芒
  private drawNorthStar(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const x = w * 0.74
    const y = h * 0.2
    const breath = 0.85 + 0.15 * Math.sin(t * 0.7)

    const halo = ctx.createRadialGradient(x, y, 0, x, y, 34 * breath)
    halo.addColorStop(0, 'rgba(200,230,255,0.32)')
    halo.addColorStop(0.4, 'rgba(160,200,255,0.10)')
    halo.addColorStop(1, 'rgba(160,200,255,0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(x, y, 34 * breath, 0, 6.2832)
    ctx.fill()

    const spike = 30 * breath
    const line = ctx.createLinearGradient(x - spike, y, x + spike, y)
    line.addColorStop(0, 'rgba(210,235,255,0)')
    line.addColorStop(0.5, 'rgba(210,235,255,0.5)')
    line.addColorStop(1, 'rgba(210,235,255,0)')
    ctx.strokeStyle = line
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x - spike, y); ctx.lineTo(x + spike, y); ctx.stroke()
    const line2 = ctx.createLinearGradient(x, y - spike * 0.7, x, y + spike * 0.7)
    line2.addColorStop(0, 'rgba(210,235,255,0)')
    line2.addColorStop(0.5, 'rgba(210,235,255,0.45)')
    line2.addColorStop(1, 'rgba(210,235,255,0)')
    ctx.strokeStyle = line2
    ctx.beginPath(); ctx.moveTo(x, y - spike * 0.7); ctx.lineTo(x, y + spike * 0.7); ctx.stroke()

    ctx.globalAlpha = 0.95
    ctx.fillStyle = '#f4faff'
    ctx.beginPath()
    ctx.arc(x, y, 2.1, 0, 6.2832)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}
