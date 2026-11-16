import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  IconBranchOutline20,
  IconCloseOutline16,
  IconPanelLeftOutline16,
  IconSearchOutline16,
  IconSettingsOutline16,
  NewChatIcon,
} from '../base/icons.js'
import { requestMessageFocus } from '../../services/chat/focus.js'
import { searchMessages, type MessageSearchResult } from '../../services/chat/search.js'
import { groupSessions } from '../../services/chat/sessionGroups.js'
import { newChat, removeSession, selectSession, useChatStore } from '../../services/chat/store.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { setSiderCollapsed } from '../../services/settings.js'
import { Button } from '../base/Button.js'
import { IconButton } from '../base/IconButton.js'
import { Modal } from '../base/Modal.js'
import { showToast } from '../base/toastState.js'
import { openSettings } from '../settings/settingsDialogState.js'
import { BranchGraphDialog } from './BranchGraphDialog.js'
import { closeMobileSider, useMobileSider } from './mobileSiderState.js'
import { SearchResultItem } from './SearchResultItem.js'
import { SessionItem } from './SessionItem.js'
import styles from './Sider.module.css'

/** 展开的侧边栏：名称、搜索、收起、开启新对话、会话列表、底部设置；移动端放在抽屉里。 */
export const Sider = ({ mobile = false }: { mobile?: boolean }) => {
  const t = useTranslate()
  const sessions = useChatStore((state) => state.sessions)
  const activeId = useChatStore((state) => state.activeId)
  const [now, setNow] = useState(Date.now)
  const groups = useMemo(() => groupSessions(sessions, now, t), [sessions, now, t])
  const [deleting, setDeleting] = useState<SessionSummary | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MessageSearchResult[]>([])
  const [searchPending, setSearchPending] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const drawerOpen = useMobileSider((state) => state.open)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const time = Date.now()
      setNow(time)
      const midnight = new Date(time).setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight - time)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    refresh()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    if (searching && (!mobile || drawerOpen)) {
      searchInputRef.current?.focus()
    } else if (mobile && !drawerOpen) {
      searchInputRef.current?.blur()
    }
  }, [searching, mobile, drawerOpen])

  useEffect(() => {
    if (!searching) {
      return
    }
    const keyword = query.trim()
    if (!keyword) {
      setResults([])
      setSearchPending(false)
      setSearchError(false)
      return
    }
    const controller = new AbortController()
    setSearchPending(true)
    setSearchError(false)
    const timer = window.setTimeout(() => {
      void searchMessages(keyword, controller.signal)
        .then((next) => {
          if (!controller.signal.aborted) {
            setResults(next)
            setSearchPending(false)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([])
            setSearchPending(false)
            setSearchError(true)
          }
        })
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, searching])

  const closeSearch = () => {
    setSearching(false)
    setQuery('')
    setResults([])
    setSearchPending(false)
    setSearchError(false)
  }

  const openSearchResult = (result: MessageSearchResult) => {
    requestMessageFocus(result.sessionId, result.messageId)
    selectSession(result.sessionId)
    closeMobileSider()
  }

  return (
    <div className={clsx(styles.sider, mobile && styles.mobile)}>
      <div className={styles.top}>
        <div className={styles.appName}>{t('appName')}</div>
        <div className={styles.topActions}>
          <IconButton
            size="m"
            icon={searching ? <IconCloseOutline16 /> : <IconSearchOutline16 />}
            tooltip={t(searching ? 'close' : 'searchChats')}
            tooltipPlacement="bottom"
            onClick={searching ? closeSearch : () => setSearching(true)}
          />
          <IconButton
            size="m"
            icon={<IconBranchOutline20 />}
            tooltip={t('branchGraph')}
            tooltipPlacement="bottom"
            onClick={() => {
              setGraphOpen(true)
              if (mobile) {
                closeMobileSider()
              }
            }}
          />
          <IconButton
            size="m"
            icon={<IconPanelLeftOutline16 />}
            tooltip={t('collapseSiderbarButton')}
            tooltipPlacement="bottom"
            onClick={() => (mobile ? closeMobileSider() : setSiderCollapsed(true))}
          />
        </div>
      </div>
      {searching ? (
        <div className={styles.searchBar}>
          <span className={styles.searchBarIcon}>
            <IconSearchOutline16 />
          </span>
          <input
            ref={searchInputRef}
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                closeSearch()
              }
            }}
            placeholder={t('searchChatsPlaceholder')}
            aria-label={t('searchChatsPlaceholder')}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <IconButton
              size="xs"
              icon={<IconCloseOutline16 />}
              aria-label={t('close')}
              onClick={() => setQuery('')}
            />
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className={styles.newChat}
          onClick={() => {
            newChat()
            closeMobileSider()
          }}
        >
          <span className={styles.newChatIcon}>
            <NewChatIcon />
          </span>
          {t('newChat')}
        </button>
      )}
      <div className={styles.listWrap}>
        {searching ? (
          <div className={styles.list}>
            {searchPending && results.length === 0 ? (
              <div className={styles.searchStatus}>{t('searchingChats')}</div>
            ) : null}
            {searchError ? <div className={styles.searchStatus}>{t('searchFailed')}</div> : null}
            {!searchPending && !searchError && query.trim() && results.length === 0 ? (
              <div className={styles.searchStatus}>{t('searchNoResults')}</div>
            ) : null}
            {!searchError
              ? results.map((result) => (
                  <SearchResultItem
                    key={`${result.sessionId}:${result.messageId}`}
                    result={result}
                    query={query}
                    onSelect={() => openSearchResult(result)}
                  />
                ))
              : null}
          </div>
        ) : (
          <div className={styles.list}>
            {groups.map((group) => (
              <div key={group.key} className={styles.section}>
                <div className={styles.sectionHeader}>{group.label}</div>
                {group.sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    active={session.id === activeId}
                    onDelete={() => setDeleting(session)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.bottom}>
        <button type="button" className={styles.settings} onClick={() => openSettings('general')}>
          <span className={styles.settingsIcon}>
            <IconSettingsOutline16 />
          </span>
          <span className={styles.settingsLabel}>{t('settings')}</span>
        </button>
      </div>
      {graphOpen ? (
        <BranchGraphDialog
          onClose={() => setGraphOpen(false)}
          onSelect={(sessionId) => {
            selectSession(sessionId)
            closeMobileSider()
            setGraphOpen(false)
          }}
        />
      ) : null}
      {deleting ? (
        <Modal
          title={t('deleteSessionModalContentTitle')}
          onClose={() => {
            if (!deletePending) {
              setDeleting(null)
            }
          }}
          footer={
            <>
              <Button variant="outlined" disabled={deletePending} onClick={() => setDeleting(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                disabled={deletePending}
                onClick={async () => {
                  setDeletePending(true)
                  try {
                    if (await removeSession(deleting.id)) {
                      setDeleting(null)
                    } else {
                      showToast({ key: 'sessionDeleteFailed', type: 'error' })
                    }
                  } finally {
                    setDeletePending(false)
                  }
                }}
              >
                {t('delete')}
              </Button>
            </>
          }
        >
          {t('deleteSessionWithFilesDescription')}
        </Modal>
      ) : null}
    </div>
  )
}

/** 移动端抽屉：常驻 DOM，按 progress 跟随手指平移；点遮罩关闭。 */
export const MobileSider = () => {
  const open = useMobileSider((state) => state.open)
  const progress = useMobileSider((state) => state.progress)
  const dragging = useMobileSider((state) => state.dragging)
  const style = { '--drawer-progress': progress } as CSSProperties
  return (
    <div
      className={clsx(styles.drawerLayer, dragging && styles.drawerDragging)}
      style={{ ...style, pointerEvents: progress > 0 ? 'auto' : 'none' }}
      aria-hidden={!open && progress === 0}
    >
      <div className={styles.drawerMask} onClick={closeMobileSider} />
      <div className={styles.drawer}>
        <Sider mobile />
      </div>
    </div>
  )
}
