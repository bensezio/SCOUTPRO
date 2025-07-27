// Static Deployment Configuration for Replit
// Optimized for static hosting instead of Cloud Run

module.exports = {
  // Build configuration
  build: {
    outDir: 'dist',
    target: 'static',
    compress: true,
    minify: true,
    
    // Exclude large files from build
    exclude: [
      'attached_assets/**',
      'ai-services/**',
      'documentations/**',
      '*.md',
      '*.pdf',
      '*.mp4',
      '*.avi',
      '*.mov',
      '*.pkl',
      'node_modules/**',
      '.git/**'
    ]
  },

  // Static hosting configuration
  static: {
    port: 5000,
    host: '0.0.0.0',
    fallback: 'index.html', // SPA fallback
    
    // Headers for static assets
    headers: {
      '/**': {
        'Cache-Control': 'public, max-age=31536000'
      },
      '/index.html': {
        'Cache-Control': 'no-cache'
      }
    }
  },

  // Performance optimizations
  optimization: {
    splitChunks: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    removeRedundantAttributes: true,
    useShortDoctype: true
  }
};