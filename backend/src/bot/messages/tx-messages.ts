import { FormatNumbers } from '../../lib/format-numbers'
import { NativeParserInterface, TransferParserInterface } from '../../types/general-interfaces'
import { TokenMetadata } from '../../lib/token-metadata'
import { TokenAnalysisResult } from '../../lib/token-analysis'

export class TxMessages {
  constructor() {}

  /**
   * Format number with appropriate suffix (K, M, B)
   */
  private static formatNum(num: number | undefined): string {
    if (num === undefined || num === null) return 'N/A'
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  /**
   * Get risk emoji based on level
   */
  private static getRiskEmoji(level: string | undefined): string {
    const riskEmoji: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    }
    return riskEmoji[level || 'medium'] || '⚪'
  }

  /**
   * Format boolean as emoji
   */
  private static boolEmoji(val: boolean | undefined): string {
    if (val === undefined) return '❓'
    return val ? '✅' : '❌'
  }

  static defiTxMessage(
    message: NativeParserInterface,
    tokenMarketCap?: string | undefined,
    walletName?: string,
  ): string {
    const owner = message.owner
    const amountOut = message.tokenTransfers.tokenAmountOut
    const tokenOut = message.tokenTransfers.tokenOutSymbol
    const amountIn = message.tokenTransfers.tokenAmountIn
    const tokenIn = message.tokenTransfers.tokenInSymbol

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

    const solscanAddressUrl = `https://solscan.io/account/${owner}`
    const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
    const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
    const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
    const tokenInMint = message.tokenTransfers.tokenInMint
    const tokenOutMint = message.tokenTransfers.tokenOutMint

    const solPrice = Number(message.solPrice)

    const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
    const fixedUsdAmount = FormatNumbers.formatPrice(amountInUsd)

    const tokenMintToTrack = message.type === 'buy' ? tokenInMint : tokenOutMint

    const gmgnLink = `<a href="https://gmgn.ai/sol/token/kxPdcLKf_${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`
    const bullxLink = `<a href="https://neo.bullx.io/terminal?chainId=1399811149&address=${tokenMintToTrack}">BLX</a>`
    const axiomLink = `<a href='https://axiom.trade/t/${tokenMintToTrack}/@handi'>AXI</a>`

    const platformName = message.platform === 'pumpfun_amm' ? 'PUMPSWAP' : message.platform!.toUpperCase()

    const marketCapText = tokenMarketCap
      ? `🔗 ${message.type === 'buy' ? `<b><a href="${solscanTokenInUrl}">#${tokenIn}</a></b>` : `<b><a href="${solscanTokenOutUrl}">#${tokenOut}</a></b>`} | <b>MC: $${tokenMarketCap}</b> | ${gmgnLink} • ${beLink} • ${dsLink} • ${phLink} • ${bullxLink} • ${axiomLink}`
      : ''

    const messageText = `
${message.type === 'buy' ? '🟢' : '🔴'} <b><a href="${solscanTxUrl}">${message.type?.toUpperCase()} ${message.type === 'buy' ? `${tokenIn}` : `${tokenOut}`}</a></b> on ${platformName}
<b>💎 ${walletName !== '' ? walletName : truncatedOwner}</b>\n
💎 <b><a href="${solscanAddressUrl}">${walletName !== '' ? walletName : truncatedOwner}</a></b> swapped <b>${amountOut}</b>${message.type === 'sell' ? ` ($${fixedUsdAmount})` : ''} <b><a href="${solscanTokenOutUrl}">${tokenOut}</a></b> for <b>${amountIn}</b>${message.type === 'buy' ? ` ($${fixedUsdAmount})` : ''} <b><a href="${solscanTokenInUrl}">${tokenIn}</a></b> @$${message.swappedTokenPrice?.toFixed(7)}

${Number(message.currenHoldingPercentage) > 0 ? '📈' : '📉'} <b>HOLDS: ${message.currentHoldingPrice} (${message.currenHoldingPercentage}%)</b>
${marketCapText}
<code>${tokenMintToTrack}</code>
`
    return messageText
  }

  static tokenMintedMessage(message: NativeParserInterface, walletName?: string): string {
    const owner = message.owner
    const amountOut = message.tokenTransfers.tokenAmountOut
    const tokenOut = message.tokenTransfers.tokenOutSymbol
    const amountIn = message.tokenTransfers.tokenAmountIn
    const tokenIn = message.tokenTransfers.tokenInSymbol

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

    const solscanAddressUrl = `https://solscan.io/account/${owner}`
    const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
    const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
    const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
    const tokenInMint = message.tokenTransfers.tokenInMint

    const solPrice = Number(message.solPrice)

    const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
    const fixedUsdAmount = amountInUsd < 0.01 ? amountInUsd.toFixed(6) : amountInUsd.toFixed(2)

    const tokenMintToTrack = tokenInMint

    const gmgnLink = `<a href="https://gmgn.ai/sol/token/${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`

    const messageText = `
⭐🔁 <a href="${solscanTxUrl}">SWAP</a> on PUMP FUN
<b>💎 ${walletName !== '' ? walletName : truncatedOwner}</b>\n
💎 <a href="${solscanAddressUrl}">${walletName !== '' ? walletName : truncatedOwner}</a> minted and swapped <b>${amountOut}</b><a href="${solscanTokenOutUrl}">${tokenOut}</a> for <b>${amountIn}</b>($${fixedUsdAmount}) <a href="${solscanTokenInUrl}">${tokenIn}</a> 

<b>💣 ${tokenIn}</b>| ${gmgnLink} • ${beLink} • ${dsLink} • ${phLink}

<code>${tokenMintToTrack}</code>   
`
    return messageText
  }

