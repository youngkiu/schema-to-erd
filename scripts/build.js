// https://esbuild.github.io/api/
import esbuild from 'esbuild';
esbuild
  .build({
    entryPoints: ['src/main.js'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    minify: true,
    outdir: 'dist',
    outExtension: { '.js': '.mjs' }
  })
  .catch(() => process.exit(1))
