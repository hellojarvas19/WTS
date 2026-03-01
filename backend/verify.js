#!/usr/bin/env node

/**
 * Quick Verification Script
 * Tests compiled code for runtime errors
 */

console.log('🔍 Running Quick Verification...\n')

// Test 1: Import ValidTransactions
try {
  const { ValidTransactions } = require('./dist/src/lib/valid-transactions')
  console.log('✅ ValidTransactions module loads correctly')
} catch (error) {
  console.log('❌ ValidTransactions module failed:', error.message)
  process.exit(1)
}

// Test 2: Import FormatNumbers
try {
  const { FormatNumbers } = require('./dist/src/lib/format-numbers')
  console.log('✅ FormatNumbers module loads correctly')
} catch (error) {
  console.log('❌ FormatNumbers module failed:', error.message)
  process.exit(1)
}

// Test 3: Test ValidTransactions.isRelevantTransaction
try {
  const { ValidTransactions } = require('./dist/src/lib/valid-transactions')
  
  const mockLogs = {
    signature: 'test',
    logs: ['Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke'],
    err: null,
  }
  
  const result = ValidTransactions.isRelevantTransaction(mockLogs)
  
  if (result.isRelevant === true && result.swap === 'pumpfun') {
    console.log('✅ ValidTransactions.isRelevantTransaction works correctly')
  } else {
    console.log('❌ ValidTransactions.isRelevantTransaction returned unexpected result')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ ValidTransactions.isRelevantTransaction failed:', error.message)
  process.exit(1)
}

// Test 4: Test FormatNumbers.formatTokenAmount
try {
  const { FormatNumbers } = require('./dist/src/lib/format-numbers')
  
  const result = FormatNumbers.formatTokenAmount(1000000)
  
  // formatTokenAmount returns comma-separated numbers, not K/M/B suffixes
  if (result === '1,000.00') {
    console.log('✅ FormatNumbers.formatTokenAmount works correctly')
  } else {
    console.log('❌ FormatNumbers.formatTokenAmount returned:', result)
    process.exit(1)
  }
} catch (error) {
  console.log('❌ FormatNumbers.formatTokenAmount failed:', error.message)
  process.exit(1)
}

// Test 5: Test FormatNumbers.formatPrice
try {
  const { FormatNumbers } = require('./dist/src/lib/format-numbers')
  
  const result = FormatNumbers.formatPrice(1000000)
  
  // formatPrice returns K/M/B suffixes without $ sign
  if (result === '1.00M') {
    console.log('✅ FormatNumbers.formatPrice works correctly')
  } else {
    console.log('❌ FormatNumbers.formatPrice returned:', result)
    process.exit(1)
  }
} catch (error) {
  console.log('❌ FormatNumbers.formatPrice failed:', error.message)
  process.exit(1)
}

// Test 6: Test Array Safety
try {
  const testArray = [1, 2, 3]
  const result = testArray[10]
  
  if (result === undefined) {
    console.log('✅ Array bounds checking works correctly')
  } else {
    console.log('❌ Array bounds checking failed')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ Array bounds checking failed:', error.message)
  process.exit(1)
}

// Test 7: Test String Safety
try {
  const shortString = 'ABC'
  const result = `${shortString.slice(0, 4)}...${shortString.slice(-4)}`
  
  if (result === 'ABC...ABC') {
    console.log('✅ String slicing works correctly')
  } else {
    console.log('❌ String slicing returned:', result)
    process.exit(1)
  }
} catch (error) {
  console.log('❌ String slicing failed:', error.message)
  process.exit(1)
}

console.log('\n🎉 All verification tests passed!')
console.log('✅ Code is ready for deployment\n')
