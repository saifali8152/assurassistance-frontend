import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // STABLE FILENAMES, on purpose.
        //
        // Vite's default is content-hashed names (index-D_rrNi9U.js), which are
        // ideal when a deploy replaces the whole directory atomically. This app
        // is uploaded over FTP file by file, where hashes are actively harmful:
        // every build invents new filenames, so index.html and assets/ drift out
        // of step the moment one upload is missed or partial — and the result is
        // a blank, unstyled page because both files 404.
        //
        // With fixed names you overwrite the same two files every time.
        //
        // Cache-busting then has to come from HTTP headers instead of the
        // filename — see public/.htaccess, which marks these as no-cache so the
        // browser revalidates and gets a cheap 304 when nothing changed.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
