const { cpSync, mkdirSync, existsSync } = require('fs')
const { resolve } = require('path')

const src = resolve(__dirname, 'node_modules/node-pty/prebuilds')

// node-pty checks './' and '../' relative to __dirname of the bundle (out/main/)
const dests = [
  resolve(__dirname, 'out/main/prebuilds'),
  resolve(__dirname, 'out/prebuilds'),
]

if (!existsSync(src)) {
  console.error('node-pty prebuilds not found at', src)
  process.exit(1)
}

for (const dest of dests) {
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
  console.log('Copied prebuilds to', dest)
}
