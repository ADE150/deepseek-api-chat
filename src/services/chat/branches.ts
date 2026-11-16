import { createId } from '../../utils/id.js'
import type { Message, Session } from './types.js'

/** 将线性消息列表规范化为单分支，保留消息 ID、内容及时间。 */
export const normalizeSession = (session: Session): Session =>
  session.rootMessageId !== undefined
    ? session
    : {
        ...session,
        rootMessageId: session.messages[0]?.id ?? null,
        messages: session.messages.map((message, index, messages) => ({
          ...message,
          parentId: messages[index - 1]?.id ?? null,
          selectedChildId: messages[index + 1]?.id,
        })),
      }

/** 展示内容与请求上下文共用当前选中的分支路径。 */
export const getVisibleMessages = (session: Session): Message[] => {
  if (session.rootMessageId === undefined) {
    return session.messages
  }
  const byId = new Map(session.messages.map((message) => [message.id, message]))
  const path: Message[] = []
  let id = session.rootMessageId
  while (id) {
    const message = byId.get(id)
    if (!message) {
      break
    }
    path.push(message)
    byId.delete(id)
    id = message.selectedChildId ?? null
  }
  return path
}

export type MessageVersions = { ids: string[]; index: number }

/** 一次遍历收集兄弟版本；版本列表未变化时复用旧对象与索引，避免流式正文更新重绘历史消息。 */
export const buildMessageVersions = (
  session: Session,
  previous: ReadonlyMap<string, MessageVersions>
): ReadonlyMap<string, MessageVersions> => {
  const groups = new Map<string | null | undefined, string[]>()
  for (const message of session.messages) {
    const key = session.rootMessageId === undefined ? message.id : message.parentId
    const ids = groups.get(key)
    if (ids) {
      ids.push(message.id)
    } else {
      groups.set(key, [message.id])
    }
  }

  const versions = new Map<string, MessageVersions>()
  let unchanged = previous.size === session.messages.length
  for (const ids of groups.values()) {
    const cachedIds = previous.get(ids[0])?.ids
    const stableIds =
      cachedIds?.length === ids.length && ids.every((id, index) => id === cachedIds[index])
        ? cachedIds
        : ids
    ids.forEach((id, index) => {
      const cached = previous.get(id)
      const version =
        cached?.ids === stableIds && cached.index === index ? cached : { ids: stableIds, index }
      versions.set(id, version)
      if (version !== cached) {
        unchanged = false
      }
    })
  }
  return unchanged ? previous : versions
}

/** 新消息挂在指定父节点下，并选择新分支；原节点与其后续对话保持不变。 */
export const appendBranch = (
  original: Session,
  parentId: string | null,
  messages: Message[]
): Session => {
  const session = normalizeSession(original)
  const first = messages[0]
  if (!first) {
    return session
  }
  return {
    ...session,
    rootMessageId: parentId === null ? first.id : session.rootMessageId,
    messages: [
      ...session.messages.map((message) =>
        message.id === parentId ? { ...message, selectedChildId: first.id } : message
      ),
      ...messages.map((message, index) => ({
        ...message,
        parentId: messages[index - 1]?.id ?? parentId,
        selectedChildId: messages[index + 1]?.id,
      })),
    ],
  }
}

/**
 * 从当前路径上的某条消息分叉出一个新会话。
 * - assistant：复制到这条回答并包含它；
 * - user：复制到这条提问之前，不包含它，避免新会话以没有回答的提问结尾。
 * 只复制当前选中的路径；所有消息生成新 ID，附件沿用原 id，由存储层按引用计数清理。
 */
export const forkSessionAt = (
  original: Session,
  messageId: string,
  newSessionId: string,
  now: number,
  title: string
): Session | null => {
  const session = normalizeSession(original)
  const path = getVisibleMessages(session)
  const index = path.findIndex((message) => message.id === messageId)
  if (index < 0) {
    return null
  }
  const endIndex = path[index].role === 'assistant' ? index : index - 1
  if (endIndex < 0) {
    return null
  }
  const selected = path.slice(0, endIndex + 1)
  if (selected.at(-1)?.role !== 'assistant') {
    return null
  }
  const ids = new Map(selected.map((message) => [message.id, createId()]))
  const messages = selected.map((message, messageIndex): Message => {
    const copy = structuredClone(message)
    copy.id = ids.get(message.id) as string
    copy.parentId = messageIndex === 0 ? null : (ids.get(selected[messageIndex - 1].id) as string)
    copy.selectedChildId = ids.get(selected[messageIndex + 1]?.id ?? '')
    return copy
  })
  const rootMessageId = messages[0]?.id
  if (!rootMessageId) {
    return null
  }
  return {
    id: newSessionId,
    title,
    createdAt: now,
    updatedAt: now,
    messages,
    rootMessageId,
    forkedFrom: { sessionId: session.id, messageId },
  }
}

/** 仅允许切换当前路径上某一节点的兄弟版本，恢复该版本已选中的后续分支。 */
export const selectVersion = (original: Session, messageId: string): Session => {
  const session = normalizeSession(original)
  const message = session.messages.find((item) => item.id === messageId)
  if (!message || !getVisibleMessages(session).some((item) => item.parentId === message.parentId)) {
    return original
  }
  return {
    ...session,
    rootMessageId: message.parentId === null ? message.id : session.rootMessageId,
    messages: session.messages.map((item) =>
      item.id === message.parentId ? { ...item, selectedChildId: message.id } : item
    ),
  }
}
