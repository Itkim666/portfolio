import { useLayoutEffect, useRef } from 'react'
import BackgroundCanvas from './components/BackgroundCanvas'
import HomePage from './pages/HomePage'
import ProjectDetail from './components/project/ProjectDetail'
import AllProjectsPage from './pages/AllProjectsPage'
import NotFoundPage from './pages/NotFoundPage'
import { useHashRoute } from './hooks/useHashRoute'
import { consumeReturn } from './utils/scrollMemory'
// 路由切页必须瞬间定位；全局页面锚点仍可使用 CSS 平滑滚动。
function jump(target?: HTMLElement | null, y?: number) {
  let top = 0
  if (typeof y === 'number') {
    top = y
  } else if (target) {
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    top = target.getBoundingClientRect().top + window.scrollY - margin
  }
  window.scrollTo({ top, left: 0, behavior: 'instant' })
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
