import {
  IconMenuOutline20,
  IconNewChatOutline20,
  IconVolumeMutedOutline20,
  IconVolumeOutline20,
} from '../base/icons.js'
import { useTranslate } from '../../i18n/index.js'
import { newChat } from '../../services/chat/store.js'
import { setAutoRead, useSettings } from '../../services/settings.js'
import { unlockReadAloudAudio } from '../../services/speech/readAloud.js'
import { IconButton } from '../base/IconButton.js'
import { showToast } from '../base/toastState.js'
import { openMobileSider } from '../sider/mobileSiderState.js'
import styles from './MobileHeader.module.css'

/** 移动端顶栏：左侧菜单打开侧边栏；会话页再显示标题、自动朗读与开启新对话 */
export const MobileHeader = ({ title }: { title?: string }) => {
  const t = useTranslate()
  const autoRead = useSettings((state) => state.autoRead)
  return (
    <div className={styles.header}>
      <IconButton
        size="xl"
        tone="primary"
        icon={<IconMenuOutline20 />}
        aria-label={t('expandSiderbarButton')}
        onClick={openMobileSider}
      />
      {title === undefined ? null : (
        <>
          <div className={styles.title}>{title}</div>
          <IconButton
            size="xl"
            tone={autoRead ? 'primary' : 'tertiary'}
            className={autoRead ? styles.autoReadActive : undefined}
            icon={autoRead ? <IconVolumeOutline20 /> : <IconVolumeMutedOutline20 />}
            tooltip={t(autoRead ? 'autoReadOn' : 'autoReadOff')}
            tooltipPlacement="bottom"
            onClick={() => {
              const next = !autoRead
              setAutoRead(next)
              if (next) {
                unlockReadAloudAudio()
              }
              showToast({ key: next ? 'autoReadEnabled' : 'autoReadDisabled' })
            }}
          />
          <IconButton
            size="xl"
            tone="primary"
            icon={<IconNewChatOutline20 />}
            aria-label={t('newChat')}
            onClick={newChat}
          />
        </>
      )}
    </div>
  )
}
