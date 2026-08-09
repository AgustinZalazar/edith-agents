import { resolve } from 'path'
import { cpSync, existsSync, mkdirSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function copyNativeBinariesPlugin(): Plugin {
  return {
    name: 'copy-native-binaries',
    writeBundle(options) {
      const root = process.cwd()
      const src = resolve(root, 'node_modules/node-pty/prebuilds')
      const outDir = options.dir ?? resolve(root, 'out/main')
      const dest = resolve(outDir, 'prebuilds')
      if (existsSync(src)) {
        mkdirSync(dest, { recursive: true })
        cpSync(src, dest, { recursive: true })
      }
    },
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyNativeBinariesPlugin()],
    build: {
      commonjsOptions: {
        ignoreDynamicRequires: true,
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [react()],
  },
})
