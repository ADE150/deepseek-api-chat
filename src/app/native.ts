import { Capacitor } from '@capacitor/core'
import { closeSearchPanel, useSearchPanel } from '../components/search/searchPanelState.js'
import { closeMobileSider, useMobileSider } from '../components/sider/mobileSiderState.js'

/** 是否运行在 Capacitor 原生壳中。 */
export const isNativeApp = () => Capacitor.isNativePlatform()

const hasOpenModal = () => document.querySelector('[role="dialog"][aria-modal="true"]') !== null

/** 状态栏文字与背景跟随应用主题；Android 15+ 忽略背景色，由系统栏安全区处理。 */
const syncSystemBars = async () => {
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  const dark = document.body.classList.contains('dark')
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {})
  await StatusBar.setBackgroundColor({ color: dark ? '#121317' : '#ffffff' }).catch(() => {})
}

/** Android 返回键：优先关闭最上层界面，再最小化应用。 */
export const setupNative = () => {
  if (!Capacitor.isNativePlatform()) {
    return
  }
  void (async () => {
    const { App } = await import('@capacitor/app')
    await App.addListener('backButton', () => {
      if (hasOpenModal()) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        return
      }
      if (useSearchPanel.getState().entry !== null) {
        closeSearchPanel()
        return
      }
      if (useMobileSider.getState().open) {
        closeMobileSider()
        return
      }
      void App.minimizeApp()
    })
    await syncSystemBars()
    new MutationObserver(() => void syncSystemBars()).observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })()
}
