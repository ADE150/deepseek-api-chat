/**
 * 一次性迁移工具：把旧 ChatLoom 应用（io.github.ade150.chatloom）的 IndexedDB 数据
 * 复制到 DSChat（io.github.ade150.dschat）。不复制 API Key 和设置。
 *
 * 用法：
 *   node scripts/migrate-chatloom-to-dschat.mjs dump <old-ws-url> [file]
 *   node scripts/migrate-chatloom-to-dschat.mjs restore <new-ws-url> [file]
 */
import { readFileSync, writeFileSync } from 'node:fs'

const mode = process.argv[2]
const url = process.argv[3]
const file = process.argv[4] ?? 'tmp/chatloom-migration.json'

if (!mode || !url) {
  console.error('Usage: node scripts/migrate-chatloom-to-dschat.mjs <dump|restore> <ws-url> [file]')
  process.exit(1)
}

const evaluate = (expression) =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    const id = 1
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true, userGesture: true },
        })
      )
    }
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.id !== id) {
        return
      }
      socket.close()
      if (message.error) {
        reject(new Error(message.error.message))
      } else if (message.result?.exceptionDetails) {
        reject(new Error(JSON.stringify(message.result.exceptionDetails)))
      } else {
        resolve(message.result?.result?.value)
      }
    }
    socket.onerror = (event) => reject(new Error(event.message ?? 'WebSocket error'))
  })

const dumpExpression = `
(async()=>{
  const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('chatloom');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
  const db=await open()
  const getAll=(name)=>new Promise((res,rej)=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
  const encode=(blob)=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})
  const sessions=await getAll('sessions')
  const summaries=await getAll('sessionSummaries')
  const files=[]
  for(const file of await getAll('files')) files.push({id:file.id,type:file.blob.type,data:await encode(file.blob)})
  return JSON.stringify({sessions,summaries,files})
})()
`

const restoreExpression = (data) => `
(async()=>{
  const data=JSON.parse(${JSON.stringify(data)})
  const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('dschat');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
  const db=await open()
  const tx=db.transaction(['sessions','sessionSummaries','files'],'readwrite')
  for(const name of ['sessions','sessionSummaries','files']) tx.objectStore(name).clear()
  for(const session of data.sessions) tx.objectStore('sessions').put(session)
  for(const summary of data.summaries) tx.objectStore('sessionSummaries').put(summary)
  for(const file of data.files){
    const binary=atob(file.data)
    const bytes=new Uint8Array(binary.length)
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i)
    tx.objectStore('files').put({id:file.id,blob:new Blob([bytes],{type:file.type})})
  }
  await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})
  return JSON.stringify({sessions:data.sessions.length,files:data.files.length})
})()
`

if (mode === 'dump') {
  const data = await evaluate(dumpExpression)
  writeFileSync(file, data, 'utf8')
  const parsed = JSON.parse(data)
  console.log(`Dumped ${parsed.sessions.length} sessions and ${parsed.files.length} files to ${file}`)
} else if (mode === 'restore') {
  const data = readFileSync(file, 'utf8')
  const result = await evaluate(restoreExpression(data))
  console.log(`Restored: ${result}`)
} else {
  console.error('Unknown mode:', mode)
  process.exit(1)
}
