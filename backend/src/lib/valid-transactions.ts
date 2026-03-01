// Transaction validation for DeFi swap detection

import { Logs, PublicKey } from '@solana/web3.js'
import { SwapType } from '../types/swap-types'
import {
  JUPITER_PROGRAM_ID,
  JUPITER_PROGRAM_IDS,
  PUMP_FUN_PROGRAM_ID,
  PUMP_FUN_TOKEN_MINT_AUTH,
  PUMPFUN_AMM_PROGRAM_ID,
  RAYDIUM_PROGRAM_ID,
  RAYDIUM_PROGRAM_IDS,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  METEORA_DLMM_PROGRAM_ID,
  METEORA_POOLS_PROGRAM_ID,
} from '../config/program-ids'

export class ValidTransactions {
  constructor(private programIds: any) {
    this.programIds = programIds
  }

  static isRelevantTransaction(logs: Logs): { isRelevant: boolean; swap: SwapType } {
    if (!logs.logs || logs.logs.length === 0) {
      return { isRelevant: false, swap: null }
    }

    const logString = logs.logs.join(' ')

    // Check PumpFun AMM (PumpSwap) first
    if (logString.includes(PUMPFUN_AMM_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'pumpfun_amm' }
    }
    
    // Check PumpFun token mint
    if (logString.includes(PUMP_FUN_TOKEN_MINT_AUTH)) {
      return { isRelevant: true, swap: 'mint_pumpfun' }
    }
    
    // Check original PumpFun bonding curve
    if (logString.includes(PUMP_FUN_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'pumpfun' }
    }
    
    // Check all Jupiter programs (V4, V6, Limit Orders)
    for (const jupiterId of JUPITER_PROGRAM_IDS) {
      if (logString.includes(jupiterId)) {
        return { isRelevant: true, swap: 'jupiter' }
      }
    }
    
    // Check all Raydium programs (AMM V4, CLMM, CPMM, Routing)
    for (const raydiumId of RAYDIUM_PROGRAM_IDS) {
      if (logString.includes(raydiumId)) {
        return { isRelevant: true, swap: 'raydium' }
      }
    }
    
    // Check Orca Whirlpool - treat as raydium for parsing (similar structure)
    if (logString.includes(ORCA_WHIRLPOOL_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'raydium' }
    }
    
    // Check Meteora programs - treat as raydium for parsing (similar structure)
    if (logString.includes(METEORA_DLMM_PROGRAM_ID) || logString.includes(METEORA_POOLS_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'raydium' }
    }

    // SOL transfers - exclude bulk transfers (more than 2 system program invocations)
    let systemProgramCount = 0

    for (const log of logs.logs) {
      if (log.includes('11111111111111111111111111111111')) {
        systemProgramCount++
        if (systemProgramCount > 2) break
      }
    }

    if (systemProgramCount > 0 && systemProgramCount <= 2) {
      return { isRelevant: true, swap: 'sol_transfer' }
    }

    return { isRelevant: false, swap: null }
  }

  public getDefiTransaction(): { valid: boolean; swap: SwapType } {
    const pumpFunProgramId = new PublicKey(PUMP_FUN_PROGRAM_ID)
    const pumpFunAmmProgramId = new PublicKey(PUMPFUN_AMM_PROGRAM_ID)
    const pumpFunTokenMintAuth = new PublicKey(PUMP_FUN_TOKEN_MINT_AUTH)
    
    // Create PublicKey arrays for multi-program DEXs
    const raydiumProgramIds = RAYDIUM_PROGRAM_IDS.map(id => new PublicKey(id))
    const jupiterProgramIds = JUPITER_PROGRAM_IDS.map(id => new PublicKey(id))
    const orcaWhirlpool = new PublicKey(ORCA_WHIRLPOOL_PROGRAM_ID)
    const meteoraDlmm = new PublicKey(METEORA_DLMM_PROGRAM_ID)
    const meteoraPools = new PublicKey(METEORA_POOLS_PROGRAM_ID)

    // Check PumpFun AMM
    const pumpFunAmmTransaction = this.programIds && this.programIds.some((id: any) => id.equals(pumpFunAmmProgramId))
    if (pumpFunAmmTransaction) {
      console.log('detected pumpfun_amm transaction')
      return { valid: true, swap: 'pumpfun_amm' }
    }

    // Check PumpFun mint
    const pumpFunMinted = this.programIds && this.programIds.some((id: any) => id.equals(pumpFunTokenMintAuth))
    if (pumpFunMinted) {
      console.log('detected token mint transaction')
      return { valid: true, swap: 'mint_pumpfun' }
    }
    
    // Check PumpFun bonding curve
    const pumpFunTransaction = this.programIds && this.programIds.some((id: any) => id.equals(pumpFunProgramId))
    if (pumpFunTransaction) {
      console.log('detected pumpfun transaction')
      return { valid: true, swap: 'pumpfun' }
    }
    
    // Check Jupiter (all versions)
    const jupiterTransaction = this.programIds && this.programIds.some((id: any) => 
      jupiterProgramIds.some(jup => id.equals(jup))
    )
    if (jupiterTransaction) {
      console.log('detected jupiter transaction')
      return { valid: true, swap: 'jupiter' }
    }
    
    // Check Raydium (all versions)
    const raydiumTransaction = this.programIds && this.programIds.some((id: any) => 
      raydiumProgramIds.some(ray => id.equals(ray))
    )
    if (raydiumTransaction) {
      console.log('detected raydium transaction')
      return { valid: true, swap: 'raydium' }
    }
    
    // Check Orca
    const orcaTransaction = this.programIds && this.programIds.some((id: any) => id.equals(orcaWhirlpool))
    if (orcaTransaction) {
      console.log('detected orca transaction')
      return { valid: true, swap: 'raydium' } // Use raydium parser
    }
    
    // Check Meteora
    const meteoraTransaction = this.programIds && this.programIds.some((id: any) => 
      id.equals(meteoraDlmm) || id.equals(meteoraPools)
    )
    if (meteoraTransaction) {
      console.log('detected meteora transaction')
      return { valid: true, swap: 'raydium' } // Use raydium parser
    }

    return { valid: false, swap: null }
  }
}
