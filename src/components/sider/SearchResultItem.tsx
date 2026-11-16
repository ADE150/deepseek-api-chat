import { useTranslate } from '../../i18n/index.js'
import type { MessageSearchResult } from '../../services/chat/search.js'
import styles from './SearchResultItem.module.css'

/** 一条消息级搜索结果；同一会话命中多条消息时会重复出现。 */
export const SearchResultItem = ({
  result,
  query,
  onSelect,
}: {
  result: MessageSearchResult
  query: string
  onSelect: () => void
}) => {
  const t = useTranslate()
  const needle = query.replace(/\s+/g, ' ').trim()
  const index = needle ? result.snippet.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase()) : -1
  const title = result.sessionTitle || t('untitledChat')
  return (
    <button type="button" className={styles.item} onClick={onSelect}>
      <span className={styles.meta}>
        <span className={styles.title}>{title}</span>
        <span className={styles.role}>
          {t(result.role === 'user' ? 'searchRoleUser' : 'searchRoleAssistant')}
        </span>
      </span>
      <span className={styles.snippet}>
        {index >= 0 ? (
          <>
            {result.snippet.slice(0, index)}
            <mark className={styles.mark}>
              {result.snippet.slice(index, index + needle.length)}
            </mark>
            {result.snippet.slice(index + needle.length)}
          </>
        ) : (
          result.snippet
        )}
      </span>
    </button>
  )
}
