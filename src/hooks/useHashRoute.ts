import { useEffect, useLayoutEffect, useState } from 'react'

export type Route =
  | { view: 'home'; anchor?: string; restore?: boolean }
  | { view: 'project'; slug: string }
  | { view: 'allProjects' }
  | { view: 'notFound'; path: string }

// '#/project/<slug>' → 项目详情页；'#/all-projects' → 全部项目页；
// '#/home' → 回首页并定位到 Projects（可选恢复进入项目前的位置）。
// 用 '#/home' 而非 '#projects'：后者会触发浏览器原生锚点滚动，与 JS 恢复位置打架。
// 浏览器刷新时统一回到首页顶端；首次直接打开项目链接仍会正常展示详情。
// '#about' 等普通锚点 → 首页对应区块。
// 其余以 '/' 开头的路径没有对应页面，走 404，而不是静默回退到首页
// —— 否则地址栏留着一个不存在的路径、页面却是首页，用户无法察觉链接写错了。
// hash 路由让构建产物在任意静态服务器、任意子路径下都能直接运行。
function parse(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('/project/')) {
    return { view: 'project', slug: decodeURIComponent(h.slice('/project/'.length)) }
  }
  if (h === '/all-projects') return { view: 'allProjects' }
  if (h === '/home') return { view: 'home', restore: true }
  if (h.startsWith('/')) return { view: 'notFound', path: h }
  return { view: 'home', anchor: h || undefined }
}

function isReloadNavigation() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return navigation?.type === 'reload'
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => {
    if (isReloadNavigation()) return { view: 'home', anchor: 'top' }
    return parse(location.hash)
  })

  // Hash 路由会被浏览器保留在刷新后的地址里；刷新时把它规范到首页顶端。
  // 直接打开项目链接仍按原路由呈现，因为导航类型不是 reload。
  useLayoutEffect(() => {
    if (!isReloadNavigation() || !location.hash || location.hash === '#top') return
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${location.search}#top`,
    )
  }, [])

  useEffect(() => {
    const on = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', on)
    window.addEventListener('popstate', on)
    return () => {
      window.removeEventListener('hashchange', on)
      window.removeEventListener('popstate', on)
    }
  }, [])
  return route
}
