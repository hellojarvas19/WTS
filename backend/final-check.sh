#!/bin/bash

echo "🔍 Final Comprehensive Check"
echo "=============================="
echo ""

# Check 1: TypeScript Compilation
echo "1️⃣  Checking TypeScript compilation..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo "❌ TypeScript compilation failed"
    exit 1
else
    echo "✅ TypeScript compilation passed"
fi
echo ""

# Check 2: Prisma Client
echo "2️⃣  Checking Prisma client..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Prisma client missing"
    exit 1
fi
echo ""

# Check 3: Compiled Output
echo "3️⃣  Checking compiled output..."
if [ -d "dist/src" ]; then
    echo "✅ Compiled output exists"
else
    echo "❌ Compiled output missing"
    exit 1
fi
echo ""

# Check 4: Critical Files
echo "4️⃣  Checking critical files..."
CRITICAL_FILES=(
    "dist/src/main.js"
    "dist/src/lib/watch-transactions.js"
    "dist/src/lib/track-wallets.js"
    "dist/src/parsers/transaction-parser.js"
    "dist/src/lib/valid-transactions.js"
    "dist/src/lib/rate-limit.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done
echo ""

# Check 5: Runtime Verification
echo "5️⃣  Running runtime verification..."
if node verify.js > /dev/null 2>&1; then
    echo "✅ Runtime verification passed"
else
    echo "❌ Runtime verification failed"
    exit 1
fi
echo ""

# Check 6: Package.json scripts
echo "6️⃣  Checking package.json scripts..."
if grep -q '"start"' package.json; then
    echo "✅ Start script exists"
else
    echo "❌ Start script missing"
    exit 1
fi
echo ""

echo "=============================="
echo "🎉 ALL CHECKS PASSED!"
echo "=============================="
echo ""
echo "✅ Code is verified and ready for deployment"
echo ""
echo "Next steps:"
echo "  1. Configure .env file"
echo "  2. Set up PostgreSQL database"
echo "  3. Run: npm run db:migrate"
echo "  4. Run: npm start"
echo ""
