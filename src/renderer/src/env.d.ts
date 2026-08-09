/// <reference types="vite/client" />

import type { EdithAPI } from '../../preload/index'

declare global {
  interface Window {
    edith: EdithAPI
  }
}
