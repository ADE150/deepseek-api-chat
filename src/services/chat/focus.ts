import { create } from 'zustand'

/** 搜索结果的跳转目标：会话加载完成并由 MessageList 渲染后滚动到对应消息。 */
type MessageFocus = {
  requestId: number
  sessionId: string | null
  messageId: string | null
}

export const useMessageFocus = create<MessageFocus>(() => ({
  requestId: 0,
  sessionId: null,
  messageId: null,
}))

export const requestMessageFocus = (sessionId: string, messageId: string) =>
  useMessageFocus.setState((state) => ({
    requestId: state.requestId + 1,
    sessionId,
    messageId,
  }))

export const clearMessageFocus = (requestId: number) =>
  useMessageFocus.setState((state) =>
    state.requestId === requestId ? { ...state, sessionId: null, messageId: null } : state
  )
