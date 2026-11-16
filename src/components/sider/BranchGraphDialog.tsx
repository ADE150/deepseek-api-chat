import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  GRAPH_NODE_HEIGHT,
  GRAPH_NODE_WIDTH,
  loadBranchGraph,
  type BranchGraph,
} from '../../services/chat/branchGraph.js'
import { useChatStore } from '../../services/chat/store.js'
import { IconPinOutline16 } from '../base/icons.js'
import { Modal } from '../base/Modal.js'
import styles from './BranchGraph.module.css'

/** 跨会话分支图：节点来自 forkedFrom 关系，点击节点打开对应会话。 */
export const BranchGraphDialog = ({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (sessionId: string) => void
}) => {
  const t = useTranslate()
  const activeId = useChatStore((state) => state.activeId)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [graph, setGraph] = useState<BranchGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    void loadBranchGraph()
      .then((next) => {
        if (!cancelled) {
          setGraph(next)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false)
          setError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const active = graph?.nodes.find((node) => node.id === activeId)
    if (!viewport || !active) {
      return
    }
    viewport.scrollTo({
      left: active.x + GRAPH_NODE_WIDTH / 2 - viewport.clientWidth / 2,
      top: active.y + GRAPH_NODE_HEIGHT / 2 - viewport.clientHeight / 2,
      behavior: 'smooth',
    })
  }, [graph, activeId])

  return (
    <Modal
      title={t('branchGraph')}
      closable
      className={styles.dialog}
      mainClassName={styles.main}
      onClose={onClose}
    >
      {loading ? <div className={styles.status}>{t('branchGraphLoading')}</div> : null}
      {!loading && error ? <div className={styles.status}>{t('branchGraphError')}</div> : null}
      {!loading && !error && graph && graph.nodes.length === 0 ? (
        <div className={styles.status}>{t('branchGraphEmpty')}</div>
      ) : null}
      {!loading && !error && graph && graph.nodes.length > 0 ? (
        <>
          <div ref={viewportRef} className={styles.viewport}>
            <div className={styles.canvas} style={{ width: graph.width, height: graph.height }}>
              <svg
                className={styles.edges}
                width={graph.width}
                height={graph.height}
                aria-hidden="true"
              >
                {graph.edges.map((edge) => (
                  <path key={`${edge.parentId}:${edge.childId}`} d={edge.path} />
                ))}
              </svg>
              {graph.nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={clsx(styles.node, node.id === activeId && styles.nodeActive)}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: GRAPH_NODE_WIDTH,
                    height: GRAPH_NODE_HEIGHT,
                  }}
                  title={node.title || t('untitledChat')}
                  onClick={() => onSelect(node.id)}
                >
                  {node.pinned ? (
                    <span className={styles.pin}>
                      <IconPinOutline16 />
                    </span>
                  ) : null}
                  <span className={styles.nodeTitle}>{node.title || t('untitledChat')}</span>
                  {node.parentTitle ? (
                    <span className={styles.nodeSub}>
                      {t('branchGraphForkedFrom', { title: node.parentTitle })}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.hint}>{t('branchGraphHint')}</div>
        </>
      ) : null}
    </Modal>
  )
}
