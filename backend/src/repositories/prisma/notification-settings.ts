import prisma from '../../providers/prisma'

export class PrismaNotificationSettingsRepository {
  public async getSettings(userId: string) {
    try {
      let settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      })

      if (!settings) {
        settings = await prisma.notificationSettings.create({
          data: { userId },
        })
      }

      return settings
    } catch (error) {
      console.log('GET_NOTIFICATION_SETTINGS_ERROR', error)
      return null
    }
  }

  public async toggleDex(userId: string, dex: 'pumpfun' | 'pumpswap' | 'raydium' | 'jupiter' | 'sol_transfers') {
    try {
      const settings = await this.getSettings(userId)
      if (!settings) return null

      const fieldMap = {
        pumpfun: 'enablePumpFun',
        pumpswap: 'enablePumpSwap',
        raydium: 'enableRaydium',
        jupiter: 'enableJupiter',
        sol_transfers: 'enableSolTransfers',
      }

      const field = fieldMap[dex]
      const currentValue = settings[field as keyof typeof settings] as boolean

      return await prisma.notificationSettings.update({
        where: { userId },
        data: { [field]: !currentValue },
      })
    } catch (error) {
      console.log('TOGGLE_DEX_ERROR', error)
      return null
    }
  }

  public async setMinSolAmount(userId: string, amount: number) {
    try {
      await this.getSettings(userId)

      return await prisma.notificationSettings.update({
        where: { userId },
        data: { minSolAmount: amount },
      })
    } catch (error) {
      console.log('SET_MIN_SOL_AMOUNT_ERROR', error)
      return null
    }
  }

  public async setAdvancedFilter(
    userId: string,
    filter: {
      minMarketCap?: number
      maxMarketCap?: number
      minLiquidity?: number
      maxLiquidity?: number
      minHolders?: number
      maxHolders?: number
      minVolume24h?: number
      maxVolume24h?: number
      minTop10Percentage?: number
      maxTop10Percentage?: number
      minDevPercentage?: number
      maxDevPercentage?: number
      minAgeHours?: number
      maxAgeHours?: number
    }
  ) {
    try {
      await this.getSettings(userId)

      return await prisma.notificationSettings.update({
        where: { userId },
        data: filter,
      })
    } catch (error) {
      console.log('SET_ADVANCED_FILTER_ERROR', error)
      return null
    }
  }
}
