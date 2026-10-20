import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Fetch-on-mount is the app's standard data-loading pattern. The React
      // Compiler hint is useful for new code, but flags the existing pattern.
      'react-hooks/set-state-in-effect': 'off',
      // AuthProvider and the useAuth hook intentionally share auth.jsx.
      'react-refresh/only-export-components': 'off',
    },
  },
])
