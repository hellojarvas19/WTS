import dotenv from 'dotenv'
import { bot } from './providers/telegram'
import { StartCommand } from './bot/commands/start-command'
import { AddCommand } from './bot/commands/add-command'
import { CallbackQueryHandler } from './bot/handlers/callback-query-handler'
import { DeleteCommand } from './bot/commands/delete-command'
import { TrackWallets } from './lib/track-wallets'
import { CronJobs } from './lib/cron-jobs'
import { ASCII_TEXT } from './constants/handi-cat'
import chalk from 'chalk'
import gradient from 'gradient-string'
import { GroupsCommand } from './bot/commands/groups-command'
import { HelpCommand } from './bot/commands/help-command'
import { ManageCommand } from './bot/commands/manage-command'
import { AdminCommand } from './bot/commands/admin-command'
import { apiServer } from './api/server'

dotenv.config()

const PORT = process.env.PORT || 3001

class Main {
  private trackWallets: TrackWallets
  private cronJobs: CronJobs
  private callbackQueryHandler: CallbackQueryHandler
  private startCommand: StartCommand
  private addCommand: AddCommand
  private deleteCommand: DeleteCommand
  private groupsCommand: GroupsCommand
  private helpCommand: HelpCommand
  private manageCommand: ManageCommand
  private adminCommand: AdminCommand

  constructor() {
    // services
    this.cronJobs = new CronJobs()
    this.trackWallets = new TrackWallets()
    this.callbackQueryHandler = new CallbackQueryHandler(bot)
    this.startCommand = new StartCommand(bot)
    this.addCommand = new AddCommand(bot)
    this.deleteCommand = new DeleteCommand(bot)
    this.groupsCommand = new GroupsCommand(bot)
    this.helpCommand = new HelpCommand(bot)
    this.manageCommand = new ManageCommand(bot)
    this.adminCommand = new AdminCommand(bot)

    // Setup API server routes
    this.setupApiRoutes()
    
    // Start API server
    this.startServer()
  }

  private setupApiRoutes(): void {
    // Add Telegram webhook endpoint to API server
    apiServer.app.post(`/webhook/telegram`, async (req, res) => {
      try {
        bot.processUpdate(req.body)
        res.status(200).send('Update received')
      } catch (error) {
        console.log('Error processing update:', error)
        res.status(500).send('Error processing update')
      }
    })

    // Default endpoint
    apiServer.app.get('/', async (req, res) => {
      try {
        res.status(200).json({
          name: 'Solana Tracker API',
          version: '1.0.0',
          status: 'running',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/api/health',
            wallets: '/api/wallets',
            transactions: '/api/transactions/:signature',
            tokens: '/api/tokens/:mint/metadata',
            price: '/api/price/sol',
            stats: '/api/stats',
          },
          websocket: '/ws',
        })
      } catch (error) {
        console.error('Default route error', error)
        res.status(500).send('Error processing default route')
      }
    })
  }

  private startServer(): void {
    apiServer.start(PORT)
  }

  public async init(): Promise<void> {
    const gradientText = gradient.retro
    console.log(gradientText(ASCII_TEXT))

    // bot
    this.callbackQueryHandler.call()
    this.startCommand.start()
    this.addCommand.addCommandHandler()
    this.deleteCommand.deleteCommandHandler()
    this.groupsCommand.activateGroupCommandHandler()
    this.manageCommand.manageCommandHandler()
    this.helpCommand.groupHelpCommandHandler()
    this.helpCommand.notifyHelpCommandHander()
    this.adminCommand.banWalletCommandHandler()

    // cron jobs (SOL price cache only)
    await this.cronJobs.updateSolPrice()

    // setup
    await this.trackWallets.setupWalletWatcher({ event: 'initial' })
  }
}

const main = new Main()
main.init()
