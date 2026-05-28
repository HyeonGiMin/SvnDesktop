// Playwright Electron driver for SVN Desktop
import { _electron as electron } from 'playwright-core'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(APP_DIR, '.claude', 'shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const electronBin = path.join(
  APP_DIR,
  'node_modules',
  'electron',
  'dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron'
)

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--inspect-electron', '--no-sandbox', APP_DIR],
  timeout: 30_000,
})

await new Promise(r => setTimeout(r, 3000))

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

// Screenshot 1: empty state
const shot1 = path.join(SHOT_DIR, '01-initial.png')
await page.screenshot({ path: shot1 })
console.log('Screenshot saved:', shot1)

// Open "Current repository" dropdown
await page.click('.repo-btn')
await new Promise(r => setTimeout(r, 400))

const shot2 = path.join(SHOT_DIR, '02-repo-dropdown.png')
await page.screenshot({ path: shot2 })
console.log('Screenshot saved:', shot2)

// Click + to add a repository
await page.click('.dropdown-add-btn')
await new Promise(r => setTimeout(r, 300))

// Fill in path (use project root as a fake test path)
const inputs = await page.$$('.dropdown-add-form input')
if (inputs.length >= 2) {
  await inputs[0].fill('Test Repo')
  await inputs[1].fill(APP_DIR)
  await page.click('.btn-primary')
  await new Promise(r => setTimeout(r, 1500))
}

const shot3 = path.join(SHOT_DIR, '03-with-repo.png')
await page.screenshot({ path: shot3 })
console.log('Screenshot saved:', shot3)

const title = await page.title()
console.log('Window title:', title)

await app.close()
