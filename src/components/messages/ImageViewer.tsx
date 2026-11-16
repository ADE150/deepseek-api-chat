import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslate } from '../../i18n/index.js'
import { IconCloseOutline16 } from '../base/icons.js'
import styles from './ImageViewer.module.css'

/** 应用内全屏图片查看器；Esc / Android 返回键 / 点击背景关闭。 */
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
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onClose}
    >
      <img
        className={styles.image}
        src={src}
        alt={name}
        draggable={false}
        onClick={(event) => event.stopPropagation()}
      />
      <button type="button" className={styles.close} aria-label={t('close')} onClick={onClose}>
        <IconCloseOutline16 />
      </button>
    </div>,
    document.body
  )
}
