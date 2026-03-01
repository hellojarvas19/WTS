import SolanaWeb3 from '@solana/web3.js'

export class CreateWallet {
  constructor() {}

  public create() {
    const keypair = SolanaWeb3.Keypair.generate()

    const publicKey = keypair.publicKey.toString()
    const privateKey = Buffer.from(keypair.secretKey).toString('base64')

    // Note: Only log public key for debugging, NEVER log private keys
    console.log('Wallet created with Public Key:', publicKey)

    return { publicKey, privateKey }
  }
}
