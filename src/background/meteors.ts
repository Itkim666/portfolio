import { pointer } from './pointer'
import { ParticlePool, KIND_DEBRIS } from './particles'

interface Meteor {
  active: boolean
  x: number; y: number // 头部位置
  vx: number; vy: number // 当前速度
  v0x: number; v0y: number // 出生速度（重聚后恢复）
  len: number // 尾迹长度
  width: number
  life: number // 剩余寿命（秒）
  frag: number // 0 = 完整流星，1 = 完全粒子化（连续量，驱动一切过渡）
  state: 'flying' | 'regather'
  holdT: number // 鼠标持续停留计时（防止永远保持碎片云）
  debris: { p: { active: boolean }; gone: boolean }[] // 本流星产生的粒子引用
  acc: number // 碎片生成累积器
}

const DEBRIS_COLORS = ['#dceeff', '#bfe4ff', '#a8d8ff', '#ffffff']
const MOUSE_R = 170 // 触发粒子化的鼠标作用半径

function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(px - x1, py - y1)
  let s = ((px - x1) * dx + (py - y1) * dy) / l2
  s = Math.max(0, Math.min(1, s))
  return Math.hypot(px - (x1 + s * dx), py - (y1 + s * dy))
}

export class MeteorSystem {
  private meteors: Meteor[]
  private max: number
  private spawnEvery: [number, number]
  private timer = 2.5 // 开场 2.5s 后出现第一颗
  private w = 0; private h = 0

  constructor(max: number, spawnEvery: [number, number]) {
    this.max = max
    this.spawnEvery = spawnEvery
    this.meteors = Array.from({ length: max }, () => this.blank())
  }

  private blank(): Meteor {
    return {
      active: false, x: 0, y: 0, vx: 0, vy: 0, v0x: 0, v0y: 0,
      len: 0, width: 0, life: 0, frag: 0, state: 'flying', holdT: 0, acc: 0,
      debris: [],
    }
  }

  setConfig(max: number, spawnEvery: [number, number]) {
    this.max = max
    this.spawnEvery = spawnEvery
  }

  resize(w: number, h: number) {
    this.w = w
    this.h = h
  }

  private spawn() {
    if (this.meteors.filter((m) => m.active).length >= this.max) return
    const m = this.meteors.find((m) => !m.active)
    if (!m) return
    const dirRight = Math.random() < 0.5 ? 1 : -1
    const ang = (20 + Math.random() * 20) * (Math.PI / 180) // 与水平线夹角 20°–40°
    const speed = 200 + Math.random() * 220
    m.active = true
    m.x = (0.1 + Math.random() * 0.8) * this.w
    m.y = -30 + Math.random() * this.h * 0.3
    m.vx = Math.cos(ang) * speed * dirRight
    m.vy = Math.sin(ang) * speed
    m.v0x = m.vx; m.v0y = m.vy
    m.len = 90 + Math.random() * 140
    m.width = 1.1 + Math.random() * 1.1
    m.life = 7 + Math.random() * 5
    m.frag = 0; m.state = 'flying'; m.holdT = 0; m.acc = 0
    m.debris.length = 0
  }

