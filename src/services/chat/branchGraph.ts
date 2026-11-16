import * as db from './db.js'
import { useChatStore } from './store.js'
import type { Session } from './types.js'

export const GRAPH_NODE_WIDTH = 168
export const GRAPH_NODE_HEIGHT = 56
const GAP_X = 32
const GAP_Y = 56
const PADDING = 24

export type BranchGraphNode = {
  id: string
  title: string
  pinned: boolean
  parentId: string | null
  parentTitle: string | null
  x: number
  y: number
}

export type BranchGraphEdge = {
  parentId: string
  childId: string
  path: string
}

export type BranchGraph = {
  nodes: BranchGraphNode[]
  edges: BranchGraphEdge[]
  width: number
  height: number
}

/** 读取全部会话（优先内存缓存），按 forkedFrom 构建跨会话分支树。 */
export const loadBranchGraph = async (): Promise<BranchGraph> => {
  const { sessions, sessionCache } = useChatStore.getState()
  const loaded: Session[] = []
  for (const summary of sessions) {
    const session = Object.hasOwn(sessionCache, summary.id)
      ? sessionCache[summary.id]
      : await db.loadSession(summary.id)
    if (session) {
      loaded.push({ ...session, ...summary })
    }
  }
  const byId = new Map(loaded.map((session) => [session.id, session]))
  const parentOf = (session: Session) =>
    session.forkedFrom && byId.has(session.forkedFrom.sessionId)
      ? session.forkedFrom.sessionId
      : null
  const children = new Map<string, Session[]>()
  const roots: Session[] = []
  for (const session of loaded) {
    const parentId = parentOf(session)
    if (!parentId) {
      roots.push(session)
      continue
    }
    const list = children.get(parentId)
    if (list) {
      list.push(session)
    } else {
      children.set(parentId, [session])
    }
  }

  const positions = new Map<string, { x: number; y: number }>()
  let leaf = 0
  const visit = (session: Session, depth: number): number => {
    const kids = children.get(session.id) ?? []
    let x: number
    if (kids.length === 0) {
      x = leaf
      leaf += 1
    } else {
      const childXs = kids.map((child) => visit(child, depth + 1))
      x = (childXs[0] + childXs[childXs.length - 1]) / 2
    }
    positions.set(session.id, {
      x: PADDING + x * (GRAPH_NODE_WIDTH + GAP_X),
      y: PADDING + depth * (GRAPH_NODE_HEIGHT + GAP_Y),
    })
    return x
  }
  for (const root of roots) {
    visit(root, 0)
    // 根会话之间留出间隔
    leaf += 0.8
  }

  const nodes: BranchGraphNode[] = loaded.flatMap((session) => {
    const position = positions.get(session.id)
    if (!position) {
      return []
    }
    const parentId = parentOf(session)
    return [
      {
        id: session.id,
        title: session.title,
        pinned: session.pinned === true,
        parentId,
        parentTitle: parentId ? (byId.get(parentId)?.title ?? null) : null,
        x: position.x,
        y: position.y,
      },
    ]
  })

  const edges: BranchGraphEdge[] = []
  for (const session of loaded) {
    const parentId = parentOf(session)
    const parent = parentId ? positions.get(parentId) : undefined
    const child = positions.get(session.id)
    if (!parentId || !parent || !child) {
      continue
    }
    const px = parent.x + GRAPH_NODE_WIDTH / 2
    const py = parent.y + GRAPH_NODE_HEIGHT
    const cx = child.x + GRAPH_NODE_WIDTH / 2
    const cy = child.y
    edges.push({
      parentId,
      childId: session.id,
      path: `M ${px} ${py} C ${px} ${py + GAP_Y / 2}, ${cx} ${cy - GAP_Y / 2}, ${cx} ${cy}`,
    })
  }

  const maxX = nodes.reduce((max, node) => Math.max(max, node.x), 0)
  const maxY = nodes.reduce((max, node) => Math.max(max, node.y), 0)
  return {
    nodes,
    edges,
    width: maxX + GRAPH_NODE_WIDTH + PADDING,
    height: maxY + GRAPH_NODE_HEIGHT + PADDING,
  }
}
