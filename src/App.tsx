import { useEffect } from 'react'
import BackgroundCanvas from './components/BackgroundCanvas'
import HomePage from './pages/HomePage'
import ProjectDetail from './components/project/ProjectDetail'
import ProjectsPage from './pages/ProjectsPage'
import { useHashRoute } from './hooks/useHashRoute'

export default function App() {
  const route = useHashRoute()

  // 独立页面切换后回到顶部；带锚点回首页时等渲染完成再滚动
  useEffect(() => {
    if (route.view !== 'home') {
      window.scrollTo(0, 0)
    } else if (route.anchor && route.anchor !== 'top') {
      requestAnimationFrame(() => {
        document.getElementById(route.anchor!)?.scrollIntoView()
      })
    } else {
      // 回到首页顶部（Home 导航 / 空锚点）
      window.scrollTo(0, 0)
    }
  }, [route])

  return (
    <>
      <BackgroundCanvas />
      {route.view === 'home' && <HomePage />}
      {route.view === 'project' && <ProjectDetail slug={route.slug} />}
      {route.view === 'projects' && <ProjectsPage />}
    </>
  )
}
