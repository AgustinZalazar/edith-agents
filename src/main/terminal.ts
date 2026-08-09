// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pty = (eval('require') as NodeRequire)('node-pty') as typeof import('node-pty')
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import type { Profile } from '../shared/types'

const DEFAULT_SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash'
const DEFAULT_CWD =
  process.env.HOME || process.env.USERPROFILE || (process.platform === 'win32' ? 'C:\\' : '/')

const terminals = new Map<string, pty.IPty>()

export function createTerminal(
  id: string,
  cwd: string | undefined,
  profile: Profile,
  win: BrowserWindow,
): void {
  // Each profile gets its own Claude config dir so accounts stay isolated
  const claudeConfigDir = join(app.getPath('userData'), `claude-${profile}`)

  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    CLAUDE_CONFIG_DIR: claudeConfigDir,
  }

  const ptyProcess = pty.spawn(DEFAULT_SHELL, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: cwd || DEFAULT_CWD,
    env,
  })

  ptyProcess.onData((data) => {
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:data', { id, data })
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    terminals.delete(id)
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:exit', { id, exitCode })
    }
  })

  terminals.set(id, ptyProcess)
}

export function writeToTerminal(id: string, data: string): void {
  terminals.get(id)?.write(data)
}

export function resizeTerminal(id: string, cols: number, rows: number): void {
  terminals.get(id)?.resize(cols, rows)
}

export function closeTerminal(id: string): void {
  const term = terminals.get(id)
  if (term) {
    term.kill()
    terminals.delete(id)
  }
}

export function closeAll(): void {
  terminals.forEach((term) => term.kill())
  terminals.clear()
}
