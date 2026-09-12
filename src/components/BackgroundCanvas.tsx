import { useEffect, useRef } from 'react'
import { createBackgroundEngine } from '../background/engine'

// 背景层：fixed 全屏画布，不接收任何指针事件，不参与布局
export default function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const engine = createBackgroundEngine(ref.current)
    // 开发期调试句柄：生产构建下 import.meta.env.DEV 为 false，不会挂载
    if (import.meta.env.DEV) {
      ;(window as unknown as { __bg?: unknown }).__bg = engine
    }
    return () => engine.destroy()
  }, [])

  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />
}
