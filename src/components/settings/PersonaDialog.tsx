import clsx from 'clsx'
import { useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import { createId } from '../../utils/id.js'
import { DEFAULT_PERSONA_ID, type Persona } from '../../services/personas.js'
import {
  removePersona,
  savePersona,
  setActivePersona,
  useSettings,
} from '../../services/settings.js'
import { Button } from '../base/Button.js'
import { Modal } from '../base/Modal.js'
import { showToast } from '../base/toastState.js'
import styles from './PersonaDialog.module.css'

/** 人设/系统提示词管理：选择、编辑、新建、删除并设为当前。 */
export const PersonaDialog = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslate()
  const personas = useSettings((state) => state.personas)
  const activeId = useSettings((state) => state.activePersonaId)
  const activePersona = personas.find((persona) => persona.id === activeId) ?? personas[0]
  const [selectedId, setSelectedId] = useState(activePersona.id)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [name, setName] = useState(activePersona.name)
  const [prompt, setPrompt] = useState(activePersona.prompt)
  const [deleting, setDeleting] = useState<Persona | null>(null)
  const isDefault = selectedId === DEFAULT_PERSONA_ID

  const select = (persona: Persona) => {
    setSelectedId(persona.id)
    setDraftId(null)
    setName(persona.name)
    setPrompt(persona.prompt)
  }

  const startNew = () => {
    const id = createId()
    setSelectedId(id)
    setDraftId(id)
    setName('')
    setPrompt('')
  }

  const save = () => {
    const nextName = name.trim()
    const nextPrompt = prompt.trim()
    if (!nextName) {
      showToast({ key: 'personaNameRequired', type: 'error' })
      return
    }
    if (!nextPrompt) {
      showToast({ key: 'personaPromptRequired', type: 'error' })
      return
    }
    const id = draftId ?? selectedId
    savePersona({ id, name: nextName, prompt: nextPrompt })
    setActivePersona(id)
    showToast({ key: 'personaSaved' })
    onClose()
  }

  const confirmDelete = () => {
    if (!deleting) {
      return
    }
    if (deleting.id === DEFAULT_PERSONA_ID) {
      setDeleting(null)
      showToast({ key: 'personaDefaultCannotDelete', type: 'error' })
      return
    }
    removePersona(deleting.id)
    setDeleting(null)
    const fallback = personas.find((persona) => persona.id === DEFAULT_PERSONA_ID)
    if (fallback) {
      select(fallback)
    }
  }

  return (
    <>
      <Modal
        title={t('personaDialogTitle')}
        closable
        className={styles.dialog}
        onClose={onClose}
        footer={
          <div className={styles.footer}>
            <Button
              variant="dangerOutlined"
              disabled={isDefault || Boolean(draftId)}
              onClick={() => {
                const target = personas.find((persona) => persona.id === selectedId)
                if (target) {
                  setDeleting(target)
                }
              }}
            >
              {t('personaDelete')}
            </Button>
            <div className={styles.footerRight}>
              <Button variant="outlined" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button onClick={save}>{t('personaSave')}</Button>
            </div>
          </div>
        }
      >
        <div className={styles.body}>
          <div className={styles.list}>
            <Button variant="outlined" size="s" className={styles.newButton} onClick={startNew}>
              {t('personaNew')}
            </Button>
            {personas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                className={clsx(
                  styles.listItem,
                  persona.id === selectedId && styles.listItemActive
                )}
                onClick={() => select(persona)}
              >
                <span className={styles.listName}>{persona.name}</span>
                {persona.id === activeId ? (
                  <span className={styles.activeBadge}>{t('personaActive')}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>{t('personaNameLabel')}</span>
              <input
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('personaNameLabel')}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('personaPromptLabel')}</span>
              <textarea
                className={styles.textarea}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t('personaPromptLabel')}
              />
            </label>
          </div>
        </div>
      </Modal>
      {deleting ? (
        <Modal
          title={t('personaDeleteConfirm', { name: deleting.name })}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setDeleting(null)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                {t('delete')}
              </Button>
            </>
          }
        >
          <div className={styles.confirmText}>{deleting.prompt}</div>
        </Modal>
      ) : null}
    </>
  )
}
