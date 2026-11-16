import { create } from 'zustand'

/**
 * 移动端抽屉状态：
 * - open 表示最终是否展开；
 * - progress 为 0（全关）到 1（全开），拖动时跟随手指；
 * - dragging 为 true 时关闭 CSS 过渡，保证跟手。
 */
type MobileSiderState = {
  open: boolean
  progress: number
  dragging: boolean
}

export const useMobileSider = create<MobileSiderState>(() => ({
  open: false,
  progress: 0,
  dragging: false,
}))

export const openMobileSider = () =>
  useMobileSider.setState({ open: true, progress: 1, dragging: false })

export const closeMobileSider = () =>
  useMobileSider.setState({ open: false, progress: 0, dragging: false })

/** 拖动中实时更新位移；不做边界动画，由手指位置决定。 */
export const dragMobileSider = (progress: number) =>
  useMobileSider.setState({ dragging: true, progress })

/** 松手后吸附到打开或关闭，并恢复过渡动画。 */
export const settleMobileSider = (open: boolean) =>
  useMobileSider.setState({ dragging: false, open, progress: open ? 1 : 0 })
