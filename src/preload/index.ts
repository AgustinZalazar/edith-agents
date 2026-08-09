import { contextBridge, ipcRenderer } from 'electron'
import type { Profile, Session, Worktree } from '../shared/types'

const edith = {
  terminal: {
    create: (id: string, cwd?: string) =>
      ipcRenderer.invoke('terminal:create', { id, cwd }),
    write: (id: string, data: string) =>
      ipcRenderer.send('terminal:write', { id, data }),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', { id, cols, rows }),
    close: (id: string) =>
      ipcRenderer.invoke('terminal:close', { id }),
    onData: (cb: (id: string, data: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, { id, data }: { id: string; data: string }) =>
        cb(id, data)
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.removeListener('terminal:data', handler)
    },
    onExit: (cb: (id: string, exitCode: number) => void) => {
      const handler = (
        _: Electron.IpcRendererEvent,
        { id, exitCode }: { id: string; exitCode: number },
      ) => cb(id, exitCode)
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.removeListener('terminal:exit', handler)
    },
  },
  profile: {
    get: (): Promise<Profile | null> => ipcRenderer.invoke('profile:get'),
    set: (profile: Profile): Promise<void> => ipcRenderer.invoke('profile:set', profile),
  },
  session: {
    list: (): Promise<Session[]> => ipcRenderer.invoke('session:list'),
    create: (name: string, profile: Profile, worktreePath?: string): Promise<Session> =>
      ipcRenderer.invoke('session:create', { name, profile, worktreePath }),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('session:delete', { id }),
    update: (id: string, updates: Partial<Session>): Promise<void> =>
      ipcRenderer.invoke('session:update', { id, updates }),
  },
  worktree: {
    list: (): Promise<Worktree[]> => ipcRenderer.invoke('worktree:list'),
    create: (name: string, path: string, branch: string, profile: Profile): Promise<Worktree> =>
      ipcRenderer.invoke('worktree:create', { name, path, branch, profile }),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('worktree:delete', { id }),
  },
}

contextBridge.exposeInMainWorld('edith', edith)

export type EdithAPI = typeof edith
