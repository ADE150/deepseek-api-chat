import { getVisibleMessages } from './branches.js'
import * as db from './db.js'
import { getReplyText } from './reply.js'
import { useChatStore } from './store.js'
import type { Session } from './types.js'

/** 搜索结果按消息返回；同一会话命中多条消息时会出现多行。 */
export type MessageSearchResult = {
  sessionId: string
  sessionTitle: string
  messageId: string
  role: 'user' | 'assistant'
  snippet: string
  updatedAt: number
}

const MAX_RESULTS = 100
const CONTEXT = 48

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

const excerpt = (text: string, index: number, length: number) => {
  const start = Math.max(0, index - CONTEXT)
  const end = Math.min(text.length, index + length + CONTEXT)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

/** 搜索所有会话当前可见分支里的用户提问和 AI 正文。 */
export const searchMessages = async (
  query: string,
  signal: AbortSignal
): Promise<MessageSearchResult[]> => {
  const needle = normalize(query).toLocaleLowerCase()
  if (!needle) {
    return []
  }
  const { sessions, sessionCache, importingHistory } = useChatStore.getState()
  if (importingHistory) {
    return []
  }
  const results: MessageSearchResult[] = []
  for (const summary of sessions) {
    if (signal.aborted) {
      break
    }
    const session: Session | undefined = Object.hasOwn(sessionCache, summary.id)
      ? sessionCache[summary.id]
      : await db.loadSession(summary.id)
    if (!session) {
      continue
    }
    for (const message of getVisibleMessages(session)) {
      const text = message.role === 'user' ? message.content : getReplyText(message)
      if (!text) {
        continue
      }
      const normalized = normalize(text)
      const index = normalized.toLocaleLowerCase().indexOf(needle)
      if (index < 0) {
        continue
      }
      results.push({
        sessionId: summary.id,
        sessionTitle: summary.title,
        messageId: message.id,
        role: message.role,
        snippet: excerpt(normalized, index, needle.length),
        updatedAt: summary.updatedAt,
      })
      if (results.length >= MAX_RESULTS) {
        return results
      }
    }
  }
  return results
}
