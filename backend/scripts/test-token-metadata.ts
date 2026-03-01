/**
 * Comprehensive Token Metadata Verification Script
 * 
 * Tests ALL APIs integrated in the project for fetching metadata on:
 * Token: 4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump
 * 
 * APIs tested:
 * 1. DexScreener API (free, no key)
 * 2. PumpFun API (free, no key)
 * 3. RugCheck API (free, no key)
 * 4. Jupiter Price API (free, no key)
 * 5. Solana RPC on-chain data (free, public endpoint)
 * 6. Moralis API (requires key - graceful skip)
 * 7. Birdeye API (requires key - graceful skip)
 * 8. Helius DAS API (requires key - graceful skip)
 * 9. GMGN API (may be blocked - graceful skip)
 * 10. TokenMetadataService (aggregated)
 * 11. TokenAnalysisService (aggregated)
 * 12. ApiRequests class (legacy)
 */

import dotenv from 'dotenv'
dotenv.config()

import axios from 'axios'
import { Connection, PublicKey } from '@solana/web3.js'
// @ts-expect-error
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const TOKEN_MINT = '4fSWEw2wbYEUCcMtitzmeGUfqinoafXxkhqZrA9Gpump'

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

interface TestResult {
  api: string
  success: boolean
  data: any
  error?: string
  duration: number
}

const results: TestResult[] = []

