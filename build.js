#!/usr/bin/env node
import esbuild from 'esbuild';

const commonOptions  = {
  // https://esbuild.github.io/api/
  entryPoints: ['src/main.js'],
  bundle: true,
  platform: 'node',
  minify: true,
  outdir: 'dist'
}

esbuild
  .build({
    ...commonOptions,
    format: 'esm',
    outExtension: { '.js': '.mjs' }
  })
  .catch(() => process.exit(1))

esbuild
  .build({
    ...commonOptions,
      format: 'cjs',
      outExtension: { '.js': '.cjs' }
  })
  .catch(() => process.exit(1))
