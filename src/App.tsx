import { useLayoutEffect, useRef } from 'react'
import BackgroundCanvas from './components/BackgroundCanvas'
import HomePage from './pages/HomePage'
import ProjectDetail from './components/project/ProjectDetail'
import AllProjectsPage from './pages/AllProjectsPage'
import { useHashRoute } from './hooks/useHashRoute'

// 瞬间滚动：临时覆盖 CSS 的 scroll-behavior: smooth，
// 否则从别的页面返回首页时会看到“从顶部一路滑下来”。
function jump(target?: HTMLElement | null) {
  const html = document.documentElement
  const prev = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  if (target) target.scrollIntoView({ block: 'start' })
  else window.scrollTo(0, 0)
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
    </>
  )
}
