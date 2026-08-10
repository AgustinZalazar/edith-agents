import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { app } from 'electron'
import type { Profile } from '../shared/types'

const execFileAsync = promisify(execFile)

export function engramDataDir(profile: Profile): string {
  return join(app.getPath('userData'), `engram-${profile}`)
}

function claudeConfigDir(profile: Profile): string {
  return join(app.getPath('userData'), `claude-${profile}`)
}

export async function isEngramInstalled(): Promise<boolean> {
  try {
    await execFileAsync('engram', ['--version'])
    return true
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException
    // ENOENT means binary not found in PATH
    return err.code !== 'ENOENT'
  }
}

export function isEngramConfigured(profile: Profile): boolean {
  try {
    const settingsPath = join(claudeConfigDir(profile), 'settings.json')
    if (!existsSync(settingsPath)) return false
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
    return 'engram' in (settings.mcpServers ?? {})
  } catch {
    return false
  }
}

export async function setupEngram(
  profile: Profile,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await execFileAsync('engram', ['setup', 'claude-code'], {
      env: {
        ...process.env,
        CLAUDE_CONFIG_DIR: claudeConfigDir(profile),
        ENGRAM_DATA_DIR: engramDataDir(profile),
      },
    })
    return { ok: true }
  } catch (e: unknown) {
    const err = e as Error
    return { ok: false, error: err.message ?? String(e) }
  }
}
