import { useEffect } from 'react'
import BackgroundCanvas from './components/BackgroundCanvas'
import HomePage from './pages/HomePage'
import ProjectDetail from './components/project/ProjectDetail'
import { useHashRoute } from './hooks/useHashRoute'

export default function App() {
  const route = useHashRoute()

  // 从详情页返回首页指定区块，或直接打开带锚点的链接时，等渲染完成再滚动
  useEffect(() => {
    if (route.view === 'project') {
      window.scrollTo(0, 0)
    } else if (route.anchor && route.anchor !== 'top') {
      requestAnimationFrame(() => {
        document.getElementById(route.anchor!)?.scrollIntoView()
      })
    }
  }, [route])

  return (
    <>
      <BackgroundCanvas />
      {route.view === 'home' ? <HomePage /> : <ProjectDetail slug={route.slug} />}
    </>
  )
}