async function runTest(name: string, fn: () => Promise<any>): Promise<any> {
  const start = Date.now()
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  TESTING: ${name}`)
  console.log(`${'═'.repeat(70)}`)

  try {
    const data = await fn()
    const duration = Date.now() - start
    results.push({ api: name, success: true, data, duration })
    console.log(`  [PASS] ${name} (${duration}ms)`)
    return data
  } catch (error: any) {
    const duration = Date.now() - start
    const errMsg = error?.message || error?.code || 'Unknown error'
    results.push({ api: name, success: false, data: null, error: errMsg, duration })
    console.log(`  [FAIL] ${name} (${duration}ms): ${errMsg}`)
    return null
  }
}

function printData(label: string, value: any) {
  if (value === undefined || value === null) {
    console.log(`    ${label}: N/A`)
  } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    console.log(`    ${label}:`)
    for (const [k, v] of Object.entries(value)) {
      console.log(`      ${k}: ${JSON.stringify(v)}`)
    }
  } else {
    console.log(`    ${label}: ${JSON.stringify(value)}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INDIVIDUAL API TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function testDexScreenerAPI(): Promise<any> {
  const response = await axios.get(
    `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`,
    { timeout: 15000 }
  )

  if (!response.data?.pairs || response.data.pairs.length === 0) {
    console.log('    No pairs found on DexScreener')
    return { pairs: [], bestPair: null }
  }

  const pairs = response.data.pairs
  const bestPair = pairs.reduce((best: any, current: any) =>
    (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
  )

  console.log(`    Pairs found: ${pairs.length}`)
  printData('Best Pair DEX', bestPair.dexId)
  printData('Pair Address', bestPair.pairAddress)
  printData('Token Name', bestPair.baseToken?.name)
  printData('Token Symbol', bestPair.baseToken?.symbol)
  printData('Price USD', bestPair.priceUsd)
  printData('Price Native (SOL)', bestPair.priceNative)
  printData('Market Cap', bestPair.marketCap)
  printData('FDV', bestPair.fdv)
  printData('Liquidity USD', bestPair.liquidity?.usd)
  printData('Volume 24h', bestPair.volume?.h24)
  printData('Price Change 24h', bestPair.priceChange?.h24)
  printData('Price Change 1h', bestPair.priceChange?.h1)
  printData('Buys 24h', bestPair.txns?.h24?.buys)
  printData('Sells 24h', bestPair.txns?.h24?.sells)
  printData('Image', bestPair.info?.imageUrl)
  printData('Websites', bestPair.info?.websites)
  printData('Socials', bestPair.info?.socials)
  printData('Boosts', bestPair.boosts)

  return { pairs, bestPair }
}

async function testPumpFunAPI(): Promise<any> {
  const response = await axios.get(
    `https://frontend-api-v3.pump.fun/coins/${TOKEN_MINT}`,
    {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Accept': '*/*',
        'Origin': 'https://www.pump.fun',
        'Referer': 'https://www.pump.fun/',
      },
    }
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(`PumpFun returned status ${response.status}`)
  }

  const data = response.data
  printData('Name', data.name)
  printData('Symbol', data.symbol)
  printData('Description', data.description?.substring(0, 100))
  printData('Image URI', data.image_uri)
  printData('Creator', data.creator)
  printData('Created Timestamp', data.created_timestamp)
  printData('Created Date', data.created_timestamp ? new Date(data.created_timestamp).toISOString() : 'N/A')
  printData('Complete (bonding done)', data.complete)
  printData('Market Cap (SOL)', data.market_cap)
  printData('USD Market Cap', data.usd_market_cap)
  printData('Virtual SOL Reserves', data.virtual_sol_reserves)
  printData('Virtual Token Reserves', data.virtual_token_reserves)
  printData('Total Supply', data.total_supply)
  printData('Bonding Curve', data.bonding_curve)
  printData('Associated Bonding Curve', data.associated_bonding_curve)
  printData('King of the Hill Timestamp', data.king_of_the_hill_timestamp)
  printData('Reply Count', data.reply_count)
  printData('Website', data.website)
  printData('Twitter', data.twitter)
  printData('Telegram', data.telegram)

  return data
}

async function testRugCheckAPI(): Promise<any> {
  const response = await axios.get(
    `https://api.rugcheck.xyz/v1/tokens/${TOKEN_MINT}/report`,
    { timeout: 15000 }
  )

  if (!response.data) {
    throw new Error('No data returned from RugCheck')
  }

  const data = response.data
  printData('Token Name', data.tokenMeta?.name)
  printData('Token Symbol', data.tokenMeta?.symbol)
  printData('Mint Authority', data.mintAuthority)
  printData('Freeze Authority', data.freezeAuthority)
  printData('Mint Authority Revoked', data.mintAuthority === null)
  printData('Freeze Authority Revoked', data.freezeAuthority === null)
  printData('Token Program', data.tokenProgram)
  printData('Token Type', data.tokenType)
  printData('Score', data.score)
  printData('Risks', data.risks?.map((r: any) => `${r.name}: ${r.description} (level: ${r.level}, score: ${r.score})`))
  printData('Total Market Count', data.markets?.length)

  // Show market/pool details
  if (data.markets && data.markets.length > 0) {
    console.log('    Markets:')
    for (const market of data.markets.slice(0, 3)) {
      console.log(`      - ${market.marketType || 'unknown'}: LP=${market.lp?.lpLockedPct?.toFixed(1) || 0}% locked, Liquidity=$${(market.lp?.quoteUSD || 0).toFixed(0)}`)
    }
  }

  // Top holders from rugcheck
  if (data.topHolders && data.topHolders.length > 0) {
    console.log(`    Top Holders (from RugCheck): ${data.topHolders.length}`)
    for (const holder of data.topHolders.slice(0, 5)) {
      console.log(`      - ${holder.address?.slice(0, 8)}...: ${holder.pct?.toFixed(2)}% ${holder.insider ? '[INSIDER]' : ''}`)
    }
  }

  return data
}

async function testJupiterPriceAPI(): Promise<any> {
  // Jupiter v2 API now requires API key - try with key if available
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    const jupiterApiKey = process.env.JUPITER_API_KEY
    if (jupiterApiKey) {
      headers['Authorization'] = `Bearer ${jupiterApiKey}`
    }

    const response = await axios.get(
      `https://api.jup.ag/price/v2?ids=${TOKEN_MINT}`,
      { timeout: 10000, headers }
    )

    if (response.data?.data?.[TOKEN_MINT]) {
      const data = response.data.data[TOKEN_MINT]
      printData('Price USD (v2)', data.price)
      printData('Token ID', data.id)
      printData('Type', data.type)
      return data
    }
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 401) {
      console.log('    Jupiter v2 API requires API key (401) - trying Raydium fallback...')
    } else {
      console.log(`    Jupiter v2 error: ${status || error?.code || error?.message}`)
    }
  }

  // Fallback: Raydium price API (free)
  try {
    const raydiumRes = await axios.get(
      `https://api-v3.raydium.io/mint/price?mints=${TOKEN_MINT}`,
      { timeout: 10000 }
    )

    if (raydiumRes.data?.success && raydiumRes.data?.data?.[TOKEN_MINT]) {
      const priceStr = raydiumRes.data.data[TOKEN_MINT]
      printData('Price USD (Raydium)', priceStr)
      return { price: parseFloat(priceStr), source: 'raydium' }
    } else {
      console.log('    Raydium has no price for this token')
    }
  } catch (error: any) {
    console.log(`    Raydium price error: ${error?.response?.status || error?.code || error?.message}`)
  }

  console.log('    No free price API available for this token')
  return null
}

async function testSolanaRPC(): Promise<any> {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
  const mintPublicKey = new PublicKey(TOKEN_MINT)

  // 1. Get Mint Info - detect Token Program or Token-2022
  console.log('    --- Mint Info ---')
  let mintInfo: any
  let tokenProgram = 'Token Program'
  try {
    mintInfo = await getMint(connection, mintPublicKey, undefined, TOKEN_PROGRAM_ID)
  } catch {
    try {
      mintInfo = await getMint(connection, mintPublicKey, undefined, TOKEN_2022_PROGRAM_ID)
      tokenProgram = 'Token-2022'
    } catch {
      // Last resort: use getParsedAccountInfo
      const parsedInfo = await connection.getParsedAccountInfo(mintPublicKey)
      const parsed = (parsedInfo?.value?.data as any)?.parsed?.info
      if (parsed) {
        tokenProgram = (parsedInfo?.value?.data as any)?.program || 'Unknown'
        mintInfo = {
          decimals: parsed.decimals ?? 0,
          supply: BigInt(parsed.supply ?? '0'),
          mintAuthority: parsed.mintAuthority ? { toBase58: () => parsed.mintAuthority } : null,
          freezeAuthority: parsed.freezeAuthority ? { toBase58: () => parsed.freezeAuthority } : null,
          isInitialized: parsed.isInitialized ?? true,
        }
      } else {
        throw new Error('Could not parse mint account')
      }
    }
  }
  console.log(`    Token Program: ${tokenProgram}`)
  const totalSupply = Number(mintInfo.supply)
  const decimals = mintInfo.decimals

  printData('Decimals', decimals)
  printData('Total Supply (raw)', totalSupply.toString())
  printData('Total Supply (formatted)', (totalSupply / Math.pow(10, decimals)).toLocaleString())
  printData('Mint Authority', mintInfo.mintAuthority?.toBase58() || null)
  printData('Mint Authority Revoked', mintInfo.mintAuthority === null)
  printData('Freeze Authority', mintInfo.freezeAuthority?.toBase58() || null)
  printData('Freeze Authority Revoked', mintInfo.freezeAuthority === null)
  printData('Is Initialized', mintInfo.isInitialized)

  // 2. Get Top Holders
  console.log('    --- Top Holders (RPC) ---')
  const largestAccounts = await connection.getTokenLargestAccounts(mintPublicKey)

  const holders = largestAccounts.value
    .filter(account => account.uiAmount !== null && account.uiAmount > 0)
    .slice(0, 10)
    .map(account => ({
      address: account.address.toBase58(),
      balance: account.uiAmount || 0,
      percentage: totalSupply > 0 ? (Number(account.amount) / totalSupply) * 100 : 0,
    }))

  const top10Pct = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0)
  printData('Holder Count (top accounts returned)', largestAccounts.value.length)
  printData('Top 10 Percentage', `${top10Pct.toFixed(2)}%`)

  for (const h of holders.slice(0, 5)) {
    console.log(`      ${h.address.slice(0, 8)}...: ${h.balance.toLocaleString()} (${h.percentage.toFixed(2)}%)`)
  }

  return {
    decimals,
    totalSupply: totalSupply / Math.pow(10, decimals),
    mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
    freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
    mintAuthorityRevoked: mintInfo.mintAuthority === null,
    freezeAuthorityRevoked: mintInfo.freezeAuthority === null,
    holders,
    top10Percentage: top10Pct,
  }
}

async function testMoralisAPI(): Promise<any> {
  const apiKey = process.env.MORALIS_API_KEY
  if (!apiKey) {
    console.log('    SKIPPED: No MORALIS_API_KEY configured')
    return null
  }

  const headers = { 'Accept': 'application/json', 'X-API-Key': apiKey }

  const [metadataRes, priceRes, pairsRes] = await Promise.allSettled([
    axios.get(`https://solana-gateway.moralis.io/token/mainnet/${TOKEN_MINT}/metadata`, { timeout: 10000, headers }),
    axios.get(`https://solana-gateway.moralis.io/token/mainnet/${TOKEN_MINT}/price`, { timeout: 10000, headers }),
    axios.get(`https://solana-gateway.moralis.io/token/mainnet/${TOKEN_MINT}/pairs`, { timeout: 10000, headers }),
  ])

  const metadata = metadataRes.status === 'fulfilled' ? metadataRes.value.data : null
  const price = priceRes.status === 'fulfilled' ? priceRes.value.data : null
  const pairsData = pairsRes.status === 'fulfilled' ? pairsRes.value.data : null

  if (metadata) {
    printData('Name', metadata.name)
    printData('Symbol', metadata.symbol)
    printData('Decimals', metadata.decimals)
    printData('Logo', metadata.logo)
    printData('Metaplex isMutable', metadata.metaplex?.isMutable)
    printData('Update Authority', metadata.metaplex?.updateAuthority)
  }

  if (price) {
    printData('USD Price', price.usdPrice)
    printData('24h Change', price.percentChange24h)
    printData('Exchange', price.exchangeName)
  }

  const pairs = Array.isArray(pairsData) ? pairsData : (pairsData?.pairs || [])
  printData('Pairs Found', pairs.length)

  return { metadata, price, pairs }
}

async function testHeliusDAS(): Promise<any> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) {
    console.log('    SKIPPED: No HELIUS_API_KEY configured')
    return null
  }

  const response = await axios.post(
    `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    {
      jsonrpc: '2.0',
      id: 'helius-das',
      method: 'getAsset',
      params: { id: TOKEN_MINT, displayOptions: { showFungible: true } },
    },
    { timeout: 15000 }
  )

  const asset = response.data?.result
  if (!asset) {
    console.log('    Helius DAS returned no result')
    return null
  }

  printData('Name', asset.content?.metadata?.name)
  printData('Symbol', asset.content?.metadata?.symbol)
  printData('Description', asset.content?.metadata?.description?.substring(0, 100))
  printData('Image', asset.content?.links?.image)
  printData('Mint Authority', asset.token_info?.mint_authority || null)
  printData('Freeze Authority', asset.token_info?.freeze_authority || null)
  printData('Decimals', asset.token_info?.decimals)
  printData('Supply', asset.token_info?.supply)
  printData('Price per Token', asset.token_info?.price_info?.price_per_token)
  printData('Is Mutable', asset.mutable)
  printData('Authorities', asset.authorities?.map((a: any) => `${a.address} [${a.scopes.join(',')}]`))

  return asset
}

async function testBirdeyeAPI(): Promise<any> {
  const apiKey = process.env.BIRDEYE_API_KEY
  if (!apiKey) {
    console.log('    SKIPPED: No BIRDEYE_API_KEY configured')
    return null
  }

  const response = await axios.get(
    `https://public-api.birdeye.so/defi/token_overview?address=${TOKEN_MINT}`,
    {
      timeout: 10000,
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
    }
  )

  if (!response.data?.success || !response.data?.data) {
    console.log('    Birdeye returned no data')
    return null
  }

  const data = response.data.data
  printData('Name', data.name)
  printData('Symbol', data.symbol)
  printData('Price', data.price)
  printData('Market Cap', data.mc)
  printData('Liquidity', data.liquidity)
  printData('Holders', data.holder)
  printData('24h Volume', data.v24hUSD)

  return data
}

async function testGmgnDirectAPI(): Promise<any> {
  try {
    const response = await axios.get(
      `https://gmgn.ai/defi/quotation/v1/tokens/sol/${TOKEN_MINT}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://gmgn.ai',
          'Referer': 'https://gmgn.ai/',
        },
      }
    )

    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data
      printData('Name', data.name)
      printData('Symbol', data.symbol)
      printData('Price', data.price)
      printData('Market Cap', data.market_cap)
      printData('Liquidity', data.liquidity)
      printData('Holder Count', data.holder_count)
      printData('Hot Level', data.hot_level)
      printData('Launchpad', data.launchpad)
      return data
    }
    console.log('    GMGN returned no data (likely blocked by Cloudflare)')
    return null
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.log('    GMGN API blocked by Cloudflare (expected)')
    } else {
      console.log(`    GMGN API error: ${error?.response?.status || error?.code || error?.message}`)
    }
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATED SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function testTokenMetadataService(): Promise<any> {
  const { TokenMetadataService } = await import('../src/lib/token-metadata')
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
  const service = new TokenMetadataService(connection)
  const metadata = await service.getTokenMetadata(TOKEN_MINT)

  console.log('    --- Token Metadata Service Results ---')
  printData('Name', metadata.name)
  printData('Symbol', metadata.symbol)
  printData('Decimals', metadata.decimals)
  printData('Description', metadata.description?.substring(0, 100))
  printData('Image', metadata.image)
  printData('Price USD', metadata.priceUsd)
  printData('Price SOL', metadata.priceSol)
  printData('Market Cap', metadata.marketCap)
  printData('FDV', metadata.fullyDilutedMarketCap)
  printData('Liquidity', metadata.liquidity)
  printData('Volume 24h', metadata.volume24h)
  printData('Price Change 24h', metadata.priceChange24h)
  printData('Total Supply', metadata.totalSupply)
  printData('Total Holders', metadata.totalHolders)
  printData('Top 10 Holders %', metadata.top10HoldersPercentage)
  printData('Pool Type', metadata.poolType)
  printData('Pool Address', metadata.poolAddress)
  printData('Mint Authority Revoked', metadata.mintAuthorityRevoked)
  printData('Freeze Authority Revoked', metadata.freezeAuthorityRevoked)
  printData('Is Mutable', metadata.isMutable)
  printData('Dev Wallet', metadata.devWallet)
  printData('Creator Address', metadata.creatorAddress)
  printData('Launch Timestamp', metadata.launchTimestamp)
  printData('Age (hours)', metadata.ageInHours)
  printData('Risk Level', metadata.riskLevel)
  printData('Website', metadata.website)
  printData('Twitter', metadata.twitter)
  printData('Telegram', metadata.telegram)
  printData('PumpFun Complete', metadata.pumpfunComplete)
  printData('PumpFun KOTH', metadata.pumpfunKingOfTheHill)
  printData('DEXScreener Paid', metadata.dexscreenerPaid)
  printData('Data Sources', metadata.dataSource)

  // Verify critical fields
  console.log('\n    --- Validation ---')
  const issues: string[] = []

  if (!metadata.name) issues.push('Name is empty')
  if (!metadata.symbol) issues.push('Symbol is empty')
  if (metadata.decimals === 0 && metadata.dataSource?.length && metadata.dataSource.length > 0) {
    // decimals=0 is actually unusual for most tokens but might be valid
    console.log('    [WARN] Decimals is 0 - verify if correct')
  }
  if (metadata.priceUsd === undefined || metadata.priceUsd === 0) issues.push('Price USD is missing/zero')
  if (metadata.marketCap === undefined || metadata.marketCap === 0) issues.push('Market Cap is missing/zero')
  if (!metadata.dataSource || metadata.dataSource.length === 0) issues.push('No data sources reported')
  if (metadata.launchTimestamp && metadata.launchTimestamp < 1000000000000) {
    issues.push(`Launch timestamp appears to be in seconds (${metadata.launchTimestamp}) - should be milliseconds`)
  }

  if (issues.length === 0) {
    console.log('    [OK] All critical fields validated')
  } else {
    for (const issue of issues) {
      console.log(`    [ISSUE] ${issue}`)
    }
  }

  return metadata
}

async function testTokenAnalysisService(): Promise<any> {
  const { TokenAnalysisService } = await import('../src/lib/token-analysis')
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
  const service = new TokenAnalysisService(connection)

  try {
    const result = await service.analyzeToken(TOKEN_MINT)

    console.log('    --- Token Analysis Service Results ---')
    printData('Name', result.name)
    printData('Symbol', result.symbol)
    printData('Decimals', result.decimals)
    printData('Description', result.description?.substring(0, 100))
    printData('Image', result.image)
    printData('Price USD', result.priceUsd)
    printData('Price SOL', result.priceSol)
    printData('Market Cap', result.marketCap)
    printData('FDV', result.fullyDilutedMarketCap)
    printData('Liquidity', result.liquidity)
    printData('Liquidity Ratio', result.liquidityRatio)
    printData('Volume 24h', result.volume24h)
    printData('Price Change 24h', result.priceChange24h)
    printData('Price Change 1h', result.priceChange1h)
    printData('Total Supply', result.totalSupply)
    printData('Total Holders', result.totalHolders)
    printData('Top 10 Holders %', result.top10HoldersPercentage)
    printData('Top Holders Count', result.topHolders?.length)
    printData('Pool Type', result.poolType)
    printData('Pool Address', result.poolAddress)
    printData('Mint Authority', result.mintAuthority)
    printData('Mint Authority Revoked', result.mintAuthorityRevoked)
    printData('Freeze Authority', result.freezeAuthority)
    printData('Freeze Authority Revoked', result.freezeAuthorityRevoked)
    printData('Update Authority', result.updateAuthority)
    printData('Is Mutable', result.isMutable)
    printData('Dev Wallet', result.devWallet)
    printData('Dev Holding %', result.devHoldingPercentage)
    printData('Dev Status', result.devStatus)
    printData('Creator Address', result.creatorAddress)
    printData('LP Burned', result.lpBurned)
    printData('LP Burned %', result.lpBurnedPercentage)
    printData('Launch Timestamp', result.launchTimestamp)
    printData('Launch Time', result.launchTime)
    printData('Age (hours)', result.ageInHours)
    printData('Launchpad', result.launchpad)
    printData('PumpFun Complete', result.pumpfunComplete)
    printData('PumpFun Progress', result.pumpfunProgress)
    printData('PumpFun KOTH', result.pumpfunKingOfTheHill)
    printData('DEXScreener Paid', result.dexscreenerPaid)
    printData('Risk Level', result.riskLevel)
    printData('Risk Score', result.riskScore)
    printData('Risk Factors', result.riskFactors)
    printData('Website', result.website)
    printData('Twitter', result.twitter)
    printData('Telegram', result.telegram)
    printData('Discord', result.discord)
    printData('Buy Pressure', result.buyPressure)
    printData('Net Flow 24h', result.netFlow24h)
    printData('Hot Level', result.hotLevel)
    printData('Data Sources', result.dataSources)
    printData('Fetch Timestamp', result.fetchTimestamp)

    // Generate signals
    const signals = service.generateSignals(result)
    if (signals.length > 0) {
      console.log('    --- Trading Signals ---')
      for (const signal of signals) {
        console.log(`      [${signal.strength.toUpperCase()}] ${signal.type}: ${signal.message}`)
      }
    }

    // Validate critical fields
    console.log('\n    --- Validation ---')
    const issues: string[] = []

    if (!result.name) issues.push('Name is empty')
    if (!result.symbol) issues.push('Symbol is empty')
    if (result.priceUsd === 0 && result.dataSources.length > 1) issues.push('Price USD is 0 despite multiple sources')
    if (result.marketCap === 0 && result.dataSources.length > 1) issues.push('Market Cap is 0 despite multiple sources')
    if (result.totalHolders === 0 && result.topHolders && result.topHolders.length > 0) {
      issues.push('totalHolders=0 but topHolders has data - inconsistent')
    }
    if (result.launchTimestamp && result.launchTimestamp < 1000000000000) {
      issues.push(`Launch timestamp might be in seconds: ${result.launchTimestamp}`)
    }
    if (result.ageInHours !== undefined && result.ageInHours < 0) {
      issues.push(`Age is negative: ${result.ageInHours}`)
    }
    if (result.riskScore > 100) {
      issues.push(`Risk score exceeds 100: ${result.riskScore}`)
    }
    if (result.top10HoldersPercentage > 100) {
      issues.push(`Top 10 holders percentage exceeds 100: ${result.top10HoldersPercentage}`)
    }

    if (issues.length === 0) {
      console.log('    [OK] All critical fields validated')
    } else {
      for (const issue of issues) {
        console.log(`    [ISSUE] ${issue}`)
      }
    }

    // Cleanup
    service.destroy()

    return result
  } catch (error) {
    // Cleanup on error too
    service.destroy()
    throw error
  }
}

async function testLegacyApiRequests(): Promise<any> {
  const { ApiRequests } = await import('../src/lib/api')
  const api = new ApiRequests()

  console.log('    --- PumpFun via ApiRequests ---')
  const pumpFunData = await api.pumpFunTokenInfo(TOKEN_MINT)
  if (pumpFunData) {
    printData('Name', pumpFunData.name)
    printData('Symbol', pumpFunData.symbol)
    printData('Mint', pumpFunData.mint)
  } else {
    console.log('    PumpFun via ApiRequests returned null')
  }

  console.log('    --- Moralis via ApiRequests ---')
  const moralisData = await api.moralisTokenInfo(TOKEN_MINT)
  if (moralisData) {
    printData('Name', moralisData.name)
    printData('Symbol', moralisData.symbol)
  } else {
    console.log('    Moralis via ApiRequests returned null (no API key or error)')
  }

  return { pumpFunData, moralisData }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(70))
  console.log('  TOKEN METADATA VERIFICATION')
  console.log(`  Token: ${TOKEN_MINT}`)
  console.log(`  Date: ${new Date().toISOString()}`)
  console.log('█'.repeat(70))

  // Run all individual API tests (non-RPC first to avoid rate limits)
  const dexScreener = await runTest('1. DexScreener API', testDexScreenerAPI)
  const pumpFun = await runTest('2. PumpFun API', testPumpFunAPI)
  const rugCheck = await runTest('3. RugCheck API', testRugCheckAPI)
  const jupiter = await runTest('4. Jupiter Price API', testJupiterPriceAPI)
  const moralis = await runTest('5. Moralis API', testMoralisAPI)
  const helius = await runTest('6. Helius DAS API', testHeliusDAS)
  const birdeye = await runTest('7. Birdeye API', testBirdeyeAPI)
  const gmgn = await runTest('8. GMGN Direct API', testGmgnDirectAPI)

  // Solana RPC test last (uses rate-limited public endpoint)
  console.log('\n  (Waiting 2s before Solana RPC to avoid rate limits...)')
  await new Promise(resolve => setTimeout(resolve, 2000))
  const solanaRpc = await runTest('9. Solana RPC On-Chain', testSolanaRPC)

  // Run aggregated service tests
  console.log('\n  (Waiting 2s before aggregated tests...)')
  await new Promise(resolve => setTimeout(resolve, 2000))
  const tokenMetadata = await runTest('10. TokenMetadataService (aggregated)', testTokenMetadataService)
  
  console.log('\n  (Waiting 2s between aggregated tests...)')
  await new Promise(resolve => setTimeout(resolve, 2000))
  const tokenAnalysis = await runTest('11. TokenAnalysisService (aggregated)', testTokenAnalysisService)
  const legacyApi = await runTest('12. ApiRequests (legacy)', testLegacyApiRequests)

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n' + '█'.repeat(70))
  console.log('  FINAL SUMMARY')
  console.log('█'.repeat(70))

  const passed = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const skipped = results.filter(r => r.success && r.data === null)

  console.log(`\n  Total Tests: ${results.length}`)
  console.log(`  Passed: ${passed.length}`)
  console.log(`  Failed: ${failed.length}`)
  console.log(`  Skipped (no API key): ${skipped.length}`)

  console.log('\n  Test Results:')
  for (const r of results) {
    const status = r.success ? (r.data === null ? 'SKIP' : 'PASS') : 'FAIL'
    const icon = status === 'PASS' ? '[OK]' : status === 'SKIP' ? '[--]' : '[XX]'
    console.log(`    ${icon} ${r.api} (${r.duration}ms)${r.error ? ` - ${r.error}` : ''}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSOLIDATED TOKEN METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n' + '█'.repeat(70))
  console.log('  ALL AVAILABLE METADATA FOR TOKEN')
  console.log(`  ${TOKEN_MINT}`)
  console.log('█'.repeat(70))

  // Build consolidated view from all sources
  const consolidated: Record<string, any> = {}

  // From DexScreener
  if (dexScreener?.bestPair) {
    const bp = dexScreener.bestPair
    consolidated.name = bp.baseToken?.name
    consolidated.symbol = bp.baseToken?.symbol
    consolidated.priceUsd = bp.priceUsd
    consolidated.priceSol = bp.priceNative
    consolidated.marketCap = bp.marketCap
    consolidated.fdv = bp.fdv
    consolidated.liquidity = bp.liquidity?.usd
    consolidated.volume24h = bp.volume?.h24
    consolidated.priceChange24h = bp.priceChange?.h24
    consolidated.priceChange1h = bp.priceChange?.h1
    consolidated.poolAddress = bp.pairAddress
    consolidated.poolType = bp.dexId
    consolidated.image = bp.info?.imageUrl
    consolidated.dexscreenerPaid = (bp.boosts?.active || 0) > 0
  }

  // From PumpFun
  if (pumpFun) {
    consolidated.name = consolidated.name || pumpFun.name
    consolidated.symbol = consolidated.symbol || pumpFun.symbol
    consolidated.description = pumpFun.description
    consolidated.image = pumpFun.image_uri || consolidated.image
    consolidated.devWallet = pumpFun.creator
    consolidated.createdTimestamp = pumpFun.created_timestamp
    consolidated.bondingComplete = pumpFun.complete
    consolidated.usdMarketCap = pumpFun.usd_market_cap
    consolidated.totalSupplyPumpFun = pumpFun.total_supply
    consolidated.website = pumpFun.website || consolidated.website
    consolidated.twitter = pumpFun.twitter || consolidated.twitter
    consolidated.telegram = pumpFun.telegram || consolidated.telegram
    consolidated.kingOfTheHill = !!pumpFun.king_of_the_hill_timestamp
    consolidated.bondingCurve = pumpFun.bonding_curve
  }

  // From RugCheck
  if (rugCheck) {
    consolidated.rugCheckScore = rugCheck.score
    consolidated.rugCheckRisks = rugCheck.risks?.map((r: any) => r.description)
    consolidated.mintAuthorityRC = rugCheck.mintAuthority
    consolidated.freezeAuthorityRC = rugCheck.freezeAuthority
  }

  // From Jupiter
  if (jupiter) {
    consolidated.jupiterPrice = jupiter.price
  }

  // From Solana RPC
  if (solanaRpc) {
    consolidated.decimals = solanaRpc.decimals
    consolidated.totalSupply = solanaRpc.totalSupply
    consolidated.mintAuthority = solanaRpc.mintAuthority
    consolidated.freezeAuthority = solanaRpc.freezeAuthority
    consolidated.mintAuthorityRevoked = solanaRpc.mintAuthorityRevoked
    consolidated.freezeAuthorityRevoked = solanaRpc.freezeAuthorityRevoked
    consolidated.top10HoldersPercentage = solanaRpc.top10Percentage
    consolidated.topHoldersCount = solanaRpc.holders.length
  }

  // From Aggregated Services
  if (tokenAnalysis) {
    consolidated.riskLevel = tokenAnalysis.riskLevel
    consolidated.riskScore = tokenAnalysis.riskScore
    consolidated.riskFactors = tokenAnalysis.riskFactors
    consolidated.dataSources = tokenAnalysis.dataSources
    consolidated.ageInHours = tokenAnalysis.ageInHours
    consolidated.lpBurned = tokenAnalysis.lpBurned
    consolidated.isMutable = tokenAnalysis.isMutable
  } else if (tokenMetadata) {
    consolidated.riskLevel = tokenMetadata.riskLevel
    consolidated.dataSources = tokenMetadata.dataSource
    consolidated.ageInHours = tokenMetadata.ageInHours
  }

  // Print consolidated
  for (const [key, value] of Object.entries(consolidated)) {
    if (value !== undefined && value !== null && value !== '') {
      console.log(`  ${key}: ${JSON.stringify(value)}`)
    }
  }

  console.log('\n' + '█'.repeat(70))
  console.log('  TEST COMPLETE')
  console.log('█'.repeat(70) + '\n')

  // Exit with proper code
  if (failed.length > 0) {
    // Check if failures are only due to missing API keys
    const realFailures = failed.filter(f => !f.error?.includes('SKIPPED'))
    if (realFailures.length > 0) {
      process.exit(1)
    }
  }
  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
