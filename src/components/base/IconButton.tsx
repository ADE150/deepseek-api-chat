import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Tooltip, type TooltipPlacement } from './Tooltip.js'
import styles from './IconButton.module.css'

/**
 * xs 为 28px（图标 16px）、m 为 34px、xl 为 44px（图标 20px）。
 * tooltip 同时作为无障碍名称；没有 tooltip 的按钮通过 aria-label 提供名称
 */
export const IconButton = ({
  icon,
  size = 'xs',
  tone = 'tertiary',
  tooltip,
  tooltipPlacement,
  className,
  ...props
}: {
  icon: ReactNode
  size?: 'xs' | 'm' | 'xl'
  tone?: 'tertiary' | 'primary'
  tooltip?: string
  tooltipPlacement?: TooltipPlacement
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'>) => {
  const { onPointerUp, onClick, ...buttonProps } = props
  const button = (
    <button
      type="button"
      className={clsx(styles.button, styles[size], styles[tone], className)}
      aria-label={tooltip}
      {...buttonProps}
      onPointerUp={(event) => {
        // 触屏点击后主动失焦。浏览器会在 pointerup 之后的 click 默认行为里重新聚焦，
        // 所以延迟到下一轮事件循环再 blur，避免 Android WebView 留下持续的高亮/涟漪。
        if (event.pointerType !== 'mouse') {
          const button = event.currentTarget
          window.setTimeout(() => {
            if (document.activeElement === button) {
              button.blur()
            }
          }, 0)
        }
        onPointerUp?.(event)
      }}
      onClick={(event) => {
        // detail > 0 表示鼠标/触摸点击；键盘激活 detail 为 0，保留键盘焦点。
        if (event.detail > 0) {
          const button = event.currentTarget
          window.setTimeout(() => {
            if (document.activeElement === button) {
              button.blur()
            }
          }, 0)
        }
        onClick?.(event)
      }}
    >
      {icon}
    </button>
  )
  return tooltip ? (
    <Tooltip content={tooltip} placement={tooltipPlacement}>
      {button}
    </Tooltip>
  ) : (
    button
  )
}
