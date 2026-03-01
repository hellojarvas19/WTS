import { TokenUtils } from './token-utils'
import dotenv from 'dotenv'

dotenv.config()

export class CronJobs {
  private static cachedPrice: string | undefined = undefined
  private static lastFetched: number = 0
  private static readonly refreshInterval: number = 5 * 60 * 1000 // 5 minutes
  private static readonly DEFAULT_SOL_PRICE = '100' // Fallback price if all sources fail

  public async updateSolPrice(): Promise<string> {
    const now = Date.now()

    if (CronJobs.cachedPrice && now - CronJobs.lastFetched < CronJobs.refreshInterval) {
      return CronJobs.cachedPrice
    }

    try {
      let solPrice = await TokenUtils.getSolPriceGecko()

      if (!solPrice) {
        solPrice = await TokenUtils.getSolPriceRpc()
      }

      if (solPrice) {
        CronJobs.cachedPrice = solPrice
        CronJobs.lastFetched = now
        return CronJobs.cachedPrice
      }

      // If both sources failed but we have a cached price, return it
      if (CronJobs.cachedPrice) {
        console.warn('Using stale cached SOL price as all sources failed')
        return CronJobs.cachedPrice
      }

      // Last resort: use default price
      console.warn('All SOL price sources failed, using default price')
      return CronJobs.DEFAULT_SOL_PRICE
    } catch (error) {
      console.error('Error fetching Solana price:', error)

      if (CronJobs.cachedPrice) {
        return CronJobs.cachedPrice
      }

      // Return default price on error
      return CronJobs.DEFAULT_SOL_PRICE
    }
  }

  static getSolPrice(): string {
    // Return cached price or default if not yet fetched
    return this.cachedPrice ?? this.DEFAULT_SOL_PRICE
  }
}
