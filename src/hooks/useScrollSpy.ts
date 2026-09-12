import { useEffect, useState } from 'react'

// 滚动监听（rAF 节流）：取“最后一个顶部越过视口 35% 线”的区块作为当前区块。
// 首页导航高亮与项目大纲高亮共用这一实现。
export function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')
  const key = ids.join(',')

  useEffect(() => {
    const list = key.split(',')
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const line = window.innerHeight * 0.35
        let cur = list[0] ?? ''
        for (const id of list) {
          const el = document.getElementById(id)
          if (el && el.getBoundingClientRect().top <= line) cur = id
        }
        setActive(cur)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [key])

  return active
}
