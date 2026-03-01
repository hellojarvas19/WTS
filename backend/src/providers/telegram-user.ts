/**
 * Telegram User API (MTProto) client for posting BUY messages to groups.
 * Uses API Key (apiId), API Hash, and Session String from https://my.telegram.org
 */
import dotenv from 'dotenv'

dotenv.config()

const API_ID = process.env.TELEGRAM_API_ID ? parseInt(process.env.TELEGRAM_API_ID, 10) : 0
const API_HASH = process.env.TELEGRAM_API_HASH ?? ''
const SESSION_STRING = process.env.TELEGRAM_SESSION_STRING ?? ''

let clientInstance: Awaited<ReturnType<typeof createClient>> | null = null
let isConnecting = false

async function createClient() {
  const { TelegramClient } = await import('telegram')
  const { StringSession } = await import('telegram/sessions')

  const session = new StringSession(SESSION_STRING)
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  })
  await client.connect()
  return client
}

async function getClient() {
  if (!API_ID || !API_HASH || !SESSION_STRING) {
    return null
  }

  // Prevent concurrent connection attempts - wait for ongoing connection to complete
  if (isConnecting) {
    // Wait for ongoing connection attempt to finish
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return clientInstance
  }

  // Check if client exists and is connected
  if (clientInstance) {
    try {
      // Test if connection is still alive
      if (clientInstance.connected) {
        return clientInstance
      }
      // Connection dropped, try to reconnect
      console.log('Telegram User API: reconnecting...')
      await clientInstance.connect()
      return clientInstance
    } catch (err) {
      console.error('Telegram User API: reconnection failed, creating new client', err)
      clientInstance = null
    }
  }

  // Create new client
  isConnecting = true
  try {
    clientInstance = await createClient()
    return clientInstance
  } catch (err) {
    console.error('Telegram User API: failed to connect', err)
    return null
  } finally {
    isConnecting = false
  }
}

/**
 * Send a message to a Telegram group using the User API.
 * @param groupChatId - Bot-API style group chat id (e.g. "-1001234567890")
 * @param text - HTML or plain text message
 * @returns true if sent, false if skipped or failed
 */
export async function sendMessageToGroup(groupChatId: string, text: string, photoUrl?: string): Promise<boolean> {
  const client = await getClient()
  if (!client) return false

  try {
    // GramJS: peer can be string (username) or numeric. Bot-API group ids are negative numbers.
    const peerId = groupChatId.startsWith('-') ? groupChatId : `-${groupChatId}`
    const peer = await client.getInputEntity(peerId)
    
    if (photoUrl) {
      try {
        // Telegram has 1024 character limit for photo captions
        const MAX_CAPTION_LENGTH = 1024
        
        if (text.length <= MAX_CAPTION_LENGTH) {
          // Send photo with caption (normal case)
          await client.sendMessage(peer, {
            message: text,
            parseMode: 'html',
            file: photoUrl,
          })
        } else {
          // Caption too long - send photo and text separately
          console.log(`Caption too long (${text.length} chars), sending photo and text separately`)
          
          // Send photo first
          await client.sendMessage(peer, {
            message: '',
            file: photoUrl,
          })
          
          // Then send text
          await client.sendMessage(peer, {
            message: text,
            parseMode: 'html',
          })
        }
        return true
      } catch (photoErr) {
        // If photo fails, fall back to text message
        console.log(`Photo send failed for group ${groupChatId}, sending text only:`, photoErr)
      }
    }
    
    // Send text only (either no photo or photo failed)
    await client.sendMessage(peer, {
      message: text,
      parseMode: 'html',
    })
    return true
  } catch (err) {
    console.error(`Telegram User API: failed to send to group ${groupChatId}:`, err)
    return false
  }
}

export function isTelegramUserConfigured(): boolean {
  return !!(API_ID && API_HASH && SESSION_STRING)
}
