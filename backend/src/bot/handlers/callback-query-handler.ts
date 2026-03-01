import TelegramBot from 'node-telegram-bot-api'
import { AddCommand } from '../commands/add-command'
import { START_MENU, SUB_MENU } from '../../config/bot-menus'
import { ManageCommand } from '../commands/manage-command'
import { DeleteCommand } from '../commands/delete-command'
import {
  adminExpectingBannedWallet,
  userExpectingGroupId,
  userExpectingWalletAddress,
} from '../../constants/flags'
import { MyWalletCommand } from '../commands/mywallet-command'
import { GeneralMessages } from '../messages/general-messages'
import { SettingsCommand } from '../commands/settings-command'
import { UpdateBotStatusHandler } from './update-bot-status-handler'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { GroupsCommand } from '../commands/groups-command'
import { HelpCommand } from '../commands/help-command'

export class CallbackQueryHandler {
  private addCommand: AddCommand
  private manageCommand: ManageCommand
  private deleteCommand: DeleteCommand
  private myWalletCommand: MyWalletCommand
  private settingsCommand: SettingsCommand
  private groupsCommand: GroupsCommand
  private helpCommand: HelpCommand
  private updateBotStatusHandler: UpdateBotStatusHandler
  private prismaUserRepository: PrismaUserRepository

  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.addCommand = new AddCommand(this.bot)
    this.manageCommand = new ManageCommand(this.bot)
    this.deleteCommand = new DeleteCommand(this.bot)
    this.myWalletCommand = new MyWalletCommand(this.bot)
    this.settingsCommand = new SettingsCommand(this.bot)
    this.groupsCommand = new GroupsCommand(this.bot)
    this.helpCommand = new HelpCommand(this.bot)
    this.updateBotStatusHandler = new UpdateBotStatusHandler(this.bot)
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public call() {
    this.bot.on('callback_query', async (callbackQuery) => {
      const message = callbackQuery.message
      const chatId = message?.chat.id
      const data = callbackQuery.data
      const userId = message?.chat.id.toString()

      if (!chatId || !userId) {
        return
      }

      switch (data) {
        case 'add':
          this.addCommand.addButtonHandler(message)
          break
        case 'manage':
          await this.manageCommand.manageButtonHandler(message)
          break
        case 'delete':
          this.deleteCommand.deleteButtonHandler(message)
          break
        case 'settings':
          this.settingsCommand.settingsCommandHandler(message)
          break
        case 'notification_filters':
          await this.settingsCommand.notificationFiltersHandler(message)
          break
        case 'dex_filters':
          await this.settingsCommand.dexFiltersHandler(message)
          break
        case 'toggle_pumpfun':
          await this.settingsCommand.toggleDexHandler(message, 'pumpfun')
          break
        case 'toggle_pumpswap':
          await this.settingsCommand.toggleDexHandler(message, 'pumpswap')
          break
        case 'toggle_raydium':
          await this.settingsCommand.toggleDexHandler(message, 'raydium')
          break
        case 'toggle_jupiter':
          await this.settingsCommand.toggleDexHandler(message, 'jupiter')
          break
        case 'toggle_sol_transfers':
          await this.settingsCommand.toggleDexHandler(message, 'sol_transfers')
          break
        case 'min_sol_amount':
          await this.settingsCommand.minSolAmountHandler(message)
          break
        case 'advanced_filters':
          await this.settingsCommand.advancedFiltersHandler(message)
          break
        case 'filter_market_cap':
          await this.settingsCommand.setFilterHandler(message, 'marketCap')
          break
        case 'filter_liquidity':
          await this.settingsCommand.setFilterHandler(message, 'liquidity')
          break
        case 'filter_holders':
          await this.settingsCommand.setFilterHandler(message, 'holders')
          break
        case 'filter_volume':
          await this.settingsCommand.setFilterHandler(message, 'volume')
          break
        case 'filter_top10':
          await this.settingsCommand.setFilterHandler(message, 'top10')
          break
        case 'filter_dev':
          await this.settingsCommand.setFilterHandler(message, 'dev')
          break
        case 'filter_age':
          await this.settingsCommand.setFilterHandler(message, 'age')
          break
        case 'reset_advanced_filters':
          await this.settingsCommand.resetAdvancedFiltersHandler(message)
          break
        case 'pause-resume-bot':
          await this.updateBotStatusHandler.pauseResumeBot(message)
          break
        case 'groups':
          await this.groupsCommand.groupsButtonHandler(message)
          break
        case 'delete_group':
          await this.groupsCommand.deleteGroupButtonHandler(message)
          break
        case 'help':
          this.helpCommand.helpButtonHandler(message)
          break
        case 'my_wallet':
          this.myWalletCommand.myWalletCommandHandler(message)
          break
        case 'show_private_key':
          this.myWalletCommand.showPrivateKeyHandler(message)
          break
        case 'back_to_main_menu':
          const user = await this.prismaUserRepository.getById(userId)
          const messageText = GeneralMessages.startMessage(user)

          userExpectingWalletAddress[chatId] = false
          userExpectingGroupId[chatId] = false
          adminExpectingBannedWallet[chatId] = false

          this.bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: START_MENU,
            parse_mode: 'HTML',
          })
          break
        default:
          break
      }
    })
  }
}
