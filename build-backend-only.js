#!/usr/bin/env node

// Production backend build script that excludes all Vite dependencies
// This ensures the production backend has zero Vite runtime dependencies

import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildBackend() {
  console.log('🔧 Building production backend (excluding Vite dependencies)...');
  
  try {
    await esbuild.build({
      entryPoints: {
        'index': resolve(__dirname, 'server/index.production.ts')
      },
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outdir: resolve(__dirname, 'dist'),
      packages: 'external',
      define: {
        'process.env.NODE_ENV': '"production"',
        '__VITE_ENABLED__': 'false'
      },
      // Exclude Vite completely from production bundle
      external: [
        'vite',
        '@vitejs/*', 
        '@replit/vite-*'
      ],

      // Don't include ./vite.ts in production builds
      loader: {
        '.ts': 'ts'
      },
      tsconfig: resolve(__dirname, 'tsconfig.json'),
      sourcemap: false,
      minify: false, // Keep readable for debugging
      logLevel: 'info'
    });
    
    console.log('✅ Backend build completed successfully');
    console.log('📁 Output: dist/index.js');
    console.log('🚫 Vite dependencies excluded from production build');
    
  } catch (error) {
    console.error('❌ Backend build failed:', error);
    process.exit(1);
  }
}

buildBackend();