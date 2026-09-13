import { useEffect, useState } from 'react'

export type Route =
  | { view: 'home'; anchor?: string; restore?: boolean }
  | { view: 'project'; slug: string }
  | { view: 'allProjects' }

// '#/project/<slug>' → 项目详情页；'#/all-projects' → 全部项目页；
// '#/home' → 回首页并定位到 Projects（可选恢复进入项目前的位置）。
// 用 '#/home' 而非 '#projects'：后者会触发浏览器原生锚点滚动，与 JS 恢复位置打架。
// '#about' 等普通锚点 → 首页对应区块。
// hash 路由让构建产物在任意静态服务器、任意子路径下都能直接运行。
function parse(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('/project/')) {
    return { view: 'project', slug: decodeURIComponent(h.slice('/project/'.length)) }
  }
  if (h === '/all-projects') return { view: 'allProjects' }
  if (h === '/home') return { view: 'home', restore: true }
  return { view: 'home', anchor: h || undefined }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
