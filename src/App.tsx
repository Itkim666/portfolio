import { useLayoutEffect, useRef } from 'react'
import BackgroundCanvas from './components/BackgroundCanvas'
import HomePage from './pages/HomePage'
import ProjectDetail from './components/project/ProjectDetail'
import AllProjectsPage from './pages/AllProjectsPage'
import NotFoundPage from './pages/NotFoundPage'
import { useHashRoute } from './hooks/useHashRoute'
import { consumeReturn } from './utils/scrollMemory'
// 瞬间滚动：临时覆盖 CSS 的 scroll-behavior: smooth，
// 否则从别的页面返回首页时会看到“从顶部一路滑下来”。
// 统一用 window.scrollTo（显式算出目标偏移），比 scrollIntoView 更可控，
// 也避免不同环境对 scrollIntoView 行为不一致。
function jump(target?: HTMLElement | null, y?: number) {
  const html = document.documentElement
  const prev = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  if (typeof y === 'number') {
    window.scrollTo(0, y)
  } else if (target) {
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - margin)
  } else {
    window.scrollTo(0, 0)
  }
  html.style.scrollBehavior = prev
}

export default function App() {
  const route = useHashRoute()
  const prevView = useRef<string | null>(null)

  useLayoutEffect(() => {
    const from = prevView.current
    prevView.current = route.view
    const isFirst = from === null
    // 从其他页面进入首页（而不是首页内部点锚点）
    const fromOtherPage = from !== null && from !== 'home'

    if (route.view !== 'home') {
      jump()
      return
    }

    // Back to Home：回到首页 Projects 区域。
    // 有进入项目前的位置就精确恢复；没有（如直接打开详情链）就落到 Projects 区块。
    if (route.restore) {
      const saved = consumeReturn()
      if (saved !== null) jump(null, saved)
      else jump(document.getElementById('projects'))
      return
    }

    if (!route.anchor || route.anchor === 'top') {
      if (isFirst || fromOtherPage) jump()
      return
    }
    // 首页内部点锚点：交给浏览器原生平滑滚动，这里不重复处理
    if (!isFirst && !fromOtherPage) return
    jump(document.getElementById(route.anchor))
  }, [route])

  return (
    <>
      <BackgroundCanvas />
      {route.view === 'home' && <HomePage />}
      {route.view === 'project' && <ProjectDetail slug={route.slug} />}
      {route.view === 'allProjects' && <AllProjectsPage />}
      {route.view === 'notFound' && <NotFoundPage path={route.path} />}
    </>
  )
}
