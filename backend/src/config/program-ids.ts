// PumpFun Programs
export const PUMP_FUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
export const PUMPFUN_AMM_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA'
export const PUMP_FUN_TOKEN_MINT_AUTH = 'TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM'

// Raydium Programs (multiple versions)
export const RAYDIUM_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8' // AMM V4
export const RAYDIUM_CLMM_PROGRAM_ID = 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK' // Concentrated Liquidity
export const RAYDIUM_CPMM_PROGRAM_ID = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C' // CPMM
export const RAYDIUM_AMM_ROUTING = 'routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS' // AMM Routing

// Jupiter Programs (multiple versions)
export const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' // V6
export const JUPITER_V4_PROGRAM_ID = 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB' // V4
export const JUPITER_LIMIT_ORDER = 'j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X' // Limit Order

// Orca Programs
export const ORCA_WHIRLPOOL_PROGRAM_ID = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'

// Meteora Programs  
export const METEORA_DLMM_PROGRAM_ID = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'
export const METEORA_POOLS_PROGRAM_ID = 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'

// All Raydium program IDs for detection
export const RAYDIUM_PROGRAM_IDS = [
  RAYDIUM_PROGRAM_ID,
  RAYDIUM_CLMM_PROGRAM_ID,
  RAYDIUM_CPMM_PROGRAM_ID,
  RAYDIUM_AMM_ROUTING,
]

// All Jupiter program IDs for detection
export const JUPITER_PROGRAM_IDS = [
  JUPITER_PROGRAM_ID,
  JUPITER_V4_PROGRAM_ID,
  JUPITER_LIMIT_ORDER,
]

export const PUMP_CURVE_TOKEN_DECIMALS = 6

// Calculated as the first 8 bytes of: `sha256("account:BondingCurve")`.
export const PUMP_CURVE_STATE_SIGNATURE = Uint8Array.from([0x17, 0xb7, 0xf8, 0x37, 0x60, 0xd8, 0xac, 0x60])

export const PUMP_CURVE_STATE_SIZE = 0x29
export const PUMP_CURVE_STATE_OFFSETS = {
  VIRTUAL_TOKEN_RESERVES: 0x08,
  VIRTUAL_SOL_RESERVES: 0x10,
  REAL_TOKEN_RESERVES: 0x18,
  REAL_SOL_RESERVES: 0x20,
  TOKEN_TOTAL_SUPPLY: 0x28,
  COMPLETE: 0x30,
}
