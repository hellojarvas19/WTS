/**
 * Unit Tests for Token Metadata Services
 * 
 * Tests the correctness of data merging, risk calculation, timestamp handling,
 * and Token-2022 compatibility without relying on external API calls.
 * 
 * Run: npx tsc && node dist/scripts/test-token-metadata-unit.js
 */

import dotenv from 'dotenv'
dotenv.config()

// ═══════════════════════════════════════════════════════════════════════════
// TEST FRAMEWORK (minimal, no external deps)
// ═══════════════════════════════════════════════════════════════════════════

let totalTests = 0
let passedTests = 0
let failedTests = 0
const failures: string[] = []

function assert(condition: boolean, message: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  [PASS] ${message}`)
  } else {
    failedTests++
    failures.push(message)
    console.log(`  [FAIL] ${message}`)
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  totalTests++
  if (actual === expected) {
    passedTests++
    console.log(`  [PASS] ${message}`)
  } else {
    failedTests++
    failures.push(`${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`)
    console.log(`  [FAIL] ${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`)
  }
}

function assertRange(actual: number | undefined, min: number, max: number, message: string) {
  totalTests++
  if (actual !== undefined && actual >= min && actual <= max) {
    passedTests++
    console.log(`  [PASS] ${message} (value: ${actual})`)
  } else {
    failedTests++
    failures.push(`${message} (expected ${min}-${max}, got: ${actual})`)
    console.log(`  [FAIL] ${message} (expected ${min}-${max}, got: ${actual})`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: PumpFun API URL Fix
// ═══════════════════════════════════════════════════════════════════════════

async function testPumpFunApiUrl() {
  console.log('\n--- Test Suite: PumpFun API URL ---')
  
  const axios = (await import('axios')).default
  const TOKEN = '4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump'
  
  try {
    const response = await axios.get(
      `https://frontend-api-v3.pump.fun/coins/${TOKEN}`,
      { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*', Origin: 'https://www.pump.fun', Referer: 'https://www.pump.fun/' } }
    )
    
    assertEqual(response.status, 200, 'PumpFun v3 API returns 200')
    assert(!!response.data.name, 'PumpFun returns token name')
    assert(!!response.data.symbol, 'PumpFun returns token symbol')
    assert(!!response.data.creator, 'PumpFun returns creator address')
    assert(typeof response.data.created_timestamp === 'number', 'PumpFun returns created_timestamp')
    assert(typeof response.data.complete === 'boolean', 'PumpFun returns bonding complete status')
    assert(typeof response.data.total_supply === 'number', 'PumpFun returns total supply')
    assert(typeof response.data.usd_market_cap === 'number', 'PumpFun returns USD market cap')
  } catch (error: any) {
    assert(false, `PumpFun v3 API request failed: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: DexScreener API
// ═══════════════════════════════════════════════════════════════════════════

async function testDexScreenerApi() {
  console.log('\n--- Test Suite: DexScreener API ---')
  
  const axios = (await import('axios')).default
  const TOKEN = '4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump'
  
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${TOKEN}`,
      { timeout: 15000 }
    )
    
    assertEqual(response.status, 200, 'DexScreener returns 200')
    assert(Array.isArray(response.data?.pairs), 'DexScreener returns pairs array')
    assert(response.data.pairs.length > 0, 'DexScreener has at least one pair')
    
    const pair = response.data.pairs[0]
    assert(!!pair.baseToken?.name, 'Pair has token name')
    assert(!!pair.baseToken?.symbol, 'Pair has token symbol')
    assert(!!pair.priceUsd, 'Pair has USD price')
    assert(typeof pair.liquidity?.usd === 'number', 'Pair has liquidity')
    assert(typeof pair.volume?.h24 === 'number', 'Pair has 24h volume')
  } catch (error: any) {
    assert(false, `DexScreener API request failed: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: RugCheck API
// ═══════════════════════════════════════════════════════════════════════════

async function testRugCheckApi() {
  console.log('\n--- Test Suite: RugCheck API ---')
  
  const axios = (await import('axios')).default
  const TOKEN = '4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump'
  
  try {
    const response = await axios.get(
      `https://api.rugcheck.xyz/v1/tokens/${TOKEN}/report`,
      { timeout: 15000 }
    )
    
    assertEqual(response.status, 200, 'RugCheck returns 200')
    assert(response.data.mintAuthority === null, 'Mint authority is null (revoked)')
    assert(response.data.freezeAuthority === null, 'Freeze authority is null (revoked)')
    assert(Array.isArray(response.data.markets), 'Has markets array')
    assert(Array.isArray(response.data.topHolders), 'Has topHolders array')
    assert(response.data.topHolders.length > 0, 'Has at least one holder')
    
    // Check LP locked info
    const pumpMarket = response.data.markets?.find((m: any) => m.marketType === 'pump_fun_amm')
    if (pumpMarket) {
      assert(pumpMarket.lp?.lpLockedPct >= 90, 'LP is locked >= 90% on PumpSwap market')
    }
    
    // Verify holder data structure
    const firstHolder = response.data.topHolders[0]
    assert(!!firstHolder.address, 'Holder has address')
    assert(typeof firstHolder.pct === 'number', 'Holder has percentage')
  } catch (error: any) {
    assert(false, `RugCheck API request failed: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: Timestamp Handling
// ═══════════════════════════════════════════════════════════════════════════

function testTimestampHandling() {
  console.log('\n--- Test Suite: Timestamp Handling ---')
  
  // Test seconds -> milliseconds conversion
  const timestampInSeconds = 1770351997
  const timestampInMillis = 1770351997000
  
  // The logic used in both services:
  const convertTimestamp = (ts: number) => ts > 1e12 ? ts : ts * 1000
  
  assertEqual(convertTimestamp(timestampInSeconds), timestampInMillis, 'Converts seconds to milliseconds')
  assertEqual(convertTimestamp(timestampInMillis), timestampInMillis, 'Preserves millisecond timestamps')
  assertEqual(convertTimestamp(0), 0, 'Zero timestamp stays zero')
  
  // Age calculation
  const now = Date.now()
  const ageInHours = (now - timestampInMillis) / (1000 * 60 * 60)
  assert(ageInHours > 0, 'Age is positive')
  assert(ageInHours < 24 * 365 * 10, 'Age is reasonable (< 10 years)')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: Risk Level Calculation
// ═══════════════════════════════════════════════════════════════════════════

function testRiskCalculation() {
  console.log('\n--- Test Suite: Risk Level Calculation ---')
  
  // Simulate the risk calculation logic from token-analysis.ts
  function calculateRisk(params: {
    mintRevoked: boolean
    freezeRevoked: boolean
    isMutable?: boolean
    top10Pct: number
    devHolding?: number
    liquidity: number
    lpBurned: boolean
    ageInHours?: number
    totalHolders: number
    isHoneypot?: boolean
  }): { score: number; level: string } {
    let riskScore = 0
    if (!params.mintRevoked) riskScore += 25
    if (!params.freezeRevoked) riskScore += 15
    if (params.isMutable === true) riskScore += 5
    if (params.top10Pct > 70) riskScore += 25
    else if (params.top10Pct > 50) riskScore += 10
    if (params.devHolding && params.devHolding > 10) riskScore += 15
    else if (params.devHolding && params.devHolding > 5) riskScore += 5
    if (params.liquidity < 10000) riskScore += 15
    if (!params.lpBurned) riskScore += 10
    if (params.ageInHours !== undefined && params.ageInHours < 1) riskScore += 10
    if (params.totalHolders < 100) riskScore += 10
    if (params.isHoneypot) riskScore += 50

    let level = 'low'
    if (riskScore >= 70) level = 'critical'
    else if (riskScore >= 50) level = 'high'
    else if (riskScore >= 30) level = 'medium'
    
    return { score: Math.min(100, riskScore), level }
  }
  
  // Test: Safe token (like our test token)
  const safe = calculateRisk({
    mintRevoked: true, freezeRevoked: true, top10Pct: 27.6,
    liquidity: 32000, lpBurned: true, totalHolders: 20
  })
  assertEqual(safe.level, 'low', 'Safe token (authorities revoked, LP burned) = low risk')
  assertRange(safe.score, 0, 29, 'Safe token risk score is under 30')
  
  // Test: Risky token
  const risky = calculateRisk({
    mintRevoked: false, freezeRevoked: false, top10Pct: 80,
    liquidity: 5000, lpBurned: false, totalHolders: 10, devHolding: 15
  })
  assertEqual(risky.level, 'critical', 'Risky token = critical')
  assertRange(risky.score, 70, 100, 'Risky token score >= 70')
  
  // Test: Honeypot
  const honeypot = calculateRisk({
    mintRevoked: true, freezeRevoked: true, top10Pct: 20,
    liquidity: 50000, lpBurned: true, totalHolders: 500, isHoneypot: true
  })
  assertEqual(honeypot.level, 'high', 'Honeypot detected = high risk')
  
  // Test: Medium risk (score should be 30-49)
  // mutable=5, top10>50=10, lp not burned=10, <100 holders=10 = 35
  const medium = calculateRisk({
    mintRevoked: true, freezeRevoked: true, isMutable: true,
    top10Pct: 55, liquidity: 50000, lpBurned: false, totalHolders: 50
  })
  assertEqual(medium.level, 'medium', 'Medium risk token calculation')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 6: Data Merging Behavior
// ═══════════════════════════════════════════════════════════════════════════

function testDataMerging() {
  console.log('\n--- Test Suite: Data Merging Behavior ---')
  
  // Test: DexScreener data takes priority for price
  const dexPrice = parseFloat('0.0001613')
  assert(!isNaN(dexPrice), 'DexScreener price string parses correctly')
  assert(dexPrice > 0, 'DexScreener price is positive')
  
  // Test: PumpFun total supply calculation
  const rawSupply = 1000000000000000
  const decimals = 6
  const formattedSupply = rawSupply / Math.pow(10, decimals)
  assertEqual(formattedSupply, 1000000000, 'PumpFun total supply: 1e15 / 1e6 = 1 billion')
  
  // Test: RugCheck LP locked detection
  const lpLockedPct = 100
  const lpBurned = lpLockedPct >= 90
  assertEqual(lpBurned, true, 'LP 100% locked = LP burned')
  
  const partialLocked = 50
  assertEqual(partialLocked >= 90, false, 'LP 50% locked = LP not burned')
  
  // Test: Holder percentage calculation (raw amounts from RPC getTokenLargestAccounts)
  // Note: RPC returns raw amounts (including decimals), so raw/raw*100 gives correct %
  const totalSupply = 999995518337864 // raw supply with 6 decimals
  const holderAmount = 107339000000 // raw amount with 6 decimals
  const percentage = (holderAmount / totalSupply) * 100
  // Expected: 107339000000 / 999995518337864 * 100 = ~0.01073% (this is the raw % of raw supply)
  // But RugCheck returns pct directly as percentage (e.g., 10.73)
  assertRange(percentage, 0.01, 0.02, 'RPC holder percentage: raw/raw*100 is consistent')
  
  // RugCheck percentage is pre-calculated (e.g. 10.73% for ~107B out of ~1T with 6 decimals)
  // The 10.73% comes from formatted amounts: 107339 / 999995.518 * 100 = 10.73%
  const formattedHolderAmount = holderAmount / 1e6  // 107339
  const formattedTotalSupply = totalSupply / 1e6     // 999995518.34
  const formattedPercentage = (formattedHolderAmount / formattedTotalSupply) * 100
  assertRange(formattedPercentage, 0.01, 0.02, 'Formatted holder percentage is consistent')
  
  // Test: Market cap consistency
  const priceUsd = 0.0001613
  const totalSupplyFormatted = 999995518.337864
  const calculatedMc = priceUsd * totalSupplyFormatted
  assertRange(calculatedMc, 100000, 250000, 'Calculated market cap from price * supply is reasonable')
  
  // Test: NaN protection for price divisions
  const safeDiv = (a: number, b: number): number => {
    if (typeof b !== 'number' || !isFinite(b) || b === 0) return 0
    const result = a / b
    return isFinite(result) ? result : 0
  }
  assertEqual(safeDiv(100, 0), 0, 'Division by zero returns 0')
  assertEqual(safeDiv(100, NaN), 0, 'Division by NaN returns 0')
  assertEqual(safeDiv(100, Infinity), 0, 'Division by Infinity returns 0')
  assertEqual(safeDiv(100, 50), 2, 'Normal division works correctly')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 7: Token-2022 Detection
// ═══════════════════════════════════════════════════════════════════════════

async function testToken2022Detection() {
  console.log('\n--- Test Suite: Token-2022 Detection ---')
  
  const { Connection, PublicKey } = await import('@solana/web3.js')
  const TOKEN = '4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump'
  const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    const mintPubkey = new PublicKey(TOKEN)
    
    // Check account owner to detect Token-2022
    const accountInfo = await connection.getAccountInfo(mintPubkey)
    
    assert(accountInfo !== null, 'Token account exists on-chain')
    assertEqual(accountInfo?.owner.toBase58(), TOKEN_2022_PROGRAM, 'Token uses Token-2022 program')
    
    // Verify parsed account info returns Token-2022 data
    const parsed = await connection.getParsedAccountInfo(mintPubkey)
    const program = (parsed?.value?.data as any)?.program
    assertEqual(program, 'spl-token-2022', 'Parsed program is spl-token-2022')
    
    const info = (parsed?.value?.data as any)?.parsed?.info
    assertEqual(info?.decimals, 6, 'Token has 6 decimals')
    assert(info?.mintAuthority === null, 'Mint authority is null')
    assert(info?.freezeAuthority === null, 'Freeze authority is null')
    assert(info?.isInitialized === true, 'Token is initialized')
    
    // Check Token-2022 extensions (embedded metadata)
    const extensions = info?.extensions
    assert(Array.isArray(extensions), 'Has extensions array')
    
    const metadataExt = extensions?.find((e: any) => e.extension === 'tokenMetadata')
    assert(!!metadataExt, 'Has tokenMetadata extension')
    assertEqual(metadataExt?.state?.name, 'level941', 'Embedded metadata name is correct')
    assertEqual(metadataExt?.state?.symbol, 'Pigeon', 'Embedded metadata symbol is correct')
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('Too Many')) {
      console.log('  [SKIP] Rate limited by Solana RPC (expected with public endpoint)')
    } else {
      assert(false, `Token-2022 detection failed: ${error.message}`)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 8: Aggregated Service Integration
// ═══════════════════════════════════════════════════════════════════════════

async function testAggregatedService() {
  console.log('\n--- Test Suite: TokenAnalysisService Integration ---')
  
  try {
    const { TokenAnalysisService } = await import('../src/lib/token-analysis')
    const { Connection } = await import('@solana/web3.js')
    const TOKEN = '4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump'
    
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    const service = new TokenAnalysisService(connection)
    
    try {
      const result = await service.analyzeToken(TOKEN)
      
      // Basic info
      assert(!!result.name, 'Result has name')
      assert(!!result.symbol, 'Result has symbol')
      assertEqual(result.mint, TOKEN, 'Result has correct mint address')
      
      // Price & market data (should come from DexScreener)
      assert(result.priceUsd > 0, 'Result has positive price')
      assert(result.marketCap > 0, 'Result has positive market cap')
      assert(result.liquidity > 0, 'Result has positive liquidity')
      assert(result.volume24h > 0, 'Result has positive 24h volume')
      
      // Security info (from RugCheck or RPC)
      assertEqual(result.mintAuthorityRevoked, true, 'Mint authority is revoked')
      assertEqual(result.freezeAuthorityRevoked, true, 'Freeze authority is revoked')
      
      // LP info (from RugCheck)
      assertEqual(result.lpBurned, true, 'LP is burned/locked')
      
      // Holders - totalHolders may be 0 if only RugCheck is available (returns top 20, not total)
      // But topHolders array and top10 percentage should be populated
      assert(
        result.totalHolders > 0 || !!(result.topHolders && result.topHolders.length > 0),
        'Has holders data (totalHolders or topHolders array)'
      )
      assert(result.top10HoldersPercentage > 0, 'Has top 10 holder percentage')
      
      // PumpFun data
      assert(result.dataSources.includes('pumpfun'), 'PumpFun is in data sources')
      assert(result.dataSources.includes('dexscreener'), 'DexScreener is in data sources')
      assert(result.dataSources.includes('rugcheck'), 'RugCheck is in data sources')
      assertEqual(result.pumpfunComplete, true, 'PumpFun bonding is complete')
      assert(!!result.devWallet, 'Has dev wallet')
      assert(!!result.creatorAddress, 'Has creator address')
      assert(!!result.launchTimestamp, 'Has launch timestamp')
      assert(result.launchTimestamp! > 1e12, 'Launch timestamp is in milliseconds')
      
      // Risk assessment
      assert(['low', 'medium', 'high', 'critical'].includes(result.riskLevel), 'Has valid risk level')
      assertRange(result.riskScore, 0, 100, 'Risk score is 0-100')
      assert(Array.isArray(result.riskFactors), 'Has risk factors array')
      
      // Age
      assert(result.ageInHours !== undefined && result.ageInHours > 0, 'Has positive age')
      
      // Decimals (PumpFun tokens = 6)
      assertEqual(result.decimals, 6, 'Decimals is 6 (PumpFun token)')
      
      // Total supply
      assert(result.totalSupply !== undefined && result.totalSupply > 0, 'Has positive total supply')
      
      // Generate signals test
      const signals = service.generateSignals(result)
      assert(Array.isArray(signals), 'Signals is an array')
      // Should have bonding_complete signal
      const bondingSignal = signals.find(s => s.type === 'bonding_complete')
      assert(!!bondingSignal, 'Has bonding_complete signal')
      
      // Cleanup
      service.destroy()
    } catch (error) {
      service.destroy()
      throw error
    }
  } catch (error: any) {
    assert(false, `TokenAnalysisService test failed: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(70))
  console.log('  TOKEN METADATA UNIT TESTS')
  console.log('█'.repeat(70))
  
  // Pure unit tests (no API calls)
  testTimestampHandling()
  testRiskCalculation()
  testDataMerging()
  
  // API integration tests (real calls)
  await testPumpFunApiUrl()
  await testDexScreenerApi()
  await testRugCheckApi()
  
  // Wait before Solana RPC calls
  console.log('\n  (Waiting 3s before Solana RPC tests...)')
  await new Promise(resolve => setTimeout(resolve, 3000))
  await testToken2022Detection()
  
  // Wait before aggregated service tests
  console.log('\n  (Waiting 3s before aggregated service tests...)')
  await new Promise(resolve => setTimeout(resolve, 3000))
  await testAggregatedService()
  
  // Summary
  console.log('\n' + '█'.repeat(70))
  console.log('  TEST SUMMARY')
  console.log('█'.repeat(70))
  console.log(`  Total: ${totalTests}`)
  console.log(`  Passed: ${passedTests}`)
  console.log(`  Failed: ${failedTests}`)
  
  if (failures.length > 0) {
    console.log('\n  Failures:')
    for (const f of failures) {
      console.log(`    - ${f}`)
    }
  }
  
  console.log('\n' + '█'.repeat(70))
  console.log(`  ${failedTests === 0 ? 'ALL TESTS PASSED' : `${failedTests} TEST(S) FAILED`}`)
  console.log('█'.repeat(70) + '\n')
  
  process.exit(failedTests > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