  static solTxMessage(message: TransferParserInterface, walletName?: string) {
    const { fromAddress, toAddress, solPrice, solAmount, lamportsAmount, signature, owner } = message

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

    const truncatedFromAddr = `${fromAddress.slice(0, 4)}...${fromAddress.slice(-4)}`
    const truncatedToAddr = `${toAddress.slice(0, 4)}...${toAddress.slice(-4)}`

    const sender = owner === fromAddress ? walletName || truncatedFromAddr : truncatedFromAddr
    const recipient = owner === toAddress ? walletName || truncatedToAddr : truncatedToAddr

    const amountInUsd = Number(solAmount) * Number(message.solPrice)
    const fixedUsdAmount = FormatNumbers.formatPrice(amountInUsd)

    const solscanTxUrl = `https://solscan.io/tx/${signature}`
    const solscanSenderUrl = `https://solscan.io/account/${fromAddress}`
    const solscanRecipientUrl = `https://solscan.io/account/${toAddress}`

    const messageText = `
🔁 <b><a href="${solscanTxUrl}">TRANSFER</a></b>
<b>💎 ${walletName !== '' ? walletName : truncatedOwner}</b>

<b><a href="${solscanSenderUrl}">${sender}</a></b> transferred <b>${solAmount.toFixed(3)} SOL ($${fixedUsdAmount})</b> to <b><a href="${solscanRecipientUrl}">${recipient}</a></b>

<code>${owner}</code>
`
    return messageText
  }

  /**
   * Enhanced DeFi transaction message with comprehensive token metadata
   */
  static enhancedDefiTxMessage(
    message: NativeParserInterface,
    metadata: TokenMetadata,
    walletName?: string,
  ): string {
    const owner = message.owner
    const amountOut = message.tokenTransfers.tokenAmountOut
    const tokenOut = message.tokenTransfers.tokenOutSymbol
    const amountIn = message.tokenTransfers.tokenAmountIn
    const tokenIn = message.tokenTransfers.tokenInSymbol

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`
    const displayName = walletName && walletName !== '' ? walletName : truncatedOwner

    const solscanAddressUrl = `https://solscan.io/account/${owner}`
    const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
    const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
    const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
    const tokenInMint = message.tokenTransfers.tokenInMint
    const tokenOutMint = message.tokenTransfers.tokenOutMint

    const solPrice = Number(message.solPrice)
    const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
    const fixedUsdAmount = FormatNumbers.formatPrice(amountInUsd)

    const tokenMintToTrack = message.type === 'buy' ? tokenInMint : tokenOutMint
    const tokenSymbol = message.type === 'buy' ? tokenIn : tokenOut

    // Chart links
    const gmgnLink = `<a href="https://gmgn.ai/sol/token/kxPdcLKf_${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`
    const bullxLink = `<a href="https://neo.bullx.io/terminal?chainId=1399811149&address=${tokenMintToTrack}">BLX</a>`
    const axiomLink = `<a href='https://axiom.trade/t/${tokenMintToTrack}/@handi'>AXI</a>`

    const platformName = message.platform === 'pumpfun_amm' ? 'PUMPSWAP' : message.platform!.toUpperCase()

    // Build social links
    const socials: string[] = []
    if (metadata.website) socials.push(`<a href="${metadata.website}">🌐</a>`)
    if (metadata.twitter) socials.push(`<a href="${metadata.twitter}">𝕏</a>`)
    if (metadata.telegram) socials.push(`<a href="${metadata.telegram}">📱</a>`)
    const socialLinks = socials.length > 0 ? socials.join(' ') : ''

    // Security indicators
    const securityFlags: string[] = []
    if (metadata.mintAuthorityRevoked === true) securityFlags.push('✅MR')
    else if (metadata.mintAuthorityRevoked === false) securityFlags.push('❌MR')
    else securityFlags.push('❓MR')
    
    if (metadata.freezeAuthorityRevoked === true) securityFlags.push('✅FR')
    else if (metadata.freezeAuthorityRevoked === false) securityFlags.push('❌FR')
    else securityFlags.push('❓FR')
    
    if (metadata.lpBurned) securityFlags.push('🔥LP')
    if (metadata.dexscreenerPaid) securityFlags.push('💎DS')

    // Dev wallet info
    let devInfo = ''
    if (metadata.devWallet) {
      const shortDev = `${metadata.devWallet.slice(0, 4)}...${metadata.devWallet.slice(-4)}`
      const devHolding = metadata.devWalletHoldingPercentage 
        ? ` (${metadata.devWalletHoldingPercentage.toFixed(2)}%)`
        : ''
      devInfo = `\n👨‍💻 <b>Dev:</b> <code>${shortDev}</code>${devHolding}`
    }

    // Age info - calculate from launchTimestamp if ageInHours not available
    let ageText = 'N/A'
    if (metadata.ageInHours !== undefined && metadata.ageInHours > 0) {
      if (metadata.ageInHours < 1) {
        ageText = `${Math.round(metadata.ageInHours * 60)}m`
      } else if (metadata.ageInHours < 24) {
        ageText = `${metadata.ageInHours.toFixed(1)}h`
      } else {
        ageText = `${Math.round(metadata.ageInHours / 24)}d`
      }
    } else if (metadata.launchTimestamp) {
      const ageMs = Date.now() - metadata.launchTimestamp
      const ageHours = ageMs / (1000 * 60 * 60)
      if (ageHours < 1) {
        ageText = `${Math.round(ageHours * 60)}m`
      } else if (ageHours < 24) {
        ageText = `${ageHours.toFixed(1)}h`
      } else {
        ageText = `${Math.round(ageHours / 24)}d`
      }
    }

    // PumpFun specific info
    let pumpInfo = ''
    if (metadata.pumpfunComplete !== undefined) {
      pumpInfo = metadata.pumpfunComplete ? ' | 🎓 Graduated' : ' | ⏳ Bonding'
    }
    if (metadata.pumpfunKingOfTheHill) {
      pumpInfo += ' | 👑 KoTH'
    }

    // Holders info - format properly
    const holdersText = metadata.totalHolders 
      ? metadata.totalHolders.toLocaleString() 
      : (metadata.topHolders && metadata.topHolders.length > 0 ? `${metadata.topHolders.length}+` : 'N/A')
    
    const top10Text = metadata.top10HoldersPercentage !== undefined && metadata.top10HoldersPercentage > 0
      ? `${metadata.top10HoldersPercentage.toFixed(1)}%`
      : 'N/A'

    // Holdings info - handle empty strings
    const holdingPrice = message.currentHoldingPrice && message.currentHoldingPrice.trim() !== '' 
      ? message.currentHoldingPrice 
      : null
    const holdingPercentage = message.currenHoldingPercentage && message.currenHoldingPercentage.trim() !== ''
      ? message.currenHoldingPercentage
      : null
    
    const hasHoldings = holdingPrice || holdingPercentage
    const holdingsLine = hasHoldings 
      ? `\n${Number(holdingPercentage) > 0 ? '📈' : '📉'} <b>HOLDS:</b> ${holdingPrice || 'N/A'} (${holdingPercentage || '0'}%)\n`
      : ''

    // Price info
    const priceText = message.swappedTokenPrice && message.swappedTokenPrice > 0
      ? ` @$${message.swappedTokenPrice < 0.00001 ? message.swappedTokenPrice.toExponential(2) : message.swappedTokenPrice.toFixed(8)}`
      : ''

    // 24h change
    const changeText = metadata.priceChange24h !== undefined
      ? ` | <b>24h:</b> ${metadata.priceChange24h >= 0 ? '+' : ''}${metadata.priceChange24h.toFixed(1)}%`
      : ''

    const messageText = `
${message.type === 'buy' ? '🟢' : '🔴'} <b><a href="${solscanTxUrl}">${message.type?.toUpperCase()} ${tokenSymbol}</a></b> on ${platformName}
<b>💎 ${displayName}</b>

💎 <b><a href="${solscanAddressUrl}">${displayName}</a></b> swapped <b>${amountOut}</b>${message.type === 'sell' ? ` ($${fixedUsdAmount})` : ''} <b><a href="${solscanTokenOutUrl}">${tokenOut}</a></b> for <b>${amountIn}</b>${message.type === 'buy' ? ` ($${fixedUsdAmount})` : ''} <b><a href="${solscanTokenInUrl}">${tokenIn}</a></b>${priceText}

💰 <b>MC:</b> $${this.formatNum(metadata.marketCap)} | <b>Liq:</b> $${this.formatNum(metadata.liquidity)}${changeText}
📊 <b>Vol:</b> $${this.formatNum(metadata.volume24h)} | <b>Holders:</b> ${holdersText} | <b>Top10:</b> ${top10Text}
🔒 ${securityFlags.join(' ')} | ${this.getRiskEmoji(metadata.riskLevel)} ${(metadata.riskLevel || 'UNKNOWN').toUpperCase()}
⏱️ <b>Age:</b> ${ageText}${pumpInfo}${devInfo}
${holdingsLine}
🔗 <b><a href="${message.type === 'buy' ? solscanTokenInUrl : solscanTokenOutUrl}">#${tokenSymbol}</a></b> ${socialLinks}
${gmgnLink} • ${beLink} • ${dsLink} • ${phLink} • ${bullxLink} • ${axiomLink}

<code>${tokenMintToTrack}</code>
`
    return messageText
  }

