import type { MouseEvent as ReactMouseEvent } from 'react'

/** Navigate hash routes without letting the browser perform native smooth-anchor scrolling. */
export function navigateHashRoute(hash: string) {
  const nextHash = hash.startsWith('#')
    ? hash
    : `#${hash.startsWith('/') ? hash : `/${hash}`}`

  window.history.pushState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash}`)
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
}

export function handleHashRouteClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  hash: string,
  beforeNavigate?: () => void,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.currentTarget.target && event.currentTarget.target !== '_self')
  ) return

  event.preventDefault()
  beforeNavigate?.()
  navigateHashRoute(hash)
}
