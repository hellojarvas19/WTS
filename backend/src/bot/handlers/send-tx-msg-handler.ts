import TelegramBot from 'node-telegram-bot-api'
import { FormatNumbers } from '../../lib/format-numbers'
import { createTxSubMenu } from '../../config/bot-menus'
import { TxMessagesRedesigned as TxMessages } from '../messages/tx-messages-redesigned'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { NativeParserInterface, TransferParserInterface } from '../../types/general-interfaces'
import { TokenMetadataService, TokenMetadata } from '../../lib/token-metadata'
import { TokenAnalysisService, TokenAnalysisResult } from '../../lib/token-analysis'
import { PrismaNotificationSettingsRepository } from '../../repositories/prisma/notification-settings'

// Configuration for enhanced metadata fetching
const ENABLE_ENHANCED_METADATA = process.env.ENABLE_ENHANCED_METADATA === 'true'

export class SendTransactionMsgHandler {
  private prismaWalletRepository: PrismaWalletRepository
  private tokenMetadataService: TokenMetadataService
  private tokenAnalysisService: TokenAnalysisService
  private notificationSettingsRepo: PrismaNotificationSettingsRepository
  
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaWalletRepository = new PrismaWalletRepository()
    this.tokenMetadataService = new TokenMetadataService()
    this.tokenAnalysisService = new TokenAnalysisService()
    this.notificationSettingsRepo = new PrismaNotificationSettingsRepository()
  }

  public async shouldSendNotificationPublic(
    message: NativeParserInterface, 
    userId: string,
    analysis?: any
  ): Promise<boolean> {
    return this.shouldSendNotification(message, userId, analysis)
  }

  private async shouldSendNotification(
    message: NativeParserInterface, 
    userId: string,
    analysis?: any
  ): Promise<boolean> {
    const settings = await this.notificationSettingsRepo.getSettings(userId)
    if (!settings) return true

    // Check DEX filters
    const platform = message.platform
    if (platform === 'pumpfun' || platform === 'mint_pumpfun') {
      if (!settings.enablePumpFun) return false
    } else if (platform === 'pumpfun_amm') {
      if (!settings.enablePumpSwap) return false
    } else if (platform === 'raydium') {
      if (!settings.enableRaydium) return false
    } else if (platform === 'jupiter') {
      if (!settings.enableJupiter) return false
    }

    // Check minimum SOL amount
    if (settings.minSolAmount > 0) {
      const solAmount = message.type === 'buy' 
        ? parseFloat(message.tokenTransfers.tokenAmountOut)
        : parseFloat(message.tokenTransfers.tokenAmountIn)
      
      if (solAmount < settings.minSolAmount) return false
    }

    // Check advanced filters (only if analysis data available)
    if (analysis) {
      // Market Cap filter
      if (settings.minMarketCap > 0 && analysis.marketCap < settings.minMarketCap) return false
      if (settings.maxMarketCap > 0 && analysis.marketCap > settings.maxMarketCap) return false

      // Liquidity filter
      if (settings.minLiquidity > 0 && analysis.liquidity < settings.minLiquidity) return false
      if (settings.maxLiquidity > 0 && analysis.liquidity > settings.maxLiquidity) return false

      // Holders filter
      if (settings.minHolders > 0 && analysis.totalHolders < settings.minHolders) return false
      if (settings.maxHolders > 0 && analysis.totalHolders > settings.maxHolders) return false

      // Volume filter
      if (settings.minVolume24h > 0 && analysis.volume24h < settings.minVolume24h) return false
      if (settings.maxVolume24h > 0 && analysis.volume24h > settings.maxVolume24h) return false

      // Top 10 holding % filter
      if (settings.minTop10Percentage > 0 && analysis.top10HoldersPercentage < settings.minTop10Percentage) return false
      if (settings.maxTop10Percentage > 0 && analysis.top10HoldersPercentage > settings.maxTop10Percentage) return false

      // Dev holding % filter
      if (settings.minDevPercentage > 0 && (analysis.devHoldingPercentage || 0) < settings.minDevPercentage) return false
      if (settings.maxDevPercentage > 0 && (analysis.devHoldingPercentage || 0) > settings.maxDevPercentage) return false

      // Age filter
      if (settings.minAgeHours > 0 && (analysis.ageInHours || 0) < settings.minAgeHours) return false
      if (settings.maxAgeHours > 0 && (analysis.ageInHours || 0) > settings.maxAgeHours) return false
    }

    return true
  }

  private async shouldSendTransferNotification(userId: string): Promise<boolean> {
    const settings = await this.notificationSettingsRepo.getSettings(userId)
    return settings ? settings.enableSolTransfers : true
  }

  public async sendTransactionMessage(message: NativeParserInterface, chatId: string) {
    const tokenToMc = message.type === 'buy' ? message.tokenTransfers.tokenInMint : message.tokenTransfers.tokenOutMint
    const tokenToMcSymbol =
      message.type === 'buy' ? message.tokenTransfers.tokenInSymbol : message.tokenTransfers.tokenOutSymbol

    const TX_SUB_MENU = createTxSubMenu(tokenToMcSymbol, tokenToMc)

    const walletName = await this.prismaWalletRepository.getUserWalletNameById(chatId, message.owner)

    if (!walletName?.address || !message.owner) {
      console.log('Address not found in user wallets')
      return
    }

    try {
      // Try enhanced metadata if enabled - use new TokenAnalysisService
      if (ENABLE_ENHANCED_METADATA) {
        try {
          const analysis = await this.tokenAnalysisService.analyzeToken(tokenToMc)
          
          // Check filters with analysis data
          if (!(await this.shouldSendNotification(message, chatId, analysis))) {
            return
          }
          
          if (analysis && (analysis.marketCap || analysis.liquidity || analysis.totalHolders)) {
            // Use new enhanced message format V2
            const messageText = TxMessages.enhancedDefiTxMessageV2(message, analysis, walletName?.name)
            
            // Send with photo if image available
            if (analysis.image) {
              try {
                return await this.bot.sendPhoto(chatId, analysis.image, {
                  caption: messageText,
                  parse_mode: 'HTML',
                  reply_markup: TX_SUB_MENU,
                })
              } catch (photoErr) {
                // If photo fails, fall back to text message
                console.log('Photo send failed, falling back to text')
              }
            }
            
            return this.bot.sendMessage(chatId, messageText, {
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              reply_markup: TX_SUB_MENU,
            })
          }
        } catch (err) {
          // Silently fall back to basic message
          console.log('Enhanced metadata fetch failed, using basic format')
        }
      }

      // Check basic filters before sending fallback message
      if (!(await this.shouldSendNotification(message, chatId))) {
        return
      }

      // Fallback to original message format
      if (message.platform === 'raydium' || message.platform === 'jupiter' || message.platform === 'pumpfun_amm') {
        let tokenMarketCap = message.swappedTokenMc

        // Check if the market cap is below 1000 and adjust if necessary
        if (tokenMarketCap && tokenMarketCap < 1000) {
          console.log('MC ADJUSTED')
          tokenMarketCap *= 1000
        }

        const formattedMarketCap = tokenMarketCap ? FormatNumbers.formatPrice(tokenMarketCap) : undefined

        const messageText = TxMessages.defiTxMessage(message, formattedMarketCap, walletName?.name)
        return this.bot.sendMessage(chatId, messageText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: TX_SUB_MENU,
        })
      } else if (message.platform === 'pumpfun') {
        let tokenMarketCap = message.swappedTokenMc

        const formattedMarketCap = tokenMarketCap ? FormatNumbers.formatPrice(tokenMarketCap) : undefined

        const messageText = TxMessages.defiTxMessage(message, formattedMarketCap, walletName?.name)
        return this.bot.sendMessage(chatId, messageText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: TX_SUB_MENU,
        })
      } else if (message.platform === 'mint_pumpfun') {
        const messageText = TxMessages.tokenMintedMessage(message, walletName?.name)

        return this.bot.sendMessage(chatId, messageText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: TX_SUB_MENU,
        })
      }
    } catch (error: any) {
      // Only log brief error info, not the full error object
      const statusCode = error?.response?.statusCode
      if (statusCode === 403) {
        // User blocked bot - don't spam logs
      } else if (statusCode) {
        console.log(`Send message failed: ${chatId}, status ${statusCode}`)
      }
    }

    return
  }

  /**
   * Send enhanced transaction message with comprehensive metadata
   * This is the new method that always fetches full metadata from all sources
   */
  public async sendEnhancedTransactionMessage(message: NativeParserInterface, chatId: string) {
    const tokenToMc = message.type === 'buy' ? message.tokenTransfers.tokenInMint : message.tokenTransfers.tokenOutMint
    const tokenToMcSymbol =
      message.type === 'buy' ? message.tokenTransfers.tokenInSymbol : message.tokenTransfers.tokenOutSymbol

    const TX_SUB_MENU = createTxSubMenu(tokenToMcSymbol, tokenToMc)

    const walletName = await this.prismaWalletRepository.getUserWalletNameById(chatId, message.owner)

    if (!walletName?.address || !message.owner) {
      return
    }

    try {
      // Fetch comprehensive analysis from all sources
      const analysis = await this.tokenAnalysisService.analyzeToken(tokenToMc)
      
      // Check filters before sending
      if (!(await this.shouldSendNotification(message, chatId, analysis))) {
        return
      }
      
      // Use new V2 message format
      const messageText = TxMessages.enhancedDefiTxMessageV2(message, analysis, walletName?.name)
      
      // Send with photo if image available
      if (analysis.image) {
        try {
          return await this.bot.sendPhoto(chatId, analysis.image, {
            caption: messageText,
            parse_mode: 'HTML',
            reply_markup: TX_SUB_MENU,
          })
        } catch (photoErr) {
          // If photo fails, fall back to text message
          console.log('Photo send failed, falling back to text:', photoErr)
        }
      }
      
      return this.bot.sendMessage(chatId, messageText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: TX_SUB_MENU,
      })
    } catch {
      // Fallback to basic message silently
      return this.sendTransactionMessage(message, chatId)
    }
  }

  /**
   * Get detailed token info for a specific token
   */
  public async getTokenInfo(tokenMint: string): Promise<TokenMetadata> {
    return this.tokenMetadataService.getTokenMetadata(tokenMint)
  }

  /**
   * Get comprehensive token analysis for a specific token
   */
  public async getTokenAnalysis(tokenMint: string): Promise<TokenAnalysisResult> {
    return this.tokenAnalysisService.analyzeToken(tokenMint)
  }

  /**
   * Send detailed token info message (uses new comprehensive analysis)
   */
  public async sendTokenInfoMessage(tokenMint: string, chatId: string) {
    try {
      // Use new comprehensive analysis
      const analysis = await this.tokenAnalysisService.analyzeToken(tokenMint)
      const messageText = TxMessages.detailedTokenAnalysisMessage(analysis)
      
      return this.bot.sendMessage(chatId, messageText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    } catch {
      return this.bot.sendMessage(chatId, '❌ Failed to fetch token information. Please try again later.', {
        parse_mode: 'HTML',
      }).catch(() => {})
    }
  }

  public async sendTransferMessage(message: TransferParserInterface, chatId: string) {
    // Check notification filters
    if (!(await this.shouldSendTransferNotification(chatId))) {
      return
    }

    try {
      const walletName = await this.prismaWalletRepository.getUserWalletNameById(chatId, message.owner)

      if (!walletName?.address || !message.owner) {
        return
      }

      const messageText = TxMessages.solTxMessage(message, walletName.name)
      return this.bot.sendMessage(chatId, messageText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    } catch {
      // Silently handle send failures
      return
    }
  }
}
