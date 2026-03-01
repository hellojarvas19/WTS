import { FormatNumbers } from '../../lib/format-numbers'
import { NativeParserInterface, TransferParserInterface } from '../../types/general-interfaces'
import { TokenMetadata } from '../../lib/token-metadata'

export class TxMessagesRedesigned {
  private static formatNum(num: number | undefined): string {
    if (num === undefined || num === null) return 'N/A'
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

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
   * Redesigned Enhanced DeFi Transaction Message
   * Uses: Bold, Italic, Blockquote, and Mono text styles
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

    // Social links
    const socials: string[] = []
    if (metadata.website) socials.push(`<a href="${metadata.website}">🌐</a>`)
    if (metadata.twitter) socials.push(`<a href="${metadata.twitter}">𝕏</a>`)
    if (metadata.telegram) socials.push(`<a href="${metadata.telegram}">📱</a>`)
    const socialLinks = socials.length > 0 ? ` | ${socials.join(' ')}` : ''

    // Security indicators
    const securityFlags: string[] = []
    if (metadata.mintAuthorityRevoked === true) securityFlags.push('✅MR')
    else if (metadata.mintAuthorityRevoked === false) securityFlags.push('❌MR')
    
    if (metadata.freezeAuthorityRevoked === true) securityFlags.push('✅FR')
    else if (metadata.freezeAuthorityRevoked === false) securityFlags.push('❌FR')
    
    if (metadata.lpBurned) securityFlags.push('🔥LP')
    if (metadata.dexscreenerPaid) securityFlags.push('💎DS')

    // Dev wallet info
    let devInfo = ''
    if (metadata.devWallet) {
      const shortDev = `${metadata.devWallet.slice(0, 4)}...${metadata.devWallet.slice(-4)}`
      const devHolding = metadata.devWalletHoldingPercentage 
        ? ` <i>(${metadata.devWalletHoldingPercentage.toFixed(2)}%)</i>`
        : ''
      devInfo = `\n<blockquote>👨‍💻 Dev: <code>${shortDev}</code>${devHolding}</blockquote>`
    }

    // Age info
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
      pumpInfo = metadata.pumpfunComplete ? ' 🎓' : ' ⏳'
    }
    if (metadata.pumpfunKingOfTheHill) {
      pumpInfo += ' 👑'
    }

    // Holders info
    const holdersText = metadata.totalHolders 
      ? metadata.totalHolders.toLocaleString() 
      : (metadata.topHolders && metadata.topHolders.length > 0 ? `${metadata.topHolders.length}+` : 'N/A')
    
    const top10Text = metadata.top10HoldersPercentage !== undefined && metadata.top10HoldersPercentage > 0
      ? `${metadata.top10HoldersPercentage.toFixed(1)}%`
      : 'N/A'

    // Holdings info
    const holdingPrice = message.currentHoldingPrice && message.currentHoldingPrice.trim() !== '' 
      ? message.currentHoldingPrice 
      : null
    const holdingPercentage = message.currenHoldingPercentage && message.currenHoldingPercentage.trim() !== ''
      ? message.currenHoldingPercentage
      : null
    
    const hasHoldings = holdingPrice || holdingPercentage
    const holdingsLine = hasHoldings 
      ? `\n<blockquote>${Number(holdingPercentage) > 0 ? '📈' : '📉'} <b>Wallet Holds:</b> <i>${holdingPrice || 'N/A'} (${holdingPercentage || '0'}%)</i></blockquote>`
      : ''

    // Price info
    const priceText = message.swappedTokenPrice && message.swappedTokenPrice > 0
      ? ` <i>@$${message.swappedTokenPrice < 0.00001 ? message.swappedTokenPrice.toExponential(2) : message.swappedTokenPrice.toFixed(8)}</i>`
      : ''

    // 24h change
    const changeEmoji = metadata.priceChange24h !== undefined && metadata.priceChange24h >= 0 ? '📈' : '📉'
    const changeText = metadata.priceChange24h !== undefined
      ? ` ${changeEmoji} <i>${metadata.priceChange24h >= 0 ? '+' : ''}${metadata.priceChange24h.toFixed(1)}%</i>`
      : ''

