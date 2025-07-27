#!/bin/bash

echo "=== VITE INSTALLATION VERIFICATION SCRIPT ==="
echo "Use this script on your VPS before running deploy.sh"
echo ""

# Change to project directory
cd /var/www/platinumscout 2>/dev/null || cd .

echo "📁 Current directory: $(pwd)"
echo ""

echo "🔍 1. Checking Vite in package.json devDependencies:"
grep -A3 -B3 '"vite"' package.json || echo "❌ Vite not found in package.json"
echo ""

echo "🔍 2. Running npm install (including devDependencies):"
npm install --include=dev
echo ""

echo "🔍 3. Verifying Vite binary exists:"
if [[ -f "node_modules/.bin/vite" ]]; then
    echo "✅ Vite binary found: $(ls -la node_modules/.bin/vite)"
else
    echo "❌ Vite binary missing!"
    exit 1
fi
echo ""

echo "🔍 4. Checking Vite version:"
if npx vite --version; then
    echo "✅ Vite accessible and working"
else
    echo "❌ Vite not accessible!"
    exit 1
fi
echo ""

echo "🔍 5. Testing Vite build (dry run):"
if npx vite build --mode production --logLevel info; then
    echo "✅ Vite build successful"
else
    echo "❌ Vite build failed!"
    exit 1
fi

echo ""
echo "✅ ALL VITE VERIFICATION CHECKS PASSED"
echo "You can now run deploy.sh safely"