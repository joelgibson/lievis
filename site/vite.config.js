import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import sveltePreprocess from 'svelte-preprocess'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob'
import { readFileSync } from 'fs';

const base_url = readFileSync('./base_url', 'utf-8').match(/^\/.*$/m)[0]

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find all .md files under src/, except those inside src/lib.
let markdownFiles = {}
glob.sync('src/**/*.md').forEach(fileName => {
  if (!fileName.includes('src/lib/'))
    markdownFiles[fileName] = path.resolve(fileName.replace(/[.]md$/, '.html'))
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        typescript: {
          tsconfigFile: './tsconfig.json',
        }
      })
    })
  ],

  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, 'src/lib'),
    }
  },

  // This is the "project root" according to Vite, most paths are relative to this.
  root: 'src',

  // This is the "deployment path".
  base: base_url,

  // Anything in publicDir gets copied to the site root for the build.
  publicDir: 'static',

  // Turn JSON files into JSON.parse("..."), which is more performant than object literals.
  json: {stringify: true},

  build: {
    target: 'es2020',
    outDir: '../_site',
    emptyOutDir: true,
    rollupOptions: {
      input: markdownFiles,
    },
    minify: false,
    sourcemap: true,
  },
})
