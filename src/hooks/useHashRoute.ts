import { useEffect, useState } from 'react'

export type Route = { view: 'home'; anchor?: string } | { view: 'project'; slug: string }

// '#/project/<slug>' → 项目详情页；'#about' 等普通锚点 → 首页对应区块。
// hash 路由让构建产物在任意静态服务器、任意子路径下都能直接运行。
function parse(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('/project/')) {
    return { view: 'project', slug: decodeURIComponent(h.slice('/project/'.length)) }
  }
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
