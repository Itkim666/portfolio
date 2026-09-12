import { pointer } from './pointer'

interface Blob {
  color: string // "r,g,b"
  bx: number; by: number // 基准中心（相对）
  r: number // 半径（相对宽度）
  spx: number; spy: number // 漂移角速度
  phx: number; phy: number // 相位
  ax: number; ay: number // 漂移幅度（相对）
  a: number // 峰值透明度
}

// 极光：渲染到 1/4 分辨率离屏画布，再整体放大绘制。
// 放大插值天然产生柔化效果，且每帧只做 4 次填充，开销极低。
export class Aurora {
  private off = document.createElement('canvas')
  private octx: CanvasRenderingContext2D
  private blobs: Blob[] = [
    { color: '62,232,176', bx: 0.26, by: 0.10, r: 0.46, spx: 0.050, spy: 0.033, phx: 0.0, phy: 2.1, ax: 0.16, ay: 0.05, a: 0.30 },
    { color: '79,184,255', bx: 0.55, by: 0.05, r: 0.42, spx: 0.041, spy: 0.027, phx: 2.0, phy: 4.2, ax: 0.18, ay: 0.05, a: 0.24 },
    { color: '140,110,255', bx: 0.80, by: 0.12, r: 0.38, spx: 0.031, spy: 0.022, phx: 4.1, phy: 1.0, ax: 0.13, ay: 0.04, a: 0.22 },
  ]

  constructor() {
    this.octx = this.off.getContext('2d')!
  }

  resize(w: number, h: number) {
    this.off.width = Math.max(2, (w / 4) | 0)
    this.off.height = Math.max(2, (h / 4) | 0)
  }

  // 每帧更新离屏画布；t 为秒。指针位置对色团中心施加极轻微的牵引
  render(t: number, w: number) {
    const o = this.octx
    const W = this.off.width, H = this.off.height
    o.clearRect(0, 0, W, H)
    o.globalCompositeOperation = 'lighter'
    const px = pointer.active ? pointer.x / w - 0.5 : 0
    const py = pointer.active ? pointer.y / 900 - 0.5 : 0
    for (const b of this.blobs) {
      const cx = (b.bx + Math.sin(t * b.spx + b.phx) * b.ax + px * 0.04) * W
      const cy = (b.by + Math.cos(t * b.spy + b.phy) * b.ay + py * 0.02) * H
      const r = b.r * W
      const g = o.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, `rgba(${b.color},${b.a})`)
      g.addColorStop(0.5, `rgba(${b.color},${b.a * 0.4})`)
      g.addColorStop(1, `rgba(${b.color},0)`)
      o.fillStyle = g
      o.fillRect(0, 0, W, H)
    }
    // 垂直渐隐：极光只存在于夜空上部，向下淡出到屏幕中部为止
    o.globalCompositeOperation = 'destination-out'
    const fade = o.createLinearGradient(0, 0, 0, H)
    fade.addColorStop(0, 'rgba(0,0,0,0)')
    fade.addColorStop(0.45, 'rgba(0,0,0,0.35)')
    fade.addColorStop(0.8, 'rgba(0,0,0,1)')
    o.fillStyle = fade
    o.fillRect(0, 0, W, H)
    o.globalCompositeOperation = 'source-over'
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.globalAlpha = 0.55
    ctx.drawImage(this.off, 0, 0, w, h)
    ctx.globalAlpha = 1
  }
}
