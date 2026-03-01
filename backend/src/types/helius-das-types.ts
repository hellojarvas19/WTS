/**
 * Helius Digital Asset Standard (DAS) API Types
 * For fetching comprehensive token metadata and authority information
 */

/**
 * Helius DAS API Asset Response
 */
export interface HeliusDASAsset {
  interface: string
  id: string
  content: HeliusDASContent
  authorities: HeliusDASAuthority[]
  compression: HeliusDASCompression
  grouping: HeliusDASGrouping[]
  royalty: HeliusDASRoyalty
  creators: HeliusDASCreator[]
  ownership: HeliusDASOwnership
  supply: HeliusDASSupply | null
  mutable: boolean
  burnt: boolean
  token_info?: HeliusDASTokenInfo
}

export interface HeliusDASContent {
  $schema: string
  json_uri: string
  files: HeliusDASFile[]
  metadata: HeliusDASMetadata
  links?: HeliusDASLinks
}

export interface HeliusDASFile {
  uri: string
  cdn_uri?: string
  mime?: string
}

export interface HeliusDASMetadata {
  description?: string
  name: string
  symbol: string
  token_standard?: string
  attributes?: HeliusDASAttribute[]
}

export interface HeliusDASAttribute {
  value: string | number
  trait_type: string
}

export interface HeliusDASLinks {
  external_url?: string
  image?: string
  animation_url?: string
}

export interface HeliusDASAuthority {
  address: string
  scopes: string[]
}

export interface HeliusDASCompression {
  eligible: boolean
  compressed: boolean
  data_hash: string
  creator_hash: string
  asset_hash: string
  tree: string
  seq: number
  leaf_id: number
}

export interface HeliusDASGrouping {
  group_key: string
  group_value: string
}

export interface HeliusDASRoyalty {
  royalty_model: string
  target: string | null
  percent: number
  basis_points: number
  primary_sale_happened: boolean
  locked: boolean
}

export interface HeliusDASCreator {
  address: string
  share: number
  verified: boolean
}

export interface HeliusDASOwnership {
  frozen: boolean
  delegated: boolean
  delegate: string | null
  ownership_model: string
  owner: string
}

export interface HeliusDASSupply {
  print_max_supply: number
  print_current_supply: number
  edition_nonce: number | null
}

export interface HeliusDASTokenInfo {
  symbol: string
  balance: number
  supply: number
  decimals: number
  token_program: string
  associated_token_address?: string
  mint_authority?: string
  freeze_authority?: string
  price_info?: HeliusDASPriceInfo
}

export interface HeliusDASPriceInfo {
  price_per_token: number
  total_price?: number
  currency: string
}

/**
 * Helius DAS API Request/Response types
 */
export interface HeliusDASGetAssetRequest {
  id: string
  displayOptions?: {
    showFungible?: boolean
    showNativeBalance?: boolean
    showUnverifiedCollections?: boolean
  }
}

export interface HeliusDASGetAssetResponse {
  jsonrpc: string
  result: HeliusDASAsset
  id: string
}

export interface HeliusDASSearchAssetsRequest {
  ownerAddress?: string
  creatorAddress?: string
  tokenType?: 'fungible' | 'nonFungible' | 'regularNft' | 'compressedNft' | 'all'
  page?: number
  limit?: number
  displayOptions?: {
    showFungible?: boolean
    showNativeBalance?: boolean
  }
}

export interface HeliusDASSearchAssetsResponse {
  jsonrpc: string
  result: {
    total: number
    limit: number
    page: number
    items: HeliusDASAsset[]
  }
  id: string
}

/**
 * Helius Token Metadata API (Enhanced endpoint)
 */
export interface HeliusTokenMetadata {
  account: string
  onChainAccountInfo?: {
    accountInfo: {
      key: string
      isSigner: boolean
      isWritable: boolean
      lamports: number
      data: {
        parsed: {
          info: {
            decimals: number
            freezeAuthority: string | null
            isInitialized: boolean
            mintAuthority: string | null
            supply: string
          }
          type: string
        }
        program: string
        space: number
      }
      owner: string
      executable: boolean
      rentEpoch: number
    }
  }
  onChainMetadata?: {
    metadata: {
      tokenStandard: string
      key: string
      updateAuthority: string
      mint: string
      data: {
        name: string
        symbol: string
        uri: string
        sellerFeeBasisPoints: number
        creators: Array<{
          address: string
          verified: boolean
          share: number
        }>
      }
      primarySaleHappened: boolean
      isMutable: boolean
      editionNonce: number | null
      collection: {
        key: string
        verified: boolean
      } | null
      collectionDetails: any | null
      uses: any | null
    }
    uri?: {
      name?: string
      symbol?: string
      description?: string
      image?: string
      external_url?: string
      attributes?: Array<{
        trait_type: string
        value: string | number
      }>
      properties?: {
        files?: Array<{
          uri: string
          type: string
        }>
      }
    }
  }
  offChainMetadata?: {
    uri?: string
    metadata?: {
      name?: string
      symbol?: string
      description?: string
      image?: string
      external_url?: string
      twitter?: string
      telegram?: string
      website?: string
      attributes?: any[]
    }
  }
  legacyMetadata?: {
    mint: string
    name: string
    symbol: string
    decimals: number
    tokenType: string
    logoURI?: string
    updateAuthority?: string
  }
}

export interface HeliusTokenMetadataResponse {
  result: HeliusTokenMetadata[]
}

/**
 * Helius Fungible Token Extension (for market data)
 */
export interface HeliusFungibleTokenData {
  mint: string
  pricePerToken: number
  totalPrice: number
  amount: number
  decimals: number
  tokenProgram: string
}

/**
 * Parsed Helius data for unified interface
 */
export interface ParsedHeliusData {
  // Basic Info
  name: string
  symbol: string
  description?: string
  image?: string
  
  // Authorities (key security data)
  mintAuthority: string | null
  freezeAuthority: string | null
  updateAuthority: string | null
  
  // Supply Info
  decimals: number
  totalSupply: number
  
  // Creator/Dev Info
  creators: Array<{
    address: string
    share: number
    verified: boolean
  }>
  
  // Metadata
  isMutable: boolean
  
  // Price (if available from DAS)
  priceUsd?: number
  
  // Social Links (from metadata URI)
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  
  // Additional flags
  burnt: boolean
  frozen: boolean
}
