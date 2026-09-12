import { pointer } from './pointer'

interface Star {
  bx: number; by: number // 0..1 相对坐标，resize 天然适配
  r: number
  base: number // 基础亮度
  tw: number // 闪烁频率
  ph: number // 闪烁相位
  color: string
  ox: number; oy: number // 当前鼠标避让偏移（缓动）
}

const COLORS = ['#d7e6ff', '#d7e6ff', '#d7e6ff', '#aac8ff', '#aac8ff', '#ffe9c9', '#ffffff']

export class StarField {
  private stars: Star[]

  constructor(count: number) {
    this.stars = Array.from({ length: count }, () => this.make())
  }

  private make(): Star {
    return {
      bx: Math.random(),
      by: Math.random(),
      r: Math.random() < 0.85 ? 0.5 + Math.random() * 0.7 : 1.1 + Math.random() * 0.8,
      base: 0.25 + Math.random() * 0.55,
      tw: 0.4 + Math.random() * 1.6,
      ph: Math.random() * 6.2832,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      ox: 0, oy: 0,
    }
  }

  trim(n: number) {
    if (n < this.stars.length) this.stars.length = n
  }

  update(dt: number) {
    const { x: mx, y: my, active } = pointer
    const R = 95
    for (const s of this.stars) {
      let tx = 0, ty = 0
      if (active) {
        const dx = s.bx * innerWidth - mx
        const dy = s.by * innerHeight - my
        const d = Math.hypot(dx, dy)
        if (d < R && d > 0.01) {
          const f = ((1 - d / R) * 9) / d
          tx = dx * f
          ty = dy * f
        }
      }
      const k = Math.min(1, dt * 3.5)
      s.ox += (tx - s.ox) * k
      s.oy += (ty - s.oy) * k
    }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    for (const s of this.stars) {
      const a = s.base * (0.65 + 0.35 * Math.sin(t * s.tw + s.ph))
      if (a < 0.02) continue
      const x = s.bx * w + s.ox
      const y = s.by * h + s.oy
      ctx.globalAlpha = a
      ctx.fillStyle = s.color
      if (s.r < 1) {
        ctx.fillRect(x - 0.5, y - 0.5, 1.2, 1.2)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, s.r, 0, 6.2832)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    this.drawNorthStar(ctx, w, h, t)
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
