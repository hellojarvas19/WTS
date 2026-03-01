import { Connection, PublicKey } from '@solana/web3.js'

import { RateLimitMessages } from '../bot/messages/rate-limit-messages'
import { TxPerSecondCapInterface } from '../types/general-interfaces'
import { MAX_5_MIN_TXS_ALLOWED, MAX_TPS_ALLOWED, MAX_TPS_FOR_BAN, WALLET_SLEEP_TIME } from '../constants/handi-cat'
import { PrismaWalletRepository } from '../repositories/prisma/wallet'
import { BANNED_WALLETS } from '../constants/banned-wallets'
import { RpcConnectionManager } from '../providers/solana'

export class RateLimit {
  private prismaWalletRepository: PrismaWalletRepository

  constructor(private subscriptions: Map<string, number>) {
    this.prismaWalletRepository = new PrismaWalletRepository()
  }

  public async last5MinutesTxs(walletAddress: string) {
    const currentTime = Date.now()

    // Calculate the time 5 minutes ago
    const fiveMinutesAgo = currentTime - 1 * 60 * 1000

    const signatures = await RpcConnectionManager.getRandomConnection().getSignaturesForAddress(
      new PublicKey(walletAddress),
      {
        limit: MAX_5_MIN_TXS_ALLOWED,
      },
    )

    // Filter the transactions that occurred in the last 5 minutes
    const recentTransactions = signatures.filter((signatureInfo) => {
      const transactionTime = signatureInfo.blockTime! * 1000 // Convert seconds to milliseconds
      return transactionTime >= fiveMinutesAgo
    })

    return recentTransactions.length
  }

  public async txPerSecondCap({ bot, excludedWallets, wallet, walletData }: TxPerSecondCapInterface): Promise<boolean> {
    walletData.count++
    const elapsedTime = (Date.now() - walletData.startTime) / 1000 // seconds

    if (elapsedTime >= 1) {
      const tps = walletData.count / elapsedTime
      console.log(`TPS for wallet ${wallet.address}: ${tps.toFixed(2)}`)

      if (tps >= MAX_TPS_FOR_BAN) {
        excludedWallets.set(wallet.address, true)
        console.log(`Wallet ${wallet.address} has been banned.`)
        BANNED_WALLETS.add(wallet.address)
        
        // Await database update to ensure consistency
        try {
          await this.prismaWalletRepository.pauseUserWalletSpam(wallet.id, 'BANNED')
        } catch (error) {
          console.error(`Failed to pause wallet ${wallet.id} in database:`, error)
        }
        
        for (const user of wallet.userWallets) {
          bot.sendMessage(user.userId, RateLimitMessages.walletWasBanned(wallet.address), { parse_mode: 'HTML' })
            .catch((err) => console.error(`Failed to send ban message to user ${user.userId}:`, err))
        }

        // Return true to stop processing for this banned wallet
        return true
      }

      if (tps >= MAX_TPS_ALLOWED) {
        excludedWallets.set(wallet.address, true)
        console.log(`Wallet ${wallet.address} excluded for 2 hours due to high TPS.`)

        // Await database update to ensure consistency
        try {
          await this.prismaWalletRepository.pauseUserWalletSpam(wallet.id, 'SPAM_PAUSED')
        } catch (error) {
          console.error(`Failed to pause wallet ${wallet.id} in database:`, error)
        }
        
        for (const user of wallet.userWallets) {
          bot.sendMessage(user.userId, RateLimitMessages.walletWasPaused(wallet.address), { parse_mode: 'HTML' })
            .catch((err) => console.error(`Failed to send pause message to user ${user.userId}:`, err))
        }

        setTimeout(async () => {
          excludedWallets.delete(wallet.address)

          for (const user of wallet.userWallets) {
            try {
              const walletUpdated = await this.prismaWalletRepository.resumeUserWallet(user.userId, wallet.id)
              if (!walletUpdated) continue
              bot.sendMessage(user.userId, RateLimitMessages.walletWasResumed(wallet.address), {
                parse_mode: 'HTML',
              }).catch((err) => console.error(`Failed to send resume message to user ${user.userId}:`, err))
            } catch (error) {
              console.error(`Failed to resume wallet for user ${user.userId}:`, error)
            }
          }

          console.log(`Wallet ${wallet.address} re-included after 2 hours.`)
        }, WALLET_SLEEP_TIME)

        // Stop processing for this wallet
        return true
      }

      // Reset for next interval
      walletData.count = 0
      walletData.startTime = Date.now()
    }

    return false
  }
}
