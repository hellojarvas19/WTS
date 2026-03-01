import { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { HandiCatStatus } from '@prisma/client'

export const START_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🔮 Add', callback_data: 'add' },
      { text: '👀 Manage', callback_data: 'manage' },
    ],
    [
      { text: '👛 My Wallet', callback_data: 'my_wallet' },
      { text: '⚙️ Settings', callback_data: 'settings' },
    ],
    [
      { text: '🆕 Groups', callback_data: 'groups' },
      { text: '🔎 Help', callback_data: 'help' },
    ],
  ],
}

export const SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_to_main_menu' }]],
}

export const createTxSubMenu = (tokenSymbol: string, tokenMint: string) => {
  const txSubMenu: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: `🐴 Buy on Trojan: ${tokenSymbol}`,
          url: `https://t.me/solana_trojanbot?start=r-handicatbt-${tokenMint}`,
        },
      ],
      [
        { text: `🐶 BonkBot: ${tokenSymbol}`, url: `https://t.me/bonkbot_bot?start=ref_3au54_ca_${tokenMint}` },
        {
          text: `⭐ Axiom: ${tokenSymbol}`,
          url: `https://axiom.trade/t/${tokenMint}/@handi`,
        },
      ],
      [
        {
          text: `🦖 GMGN: ${tokenSymbol}`,
          url: `https://t.me/GMGN_sol_bot?start=i_kxPdcLKf_c_${tokenMint}`,
        },
      ],
    ],
  }

  return txSubMenu
}

export const MANAGE_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🔮 Add', callback_data: 'add' },
      { text: '🗑️ Delete', callback_data: 'delete' },
    ],

    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const USER_SETTINGS_MENU = (botStatus: HandiCatStatus): InlineKeyboardMarkup => {
  return {
    inline_keyboard: [
      [
        {
          text: `${botStatus === 'ACTIVE' ? '⏸️ Pause Handi Cat' : '▶️ Resume Handi Cat'}`,
          callback_data: 'pause-resume-bot',
        },
      ],
      [
        {
          text: '🔔 Notification Filters',
          callback_data: 'notification_filters',
        },
      ],
      [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
    ],
  }
}

export const NOTIFICATION_FILTERS_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🎯 DEX Filters', callback_data: 'dex_filters' },
      { text: '💰 Min SOL Amount', callback_data: 'min_sol_amount' },
    ],
    [
      { text: '📊 Advanced Filters', callback_data: 'advanced_filters' },
    ],
    [{ text: '🔙 Back', callback_data: 'settings' }],
  ],
}

export const ADVANCED_FILTERS_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '💰 Market Cap', callback_data: 'filter_market_cap' },
      { text: '💧 Liquidity', callback_data: 'filter_liquidity' },
    ],
    [
      { text: '👥 Holders', callback_data: 'filter_holders' },
      { text: '📈 Volume 24h', callback_data: 'filter_volume' },
    ],
    [
      { text: '📊 Top 10%', callback_data: 'filter_top10' },
      { text: '👨‍💻 Dev%', callback_data: 'filter_dev' },
    ],
    [
      { text: '⏱️ Token Age', callback_data: 'filter_age' },
    ],
    [
      { text: '🔄 Reset All Filters', callback_data: 'reset_advanced_filters' },
    ],
    [{ text: '🔙 Back', callback_data: 'notification_filters' }],
  ],
}

export const DEX_FILTERS_MENU = (settings: {
  enablePumpFun: boolean
  enablePumpSwap: boolean
  enableRaydium: boolean
  enableJupiter: boolean
  enableSolTransfers: boolean
}): InlineKeyboardMarkup => {
  return {
    inline_keyboard: [
      [
        {
          text: `${settings.enablePumpFun ? '✅' : '❌'} Pump.fun`,
          callback_data: 'toggle_pumpfun',
        },
        {
          text: `${settings.enablePumpSwap ? '✅' : '❌'} PumpSwap`,
          callback_data: 'toggle_pumpswap',
        },
      ],
      [
        {
          text: `${settings.enableRaydium ? '✅' : '❌'} Raydium`,
          callback_data: 'toggle_raydium',
        },
        {
          text: `${settings.enableJupiter ? '✅' : '❌'} Jupiter`,
          callback_data: 'toggle_jupiter',
        },
      ],
      [
        {
          text: `${settings.enableSolTransfers ? '✅' : '❌'} SOL Transfers`,
          callback_data: 'toggle_sol_transfers',
        },
      ],
      [{ text: '🔙 Back', callback_data: 'notification_filters' }],
    ],
  }
}

export const USER_WALLET_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: '🔑 Show private key',
        callback_data: 'show_private_key',
      },
    ],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const GROUPS_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: '🗑️ Delete Group',
        callback_data: 'delete_group',
      },
    ],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}
