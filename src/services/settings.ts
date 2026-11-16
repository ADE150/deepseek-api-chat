import { create } from 'zustand'
import type { TtsVoice } from './api/speech.js'
import { normalizeLocation, type UserLocation } from './location.js'
import { DEFAULT_PERSONA, DEFAULT_PERSONA_ID, type Persona } from './personas.js'

export type Locale = 'zh-CN' | 'en-US'

/** 主题偏好；默认跟随系统 */
export type ThemePreference = 'light' | 'dark' | 'system'

/** 本机设置，存 localStorage：API Key、语言、主题、位置、朗读音色、深度思考与智能搜索开关、侧边栏收起状态 */
type Settings = {
  apiKey: string | null
  locale: Locale
  themePreference: ThemePreference
  location: UserLocation | null
  ttsVoice: TtsVoice
  thinking: boolean
  search: boolean
  autoRead: boolean
  personas: Persona[]
  activePersonaId: string
  siderCollapsed: boolean
}

const KEYS = {
  apiKey: 'dschat:api-key',
  locale: 'dschat:locale',
  location: 'dschat:location',
  themePreference: 'dschat:theme-preference',
  ttsVoice: 'dschat:tts-voice',
  thinking: 'dschat:thinking',
  search: 'dschat:search',
  autoRead: 'dschat:auto-read',
  personas: 'dschat:personas',
  activePersona: 'dschat:active-persona',
  siderCollapsed: 'dschat:sider-collapsed',
} as const

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    // 存储不可用时只在内存中生效
  }
}

/** 位置选择模式跟随浏览器语言，与应用内选择的界面语言无关。 */
export const isChineseBrowser = (): boolean =>
  (typeof navigator === 'undefined' ? 'zh' : navigator.language).toLowerCase().startsWith('zh')

const initialLocale = (): Locale => {
  const saved = read(KEYS.locale)
  if (saved === 'zh-CN' || saved === 'en-US') {
    return saved
  }
  return isChineseBrowser() ? 'zh-CN' : 'en-US'
}

const initialLocation = (): UserLocation | null => {
  try {
    const location = normalizeLocation(JSON.parse(read(KEYS.location) ?? 'null'))
    if (!location) {
      return null
    }
    return isChineseBrowser()
      ? location.region === 'CN' && location.province
        ? location
        : null
      : { region: location.region }
  } catch {
    return null
  }
}

/** 未保存过时跟随系统 */
const initialThemePreference = (): ThemePreference => {
  const saved = read(KEYS.themePreference)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

/** 未保存过时使用服务端默认音色 stella（海星） */
const initialTtsVoice = (): TtsVoice => (read(KEYS.ttsVoice) === 'tide' ? 'tide' : 'stella')

const readPersonas = (): Persona[] => {
  try {
    const parsed: unknown = JSON.parse(read(KEYS.personas) ?? 'null')
    const valid = (Array.isArray(parsed) ? parsed : []).filter(
      (item): item is Persona =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Persona).id === 'string' &&
        typeof (item as Persona).name === 'string' &&
        typeof (item as Persona).prompt === 'string'
    )
    const byId = new Map(valid.map((persona) => [persona.id, persona]))
    if (!byId.has(DEFAULT_PERSONA_ID)) {
      byId.set(DEFAULT_PERSONA_ID, DEFAULT_PERSONA)
    }
    return [...byId.values()]
  } catch {
    return [DEFAULT_PERSONA]
  }
}

const initialPersonas = readPersonas()

const initialActivePersonaId = () => {
  const saved = read(KEYS.activePersona)
  return initialPersonas.some((persona) => persona.id === saved) ? saved : DEFAULT_PERSONA_ID
}

export const useSettings = create<Settings>(() => ({
  apiKey: read(KEYS.apiKey),
  locale: initialLocale(),
  location: initialLocation(),
  themePreference: initialThemePreference(),
  ttsVoice: initialTtsVoice(),
  thinking: read(KEYS.thinking) === 'true',
  search: read(KEYS.search) === 'true',
  autoRead: read(KEYS.autoRead) === 'true',
  personas: initialPersonas,
  activePersonaId: initialActivePersonaId() ?? DEFAULT_PERSONA_ID,
  siderCollapsed: read(KEYS.siderCollapsed) === 'true',
}))

export const setLocale = (locale: Locale) => {
  write(KEYS.locale, locale)
  useSettings.setState({ locale })
}

export const setLocation = (value: UserLocation | null) => {
  const location = normalizeLocation(value)
  write(KEYS.location, location ? JSON.stringify(location) : null)
  useSettings.setState({ location })
}

export const setThemePreference = (themePreference: ThemePreference) => {
  write(KEYS.themePreference, themePreference)
  useSettings.setState({ themePreference })
}

export const setTtsVoice = (ttsVoice: TtsVoice) => {
  write(KEYS.ttsVoice, ttsVoice)
  useSettings.setState({ ttsVoice })
}

export const setApiKey = (apiKey: string | null) => {
  write(KEYS.apiKey, apiKey)
  useSettings.setState({ apiKey })
}

export const setThinking = (thinking: boolean) => {
  write(KEYS.thinking, String(thinking))
  useSettings.setState({ thinking })
}

export const setSearch = (search: boolean) => {
  write(KEYS.search, String(search))
  useSettings.setState({ search })
}

export const setSiderCollapsed = (siderCollapsed: boolean) => {
  write(KEYS.siderCollapsed, String(siderCollapsed))
  useSettings.setState({ siderCollapsed })
}

export const setAutoRead = (autoRead: boolean) => {
  write(KEYS.autoRead, String(autoRead))
  useSettings.setState({ autoRead })
}

export const setActivePersona = (activePersonaId: string) => {
  if (!useSettings.getState().personas.some((persona) => persona.id === activePersonaId)) {
    return
  }
  write(KEYS.activePersona, activePersonaId)
  useSettings.setState({ activePersonaId })
}

export const savePersona = (persona: Persona) => {
  const personas = useSettings.getState().personas
  const next = personas.some((item) => item.id === persona.id)
    ? personas.map((item) => (item.id === persona.id ? persona : item))
    : [...personas, persona]
  write(KEYS.personas, JSON.stringify(next))
  useSettings.setState({ personas: next })
}

export const removePersona = (id: string) => {
  if (id === DEFAULT_PERSONA_ID) {
    return
  }
  const state = useSettings.getState()
  const personas = state.personas.filter((persona) => persona.id !== id)
  const activePersonaId = state.activePersonaId === id ? DEFAULT_PERSONA_ID : state.activePersonaId
  write(KEYS.personas, JSON.stringify(personas))
  write(KEYS.activePersona, activePersonaId)
  useSettings.setState({ personas, activePersonaId })
}

/** 当前请求使用的 system prompt；空白时回退到默认人设。 */
export const getActiveSystemPrompt = () => {
  const { personas, activePersonaId } = useSettings.getState()
  return (
    personas.find((persona) => persona.id === activePersonaId)?.prompt.trim() ||
    DEFAULT_PERSONA.prompt
  )
}