  /**
   * Detailed token info message (for /info command or button)
   */
  static detailedTokenInfoMessage(metadata: TokenMetadata): string {
    const formatNum = this.formatNum
    const boolEmoji = this.boolEmoji
    const getRiskEmoji = this.getRiskEmoji

    // Social links
    const socials: string[] = []
    if (metadata.website) socials.push(`<a href="${metadata.website}">Website</a>`)
    if (metadata.twitter) socials.push(`<a href="${metadata.twitter}">Twitter</a>`)
    if (metadata.telegram) socials.push(`<a href="${metadata.telegram}">Telegram</a>`)
    if (metadata.discord) socials.push(`<a href="${metadata.discord}">Discord</a>`)

    // Age calculation
    let ageText = 'N/A'
    if (metadata.ageInHours !== undefined) {
      if (metadata.ageInHours < 1) {
        ageText = `${Math.round(metadata.ageInHours * 60)} minutes`
      } else if (metadata.ageInHours < 24) {
        ageText = `${metadata.ageInHours.toFixed(1)} hours`
      } else {
        ageText = `${Math.round(metadata.ageInHours / 24)} days`
      }
    }

    // Top holders list
    let topHoldersList = ''
    if (metadata.topHolders && metadata.topHolders.length > 0) {
      const holderLines = metadata.topHolders.slice(0, 5).map((h, i) => {
        const addr = `${h.address.slice(0, 4)}...${h.address.slice(-4)}`
        const tags: string[] = []
        if (h.isDevWallet) tags.push('👨‍💻')
        if (h.isLpPair) tags.push('🏊')
        const tagStr = tags.length > 0 ? ` ${tags.join('')}` : ''
        return `   ${i + 1}. <code>${addr}</code> - ${h.percentage.toFixed(2)}%${tagStr}`
      })
      topHoldersList = `\n\n<b>🏆 Top Holders:</b>\n${holderLines.join('\n')}`
    }

    // Chart links
    const gmgnLink = `<a href="https://gmgn.ai/sol/token/kxPdcLKf_${metadata.mint}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${metadata.mint}?chain=solana">Birdeye</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${metadata.mint}">DexScreener</a>`

    const messageText = `
<b>🪙 ${metadata.name || 'Unknown'} (${metadata.symbol || 'N/A'})</b>
${metadata.description ? `\n<i>${metadata.description.slice(0, 150)}${metadata.description.length > 150 ? '...' : ''}</i>\n` : ''}
<b>━━━━━━ 💰 Market Data ━━━━━━</b>
├ <b>Price:</b> $${metadata.priceUsd?.toFixed(10) || 'N/A'}
├ <b>Market Cap:</b> $${formatNum(metadata.marketCap)}
├ <b>FDV:</b> $${formatNum(metadata.fullyDilutedMarketCap)}
├ <b>Liquidity:</b> $${formatNum(metadata.liquidity)}
├ <b>24h Volume:</b> $${formatNum(metadata.volume24h)}
├ <b>24h Change:</b> ${metadata.priceChange24h?.toFixed(2) || 'N/A'}%
└ <b>1h Change:</b> ${metadata.priceChange1h?.toFixed(2) || 'N/A'}%

<b>━━━━━━ 👥 Holders ━━━━━━</b>
├ <b>Total Holders:</b> ${metadata.totalHolders?.toLocaleString() || 'N/A'}
├ <b>Top 10 Hold:</b> ${metadata.top10HoldersPercentage?.toFixed(2) || 'N/A'}%
└ <b>Dev Holds:</b> ${metadata.devWalletHoldingPercentage?.toFixed(2) || 'N/A'}%

<b>━━━━━━ 🔒 Security ━━━━━━</b>
├ <b>Mint Authority:</b> ${boolEmoji(metadata.mintAuthorityRevoked)} ${metadata.mintAuthorityRevoked ? 'Revoked' : 'Active'}
├ <b>Freeze Authority:</b> ${boolEmoji(metadata.freezeAuthorityRevoked)} ${metadata.freezeAuthorityRevoked ? 'Revoked' : 'Active'}
├ <b>Metadata:</b> ${boolEmoji(!metadata.isMutable)} ${metadata.isMutable ? 'Mutable' : 'Immutable'}
├ <b>LP Status:</b> ${boolEmoji(metadata.lpBurned)} ${metadata.lpBurned ? `Burned (${metadata.lpBurnedPercentage?.toFixed(1) || '?'}%)` : 'Not Burned'}
└ <b>Risk Level:</b> ${getRiskEmoji(metadata.riskLevel)} ${(metadata.riskLevel || 'Unknown').toUpperCase()}

<b>━━━━━━ 📊 Info ━━━━━━</b>
├ <b>Pool:</b> ${metadata.poolType || 'N/A'}
├ <b>Age:</b> ${ageText}
├ <b>Launch:</b> ${metadata.launchTime?.toLocaleString() || 'N/A'}
├ <b>DEX Paid:</b> ${boolEmoji(metadata.dexscreenerPaid)}
${metadata.pumpfunComplete !== undefined ? `├ <b>Bonding:</b> ${metadata.pumpfunComplete ? '✅ Complete' : '⏳ Active'}\n` : ''}${metadata.pumpfunKingOfTheHill ? `├ <b>👑 King of the Hill</b>\n` : ''}└ <b>Supply:</b> ${metadata.totalSupply?.toLocaleString() || 'N/A'}
${metadata.devWallet ? `\n<b>👨‍💻 Dev Wallet:</b>\n<code>${metadata.devWallet}</code>` : ''}${topHoldersList}

<b>━━━━━━ 🔗 Links ━━━━━━</b>
${socials.length > 0 ? socials.join(' • ') + '\n' : ''}${gmgnLink} • ${beLink} • ${dsLink}

<b>📋 Contract:</b>
<code>${metadata.mint}</code>

<i>Data from: ${metadata.dataSource?.join(', ') || 'N/A'}</i>
`
    return messageText
  }

