import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { appShellPlugin } from './vite/appShellPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appShellPlugin()],
})
