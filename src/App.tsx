import { useEffect } from 'react'
import BackgroundCanvas from './components/BackgroundCanvas'
import HomePage from './pages/HomePage'
import ProjectDetail from './components/project/ProjectDetail'
import AllProjectsPage from './pages/AllProjectsPage'
import { useHashRoute } from './hooks/useHashRoute'

export default function App() {
  const route = useHashRoute()

  // 换页回到顶部；带锚点回首页时等渲染完成再滚动
  useEffect(() => {
    if (route.view === 'home') {
      if (route.anchor && route.anchor !== 'top') {
        requestAnimationFrame(() => {
          document.getElementById(route.anchor!)?.scrollIntoView()
        })
      } else {
        window.scrollTo(0, 0)
      }
    } else {
      window.scrollTo(0, 0)
    }
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