  update(dt: number, pool: ParticlePool) {
    this.timer -= dt
    if (this.timer <= 0) {
      this.timer = this.spawnEvery[0] + Math.random() * (this.spawnEvery[1] - this.spawnEvery[0])
      this.spawn()
    }

    for (const m of this.meteors) {
      if (!m.active) continue
      const dirLen = Math.hypot(m.vx, m.vy) || 1
      const dx = m.vx / dirLen, dy = m.vy / dirLen
      const tailX = m.x - dx * m.len, tailY = m.y - dy * m.len

      if (m.state === 'flying') {
        // —— 鼠标影响：到尾迹线段的距离 → 连续的粒子化程度 ——
        const infl = pointer.active
          ? Math.max(0, 1 - distToSeg(pointer.x, pointer.y, m.x, m.y, tailX, tailY) / MOUSE_R)
          : 0
        const target = Math.min(1, infl * 1.35)
        m.frag += (target - m.frag) * Math.min(1, dt * 3)

        // 轻微偏转：流星被鼠标推开一点点，而不是硬转向
        if (infl > 0) {
          const hx = m.x - pointer.x, hy = m.y - pointer.y
          const hd = Math.hypot(hx, hy) || 1
          m.vx += (hx / hd) * infl * 26 * dt
          m.vy += (hy / hd) * infl * 26 * dt
        }

        m.holdT = target > 0.35 ? m.holdT + dt : 0
        if (m.frag > 0.5 && (target < 0.2 || m.holdT > 2.6)) {
          // 鼠标离开（或停留太久）→ 开始重聚
          m.state = 'regather'
        }

        m.x += m.vx * dt
        m.y += m.vy * dt
        m.life -= dt

        // —— 碎片生成：速率 ∝ frag，沿尾迹随机分布，继承流速并向鼠标外侧扩散 ——
        m.acc += dt * m.frag * 95
        while (m.acc >= 1) {
          m.acc--
          const s = 0.1 + Math.random() * 0.9
          const px = m.x - dx * m.len * s
          const py = m.y - dy * m.len * s
          let sx: number, sy: number
          if (pointer.active) {
            const ox = px - pointer.x, oy = py - pointer.y
            const od = Math.hypot(ox, oy) || 1
            const sp = 40 + Math.random() * 110
            sx = (ox / od) * sp
            sy = (oy / od) * sp
          } else {
            const a = Math.random() * 6.2832
            sx = Math.cos(a) * (20 + Math.random() * 50)
            sy = Math.sin(a) * (20 + Math.random() * 50)
          }
          const p = pool.spawn({
            kind: KIND_DEBRIS,
            x: px, y: py,
            vx: m.vx * 0.35 + sx,
            vy: m.vy * 0.35 + sy,
            life: 0.7 + Math.random() * 1.0,
            size: 0.7 + Math.random() * 1.5,
            color: DEBRIS_COLORS[(Math.random() * DEBRIS_COLORS.length) | 0],
            drag: 1.3,
            glow: 1,
          })
          if (p) {
            m.debris.push({ p, gone: false })
          } else break // 池满则停止生成
        }

        const off = m.x < -m.len - 80 || m.x > this.w + m.len + 80 || m.y > this.h + m.len + 80
        if (m.life <= 0 || off) {
          m.active = false
        }
      } else {
        // —— 重聚阶段：碎片被引导回头部，头部随 frag 回落重新亮起 ——
        m.frag += (0 - m.frag) * Math.min(1, dt * 1.6)
        m.x += m.vx * dt * 0.12 // 几乎悬停，缓慢漂移
        m.y += m.vy * dt * 0.12
        let allGone = true
        for (const d of m.debris) {
          if (!d.p.active) { d.gone = true; continue }
          if (d.gone) continue
          allGone = false
          const pp = d.p as { active: boolean; regather: boolean; ax: number; ay: number }
          pp.regather = true
          pp.ax = m.x
          pp.ay = m.y
        }
        if (m.frag < 0.06 && allGone) {
          // 重聚完成：恢复巡航
          m.state = 'flying'
          m.holdT = 0
          m.life = Math.max(m.life, 3.5)
          m.vx += (m.v0x - m.vx) * 0.6
          m.vy += (m.v0y - m.vy) * 0.6
          m.debris.length = 0
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const m of this.meteors) {
      if (!m.active) continue
      const a = (1 - m.frag) * Math.min(1, Math.max(0, m.life)) // 头部亮度随粒子化连续消退
      if (a < 0.02) continue
      const dirLen = Math.hypot(m.vx, m.vy) || 1
      const dx = m.vx / dirLen, dy = m.vy / dirLen
      const tailX = m.x - dx * m.len, tailY = m.y - dy * m.len

      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
      grad.addColorStop(0, `rgba(214,238,255,${0.85 * a})`)
      grad.addColorStop(0.25, `rgba(170,215,255,${0.4 * a})`)
      grad.addColorStop(1, 'rgba(170,215,255,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = m.width
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(m.x, m.y)
      ctx.lineTo(tailX, tailY)
      ctx.stroke()

      // 头部光点
      const head = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 7)
      head.addColorStop(0, `rgba(240,250,255,${0.9 * a})`)
      head.addColorStop(1, 'rgba(240,250,255,0)')
      ctx.fillStyle = head
      ctx.beginPath()
      ctx.arc(m.x, m.y, 7, 0, 6.2832)
      ctx.fill()
    }
  }
}
