import TelegramBot from 'node-telegram-bot-api'
import { UserSettingsMessages } from '../messages/user-settings-messages'
import { SUB_MENU, USER_SETTINGS_MENU, NOTIFICATION_FILTERS_MENU, DEX_FILTERS_MENU, ADVANCED_FILTERS_MENU } from '../../config/bot-menus'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { PrismaNotificationSettingsRepository } from '../../repositories/prisma/notification-settings'

export class SettingsCommand {
  private userSettingsMessages: UserSettingsMessages
  private prismaUserRepository: PrismaUserRepository
  private notificationSettingsRepo: PrismaNotificationSettingsRepository
  private activeListeners: Map<string, (msg: TelegramBot.Message) => void>
  
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.userSettingsMessages = new UserSettingsMessages()
    this.prismaUserRepository = new PrismaUserRepository()
    this.notificationSettingsRepo = new PrismaNotificationSettingsRepository()
    this.activeListeners = new Map()
  }

  public async settingsCommandHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()
    const userBotStatus = await this.prismaUserRepository.getBotStatus(userId)

    const sendMessage = this.bot.editMessageText(UserSettingsMessages.settingsMessage, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: USER_SETTINGS_MENU(userBotStatus ? userBotStatus.botStatus : 'ACTIVE'),
      parse_mode: 'HTML',
    })

    return sendMessage
  }

  public async notificationFiltersHandler(msg: TelegramBot.Message) {
    const messageText = '<b>🔔 Notification Filters</b>\n\nCustomize which notifications you receive'

    await this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: NOTIFICATION_FILTERS_MENU,
      parse_mode: 'HTML',
    })
  }

  public async dexFiltersHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()
    const settings = await this.notificationSettingsRepo.getSettings(userId)

    if (!settings) {
      return
    }

    const messageText = `<b>🎯 DEX Filters</b>\n\nToggle which platforms to receive notifications from:`

    await this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: DEX_FILTERS_MENU({
        enablePumpFun: settings.enablePumpFun,
        enablePumpSwap: settings.enablePumpSwap,
        enableRaydium: settings.enableRaydium,
        enableJupiter: settings.enableJupiter,
        enableSolTransfers: settings.enableSolTransfers,
      }),
      parse_mode: 'HTML',
    })
  }

  public async toggleDexHandler(msg: TelegramBot.Message, dex: 'pumpfun' | 'pumpswap' | 'raydium' | 'jupiter' | 'sol_transfers') {
    const userId = msg.chat.id.toString()
    await this.notificationSettingsRepo.toggleDex(userId, dex)
    await this.dexFiltersHandler(msg)
  }

  public async minSolAmountHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()
    
    // Clean up any existing listener
    this.cleanupListener(userId)
    
    const settings = await this.notificationSettingsRepo.getSettings(userId)

    if (!settings) return

    const messageText = `<b>💰 Minimum SOL Amount</b>\n\nCurrent: ${settings.minSolAmount} SOL\n\nReply with a number to set minimum SOL amount for swap notifications (e.g., 0.5)\n\nSet to 0 to receive all notifications.`

    await this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'notification_filters' }]] },
      parse_mode: 'HTML',
    })

    const listener = async (response: TelegramBot.Message) => {
      if (response.chat.id.toString() !== userId || !response.text) return

      const amount = parseFloat(response.text)
      if (isNaN(amount) || amount < 0) {
        await this.bot.sendMessage(userId, '❌ Invalid amount. Please enter a valid number.')
        return
      }

      await this.notificationSettingsRepo.setMinSolAmount(userId, amount)
      await this.bot.sendMessage(userId, `✅ Minimum SOL amount set to ${amount} SOL`)
      
      this.cleanupListener(userId)
    }

    this.activeListeners.set(userId, listener)
    this.bot.on('message', listener)
    
    // Auto cleanup after 5 minutes
    setTimeout(() => this.cleanupListener(userId), 5 * 60 * 1000)
  }

  private cleanupListener(userId: string) {
    const listener = this.activeListeners.get(userId)
    if (listener) {
      this.bot.removeListener('message', listener)
      this.activeListeners.delete(userId)
    }
  }

  public async advancedFiltersHandler(msg: TelegramBot.Message) {
    const messageText = '<b>📊 Advanced Filters</b>\n\nFilter notifications by token metrics.\n\n<i>Set to 0 to disable a filter</i>'

    await this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: ADVANCED_FILTERS_MENU,
      parse_mode: 'HTML',
    })
  }

  public async setFilterHandler(msg: TelegramBot.Message, filterType: 'marketCap' | 'liquidity' | 'holders' | 'volume' | 'top10' | 'dev' | 'age') {
    const userId = msg.chat.id.toString()
    
    // Clean up any existing listener
    this.cleanupListener(userId)
    
    const settings = await this.notificationSettingsRepo.getSettings(userId)
    if (!settings) return

    const filterConfig = {
      marketCap: { name: 'Market Cap', emoji: '💰', unit: '$', field: 'MarketCap' },
      liquidity: { name: 'Liquidity', emoji: '💧', unit: '$', field: 'Liquidity' },
      holders: { name: 'Holders', emoji: '👥', unit: '', field: 'Holders' },
      volume: { name: 'Volume 24h', emoji: '📈', unit: '$', field: 'Volume24h' },
      top10: { name: 'Top 10%', emoji: '📊', unit: '%', field: 'Top10Percentage' },
      dev: { name: 'Dev%', emoji: '👨‍💻', unit: '%', field: 'DevPercentage' },
      age: { name: 'Token Age', emoji: '⏱️', unit: ' hours', field: 'AgeHours' },
    }

    const config = filterConfig[filterType]
    const minKey = `min${config.field}` as keyof typeof settings
    const maxKey = `max${config.field}` as keyof typeof settings

    const messageText = `<b>${config.emoji} ${config.name} Filter</b>\n\nCurrent:\nMin: ${settings[minKey] || 0}${config.unit}\nMax: ${settings[maxKey] || 0}${config.unit}\n\nReply with two numbers separated by space:\n<code>min max</code>\n\nExample: <code>100000 1000000</code>\nSet to 0 to disable.`

    await this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'advanced_filters' }]] },
      parse_mode: 'HTML',
    })

    const listener = async (response: TelegramBot.Message) => {
      if (response.chat.id.toString() !== userId || !response.text) return
      
      // Ignore commands
      if (response.text.startsWith('/')) {
        this.cleanupListener(userId)
        return
      }

      const parts = response.text.trim().split(/\s+/)
      if (parts.length !== 2) {
        await this.bot.sendMessage(userId, '❌ Invalid format. Send two numbers: <code>min max</code>', { parse_mode: 'HTML' })
        return
      }

      const min = parseFloat(parts[0])
      const max = parseFloat(parts[1])

      if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
        await this.bot.sendMessage(userId, '❌ Invalid numbers. Both must be >= 0')
        return
      }

      const updateData: any = {}
      updateData[minKey] = min
      updateData[maxKey] = max

      await this.notificationSettingsRepo.setAdvancedFilter(userId, updateData)
      await this.bot.sendMessage(userId, `✅ ${config.emoji} ${config.name} filter updated:\nMin: ${min}${config.unit}\nMax: ${max}${config.unit}`)
      
      this.cleanupListener(userId)
    }

    this.activeListeners.set(userId, listener)
    this.bot.on('message', listener)
    
    // Auto cleanup after 5 minutes
    setTimeout(() => this.cleanupListener(userId), 5 * 60 * 1000)
  }

  public async resetAdvancedFiltersHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()

    await this.notificationSettingsRepo.setAdvancedFilter(userId, {
      minMarketCap: 0,
      maxMarketCap: 0,
      minLiquidity: 0,
      maxLiquidity: 0,
      minHolders: 0,
      maxHolders: 0,
      minVolume24h: 0,
      maxVolume24h: 0,
      minTop10Percentage: 0,
      maxTop10Percentage: 0,
      minDevPercentage: 0,
      maxDevPercentage: 0,
      minAgeHours: 0,
      maxAgeHours: 0,
    })

    const messageText = '<b>✅ All Advanced Filters Reset</b>\n\nAll filters have been set to 0 (disabled).'

    await this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'advanced_filters' }]] },
      parse_mode: 'HTML',
    })
  }
}

