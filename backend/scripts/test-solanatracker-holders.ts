import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Test Solana Tracker API integration for holders data
 */
async function testSolanaTrackerHolders() {
  const apiKey = process.env.SOLANA_TRACKER_API_KEY
  
  if (!apiKey) {
    console.log('❌ SOLANA_TRACKER_API_KEY not configured in .env')
    return
  }

  // Test with a popular token (e.g., BONK)
  const testToken = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' // BONK token

  console.log('\n🧪 Testing Solana Tracker API - Top Holders')
  console.log('━'.repeat(60))
  console.log(`Token: ${testToken}`)
  console.log('━'.repeat(60))

  try {
    const response = await axios.get(
      `https://data.solanatracker.io/tokens/${testToken}/holders/top`,
      {
        timeout: 10000,
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.data || !Array.isArray(response.data)) {
      console.log('❌ Invalid response format')
      return
    }

    const holders = response.data.slice(0, 20)
    console.log(`\n✅ Successfully fetched ${holders.length} holders\n`)

    // Calculate top 10 percentage
    const top10Percentage = holders
      .slice(0, 10)
      .reduce((sum, h) => sum + (h.percentage || 0), 0)

    console.log(`📊 Top 10 Holders: ${top10Percentage.toFixed(2)}%\n`)

    // Display top 5 holders
    console.log('Top 5 Holders:')
    console.log('─'.repeat(60))
    holders.slice(0, 5).forEach((holder, index) => {
      console.log(`${index + 1}. ${holder.address.slice(0, 8)}...${holder.address.slice(-6)}`)
      console.log(`   Balance: ${holder.amount.toLocaleString()}`)
      console.log(`   Percentage: ${holder.percentage.toFixed(4)}%`)
      if (holder.value?.usd) {
        console.log(`   Value: $${holder.value.usd.toLocaleString()}`)
      }
      console.log()
    })

    console.log('✅ Solana Tracker API integration working correctly!')
    
  } catch (error: any) {
    console.error('❌ Error testing Solana Tracker API:')
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Message: ${error.response.data?.message || error.message}`)
    } else {
      console.error(`   ${error.message}`)
    }
  }
}

// Run the test
testSolanaTrackerHolders()
