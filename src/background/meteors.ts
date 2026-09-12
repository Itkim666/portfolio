import { pointer } from './pointer'
import { ParticlePool, KIND_DEBRIS, DEBRIS_COLORS } from './particles'
import { glowSprite } from './glow'

type MeteorState = 'flying' | 'burst' | 'regather'

interface Meteor {
  active: boolean
  x: number; y: number // 头部位置
  vx: number; vy: number
  v0x: number; v0y: number // 巡航速度（重组后恢复）
  len: number // 尾迹长度
  width: number
  base: number // 基础透明度
  life: number
  frag: number // 0=完整流星，1=完全粒子化（连续量）
  state: MeteorState
  holdT: number // 爆散/重聚计时
  acc: number // 碎片生成累积器
  debris: { p: { active: boolean }; gone: boolean }[]
}

const MOUSE_R = 150 // 鼠标扰动半径
const HOVER_FRAG_MAX = 0.5 // 悬停最多粒子化到此程度（克制）；点击才完全爆散

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
  private meanGap: number // 平均生成间隔（秒）
  private timer = 1.2
  private w = 0
  private h = 0

  constructor(max: number, meanGap: number) {
    this.max = max
    this.meanGap = meanGap
    this.meteors = Array.from({ length: max }, () => this.blank())
  }

  private blank(): Meteor {
    return {
      active: false, x: 0, y: 0, vx: 0, vy: 0, v0x: 0, v0y: 0,
      len: 0, width: 1, base: 0.8, life: 0, frag: 0, state: 'flying',
      holdT: 0, acc: 0, debris: [],
    }
  }

  setConfig(max: number, meanGap: number) {
    this.max = max
    this.meanGap = meanGap
    // 缩容时把多余流星标记为可回收，而不是留一堆对象
    while (this.meteors.length > max) this.meteors.pop()
    while (this.meteors.length < max) this.meteors.push(this.blank())
  }

  resize(w: number, h: number) {
    this.w = w
    this.h = h
  }

  get activeCount(): number {
    let n = 0
    for (const m of this.meteors) if (m.active) n++
    return n
  }

  get states(): { flying: number; burst: number; regather: number } {
    const s = { flying: 0, burst: 0, regather: 0 }
    for (const m of this.meteors) if (m.active) s[m.state]++
    return s
  }

  /** 调试用：当前巡航流星的头部坐标 */
  heads(): { x: number; y: number }[] {
    return this.meteors
      .filter((m) => m.active && m.state === 'flying')
      .map((m) => ({ x: Math.round(m.x), y: Math.round(m.y) }))
  }

  // 生成一颗流星：位置、角度、速度、长度、宽度、透明度全部随机
  private spawn() {
    if (this.activeCount >= this.max) return
    const m = this.meteors.find((m) => !m.active)
    if (!m) return
    const dir = Math.random() < 0.5 ? 1 : -1
    const ang = (16 + Math.random() * 42) * (Math.PI / 180) // 16°–58°，避免全部同角度
    const speed = 150 + Math.random() * 420 // 有快有慢
    m.active = true
    m.x = (-0.08 + Math.random() * 1.16) * this.w
    m.y = (-0.12 + Math.random() * 0.72) * this.h
    m.vx = Math.cos(ang) * speed * dir
    m.vy = Math.sin(ang) * speed
    m.v0x = m.vx
    m.v0y = m.vy
    m.len = 70 + Math.random() * 230
    m.width = 0.7 + Math.random() * 1.6
    m.base = 0.35 + Math.random() * 0.6
    m.life = 3.5 + Math.random() * 3
    m.frag = 0
    m.state = 'flying'
    m.holdT = 0
    m.acc = 0
    m.debris.length = 0
  }

  update(dt: number, pool: ParticlePool) {
    // 随机（指数分布）生成间隔 → 天然成簇，不会整齐排队出现
    this.timer -= dt
    if (this.timer <= 0) {
      const u = Math.random() || 0.0001
      this.timer = Math.max(0.08, -Math.log(u) * this.meanGap)
      this.spawn()
      // 偶发“连发”，形成真正的流星雨节奏
      if (Math.random() < 0.32) this.spawn()
    }

    for (const m of this.meteors) {
      if (!m.active) continue
      const dirLen = Math.hypot(m.vx, m.vy)
      const dx = dirLen ? m.vx / dirLen : 1
      const dy = dirLen ? m.vy / dirLen : 0
      const tailX = m.x - dx * m.len
      const tailY = m.y - dy * m.len

      if (m.state === 'flying') {
        // —— 鼠标扰动：靠近时轻微偏转 + 克制的粒子化 ——
        const infl = pointer.active
          ? Math.max(0, 1 - distToSeg(pointer.x, pointer.y, m.x, m.y, tailX, tailY) / MOUSE_R)
          : 0
        const target = Math.min(HOVER_FRAG_MAX, infl * 0.75)
        m.frag += (target - m.frag) * Math.min(1, dt * 3)

        if (infl > 0) {
          const hx = m.x - pointer.x, hy = m.y - pointer.y
          const hd = Math.hypot(hx, hy) || 1
          m.vx += (hx / hd) * infl * 22 * dt
          m.vy += (hy / hd) * infl * 22 * dt
        }

        m.x += m.vx * dt
        m.y += m.vy * dt
        m.life -= dt

        // 悬停产生的少量碎片（被点击时会一并回收）
        m.acc += dt * m.frag * 40
        while (m.acc >= 1) {
          m.acc--
          this.emit(m, pool, dx, dy, m.x, m.y, 30 + Math.random() * 70)
        }
        // 剪枝：悬停碎片随生命结束会失效，及时移除死引用避免数组无限增长
        if (m.debris.length > 64) {
          m.debris = m.debris.filter((d) => d.p.active)
        }

        const off = m.x < -m.len - 120 || m.x > this.w + m.len + 120 || m.y > this.h + m.len + 120
        if (m.life <= 0 || off) m.active = false

      } else if (m.state === 'burst') {
        // —— 爆散：立即停止原运动，头部快速隐去，粒子已向外飞散 ——
        m.holdT += dt
        m.frag += (1 - m.frag) * Math.min(1, dt * 12)
        m.vx *= Math.exp(-3.2 * dt)
        m.vy *= Math.exp(-3.2 * dt)
        m.x += m.vx * dt
        m.y += m.vy * dt
        if (m.holdT > 0.5) {
          m.state = 'regather'
          m.holdT = 0
        }

      } else {
        // —— 重组：粒子被引导回头部，头部随 frag 回落重新亮起 ——
        m.holdT += dt
        m.frag += (0 - m.frag) * Math.min(1, dt * 1.4)
        m.x += m.vx * dt
        m.y += m.vy * dt
        let alive = 0
        for (const d of m.debris) {
          if (!d.p.active) { d.gone = true; continue }
          if (d.gone) continue
          alive++
          const pp = d.p as { active: boolean; regather: boolean; ax: number; ay: number; tox: number; toy: number; swirl: number }
          pp.regather = true
          pp.ax = m.x
          pp.ay = m.y
        }
        if (alive === 0 || m.holdT > 3.2) {
          // 重组完成：恢复巡航，继续划过天空
          m.state = 'flying'
          m.holdT = 0
          m.vx = m.v0x * (0.85 + Math.random() * 0.3)
          m.vy = m.v0y * (0.85 + Math.random() * 0.3)
          m.v0x = m.vx
          m.v0y = m.vy
          m.life = Math.max(m.life, 3.5)
          m.debris.length = 0
        }
      }
    }
  }

  // 生成一颗粒子碎片，方向以随机角度向外扩散
  private emit(
    m: Meteor, pool: ParticlePool, dx: number, dy: number,
    px: number, py: number, spread: number,
  ) {
    const a = Math.random() * 6.2832
    const p = pool.spawn({
      kind: KIND_DEBRIS,
      x: px, y: py,
      vx: dx * 40 + Math.cos(a) * spread,
      vy: dy * 40 + Math.sin(a) * spread,
      life: 0.7 + Math.random() * 1.0,
      size: 0.7 + Math.random() * 1.5,
      color: DEBRIS_COLORS[(Math.random() * DEBRIS_COLORS.length) | 0],
      drag: 1.3,
      glow: 1,
    })
    if (p) m.debris.push({ p, gone: false })
  }

  // 点击爆散：命中最近的流星则返回 true。只影响被点击的那一颗。
  handleClick(x: number, y: number, pool: ParticlePool): boolean {
    let best: Meteor | null = null
    let bestD = 30 // 命中半径（像素）
    for (const m of this.meteors) {
      if (!m.active || m.state !== 'flying') continue
      const dirLen = Math.hypot(m.vx, m.vy)
      const dx = dirLen ? m.vx / dirLen : 1
      const dy = dirLen ? m.vy / dirLen : 0
      const d = distToSeg(x, y, m.x, m.y, m.x - dx * m.len, m.y - dy * m.len)
      if (d < bestD) { bestD = d; best = m }
    }
    if (!best) return false

    const m = best
    // 立即停止原运动
    m.vx *= 0.06
    m.vy *= 0.06
    m.state = 'burst'
    m.holdT = 0
    m.debris.length = 0
    // 向四周爆散大量发光粒子（数量也随机）
    const count = 70 + (Math.random() * 50) | 0
    for (let i = 0; i < count; i++) {
      const a = Math.random() * 6.2832
      const speed = 60 + Math.random() * 300
      const p = pool.spawn({
        kind: KIND_DEBRIS,
        x: m.x + (Math.random() - 0.5) * 6,
        y: m.y + (Math.random() - 0.5) * 6,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1.1 + Math.random() * 1.6,
        size: 0.8 + Math.random() * 2.2,
        color: DEBRIS_COLORS[(Math.random() * DEBRIS_COLORS.length) | 0],
        drag: 0.8 + Math.random() * 1.0,
        glow: 1,
        // 重组时的弧线绕行：给每个粒子一点点切向速度和残留目标偏移
        swirl: (Math.random() - 0.5) * 90,
        tox: (Math.random() - 0.5) * 70,
        toy: (Math.random() - 0.5) * 70,
      })
      if (!p) break
      m.debris.push({ p, gone: false })
    }
    return true
  }

  draw(ctx: CanvasRenderingContext2D) {
    const sprite = glowSprite()
    for (const m of this.meteors) {
      if (!m.active) continue
      const vis = (1 - m.frag) * Math.min(1, Math.max(0, m.life)) * m.base
      if (vis < 0.02) continue
      const dirLen = Math.hypot(m.vx, m.vy)
      const dx = dirLen ? m.vx / dirLen : 1
      const dy = dirLen ? m.vy / dirLen : 0
      const tailX = m.x - dx * m.len
      const tailY = m.y - dy * m.len

      // 拖尾：渐变透明，尾巴自然消失
      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
      grad.addColorStop(0, `rgba(214,238,255,${0.9 * vis})`)
      grad.addColorStop(0.22, `rgba(178,220,255,${0.42 * vis})`)
      grad.addColorStop(0.6, `rgba(150,200,255,${0.13 * vis})`)
      grad.addColorStop(1, 'rgba(150,200,255,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = m.width
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(m.x, m.y)
      ctx.lineTo(tailX, tailY)
      ctx.stroke()

      // 头部光点
      const gr = 9
      ctx.globalAlpha = vis
      ctx.drawImage(sprite, m.x - gr, m.y - gr, gr * 2, gr * 2)
      ctx.globalAlpha = 1
    }
  }
}
