import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const command = process.argv[2]
if (!['dev', 'build', 'deploy'].includes(command)) {
  throw new Error('Expected a Sanity command: dev, build, or deploy.')
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const studio = path.join(root, 'studio')
const mode = command === 'dev' ? 'development' : 'production'
const localEnvironment = loadEnv(mode, root, '')
const sanity = path.join(root, 'node_modules', '.bin', 'sanity')

const child = spawn(sanity, [command, ...process.argv.slice(3)], {
  cwd: studio,
  env: { ...process.env, ...localEnvironment },
  stdio: 'inherit',
})

child.on('error', (error) => {
  throw error
})
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
