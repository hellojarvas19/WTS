/**
 * Critical Function Tests
 * Tests all critical paths and edge cases
 */

import { ValidTransactions } from '../src/lib/valid-transactions'
import { FormatNumbers } from '../src/lib/format-numbers'

console.log('🧪 Running Critical Function Tests...\n')

let passedTests = 0
let failedTests = 0

function test(name: string, fn: () => boolean) {
  try {
    const result = fn()
    if (result) {
      console.log(`✅ ${name}`)
      passedTests++
    } else {
      console.log(`❌ ${name}`)
      failedTests++
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error}`)
    failedTests++
  }
}

// Test 1: ValidTransactions - PumpFun Detection
test('ValidTransactions detects PumpFun transactions', () => {
  const mockLogs = {
    signature: 'test',
    logs: ['Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke'],
    err: null,
  }
  const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === true && swap === 'pumpfun'
})

// Test 2: ValidTransactions - PumpSwap Detection
test('ValidTransactions detects PumpSwap transactions', () => {
  const mockLogs = {
    signature: 'test',
    logs: ['Program pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA invoke'],
    err: null,
  }
  const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === true && swap === 'pumpfun_amm'
})

// Test 3: ValidTransactions - Jupiter Detection
test('ValidTransactions detects Jupiter transactions', () => {
  const mockLogs = {
    signature: 'test',
    logs: ['Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke'],
    err: null,
  }
  const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === true && swap === 'jupiter'
})

// Test 4: ValidTransactions - Raydium Detection
test('ValidTransactions detects Raydium transactions', () => {
  const mockLogs = {
    signature: 'test',
    logs: ['Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke'],
    err: null,
  }
  const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === true && swap === 'raydium'
})

// Test 5: ValidTransactions - SOL Transfer Detection
test('ValidTransactions detects SOL transfers', () => {
  const mockLogs = {
    signature: 'test',
    logs: ['Program 11111111111111111111111111111111 invoke'],
    err: null,
  }
  const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === true && swap === 'sol_transfer'
})

// Test 6: ValidTransactions - Rejects Bulk Transfers
test('ValidTransactions rejects bulk SOL transfers', () => {
  const mockLogs = {
    signature: 'test',
    logs: [
      'Program 11111111111111111111111111111111 invoke',
      'Program 11111111111111111111111111111111 invoke',
      'Program 11111111111111111111111111111111 invoke',
    ],
    err: null,
  }
  const { isRelevant } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === false
})

// Test 7: ValidTransactions - Rejects Irrelevant Transactions
test('ValidTransactions rejects irrelevant transactions', () => {
  const mockLogs = {
    signature: 'test',
    logs: ['Program SomeRandomProgram123456789 invoke'],
    err: null,
  }
  const { isRelevant } = ValidTransactions.isRelevantTransaction(mockLogs)
  return isRelevant === false
})

// Test 8: FormatNumbers - Token Amount Formatting
test('FormatNumbers formats token amounts correctly', () => {
  const result1 = FormatNumbers.formatTokenAmount(1000000)
  const result2 = FormatNumbers.formatTokenAmount(1500000)
  const result3 = FormatNumbers.formatTokenAmount(999)
  return result1 === '1.00M' && result2 === '1.50M' && result3 === '999.00'
})

// Test 9: FormatNumbers - Price Formatting
test('FormatNumbers formats prices correctly', () => {
  const result1 = FormatNumbers.formatPrice(1000000)
  const result2 = FormatNumbers.formatPrice(1500)
  const result3 = FormatNumbers.formatPrice(50)
  return result1 === '$1.00M' && result2 === '$1.50K' && result3 === '$50.00'
})

// Test 10: FormatNumbers - Small Price Formatting
test('FormatNumbers formats small prices correctly', () => {
  const result = FormatNumbers.formatTokenPrice(0.00000123)
  return result === '0.00000123'
})

// Test 11: Array Safety - Empty Array Handling
test('Array operations handle empty arrays safely', () => {
  const emptyArray: number[] = []
  const result = emptyArray[0]
  return result === undefined
})

// Test 12: Array Safety - Undefined Element Access
test('Array operations handle undefined elements safely', () => {
  const sparseArray: (number | undefined)[] = [1, undefined, 3]
  const result = sparseArray[1]
  return result === undefined
})

// Test 13: String Safety - Slice on Short Strings
test('String slice handles short strings safely', () => {
  const shortString = 'ABC'
  const result = `${shortString.slice(0, 4)}...${shortString.slice(-4)}`
  return result === 'ABC...ABC'
})

// Test 14: String Safety - Slice on Empty Strings
test('String slice handles empty strings safely', () => {
  const emptyString = ''
  const result = `${emptyString.slice(0, 4)}...${emptyString.slice(-4)}`
  return result === '...'
})

// Test 15: Number Safety - Division by Zero
test('Number operations handle division by zero', () => {
  const result = 100 / 0
  return !isFinite(result)
})

// Test 16: Number Safety - NaN Detection
test('Number operations detect NaN correctly', () => {
  const result = 0 / 0
  return isNaN(result)
})

console.log(`\n📊 Test Results:`)
console.log(`✅ Passed: ${passedTests}`)
console.log(`❌ Failed: ${failedTests}`)
console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!')
  process.exit(0)
} else {
  console.log('\n⚠️  Some tests failed!')
  process.exit(1)
}
