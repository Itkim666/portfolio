interface ProjectTransitionOptions {
  source: HTMLElement
  cover: string
  onNavigate: () => void
}

let active = false
let previousOverflow = ''

/**
 * 以首页中真实可见的封面为起点，完成项目详情的共享元素转场。
 * 路由会在封面展开的中段切换，因此详情内容始终在封面下方等待被揭示。
 */
export function startProjectTransition({ source, cover, onNavigate }: ProjectTransitionOptions) {
  if (active) return false

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onNavigate()
    return true
  }

  active = true
  const sourceCover = source.querySelector<HTMLElement>('.stage-card__cover') ?? source
  const sourceImage = sourceCover.querySelector<HTMLImageElement>('img')
  const rect = sourceCover.getBoundingClientRect()
  const overlay = document.createElement('div')
  const image = document.createElement('img')

  overlay.className = 'project-transition-cover'
  overlay.style.left = `${rect.left}px`
  overlay.style.top = `${rect.top}px`
  overlay.style.width = `${rect.width}px`
  overlay.style.height = `${rect.height}px`
  image.src = cover
  image.alt = ''
  image.decoding = 'sync'
  // 悬停时封面本身已有轻微缩放；复制当前计算后的图像状态，起帧不会回跳。
  if (sourceImage) {
    const style = window.getComputedStyle(sourceImage)
    image.style.transform = style.transform
    image.style.transformOrigin = style.transformOrigin
    image.style.filter = style.filter
  }
  overlay.append(image)

  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  document.body.classList.add('is-project-transitioning')
  document.body.append(overlay)

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => overlay.classList.add('is-expanding'))
  })

  // 详情页在全屏封面尚未离开时挂载，避免 hash 路由产生空白帧。
  window.setTimeout(onNavigate, 420)
  window.setTimeout(() => {
    document.body.classList.remove('is-project-transitioning')
    document.body.classList.add('is-project-cover-revealing')
    overlay.classList.add('is-revealing')
  }, 810)

  window.setTimeout(() => {
    overlay.remove()
    document.documentElement.style.overflow = previousOverflow
    document.body.classList.remove('is-project-cover-revealing')
    active = false
  }, 1900)

  return true
}
