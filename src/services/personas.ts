/** 人设/系统提示词预设。 */
export type Persona = {
  id: string
  name: string
  prompt: string
}

export const DEFAULT_PERSONA_ID = 'default'

export const DEFAULT_PERSONA: Persona = {
  id: DEFAULT_PERSONA_ID,
  name: 'DeepSeek',
  prompt: '该助手为DeepSeek，由深度求索公司创造。',
}
