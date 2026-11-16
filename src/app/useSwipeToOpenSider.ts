import { useEffect } from 'react'
import {
  dragMobileSider,
  settleMobileSider,
  useMobileSider,
} from '../components/sider/mobileSiderState.js'

const INTERACTIVE = 'input, textarea, select, [contenteditable="true"], a, button'
const DRAWER_MAX_WIDTH = 300
const DRAWER_GUTTER = 48
/** 打开/关闭的吸附阈值 */
const OPEN_THRESHOLD = 0.2
const CLOSE_THRESHOLD = 0.8

const drawerWidth = () => Math.min(DRAWER_MAX_WIDTH, Math.max(0, window.innerWidth - DRAWER_GUTTER))

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const isInteractive = (target: EventTarget | null) =>
  target instanceof Element && target.closest(INTERACTIVE) !== null

/** 在可横向滚动的代码块等区域里，不把滑动当成抽屉手势。 */
const isInsideHorizontalScroller = (target: EventTarget | null) => {
  for (
    let element = target instanceof Element ? target : null;
    element && element !== document.body;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element)
    if (/auto|scroll/.test(style.overflowX) && element.scrollWidth > element.clientWidth) {
      return true
    }
  }
  return false
}

type Drag = {
  mode: 'open' | 'close'
  x: number
  y: number
  active: boolean
  progress: number
}

/**
 * 移动端抽屉手势：
 * - 关闭时从左半屏右滑，抽屉随手指平移；
 * - 打开时可从抽屉或遮罩向左滑关闭；
 * - 松手后按位移吸附到打开/关闭，并恢复 CSS 过渡动画。
 */
export const useSwipeToOpenSider = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return
    }
    let drag: Drag | null = null

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return
      }
      const touch = event.touches[0]
      if (useMobileSider.getState().open) {
        if (isInteractive(event.target)) {
          return
        }
        drag = { mode: 'close', x: touch.clientX, y: touch.clientY, active: false, progress: 1 }
        return
      }
      const maxStartX = Math.min(240, window.innerWidth * 0.5)
      if (
        touch.clientX > maxStartX ||
        isInteractive(event.target) ||
        isInsideHorizontalScroller(event.target)
      ) {
        return
      }
      drag = { mode: 'open', x: touch.clientX, y: touch.clientY, active: false, progress: 0 }
    }

    const onMove = (event: TouchEvent) => {
      if (!drag || event.touches.length !== 1) {
        return
      }
      const touch = event.touches[0]
      const dx = touch.clientX - drag.x
      const dy = touch.clientY - drag.y
      if (!drag.active) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          return
        }
        // 方向不对或纵向滚动优先时放弃本次手势，把列表滚动留给浏览器。
        if (
          (drag.mode === 'open' && dx <= 0) ||
          (drag.mode === 'close' && dx >= 0) ||
          Math.abs(dy) > Math.abs(dx) * 1.2
        ) {
          drag = null
          return
        }
        drag.active = true
      }
      if (event.cancelable) {
        event.preventDefault()
      }
      const width = drawerWidth()
      if (width <= 0) {
        return
      }
      drag.progress = drag.mode === 'open' ? clamp(dx / width) : clamp(1 + dx / width)
      dragMobileSider(drag.progress)
    }

    const settle = (cancelled: boolean) => {
      if (!drag) {
        return
      }
      const current = drag
      drag = null
      if (!current.active) {
        return
      }
      if (cancelled) {
        settleMobileSider(current.mode === 'close')
        return
      }
      settleMobileSider(
        current.mode === 'open'
          ? current.progress >= OPEN_THRESHOLD
          : current.progress > CLOSE_THRESHOLD
      )
    }

    const onEnd = () => settle(false)
    const onCancel = () => settle(true)
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled])
}
