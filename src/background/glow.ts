// 预渲染的径向发光贴图：整个背景共用这一张，靠 drawImage + globalAlpha 复用。
// 目的：替代每帧 createRadialGradient 调用（每帧几十次 → GC 压力）。
let cached: HTMLCanvasElement | null = null

export function glowSprite(): HTMLCanvasElement {
  if (cached) return cached
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(236,248,255,1)')
  grad.addColorStop(0.22, 'rgba(200,230,255,0.5)')
  grad.addColorStop(0.55, 'rgba(160,200,255,0.13)')
  grad.addColorStop(1, 'rgba(160,200,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  cached = c
  return c
}
