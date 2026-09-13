import { useEffect, useState } from 'react'
import { site } from '../data/site'

// Skills/About/Contact 保持首页锚点行为；Projects 指向独立页面（hash 路由切换，不新开标签页）
const LINKS = [
  { href: '#top', id: 'top', label: 'Home' },
  { href: '#about', id: 'about', label: 'About' },
  { href: '#skills', id: 'skills', label: 'Skills' },
  { href: '#/projects', id: 'projects', label: 'Projects' },
  { href: '#github', id: 'github', label: 'GitHub' },
  { href: '#contact', id: 'contact', label: 'Contact' },
]

export default function Navbar({ active }: { active: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

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

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          {site.name}<span className="brand-dot">.</span>
        </a>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={active === l.id ? 'on' : ''}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <button
          className="burger"
          aria-label="切换菜单"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
