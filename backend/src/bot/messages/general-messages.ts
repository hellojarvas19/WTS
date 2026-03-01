import { UserPrisma } from '../../types/prisma-types'
import { UserGroup } from '../../types/general-interfaces'

export class GeneralMessages {
  constructor() {}

  static startMessage(user: UserPrisma): string {
    const walletCount = user?._count?.userWallets ?? 0
    return `
🐱 Handi Cat | Wallet Tracker

Get real time activity notifications for any wallet you add!

You are currently tracking <b>${walletCount} wallets</b> ✨

<b>Commands:</b>
- /add — Add a wallet
- /delete — Remove a wallet
- /manage — View wallets
- /activate — Add this bot to a group (BUY alerts only)
`
  }

  static startMessageGroup = `
🐱 Handi Cat | Wallet Tracker

Get real time activity notifications for any wallet you add!

<b>Commands:</b>
- /add — Add a new wallet
- /delete — Delete a wallet
- /manage — View all wallets
- /activate — Activate this group to receive BUY alerts
`

  static generalMessageError: string = `
😿 Ooops it seems that something went wrong while processing the transaction.

You probaly don't have sufficient balance in your wallet or it can't cover the transaction fees.

Maybe try adding some <b>SOL</b> to your Handi Cat personal wallet 😺
`

  static botWalletError: string = `
😿 Oops! it seems that this wallet is spamming to many tps, Please enter another wallet or try again later.
`

  static groupsMessage(userGroups: UserGroup[]) {
    const groupsContent =
      userGroups.length === 0
        ? `     
<i>You do not have any groups yet.</i>
`
        : userGroups
            .map(
              (group) => `
✅ Group Name: <b>${group.name}</b>
🔗 Group ID: <code>${group.id}</code>

`,
            )
            .join('\n\n')

    return `
You can use <b>Handi Cat</b> in group chats for BUY alerts.

Your groups: ${userGroups.length}
${groupsContent}
Learn how to add Handi Cat to a group: /help_group
`
  }

  static groupChatNotStarted = `
🚫 You cannot change Handi Cat settings in this group

Bot is not initiated. Send /start
`

  static groupChatNotActivated = `
🚫 You cannot change Handi Cat settings in this group

Bot is not activated. Send /activate
`

  static userNotAuthorizedInGroup = `
🚫 You cannot change Handi Cat settings in this group

you are not authorized to perform this action.
`

  static deleteGroupMessage = `
To <b>remove</b> a group from your list, simply send me the <u>Group ID</u> of the group you'd like to delete.
`

  static groupDeletedMessage = `
This group has been deleted from your list!
`
  static failedToDeleteGroupMessage = `
Failed to delete group, make sure you provided a valid <b>Group ID</b>
`
}
