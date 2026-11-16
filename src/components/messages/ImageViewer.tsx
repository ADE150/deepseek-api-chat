import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslate } from '../../i18n/index.js'
import { IconCloseOutline16 } from '../base/icons.js'
import styles from './ImageViewer.module.css'

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_TAP_SCALE = 2.5
const HORIZONTAL_PADDING = 16

type Pinch = {
  startDistance: number
  startScale: number
  ratioX: number
  ratioY: number
}

type Anchor = {
  ratioX: number
  ratioY: number
  midX: number
  midY: number
}

const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

/**
 * 应用内全屏图片查看器：
 * - 长截图按容器宽度显示，可上下滚动；
 * - 双指缩放只作用于图片，不缩放背景页面；
 * - 双击在 1x / 2.5x 之间切换；
 * - Esc / Android 返回键关闭。
 */
export const ImageViewer = ({
  src,
  name,
  onClose,
}: {
  src: string
  name: string
  onClose: () => void
}) => {
  const t = useTranslate()
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [baseWidth, setBaseWidth] = useState<number | null>(null)
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const pinchRef = useRef<Pinch | null>(null)
  const pendingAnchorRef = useRef<Anchor | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // 缩放后在同一帧把捏合中心重新放回手指下方。
  useLayoutEffect(() => {
    const anchor = pendingAnchorRef.current
    const scroll = scrollRef.current
    if (!anchor || !scroll) {
      return
    }
    pendingAnchorRef.current = null
    scroll.scrollLeft = anchor.ratioX * scroll.scrollWidth - anchor.midX
    scroll.scrollTop = anchor.ratioY * scroll.scrollHeight - anchor.midY
  }, [scale])

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) {
      return
    }
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        pinchRef.current = null
        return
      }
      const scroll = scrollRef.current
      if (!scroll) {
        return
      }
      const [a, b] = event.touches
      const rect = scroll.getBoundingClientRect()
      const midX = (a.clientX + b.clientX) / 2 - rect.left
      const midY = (a.clientY + b.clientY) / 2 - rect.top
      pinchRef.current = {
        startDistance: Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)),
        startScale: scaleRef.current,
        ratioX: (scroll.scrollLeft + midX) / Math.max(1, scroll.scrollWidth),
        ratioY: (scroll.scrollTop + midY) / Math.max(1, scroll.scrollHeight),
      }
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        // 阻止浏览器页面级双指缩放，只让图片缩放。
        event.preventDefault()
      }
      const pinch = pinchRef.current
      if (!pinch || event.touches.length !== 2) {
        return
      }
      const scroll = scrollRef.current
      if (!scroll) {
        return
      }
      const [a, b] = event.touches
      const rect = scroll.getBoundingClientRect()
      const distance = Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY))
      const next = clamp(pinch.startScale * (distance / pinch.startDistance))
      pendingAnchorRef.current = {
        ratioX: pinch.ratioX,
        ratioY: pinch.ratioY,
        midX: (a.clientX + b.clientX) / 2 - rect.left,
        midY: (a.clientY + b.clientY) / 2 - rect.top,
      }
      setScale(next)
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        pinchRef.current = null
      }
    }
    const preventGesture = (event: Event) => event.preventDefault()
    overlay.addEventListener('touchstart', onTouchStart, { passive: true })
    overlay.addEventListener('touchmove', onTouchMove, { passive: false })
    overlay.addEventListener('touchend', onTouchEnd, { passive: true })
    overlay.addEventListener('touchcancel', onTouchEnd, { passive: true })
    overlay.addEventListener('gesturestart', preventGesture)
    overlay.addEventListener('gesturechange', preventGesture)
    return () => {
      overlay.removeEventListener('touchstart', onTouchStart)
      overlay.removeEventListener('touchmove', onTouchMove)
      overlay.removeEventListener('touchend', onTouchEnd)
      overlay.removeEventListener('touchcancel', onTouchEnd)
      overlay.removeEventListener('gesturestart', preventGesture)
      overlay.removeEventListener('gesturechange', preventGesture)
    }
  }, [])

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    const scroll = scrollRef.current
    const available = Math.max(
      1,
      (scroll?.clientWidth ?? image.naturalWidth) - HORIZONTAL_PADDING * 2
    )
    setBaseWidth(Math.min(image.naturalWidth || available, available))
  }

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    const scroll = scrollRef.current
    if (!scroll) {
      return
    }
    const rect = scroll.getBoundingClientRect()
    const midX = event.clientX - rect.left
    const midY = event.clientY - rect.top
    pendingAnchorRef.current = {
      ratioX: (scroll.scrollLeft + midX) / Math.max(1, scroll.scrollWidth),
      ratioY: (scroll.scrollTop + midY) / Math.max(1, scroll.scrollHeight),
      midX,
      midY,
    }
    setScale(scale > 1 ? 1 : DOUBLE_TAP_SCALE)
  }

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div ref={scrollRef} className={styles.scroll} onDoubleClick={handleDoubleClick}>
        <div
          className={styles.stage}
          style={baseWidth === null ? undefined : { width: baseWidth * scale }}
        >
          <img
            className={styles.image}
            src={src}
            alt={name}
            draggable={false}
            onLoad={handleImageLoad}
          />
        </div>
      </div>
      <button type="button" className={styles.close} aria-label={t('close')} onClick={onClose}>
        <IconCloseOutline16 />
      </button>
    </div>,
    document.body
  )
}
