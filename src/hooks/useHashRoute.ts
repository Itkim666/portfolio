import { useEffect, useState } from 'react'

export type Route =
  | { view: 'home'; anchor?: string }
  | { view: 'project'; slug: string }
  | { view: 'projects' }

// 支持的独立页面路由（Skills / GitHub 保持首页锚点行为）
const PAGES = ['/projects'] as const

// '#/project/<slug>' → 项目详情；'#/projects' → 项目页；
// '#about' 等普通锚点 → 首页对应区块。
// hash 路由让构建产物在任意静态服务器、任意子路径下都能直接运行。
function parse(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('/project/')) {
    return { view: 'project', slug: decodeURIComponent(h.slice('/project/'.length)) }
  }
  for (const p of PAGES) {
    if (h === p) return { view: p.slice(1) as 'projects' }
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