    const messageText = `
╔═════════════════
${message.type === 'buy' ? '🟢 <b>BUY' : '🔴 <b>SELL'} <a href="${solscanTxUrl}">${tokenSymbol}</a></b> • <i>${platformName}</i>
╚═════════════════

👤 <b><a href="${solscanAddressUrl}">${displayName}</a></b>

💱 <b>Swapped:</b>
   <code>${amountOut} ${tokenOut}</code>${message.type === 'sell' ? ` <i>($${fixedUsdAmount})</i>` : ''}
   ↓
   <code>${amountIn} ${tokenIn}</code>${message.type === 'buy' ? ` <i>($${fixedUsdAmount})</i>` : ''}${priceText}

━━━━━━━━━━━━━━━━━━
<b>📊 MARKET DATA</b>
━━━━━━━━━━━━━━━━━━
💰 <b>Market Cap:</b> <code>$${this.formatNum(metadata.marketCap)}</code>
💧 <b>Liquidity:</b> <code>$${this.formatNum(metadata.liquidity)}</code>${changeText}
📈 <b>Volume 24h:</b> <code>$${this.formatNum(metadata.volume24h)}</code>
👥 <b>Holders:</b> <code>${holdersText}</code> | <b>Top 10:</b> <i>${top10Text}</i>
⏱️ <b>Age:</b> <i>${ageText}</i>${pumpInfo}

━━━━━━━━━━━━━━━━━━
<b>🔒 SECURITY</b>
━━━━━━━━━━━━━━━━━━
${securityFlags.join(' • ')} | ${this.getRiskEmoji(metadata.riskLevel)} <b>${(metadata.riskLevel || 'UNKNOWN').toUpperCase()}</b>${devInfo}${holdingsLine}

━━━━━━━━━━━━━━━━━━
🔗 <b><a href="${message.type === 'buy' ? solscanTokenInUrl : solscanTokenOutUrl}">#${tokenSymbol}</a></b>${socialLinks}
${gmgnLink} • ${beLink} • ${dsLink} • ${phLink} • ${bullxLink} • ${axiomLink}

<code>${tokenMintToTrack}</code>
`
    return messageText
  }

  /**
   * Redesigned SOL Transfer Message
   */
  static solTxMessage(message: TransferParserInterface, walletName?: string): string {
    const { fromAddress, toAddress, solAmount, signature, owner } = message

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
╔═══════════════════════════════
🔁 <b><a href="${solscanTxUrl}">SOL TRANSFER</a></b>
╚═══════════════════════════════

👤 <b>Wallet:</b> <i>${walletName !== '' ? walletName : truncatedOwner}</i>

<blockquote>
📤 <b>From:</b> <code><a href="${solscanSenderUrl}">${sender}</a></code>
📥 <b>To:</b> <code><a href="${solscanRecipientUrl}">${recipient}</a></code>
</blockquote>

💰 <b>Amount:</b> <code>${solAmount.toFixed(3)} SOL</code> <i>($${fixedUsdAmount})</i>

<code>${owner}</code>
`
    return messageText
  }

  /**
   * Detailed Token Analysis Message (for /info command)
   */
  static detailedTokenAnalysisMessage(analysis: any): string {
    const tokenName = analysis.name || 'Unknown'
    const tokenSymbol = analysis.symbol || 'N/A'

    const price = analysis.priceUsd || 0
    const priceFormatted = price < 0.00001 
      ? price.toExponential(3) 
      : price < 0.01 
        ? price.toFixed(7)
        : price.toFixed(4)

    const ageText = analysis.ageInHours 
      ? analysis.ageInHours < 1 
        ? `${Math.round(analysis.ageInHours * 60)}m`
        : analysis.ageInHours < 24
          ? `${analysis.ageInHours.toFixed(1)}h`
          : `${Math.round(analysis.ageInHours / 24)}d`
      : 'N/A'

    const messageText = `
╔═══════════════════════════════
<b>${tokenName}</b> • <b>$${tokenSymbol}</b>
╚═══════════════════════════════

<code>${analysis.mint}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>💰 MARKET DATA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 <b>Price:</b> <code>$${priceFormatted}</code>
💰 <b>Market Cap:</b> <code>$${this.formatNum(analysis.marketCap)}</code>
💧 <b>Liquidity:</b> <code>$${this.formatNum(analysis.liquidity)}</code>
📈 <b>Volume 24h:</b> <code>$${this.formatNum(analysis.volume24h)}</code>
📊 <b>24h Change:</b> <i>${analysis.priceChange24h?.toFixed(2) || 'N/A'}%</i>
⏱️ <b>Age:</b> <i>${ageText}</i>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>👥 HOLDERS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 <b>Total:</b> <code>${analysis.totalHolders?.toLocaleString() || 'N/A'}</code>
📊 <b>Top 10:</b> <i>${analysis.top10HoldersPercentage?.toFixed(1) || 'N/A'}%</i>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>🔒 SECURITY</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysis.mintAuthorityRevoked ? '✅' : '❌'} Mint Authority Revoked
${analysis.freezeAuthorityRevoked ? '✅' : '❌'} Freeze Authority Revoked
${analysis.lpBurned ? '✅' : '❌'} LP Burned
${this.getRiskEmoji(analysis.riskLevel)} <b>Risk:</b> ${(analysis.riskLevel || 'UNKNOWN').toUpperCase()}
`
    return messageText
  }

  /**
   * Redesigned Token Minted Message
   */
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
    const amountInUsd = Number(amountOut) * solPrice
    const fixedUsdAmount = amountInUsd < 0.01 ? amountInUsd.toFixed(6) : amountInUsd.toFixed(2)

    const tokenMintToTrack = tokenInMint

    const gmgnLink = `<a href="https://gmgn.ai/sol/token/${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`

    const messageText = `
╔═══════════════════════════════
⭐ <b><a href="${solscanTxUrl}">TOKEN MINTED</a></b> • <i>PUMP.FUN</i>
╚═══════════════════════════════

👤 <b><a href="${solscanAddressUrl}">${walletName !== '' ? walletName : truncatedOwner}</a></b>

<blockquote>
🎨 Minted and swapped:
   <code>${amountOut} <a href="${solscanTokenOutUrl}">${tokenOut}</a></code>
   ↓
   <code>${amountIn} <a href="${solscanTokenInUrl}">${tokenIn}</a></code> <i>($${fixedUsdAmount})</i>
</blockquote>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💣 <b>${tokenIn}</b>
${gmgnLink} • ${beLink} • ${dsLink} • ${phLink}

<code>${tokenMintToTrack}</code>   
`
    return messageText
  }

  /**
   * Enhanced DeFi Transaction Message V2 (with TokenAnalysisResult)
   * Alias for enhancedDefiTxMessage to maintain compatibility
   */
  static enhancedDefiTxMessageV2(
    message: NativeParserInterface,
    analysis: any,
    walletName?: string,
  ): string {
    // Convert TokenAnalysisResult to TokenMetadata format
    const metadata: any = {
      ...analysis,
      mint: analysis.mint,
      name: analysis.name,
      symbol: analysis.symbol,
      decimals: analysis.decimals,
      priceUsd: analysis.priceUsd,
      priceSol: analysis.priceSol,
      marketCap: analysis.marketCap,
      liquidity: analysis.liquidity,
      volume24h: analysis.volume24h,
      priceChange24h: analysis.priceChange24h,
      totalHolders: analysis.totalHolders,
      top10HoldersPercentage: analysis.top10HoldersPercentage,
      topHolders: analysis.topHolders,
      mintAuthorityRevoked: analysis.mintAuthorityRevoked,
      freezeAuthorityRevoked: analysis.freezeAuthorityRevoked,
      lpBurned: analysis.lpBurned,
      riskLevel: analysis.riskLevel,
      ageInHours: analysis.ageInHours,
      launchTimestamp: analysis.launchTimestamp,
      devWallet: analysis.devWallet,
      devWalletHoldingPercentage: analysis.devHoldingPercentage,
      website: analysis.website,
      twitter: analysis.twitter,
      telegram: analysis.telegram,
      pumpfunComplete: analysis.pumpfunComplete,
      pumpfunKingOfTheHill: analysis.pumpfunKingOfTheHill,
      dexscreenerPaid: analysis.dexscreenerPaid,
    }
    
    return this.enhancedDefiTxMessage(message, metadata, walletName)
  }

  /**
   * Basic DeFi Transaction Message (fallback when metadata not available)
   */
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

    const gmgnLink = `<a href="https://gmgn.ai/sol/token/kxPdcLKf_${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`
    const bullxLink = `<a href="https://neo.bullx.io/terminal?chainId=1399811149&address=${tokenMintToTrack}">BLX</a>`
    const axiomLink = `<a href='https://axiom.trade/t/${tokenMintToTrack}/@handi'>AXI</a>`

    const platformName = message.platform === 'pumpfun_amm' ? 'PUMPSWAP' : message.platform!.toUpperCase()

    const priceText = message.swappedTokenPrice && message.swappedTokenPrice > 0
      ? ` <i>@$${message.swappedTokenPrice < 0.00001 ? message.swappedTokenPrice.toExponential(2) : message.swappedTokenPrice.toFixed(8)}</i>`
      : ''

    const holdingPrice = message.currentHoldingPrice && message.currentHoldingPrice.trim() !== '' 
      ? message.currentHoldingPrice 
      : null
    const holdingPercentage = message.currenHoldingPercentage && message.currenHoldingPercentage.trim() !== ''
      ? message.currenHoldingPercentage
      : null
    
    const holdingsLine = (holdingPrice || holdingPercentage)
      ? `\n<blockquote>${Number(holdingPercentage) > 0 ? '📈' : '📉'} <b>Holds:</b> <i>${holdingPrice || 'N/A'} (${holdingPercentage || '0'}%)</i></blockquote>`
      : ''

    const marketCapText = tokenMarketCap
      ? `\n💰 <b>Market Cap:</b> <code>$${tokenMarketCap}</code>`
      : ''

    const messageText = `
╔═══════════════════════════════
${message.type === 'buy' ? '🟢 <b>BUY' : '🔴 <b>SELL'} <a href="${solscanTxUrl}">${tokenSymbol}</a></b> • <i>${platformName}</i>
╚═══════════════════════════════

👤 <b><a href="${solscanAddressUrl}">${displayName}</a></b>

💱 <b>Swapped:</b>
   <code>${amountOut} ${tokenOut}</code>${message.type === 'sell' ? ` <i>($${fixedUsdAmount})</i>` : ''}
   ↓
   <code>${amountIn} ${tokenIn}</code>${message.type === 'buy' ? ` <i>($${fixedUsdAmount})</i>` : ''}${priceText}${marketCapText}${holdingsLine}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 <b><a href="${message.type === 'buy' ? solscanTokenInUrl : solscanTokenOutUrl}">#${tokenSymbol}</a></b>
${gmgnLink} • ${beLink} • ${dsLink} • ${phLink} • ${bullxLink} • ${axiomLink}

<code>${tokenMintToTrack}</code>
`
    return messageText
  }
}
