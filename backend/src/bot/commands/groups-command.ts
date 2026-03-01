import TelegramBot from 'node-telegram-bot-api'
import { GROUPS_MENU, SUB_MENU } from '../../config/bot-menus'
import { BotMiddleware } from '../../config/bot-middleware'
import { GeneralMessages } from '../messages/general-messages'
import { PrismaGroupRepository } from '../../repositories/prisma/group'
import { CreateUserGroupInterface } from '../../types/general-interfaces'
import { userExpectingGroupId } from '../../constants/flags'
import { PrismaUserRepository } from '../../repositories/prisma/user'

export class GroupsCommand {
  private prismaGroupRepository: PrismaGroupRepository
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaGroupRepository = new PrismaGroupRepository()
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async groupsButtonHandler(message: TelegramBot.Message) {
    const userId = message.chat.id.toString()
    const allUserGroups = await this.prismaGroupRepository.getAllUserGroups(userId)
    this.bot.editMessageText(GeneralMessages.groupsMessage(allUserGroups || []), {
      chat_id: message.chat.id,
      message_id: message.message_id,
      parse_mode: 'HTML',
      reply_markup: GROUPS_MENU,
    })
  }

  public async activateGroupCommandHandler() {
    this.bot.onText(/\/activate/, async (msg) => {
      const chatId = msg.chat.id
      const userId = String(msg.from?.id)
      const groupName = msg.chat.title || 'No group name'

      if (!BotMiddleware.isGroup(chatId)) return

      const groupUser = await this.prismaUserRepository.getById(userId)
      if (!groupUser) {
        this.bot.sendMessage(chatId, GeneralMessages.groupChatNotStarted, {
          parse_mode: 'HTML',
        })
        return
      }

      const existingGroup = await this.prismaGroupRepository.getGroupById(String(chatId), userId)

      if (!existingGroup?.id) {
        const data = {
          id: String(chatId),
          userId: userId,
          name: groupName,
        } satisfies CreateUserGroupInterface

        const activatedGroup = await this.prismaGroupRepository.activateGroup(data)

        if (!activatedGroup) return

        this.bot.sendMessage(
          chatId,
          `🐱 Group ${groupName} has been activated! Remember only you can update this bot settings`,
        )

        return
      }

      this.bot.sendMessage(
        chatId,
        `
😾 This group has been already activated
`,
      )
    })
  }

  public async deleteGroupButtonHandler(message: TelegramBot.Message) {
    const chatId = message.chat.id
    this.bot.editMessageText(GeneralMessages.deleteGroupMessage, {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: 'HTML',
      reply_markup: SUB_MENU,
    })

    userExpectingGroupId[chatId] = true
    const listener = async (responseMsg: TelegramBot.Message) => {
      // Check if the user is expected to enter a wallet address
      if (!userExpectingGroupId[chatId]) return

      const groupId = responseMsg.text?.trim()

      if (groupId?.startsWith('/') || !groupId) {
        userExpectingGroupId[chatId] = false
        return
      }

      // Validate group ID format (should be a numeric ID, possibly negative for groups)
      const groupIdPattern = /^-?\d+$/
      if (!groupIdPattern.test(groupId)) {
        this.bot.sendMessage(chatId, 'Invalid group ID format. Please provide a valid numeric group ID.', {
          parse_mode: 'HTML',
          reply_markup: SUB_MENU,
        })
        this.bot.removeListener('message', listener)
        userExpectingGroupId[chatId] = false
        return
      }

      const deletedWallet = await this.prismaGroupRepository.deleteGroup(groupId, String(chatId))

      if (deletedWallet) {
        this.bot.sendMessage(chatId, GeneralMessages.groupDeletedMessage, {
          parse_mode: 'HTML',
          reply_markup: SUB_MENU,
        })
      } else {
        this.bot.sendMessage(chatId, GeneralMessages.failedToDeleteGroupMessage, {
          parse_mode: 'HTML',
          reply_markup: SUB_MENU,
        })
      }

      this.bot.removeListener('message', listener)
      userExpectingGroupId[chatId] = false
    }

    this.bot.once('message', listener)
  }
}
