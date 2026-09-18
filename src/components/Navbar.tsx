import { useCallback, useEffect, useRef, useState } from 'react'
import { site } from '../data/site'

const LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#education', label: 'Education' },
  { href: '#github', label: 'GitHub' },
  { href: '#contact', label: 'Contact' },
]

// 与 global.css 里折叠导航的断点保持一致（@media (max-width: 960px)）
const MOBILE_QUERY = '(max-width: 960px)'

const FOCUSABLE = 'a[href], button:not([disabled])'

export default function Navbar({ active }: { active: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )
  const headerRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)

  const menuOpen = open && isMobile

  useEffect(() => {
    let raf = 0
    const on = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setScrolled(window.scrollY > 24)
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  // 折叠菜单只在窄屏有意义：拉宽到桌面断点后必须收起，
  // 否则 open 状态会残留，滚动锁和焦点陷阱会跟着一起卡住。
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isMobile) setOpen(false)
  }, [isMobile])

  // restoreFocus：Esc / 点按钮关闭时把焦点交回汉堡按钮；
  // 鼠标点到别处时不抢焦点（用户已经点走了，再抢回来反而别扭）。
  const close = useCallback((restoreFocus: boolean) => {
    const header = headerRef.current
    const focusInside = !!header && !!document.activeElement && header.contains(document.activeElement)
    setOpen(false)
    if (restoreFocus && focusInside) burgerRef.current?.focus()
  }, [])

  // 展开后焦点直接进入菜单第一项。
  // .nav-links 在 DOM 里排在汉堡按钮之前，不这样做的话从按钮往后 Tab 会直接跳过菜单。
  useEffect(() => {
    if (!menuOpen) return
    navRef.current?.querySelector<HTMLElement>('a')?.focus()
  }, [menuOpen])

  // Esc 关闭 + 点击菜单外部关闭
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    const onPointerDown = (e: PointerEvent) => {
      const header = headerRef.current
      if (header && e.target instanceof Node && !header.contains(e.target)) close(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen, close])

  // 菜单是覆盖在正文之上的浮层，Tab 不该跑到被它盖住的内容上。
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const header = headerRef.current
      if (!header) return
      const items = Array.from(header.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null
      const inside = !!current && header.contains(current)
      if (e.shiftKey && (!inside || current === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || current === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // 菜单展开时锁住背景滚动。锁 html 而不是 body：
  // body 上有 overflow-x: hidden，设 overflow 会把它变成独立滚动容器，
  // 真正滚动的仍是 html（document.scrollingElement），锁 body 拦不住。
  useEffect(() => {
    if (!menuOpen) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`} ref={headerRef}>
      <div className="nav-inner">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          {site.name}<span className="brand-dot">.</span>
        </a>
        <nav id="site-menu" className={`nav-links ${menuOpen ? 'open' : ''}`} ref={navRef}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={active === l.href.slice(1) ? 'on' : ''}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <button
          ref={burgerRef}
          className="burger"
          aria-label="切换菜单"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
