/** 跨平台生产构建：删除 dist 后以 production 模式运行 rspack。 */
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

rmSync('dist', { recursive: true, force: true })

const isWindows = process.platform === 'win32'
const binary = resolve('node_modules', '.bin', isWindows ? 'rspack.cmd' : 'rspack')
const result = spawnSync(binary, ['build', '-c', 'rspack.config.ts'], {
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, NODE_ENV: 'production' },
})

process.exit(result.status ?? 1)
