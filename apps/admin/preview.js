// preview.js
import { loadEnv } from 'vite'
import { spawn } from 'node:child_process'

const mode = process.env.MODE || 'production'
const env = loadEnv(mode, process.cwd(), '')

const port = env.VITE_PORT || '5002'
const host = env.VITE_HOST || '0.0.0.0'

const proc = spawn(
  'vite',
  ['preview', '--mode', mode, '--port', port, '--host', host],
  { stdio: 'inherit', shell: true }
)

proc.on('exit', code => process.exit(code))
