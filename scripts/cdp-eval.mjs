/** 通过 CDP 在指定页面执行一段 JavaScript，用于真机/模拟器 WebView 调试。
 *
 * 用法：
 *   node scripts/cdp-eval.mjs <ws-page-url> "<expression>"
 *   node scripts/cdp-eval.mjs <ws-page-url> < script.js
 */

const url = process.argv[2]
let expression = process.argv[3]

if (!url) {
  console.error('Usage: node scripts/cdp-eval.mjs <ws-page-url> [expression]')
  process.exit(1)
}

if (!expression) {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  expression = Buffer.concat(chunks).toString('utf8')
}

if (!expression.trim()) {
  console.error('No expression provided')
  process.exit(1)
}

const socket = new WebSocket(url)
const pending = new Map()
let nextId = 0

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(String(id), { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })

socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.id === undefined) {
    return
  }
  const entry = pending.get(String(message.id))
  if (!entry) {
    return
  }
  pending.delete(String(message.id))
  if (message.error) {
    entry.reject(new Error(message.error.message))
  } else {
    entry.resolve(message.result)
  }
}

socket.onerror = (event) => {
  console.error('WebSocket error:', event.message ?? event)
  process.exit(1)
}

socket.onopen = async () => {
  try {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    })
    if (result.exceptionDetails) {
      console.error(JSON.stringify(result.exceptionDetails, null, 2))
      process.exitCode = 1
    } else {
      console.log(JSON.stringify(result.result?.value ?? null))
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    socket.close()
  }
}
