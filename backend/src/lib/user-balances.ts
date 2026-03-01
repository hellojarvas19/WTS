import { PublicKey } from '@solana/web3.js'
import { RpcConnectionManager } from '../providers/solana'

export class UserBalances {
  constructor() {}

  /**
   * Get the SOL balance for a wallet address
   * @param walletAddress - The wallet public key as a string
   * @returns Balance in lamports, or undefined if fetch fails
   */
  public async userPersonalSolBalance(walletAddress: string): Promise<number | undefined> {
    try {
      // Validate wallet address
      if (!walletAddress || walletAddress.trim() === '') {
        console.error('USER_FETCH_BALANCE_ERROR: Empty wallet address')
        return undefined
      }
      
      const publicKey = new PublicKey(walletAddress)

      const balance = await RpcConnectionManager.getRandomConnection().getBalance(publicKey)

      // Return balance in lamports (caller converts to SOL if needed)
      return balance
    } catch (error) {
      console.error('USER_FETCH_BALANCE_ERROR', error)
      return undefined
    }
  }
}
