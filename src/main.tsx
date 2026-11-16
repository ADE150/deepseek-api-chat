import { createRoot } from 'react-dom/client'
import { App } from './app/App.js'
import { isNativeApp, setupNative } from './app/native.js'
import { setupTheme } from './app/theme.js'
import { ensureKatex } from './services/markdown/katex.js'
import './app/theme.css'
import './app/global.css'

ensureKatex()
setupTheme()
setupNative()

/** 生产 Web 构建注册 service worker；Capacitor 内跳过，避免应用更新后仍命中旧缓存。 */
const registerServiceWorker = () => {
  if (
    !__SERVICE_WORKER__ ||
    isNativeApp() ||
    !('serviceWorker' in navigator) ||
    location.protocol === 'file:'
  ) {
    return
  }
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => {
      // 注册失败不影响在线使用。
    })
  })
}

registerServiceWorker()

createRoot(document.getElementById('root') as HTMLElement).render(<App />)
