// 全局共享的指针状态：所有背景模块只读这一个对象，避免重复监听
export const pointer = {
  x: -9999,
  y: -9999,
  active: false,
}

export function attachPointer(): () => void {
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.active = true
  }
  const onLeave = () => {
    pointer.active = false
    pointer.x = -9999
    pointer.y = -9999
  }
  const onUp = (e: PointerEvent) => {
    // 触摸抬起后指针不再存在，避免残留一个“隐形鼠标”
    if (e.pointerType === 'touch') onLeave()
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('blur', onLeave)
  return () => {
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('blur', onLeave)
  }
}
