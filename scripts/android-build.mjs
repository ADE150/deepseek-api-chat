/** 跨平台调用 Android Gradle wrapper；默认构建 debug APK。
 *
 * 用法：
 *   node scripts/android-build.mjs [gradle task，默认 assembleDebug]
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const isWindows = process.platform === 'win32'
const candidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  isWindows && process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
    : undefined,
  !isWindows ? join(process.env.HOME ?? '', 'Android', 'Sdk') : undefined,
].filter(Boolean)

const sdk = candidates.find((path) => existsSync(path))
if (!sdk) {
  console.error('Android SDK not found. Set ANDROID_HOME to your SDK directory.')
  process.exit(1)
}

const task = process.argv[2] ?? 'assembleDebug'
const androidDir = resolve('android')
const wrapper = join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew')
const result = spawnSync(wrapper, [task, '--no-daemon'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWindows,
  env: {
    ...process.env,
    ANDROID_HOME: sdk,
    ANDROID_SDK_ROOT: sdk,
  },
})

process.exit(result.status ?? 1)
