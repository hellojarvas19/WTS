import dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import WebSocket from 'ws'
import { PrismaClient } from '@prisma/client'
import { Connection, PublicKey } from '@solana/web3.js'
import { RpcConnectionManager } from '../providers/solana'
import { TokenMetadataService } from '../lib/token-metadata'
import { TokenAnalysisService } from '../lib/token-analysis'
import { CronJobs } from '../lib/cron-jobs'
import chalk from 'chalk'

dotenv.config()

const prisma = new PrismaClient()
const tokenMetadataService = new TokenMetadataService()
const tokenAnalysisService = new TokenAnalysisService()

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET CLIENT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

interface WSClient extends WebSocket {
  id?: string
  subscriptions?: Set<string>
}

// ═══════════════════════════════════════════════════════════════════════════════
// API SERVER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class ApiServer {
  public app: Express
  public httpServer: ReturnType<typeof createServer>
  public wss: WebSocket.Server
  private clients: Map<string, WSClient> = new Map()

  constructor() {
    this.app = express()
    this.httpServer = createServer(this.app)
    this.wss = new WebSocket.Server({ 
      server: this.httpServer,
      path: '/ws'
    })
    this.setupMiddleware()
    this.setupRoutes()
    this.setupWebSocket()
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    }))
    this.app.use(express.json({ limit: '50mb' }))
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REST API ROUTES
  // ═══════════════════════════════════════════════════════════════════════════════

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        solPrice: CronJobs.getSolPrice(),
        connections: this.clients.size,
      })
    })

    // Get all wallets
    this.app.get('/api/wallets', async (req: Request, res: Response) => {
      try {
        const wallets = await prisma.wallet.findMany({
          include: {
            userWallets: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        })
        res.json(wallets)
      } catch (error) {
        console.error('Error fetching wallets:', error)
        res.status(500).json({ error: 'Failed to fetch wallets' })
      }
    })

    // Get wallet by address
    this.app.get('/api/wallets/:address', async (req: Request, res: Response) => {
      try {
        const { address } = req.params
        const wallet = await prisma.wallet.findFirst({
          where: { address },
          include: {
            userWallets: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        })
        if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' })
        }
        res.json(wallet)
      } catch (error) {
        console.error('Error fetching wallet:', error)
        res.status(500).json({ error: 'Failed to fetch wallet' })
      }
    })

    // Get wallet transactions
    this.app.get('/api/wallets/:address/transactions', async (req: Request, res: Response) => {
      try {
        const { address } = req.params
        const limit = parseInt(req.query.limit as string) || 10
        
        const connection = RpcConnectionManager.getRandomConnection()
        const publicKey = new PublicKey(address)
        
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit })
        
        const transactions = await Promise.all(
          signatures.map(async (sigInfo) => {
            const tx = await connection.getParsedTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            })
            if (!tx) return null
            
            return {
              signature: sigInfo.signature,
              timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
              status: tx.meta?.err ? 'failed' : 'confirmed',
              fee: tx.meta?.fee || 0,
              slot: sigInfo.slot,
            }
          })
        )
        
        res.json(transactions.filter(Boolean))
      } catch (error) {
        console.error('Error fetching transactions:', error)
        res.status(500).json({ error: 'Failed to fetch transactions' })
      }
    })

    // Get transaction details
    this.app.get('/api/transactions/:signature', async (req: Request, res: Response) => {
      try {
        const { signature } = req.params
        const connection = RpcConnectionManager.getRandomConnection()
        
        const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        })
        
        if (!tx) {
          return res.status(404).json({ error: 'Transaction not found' })
        }
        
        res.json(tx)
      } catch (error) {
        console.error('Error fetching transaction:', error)
        res.status(500).json({ error: 'Failed to fetch transaction' })
      }
    })

    // Get token metadata
    this.app.get('/api/tokens/:mint/metadata', async (req: Request, res: Response) => {
      try {
        const { mint } = req.params
        const metadata = await tokenMetadataService.getTokenMetadata(mint)
        res.json(metadata)
      } catch (error) {
        console.error('Error fetching token metadata:', error)
        res.status(500).json({ error: 'Failed to fetch token metadata' })
      }
    })

    // Get token analysis
    this.app.get('/api/tokens/:mint/analysis', async (req: Request, res: Response) => {
      try {
        const { mint } = req.params
        const analysis = await tokenAnalysisService.analyzeToken(mint)
        res.json(analysis)
      } catch (error) {
        console.error('Error analyzing token:', error)
        res.status(500).json({ error: 'Failed to analyze token' })
      }
    })

    // Get SOL price
    this.app.get('/api/price/sol', (req: Request, res: Response) => {
      res.json({
        price: CronJobs.getSolPrice(),
        timestamp: Date.now(),
      })
    })

    // Get wallet balance
    this.app.get('/api/wallets/:address/balance', async (req: Request, res: Response) => {
      try {
        const { address } = req.params
        const connection = RpcConnectionManager.getRandomConnection()
        const publicKey = new PublicKey(address)
        
        const balance = await connection.getBalance(publicKey)
        const solPrice = CronJobs.getSolPrice() || 0
        
        res.json({
          lamports: balance,
          sol: balance / 1e9,
          usd: (balance / 1e9) * solPrice,
        })
      } catch (error) {
        console.error('Error fetching balance:', error)
        res.status(500).json({ error: 'Failed to fetch balance' })
      }
    })

    // Get token accounts for wallet
    this.app.get('/api/wallets/:address/tokens', async (req: Request, res: Response) => {
      try {
        const { address } = req.params
        const connection = RpcConnectionManager.getRandomConnection()
        const publicKey = new PublicKey(address)
        
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        )
        
        const tokens = tokenAccounts.value.map((account) => {
          const parsedInfo = account.account.data.parsed.info
          return {
            mint: parsedInfo.mint,
            amount: parsedInfo.tokenAmount.uiAmount,
            decimals: parsedInfo.tokenAmount.decimals,
            address: account.pubkey.toString(),
          }
        })
        
        res.json(tokens)
      } catch (error) {
        console.error('Error fetching token accounts:', error)
        res.status(500).json({ error: 'Failed to fetch token accounts' })
      }
    })

    // Get tracked wallets count
    this.app.get('/api/stats', async (req: Request, res: Response) => {
      try {
        const walletCount = await prisma.wallet.count()
        const userCount = await prisma.user.count()
        
        res.json({
          wallets: walletCount,
          users: userCount,
          connections: this.clients.size,
          solPrice: CronJobs.getSolPrice(),
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        res.status(500).json({ error: 'Failed to fetch stats' })
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // WEBSOCKET SETUP
  // ═══════════════════════════════════════════════════════════════════════════════

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as WSClient
      const clientId = Math.random().toString(36).substring(2, 15)
      client.id = clientId
      client.subscriptions = new Set()
      
      this.clients.set(clientId, client)
      console.log(chalk.cyan(`WebSocket client connected: ${clientId}`))
      console.log(chalk.gray(`Total connections: ${this.clients.size}`))

      // Send welcome message
      this.sendToClient(client, {
        type: 'connected',
        data: { clientId, timestamp: Date.now() },
      })

      // Handle messages
      client.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleWebSocketMessage(client, message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          this.sendToClient(client, {
            type: 'error',
            data: { message: 'Invalid message format' },
          })
        }
      })

      // Handle disconnection
      client.on('close', () => {
        this.clients.delete(clientId)
        console.log(chalk.red(`WebSocket client disconnected: ${clientId}`))
        console.log(chalk.gray(`Total connections: ${this.clients.size}`))
      })

      // Handle errors
      client.on('error', (error: Error) => {
        console.error(`WebSocket error for client ${clientId}:`, error)
      })
    })
  }

  private handleWebSocketMessage(ws: WSClient, message: any): void {
    const { action, wallet } = message

    switch (action) {
      case 'subscribe-wallet':
        if (wallet) {
          ws.subscriptions?.add(`wallet:${wallet}`)
          this.sendToClient(ws, {
            type: 'subscribed',
            data: { wallet, subscription: 'wallet' },
          })
          console.log(chalk.green(`Client ${ws.id} subscribed to wallet: ${wallet}`))
        }
        break

      case 'unsubscribe-wallet':
        if (wallet) {
          ws.subscriptions?.delete(`wallet:${wallet}`)
          this.sendToClient(ws, {
            type: 'unsubscribed',
            data: { wallet, subscription: 'wallet' },
          })
          console.log(chalk.yellow(`Client ${ws.id} unsubscribed from wallet: ${wallet}`))
        }
        break

      case 'subscribe-transactions':
        if (wallet) {
          ws.subscriptions?.add(`transactions:${wallet}`)
          this.sendToClient(ws, {
            type: 'subscribed',
            data: { wallet, subscription: 'transactions' },
          })
          console.log(chalk.green(`Client ${ws.id} subscribed to transactions for: ${wallet}`))
        }
        break

      case 'unsubscribe-transactions':
        if (wallet) {
          ws.subscriptions?.delete(`transactions:${wallet}`)
          this.sendToClient(ws, {
            type: 'unsubscribed',
            data: { wallet, subscription: 'transactions' },
          })
          console.log(chalk.yellow(`Client ${ws.id} unsubscribed from transactions for: ${wallet}`))
        }
        break

      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: Date.now() },
        })
        break

      default:
        this.sendToClient(ws, {
          type: 'error',
          data: { message: `Unknown action: ${action}` },
        })
    }
  }

  private sendToClient(ws: WSClient, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BROADCAST METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  public broadcastToWallet(walletAddress: string, message: any): void {
    const walletSub = `wallet:${walletAddress}`
    const txSub = `transactions:${walletAddress}`

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const subs = client.subscriptions
        if (subs?.has(walletSub) || subs?.has(txSub)) {
          this.sendToClient(client, message)
        }
      }
    })
  }

  public broadcastTransaction(walletAddress: string, transaction: any): void {
    this.broadcastToWallet(walletAddress, {
      type: 'new-transaction',
      data: {
        wallet: walletAddress,
        transaction,
        timestamp: Date.now(),
      },
    })
  }

  public broadcastWalletUpdate(walletAddress: string, data: any): void {
    this.broadcastToWallet(walletAddress, {
      type: 'wallet-update',
      data: {
        wallet: walletAddress,
        ...data,
        timestamp: Date.now(),
      },
    })
  }

  public broadcastToAll(message: any): void {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message)
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SERVER START
  // ═══════════════════════════════════════════════════════════════════════════════

  public start(port: number = 3001): void {
    this.httpServer.listen(port, () => {
      console.log(chalk.bold.white.bgMagenta(`API Server running on http://localhost:${port}`))
      console.log(chalk.bold.white.bgCyan(`WebSocket server ready on ws://localhost:${port}/ws`))
    })
  }
}

// Export singleton instance
export const apiServer = new ApiServer()