  /**
   * Generate a visual progress bar with colored squares
   */
  private static generateProgressBar(percentage: number, total: number = 10): string {
    const filled = Math.round((percentage / 100) * total)
    const empty = total - filled
    return '🟩'.repeat(Math.max(0, filled)) + '⬜️'.repeat(Math.max(0, empty))
  }

  /**
   * Get wallet type emoji based on balance or known tags
   */
  private static getWalletEmoji(tags?: string[]): string {
    if (!tags || tags.length === 0) return ''
    if (tags.includes('whale') || tags.includes('smart_money')) return '🐋'
    if (tags.includes('degen')) return '🎰'
    if (tags.includes('sniper')) return '🎯'
    return ''
  }

  /**
   * Get holder size emoji based on percentage
   */
  private static getHolderEmoji(percentage: number, isPool: boolean = false): string {
    if (isPool) return '🐳 Pool'
    if (percentage >= 5) return '🐋'
    if (percentage >= 2) return '🦈'
    if (percentage >= 1) return '🐠'
    return '🦐'
  }

  /**
   * Format age as human readable string
   */
  private static formatAge(ageInHours?: number, launchTimestamp?: number): string {
    let hours = ageInHours
    
    // Try to calculate from timestamp if hours not provided
    if ((!hours || hours <= 0) && launchTimestamp && launchTimestamp > 0) {
      // Handle both milliseconds and seconds timestamps
      const timestamp = launchTimestamp > 1e12 ? launchTimestamp : launchTimestamp * 1000
      hours = (Date.now() - timestamp) / (1000 * 60 * 60)
    }
    
    if (!hours || hours <= 0 || !isFinite(hours)) return 'N/A'
    
    if (hours < 1) {
      const mins = Math.round(hours * 60)
      return mins > 0 ? `${mins} mins ago` : 'Just now'
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs ago`
    } else if (hours < 24 * 7) {
      return `${Math.round(hours / 24)} days ago`
    } else if (hours < 24 * 30) {
      return `${Math.round(hours / (24 * 7))} weeks ago`
    } else {
      return `${Math.round(hours / (24 * 30))} months ago`
    }
  }

  /**
   * Enhanced DeFi transaction message with comprehensive token analysis
   * New UX format with visual progress bars and detailed metrics
   */
  static enhancedDefiTxMessageV2(
    message: NativeParserInterface,
    analysis: TokenAnalysisResult,
    walletName?: string,
  ): string {
    const owner = message.owner
    const amountOut = message.tokenTransfers.tokenAmountOut
    const tokenOut = message.tokenTransfers.tokenOutSymbol
    const amountIn = message.tokenTransfers.tokenAmountIn
    const tokenIn = message.tokenTransfers.tokenInSymbol

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`
    const displayName = walletName && walletName !== '' ? walletName : truncatedOwner

    const solscanAddressUrl = `https://solscan.io/account/${owner}`
    const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
    const tokenInMint = message.tokenTransfers.tokenInMint
    const tokenOutMint = message.tokenTransfers.tokenOutMint

    const solPrice = Number(message.solPrice)
    const tokenMintToTrack = message.type === 'buy' ? tokenInMint : tokenOutMint
    
    // Get token symbol - prefer from message, fallback to analysis data
    const messageSymbol = message.type === 'buy' ? tokenIn : tokenOut
    const tokenSymbol = (messageSymbol && messageSymbol.trim() !== '') 
      ? messageSymbol 
      : (analysis.symbol || 'TOKEN')
    
    // Get token name - prefer from analysis, fallback to symbol
    const tokenName = (analysis.name && analysis.name.trim() !== '') 
      ? analysis.name 
      : tokenSymbol

    // Calculate swap amounts - handle potential NaN values and 0 amounts
    const swapAmountSol = message.type === 'buy' ? amountOut : amountIn
    const swapAmountToken = message.type === 'buy' ? amountIn : amountOut
    const parsedSolAmount = Number(swapAmountSol)
    const parsedTokenAmount = Number(swapAmountToken)
    
    // If SOL amount is 0 but we have token price and token amount, calculate SOL from those
    let effectiveSolAmount = parsedSolAmount
    const tokenPrice = message.swappedTokenPrice || analysis.priceUsd || 0
    if ((effectiveSolAmount === 0 || isNaN(effectiveSolAmount)) && tokenPrice > 0 && parsedTokenAmount > 0 && solPrice > 0) {
      effectiveSolAmount = (parsedTokenAmount * tokenPrice) / solPrice
    }
    
    const swapAmountUsd = effectiveSolAmount * solPrice

    // Format token amount - handle NaN
    const formattedTokenAmount = !isNaN(parsedTokenAmount) && parsedTokenAmount > 0
      ? FormatNumbers.formatTokenAmount(parsedTokenAmount)
      : swapAmountToken || '0'

    // Format SOL amount - show calculated value if original was 0
    const formattedSolAmount = effectiveSolAmount > 0 
      ? effectiveSolAmount.toFixed(2)
      : swapAmountSol || '0.00'

    // Format price
    const priceFormatted = tokenPrice < 0.00001 
      ? tokenPrice.toExponential(3) 
      : tokenPrice < 0.01 
        ? tokenPrice.toFixed(7)
        : tokenPrice.toFixed(4)

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER: Token name and contract
    // ═══════════════════════════════════════════════════════════════════════════
    // Show symbol prominently, name secondary
    const headerName = tokenName !== tokenSymbol ? `${tokenName} — ` : ''
    const header = `${headerName}<b>$${tokenSymbol}</b>
<code>${tokenMintToTrack}</code>`

    // ═══════════════════════════════════════════════════════════════════════════
    // RISK BAR: Visual risk indicator
    // ═══════════════════════════════════════════════════════════════════════════
    const riskPercentage = analysis.riskScore || 50
    const riskBar = this.generateProgressBar(100 - riskPercentage) // Invert: higher safety = more green
    const riskSection = `
<b>Overall Risk : ${riskPercentage}%</b>
${riskBar}`

    // ═══════════════════════════════════════════════════════════════════════════
    // SWAP INFO: Transaction details
    // ═══════════════════════════════════════════════════════════════════════════
    const walletEmoji = this.getWalletEmoji(analysis.topHolders?.find(h => h.address.includes(owner.slice(0, 4)))?.tags)
    const walletLabel = walletEmoji ? `${displayName} ${walletEmoji}` : displayName
    
    const swapEmoji = message.type === 'buy' ? '🔹' : '🔸'
    const swapAction = message.type === 'buy' ? 'swapped' : 'sold'
    
    const swapSection = `
${swapEmoji}<b><a href="${solscanTxUrl}">${walletLabel}</a></b> ${swapAction} <b>${formattedSolAmount} SOL</b> for <b>${formattedTokenAmount}</b> ($${FormatNumbers.formatPrice(swapAmountUsd)}) <b>$${tokenSymbol}</b> @$${priceFormatted}
├ Wallet: <a href="${solscanAddressUrl}">${displayName}</a>`

    // ═══════════════════════════════════════════════════════════════════════════
    // MARKET DATA: MC, Age, Dev, Liquidity, Socials
    // ═══════════════════════════════════════════════════════════════════════════
    const ageText = this.formatAge(analysis.ageInHours, analysis.launchTimestamp)
    
    // Dev info
    let devLine = ''
    if (analysis.devWallet) {
      const shortDev = `${analysis.devWallet.slice(0, 4)}…${analysis.devWallet.slice(-4)}`
      const devPct = analysis.devHoldingPercentage !== undefined 
        ? `(${analysis.devHoldingPercentage.toFixed(1)}%)` 
        : ''
      devLine = `\n🧑‍💻 Dev: ${shortDev} ${devPct}`
    }

    // Social links
    const socialLinks: string[] = []
    if (analysis.twitter) socialLinks.push(`<a href="${analysis.twitter}">𝕏</a>`)
    if (analysis.website) socialLinks.push(`<a href="${analysis.website}">Web</a>`)
    if (analysis.telegram) socialLinks.push(`<a href="${analysis.telegram}">TG</a>`)
    const socialsLine = socialLinks.length > 0 
      ? `\n🔗 Socials\n└ ${socialLinks.join(' • ')}` 
      : ''

    // Format liquidity - show N/A if truly 0 (no data) vs actual low liquidity
    const liquidityText = analysis.liquidity > 0 
      ? `$${this.formatNum(analysis.liquidity)}`
      : (analysis.pumpfunComplete === false ? 'Bonding Curve' : 'N/A')

    const marketSection = `
💰 MarketCap: <b>$${this.formatNum(analysis.marketCap)}</b>
🕓 Age: <b>${ageText}</b>${devLine}
💧 Liquidity: <b>${liquidityText}</b>${socialsLine}`

    // ═══════════════════════════════════════════════════════════════════════════
    // VOLUME TABLE: 5M, 1H, 24H
    // ═══════════════════════════════════════════════════════════════════════════
    const vol5m = analysis.volume24h ? (analysis.volume24h * 0.05) : 0 // Estimate
    const vol1h = analysis.volume24h ? (analysis.volume24h * 0.2) : 0 // Estimate
    const vol24h = analysis.volume24h || 0
    
    const change5m = analysis.priceChange1h ? (analysis.priceChange1h * 0.3) : 0 // Estimate
    const change1h = analysis.priceChange1h || 0
    const change24h = analysis.priceChange24h || 0

    const formatChange = (val: number) => {
      const sign = val >= 0 ? '+' : ''
      return `${sign}${val.toFixed(1)}%`
    }

    const volumeTable = `
<code>              5M          1H         24H</code>
<code>Vol:    $${this.formatNum(vol5m).padStart(6)}  $${this.formatNum(vol1h).padStart(6)}  $${this.formatNum(vol24h).padStart(6)}</code>
<code>Ch:     ${formatChange(change5m).padStart(7)}  ${formatChange(change1h).padStart(7)}  ${formatChange(change24h).padStart(7)}</code>`

    // ═══════════════════════════════════════════════════════════════════════════
    // BONDING CURVE (for PumpFun tokens)
    // ═══════════════════════════════════════════════════════════════════════════
    // Detect PumpFun token by mint address ending with "pump" or platform info
    const isPumpFunToken = tokenMintToTrack.toLowerCase().endsWith('pump') || 
                           analysis.launchpad === 'pumpfun' ||
                           analysis.poolType === 'pumpfun' ||
                           message.platform === 'pumpfun' ||
                           message.platform === 'pumpfun_amm'
    
    let bondingSection = ''
    // FIXED: Check for undefined/null explicitly - 0 is a valid progress value
    const bondingProgress = analysis.pumpfunProgress
    const hasBondingProgress = bondingProgress !== undefined && bondingProgress !== null
    if (hasBondingProgress && !analysis.pumpfunComplete) {
      const bondingBar = this.generateProgressBar(bondingProgress)
      bondingSection = `
<b>Bonding Curve Fill: ${bondingProgress.toFixed(1)}%</b>
${bondingBar}`
    } else if (analysis.pumpfunComplete === true) {
      bondingSection = `
🎓 <b>Bonding Curve: GRADUATED</b>`
    } else if (isPumpFunToken && analysis.pumpfunComplete === undefined) {
      // PumpFun token but no bonding data - likely graduated or data unavailable
      bondingSection = `
⏳ <b>Bonding Curve: Checking...</b>`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY FLAGS: LP, Mint, Freeze, Mutable
    // ═══════════════════════════════════════════════════════════════════════════
    // LP status - context-aware for bonding curve tokens
    let lpStatus: string
    if (analysis.pumpfunComplete === false) {
      // Token still on bonding curve - LP doesn't exist yet
      lpStatus = '🔄 LP: Bonding Curve'
    } else if (analysis.lpBurned) {
      lpStatus = `🔥 LP Burned${analysis.lpBurnedPercentage ? ': ' + analysis.lpBurnedPercentage.toFixed(0) + '%' : ''}`
    } else {
      lpStatus = '⚠️ LP Not Burned'
    }
    
    const mintStatus = analysis.mintAuthorityRevoked ? '✅ Mint' : '❌ Mint'
    const freezeStatus = analysis.freezeAuthorityRevoked ? '✅ Freeze' : '❌ Freeze'
    // Treat undefined isMutable as unknown rather than risky for display
    const mutableStatus = analysis.isMutable === false 
      ? '✅ Immutable' 
      : analysis.isMutable === true 
        ? '⚠️ Mutable' 
        : '❓ Mutable'

    const securitySection = `
${lpStatus}
${mintStatus}
${freezeStatus}
${mutableStatus}`

    // ═══════════════════════════════════════════════════════════════════════════
    // HOLDERS: Total, Top 10 breakdown
    // ═══════════════════════════════════════════════════════════════════════════
    const hasTopHoldersArray = analysis.topHolders && analysis.topHolders.length > 0
    
    // Filter out pool/LP accounts for display
    const realHolders = hasTopHoldersArray 
      ? analysis.topHolders!.filter(h => !h.isLpPair)
      : []
    
    // Holder count - use totalHolders if available, otherwise indicate approximate
    const holdersText = analysis.totalHolders > 0 
      ? analysis.totalHolders.toLocaleString()
      : realHolders.length > 0
        ? `${realHolders.length}+`
        : 'N/A'
    
    // Top 10 percentage - exclude pool accounts
    const top10Text = analysis.top10HoldersPercentage > 0
      ? `${analysis.top10HoldersPercentage.toFixed(1)}%`
      : 'N/A'
    
    // Show top holders breakdown (excluding pool accounts)
    let holdersBreakdown = ''
    if (realHolders.length > 0) {
      const topHolderLines = realHolders.slice(0, 5).map((h, i) => {
        const shortAddr = `${h.address.slice(0, 4)}…${h.address.slice(-4)}`
        const emoji = this.getHolderEmoji(h.percentage, false)
        const devTag = h.isDevWallet ? ' 🅳' : ''
        const isLast = i === Math.min(realHolders.length - 1, 4)
        const prefix = isLast ? '└' : '├'
        return `${prefix} ${emoji} ${shortAddr} • ${h.percentage.toFixed(2)}%${devTag}`
      })
      holdersBreakdown = '\n' + topHolderLines.join('\n')
    }

    const holdersSection = `
👥 Holders: <b>${holdersText}</b>
🏦 Top 10 Hold: <b>${top10Text}</b>${holdersBreakdown}`

    // ═══════════════════════════════════════════════════════════════════════════
    // DEV ANALYSIS: Sold status, Rug ratio, DEX paid
    // ═══════════════════════════════════════════════════════════════════════════
    let devAnalysisSection = ''
    
    // Dev sold status
    if (analysis.devStatus) {
      const devSoldEmoji = analysis.devStatus === 'sold' ? '🔴' : analysis.devStatus === 'holding' ? '🟢' : '🟡'
      const devSoldText = analysis.devStatus === 'sold' 
        ? `Dev Sold ${devSoldEmoji} (${analysis.devHoldingPercentage?.toFixed(1) || '0'}% left)`
        : analysis.devStatus === 'holding'
          ? `Dev Holding ${devSoldEmoji} (${analysis.devHoldingPercentage?.toFixed(1) || '?'}%)`
          : `Dev Status: ${analysis.devStatus} ${devSoldEmoji}`
      devAnalysisSection += `\n├ ${devSoldText}`
    }

    // Dev rug ratio
    if (analysis.devRugHistory && analysis.devRugHistory.length > 0) {
      const rugRatio = Math.min(100, analysis.devRugHistory.length * 15 + 20)
      devAnalysisSection += `\n├ Dev Rug Ratio 🔴 (${rugRatio}%)`
    }

    // DEX paid status
    const dexPaidEmoji = analysis.dexscreenerPaid ? '🟢' : '⚪'
    devAnalysisSection += `\n└ DEX Paid ${dexPaidEmoji}`

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK BUY LINKS
    // ═══════════════════════════════════════════════════════════════════════════
    const trojanLink = `<a href="https://t.me/paris_trojanbot?start=${tokenMintToTrack}">Trojan</a>`
    const gmgnLink = `<a href="https://gmgn.ai/sol/token/${tokenMintToTrack}">GMGN</a>`
    const bullxLink = `<a href="https://neo.bullx.io/terminal?chainId=1399811149&address=${tokenMintToTrack}">BullX</a>`
    const photonLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">Photon</a>`
    const axiomLink = `<a href="https://axiom.trade/t/${tokenMintToTrack}/@handi">Axiom</a>`

    const quickBuySection = `
🔫 <b>Quick Buy</b>
├ ${trojanLink} • ${bullxLink} • ${photonLink}
└ ${gmgnLink} • ${axiomLink}`

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSEMBLE FINAL MESSAGE
    // ═══════════════════════════════════════════════════════════════════════════
    const messageText = `${header}
${riskSection}
${swapSection}
${marketSection}
${volumeTable}
${bondingSection}
${securitySection}
${holdersSection}${devAnalysisSection}
${quickBuySection}
`
    return messageText
  }

  /**
   * Detailed token analysis message (for /analyze command)
   * Uses comprehensive data from all sources with new UX format
   */
  static detailedTokenAnalysisMessage(analysis: TokenAnalysisResult): string {
    const tokenName = analysis.name || 'Unknown'
    const tokenSymbol = analysis.symbol || 'N/A'

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════════════════════════
    const header = `<b>${tokenName}</b> — <b>$${tokenSymbol}</b>
<code>${analysis.mint}</code>`

    // ═══════════════════════════════════════════════════════════════════════════
    // RISK BAR
    // ═══════════════════════════════════════════════════════════════════════════
    const riskPercentage = analysis.riskScore || 50
    const riskBar = this.generateProgressBar(100 - riskPercentage)
    const riskSection = `
<b>Overall Risk : ${riskPercentage}%</b>
${riskBar}`

    // ═══════════════════════════════════════════════════════════════════════════
    // MARKET DATA
    // ═══════════════════════════════════════════════════════════════════════════
    const ageText = this.formatAge(analysis.ageInHours, analysis.launchTimestamp)
    
    // Price formatting
    const price = analysis.priceUsd || 0
    const priceFormatted = price < 0.00001 
      ? price.toExponential(3) 
      : price < 0.01 
        ? price.toFixed(7)
        : price.toFixed(4)

    // Liquidity ratio
    const liqRatio = analysis.liquidityRatio 
      ? ` (${(analysis.liquidityRatio * 100).toFixed(1)}% ratio)` 
      : ''

    // Buy pressure
    let pressureText = 'N/A'
    let pressureEmoji = ''
    if (analysis.buyPressure !== undefined) {
      if (analysis.buyPressure > 1.5) { pressureText = `${analysis.buyPressure.toFixed(2)}x`; pressureEmoji = '🚀' }
      else if (analysis.buyPressure > 1) { pressureText = `${analysis.buyPressure.toFixed(2)}x`; pressureEmoji = '➡️' }
      else if (analysis.buyPressure > 0.5) { pressureText = `${analysis.buyPressure.toFixed(2)}x`; pressureEmoji = '📉' }
      else { pressureText = `${analysis.buyPressure.toFixed(2)}x`; pressureEmoji = '🔻' }
    }

    const marketSection = `
<b>━━━━━━ 💰 Market Data ━━━━━━</b>
├ 💵 Price: <b>$${priceFormatted}</b>
├ 💰 Market Cap: <b>$${this.formatNum(analysis.marketCap)}</b>
├ 📊 FDV: <b>$${this.formatNum(analysis.fullyDilutedMarketCap)}</b>
├ 💧 Liquidity: <b>$${this.formatNum(analysis.liquidity)}</b>${liqRatio}
├ 📈 24h Volume: <b>$${this.formatNum(analysis.volume24h)}</b>
├ 📊 24h Change: <b>${analysis.priceChange24h?.toFixed(2) || 'N/A'}%</b>
├ 📊 1h Change: <b>${analysis.priceChange1h?.toFixed(2) || 'N/A'}%</b>
└ ${pressureEmoji} Buy Pressure: <b>${pressureText}</b>`

    // ═══════════════════════════════════════════════════════════════════════════
    // HOLDERS SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    const holdersCount = analysis.totalHolders || 0
    const top10Pct = analysis.top10HoldersPercentage || 0
    
    let holdersBreakdown = ''
    if (analysis.topHolders && analysis.topHolders.length > 0) {
      const topHolderLines = analysis.topHolders.slice(0, 5).map((h, i) => {
        const shortAddr = `${h.address.slice(0, 4)}…${h.address.slice(-4)}`
        const emoji = this.getHolderEmoji(h.percentage, h.isLpPair)
        const tags: string[] = []
        if (h.isDevWallet) tags.push('👨‍💻')
        if (h.isSmartWallet) tags.push('🧠')
        const tagStr = tags.length > 0 ? ` ${tags.join('')}` : ''
        const prefix = i === Math.min(analysis.topHolders!.length - 1, 4) ? '└' : '├'
        return `${prefix} ${emoji} ${shortAddr} • ${h.percentage.toFixed(2)}%${tagStr}`
      })
      holdersBreakdown = '\n' + topHolderLines.join('\n')
    }

    const holdersSection = `
<b>━━━━━━ 👥 Holders ━━━━━━</b>
├ 👥 Total Holders: <b>${holdersCount.toLocaleString()}</b>
├ 🏦 Top 10 Hold: <b>${top10Pct.toFixed(1)}%</b>
├ 🧑‍💻 Dev Holds: <b>${analysis.devHoldingPercentage?.toFixed(2) || 'N/A'}%</b>
├ 📊 Dev Status: <b>${analysis.devStatus?.toUpperCase() || 'N/A'}</b>
└ 🧠 Smart Wallets: <b>${analysis.smartWalletHolders || 'N/A'}</b>${holdersBreakdown}`

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    const mintStatus = analysis.mintAuthorityRevoked ? '✅ Revoked' : '❌ Active'
    const freezeStatus = analysis.freezeAuthorityRevoked ? '✅ Revoked' : '❌ Active'
    const mutableStatus = analysis.isMutable === false ? '✅ Immutable' : '⚠️ Mutable'
    const lpStatus = analysis.lpBurned 
      ? `🔥 Burned (${analysis.lpBurnedPercentage?.toFixed(1) || '?'}%)`
      : '⚠️ Not Burned'
    const honeypotStatus = analysis.isHoneypot ? '🚨 YES!' : '✅ No'

    const securitySection = `
<b>━━━━━━ 🔒 Security ━━━━━━</b>
├ 🪙 Mint Authority: <b>${mintStatus}</b>
├ 🧊 Freeze Authority: <b>${freezeStatus}</b>
├ 📝 Metadata: <b>${mutableStatus}</b>
├ 💧 LP Status: <b>${lpStatus}</b>
├ 🍯 Honeypot: <b>${honeypotStatus}</b>
├ 💸 Buy Tax: <b>${analysis.buyTax !== undefined ? `${analysis.buyTax}%` : 'N/A'}</b>
├ 💸 Sell Tax: <b>${analysis.sellTax !== undefined ? `${analysis.sellTax}%` : 'N/A'}</b>
├ 📊 Risk Score: <b>${analysis.riskScore}/100</b>
└ ${this.getRiskEmoji(analysis.riskLevel)} Risk Level: <b>${analysis.riskLevel.toUpperCase()}</b>`

    // ═══════════════════════════════════════════════════════════════════════════
    // INFO SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    const hotLevel = analysis.hotLevel !== undefined 
      ? '🔥'.repeat(Math.min(analysis.hotLevel, 5)) || '⬜️'
      : 'N/A'

    let bondingInfo = ''
    if (analysis.pumpfunComplete !== undefined) {
      if (analysis.pumpfunComplete) {
        bondingInfo = '\n├ 🎓 Bonding: <b>GRADUATED</b>'
      } else {
        const progress = analysis.pumpfunProgress || 0
        const bondingBar = this.generateProgressBar(progress)
        bondingInfo = `\n├ ⏳ Bonding: <b>${progress.toFixed(1)}%</b>\n├ ${bondingBar}`
      }
    }
    if (analysis.pumpfunKingOfTheHill) {
      bondingInfo += '\n├ 👑 <b>King of the Hill</b>'
    }

    const infoSection = `
<b>━━━━━━ 📊 Info ━━━━━━</b>
├ 🏊 Pool: <b>${analysis.poolType || 'N/A'}</b>
├ 🕓 Age: <b>${ageText}</b>
├ 📅 Launch: <b>${analysis.launchTime?.toLocaleString() || 'N/A'}</b>
├ 💎 DEX Paid: <b>${analysis.dexscreenerPaid ? '✅ Yes' : '⚪ No'}</b>
├ 🔥 Hot Level: <b>${hotLevel}</b>${bondingInfo}
└ 📦 Supply: <b>${analysis.totalSupply?.toLocaleString() || 'N/A'}</b>`

    // ═══════════════════════════════════════════════════════════════════════════
    // DEV WALLET SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    let devSection = ''
    if (analysis.devWallet) {
      const devSoldEmoji = analysis.devStatus === 'sold' ? '🔴' : analysis.devStatus === 'holding' ? '🟢' : '🟡'
      devSection = `
<b>━━━━━━ 🧑‍💻 Developer ━━━━━━</b>
├ Wallet: <code>${analysis.devWallet}</code>
├ Status: <b>${analysis.devStatus?.toUpperCase() || 'N/A'}</b> ${devSoldEmoji}
└ Holding: <b>${analysis.devHoldingPercentage?.toFixed(2) || 'N/A'}%</b>`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RISK FACTORS
    // ═══════════════════════════════════════════════════════════════════════════
    let riskFactorsSection = ''
    if (analysis.riskFactors.length > 0) {
      const riskLines = analysis.riskFactors.slice(0, 5).map((f, i) => {
        const prefix = i === Math.min(analysis.riskFactors.length - 1, 4) ? '└' : '├'
        return `${prefix} ⚠️ ${f}`
      })
      riskFactorsSection = `
<b>━━━━━━ ⚠️ Risk Factors ━━━━━━</b>
${riskLines.join('\n')}`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RUG HISTORY
    // ═══════════════════════════════════════════════════════════════════════════
    let rugHistorySection = ''
    if (analysis.devRugHistory && analysis.devRugHistory.length > 0) {
      const rugLines = analysis.devRugHistory.slice(0, 3).map((r, i) => {
        const prefix = i === Math.min(analysis.devRugHistory!.length - 1, 2) ? '└' : '├'
        return `${prefix} 🚨 ${r.symbol} (${r.name})`
      })
      rugHistorySection = `
<b>━━━━━━ 🚨 Dev's Rug History ━━━━━━</b>
${rugLines.join('\n')}`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SOCIAL LINKS
    // ═══════════════════════════════════════════════════════════════════════════
    const socialLinks: string[] = []
    if (analysis.twitter) socialLinks.push(`<a href="${analysis.twitter}">𝕏 Twitter</a>`)
    if (analysis.website) socialLinks.push(`<a href="${analysis.website}">🌐 Website</a>`)
    if (analysis.telegram) socialLinks.push(`<a href="${analysis.telegram}">📱 Telegram</a>`)
    if (analysis.discord) socialLinks.push(`<a href="${analysis.discord}">💬 Discord</a>`)

    const socialsSection = socialLinks.length > 0 ? `
<b>━━━━━━ 🔗 Socials ━━━━━━</b>
${socialLinks.join(' • ')}` : ''

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK BUY LINKS
    // ═══════════════════════════════════════════════════════════════════════════
    const trojanLink = `<a href="https://t.me/paris_trojanbot?start=${analysis.mint}">Trojan</a>`
    const gmgnLink = `<a href="https://gmgn.ai/sol/token/${analysis.mint}">GMGN</a>`
    const bullxLink = `<a href="https://neo.bullx.io/terminal?chainId=1399811149&address=${analysis.mint}">BullX</a>`
    const photonLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${analysis.mint}">Photon</a>`
    const beLink = `<a href="https://birdeye.so/token/${analysis.mint}?chain=solana">Birdeye</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${analysis.mint}">DexScreener</a>`

    const quickBuySection = `
<b>━━━━━━ 🔫 Quick Buy ━━━━━━</b>
├ ${trojanLink} • ${bullxLink} • ${photonLink}
└ ${gmgnLink} • ${beLink} • ${dsLink}`

    // ═══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════════════════
    const footer = `
<i>📡 Sources: ${analysis.dataSources.join(', ')}</i>
<i>🕐 Updated: ${new Date(analysis.fetchTimestamp).toLocaleTimeString()}</i>`

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSEMBLE FINAL MESSAGE
    // ═══════════════════════════════════════════════════════════════════════════
    const messageText = `${header}
${riskSection}
${marketSection}
${holdersSection}
${securitySection}
${infoSection}${devSection}${riskFactorsSection}${rugHistorySection}${socialsSection}
${quickBuySection}
${footer}
`
    return messageText
  }
}
