import { ipcMain, BrowserWindow } from 'electron'
import { createTerminal, writeToTerminal, resizeTerminal, closeTerminal } from './terminal'
import * as store from './store'
import { getUsage } from './usage'
import { isEngramInstalled, isEngramConfigured, setupEngram } from './engram'
import type { Profile, Session } from '../shared/types'

export function setupIPC(win: BrowserWindow): void {
  ipcMain.handle('terminal:create', (_, { id, cwd }: { id: string; cwd?: string }) => {
    const session = store.getSessions().find((s) => s.id === id)
    const profile = session?.profile ?? 'personal'
    createTerminal(id, cwd, profile, win)
  })

  ipcMain.on('terminal:write', (_, { id, data }: { id: string; data: string }) => {
    writeToTerminal(id, data)
  })

  ipcMain.on('terminal:resize', (_, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    resizeTerminal(id, cols, rows)
  })

  ipcMain.handle('terminal:close', (_, { id }: { id: string }) => {
    closeTerminal(id)
  })

  ipcMain.handle('profile:get', () => store.getProfile())
  ipcMain.handle('profile:set', (_, profile: Profile) => store.setProfile(profile))
  ipcMain.handle('profile:stats', (_, profile: Profile) => store.getProfileStats(profile))
  ipcMain.handle('usage:get', (_, { profile, sessionId }: { profile: Profile; sessionId: string }) =>
    getUsage(profile, sessionId),
  )

  ipcMain.handle('session:list', () => store.getSessions())
  ipcMain.handle(
    'session:create',
    (_, { name, profile, worktreePath }: { name: string; profile: Profile; worktreePath?: string }) =>
      store.createSession(name, profile, worktreePath),
  )
  ipcMain.handle('session:delete', (_, { id }: { id: string }) => store.deleteSession(id))
  ipcMain.handle(
    'session:update',
    (_, { id, updates }: { id: string; updates: Partial<Session> }) =>
      store.updateSession(id, updates),
  )

  ipcMain.handle('engram:status', async (_, profile: Profile) => {
    const [installed, configured] = await Promise.all([
      isEngramInstalled(),
      Promise.resolve(isEngramConfigured(profile)),
    ])
    return { installed, configured }
  })

  ipcMain.handle('engram:setup', (_, profile: Profile) => setupEngram(profile))

  ipcMain.handle('worktree:list', () => store.getWorktrees())
  ipcMain.handle(
    'worktree:create',
    (_, { name, path, branch, profile }: { name: string; path: string; branch: string; profile: Profile }) =>
      store.createWorktree(name, path, branch, profile),
  )
  ipcMain.handle('worktree:delete', (_, { id }: { id: string }) => store.deleteWorktree(id))
}
