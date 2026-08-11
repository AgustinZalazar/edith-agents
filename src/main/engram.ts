import { spawn } from 'child_process'
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

function withGoBin(env: NodeJS.ProcessEnv): Record<string, string> {
  const base = { ...env } as Record<string, string>
  const home = process.env.USERPROFILE ?? process.env.HOME ?? ''
  const goBin = join(home, 'go', 'bin')
  const pathKey = Object.keys(base).find((k) => k.toLowerCase() === 'path') ?? 'PATH'
  const sep = process.platform === 'win32' ? ';' : ':'
  base[pathKey] = `${goBin}${sep}${base[pathKey] ?? ''}`
  return base
}

export async function isEngramInstalled(): Promise<boolean> {
  try {
    await execFileAsync('engram', ['--version'], {
      env: withGoBin(process.env),
      timeout: 5000,
    })
    return true
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException
    return err.code !== 'ENOENT'
  }
}

export function isEngramConfigured(profile: Profile): boolean {
  try {
    const settingsPath = join(claudeConfigDir(profile), 'settings.json')
    if (!existsSync(settingsPath)) return false
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
    // Engram installs as a Claude Code plugin, not an MCP server entry
    return settings.enabledPlugins?.['engram@engram'] === true
  } catch {
    return false
  }
}

export function setupEngram(profile: Profile): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const env = {
      ...withGoBin(process.env),
      CLAUDE_CONFIG_DIR: claudeConfigDir(profile),
      ENGRAM_DATA_DIR: engramDataDir(profile),
    }

    let child: ReturnType<typeof spawn>
    try {
      child = spawn('engram', ['setup', 'claude-code'], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (e: unknown) {
      resolve({ ok: false, error: (e as Error).message })
      return
    }

    // Auto-answer the "Add to allowlist? (y/N):" prompt
    child.stdin?.write('y\n')
    child.stdin?.end()

    let out = ''
    child.stdout?.on('data', (d: Buffer) => { out += d.toString() })
    child.stderr?.on('data', (d: Buffer) => { out += d.toString() })

    const timer = setTimeout(() => {
      child.kill()
      resolve({ ok: false, error: `timed out. Output: ${out.trim() || '(none)'}` })
    }, 15_000)

    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      resolve({
        ok: false,
        error: err.code === 'ENOENT' ? 'engram binary not found in PATH' : err.message,
      })
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0 || code === null) {
        resolve({ ok: true })
      } else {
        resolve({ ok: false, error: out.trim() || `exited with code ${code}` })
      }
    })
  })
}
