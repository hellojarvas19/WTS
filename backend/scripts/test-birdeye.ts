/**
 * Test Birdeye API Integration
 * Run: npx ts-node scripts/test-birdeye.ts
 */

import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

const TEST_TOKEN = 'So11111111111111111111111111111111111111112' // Wrapped SOL

async function testBirdeyeAPI() {
  console.log('🦅 Testing Birdeye API Integration\n')
  
  const apiKey = process.env.BIRDEYE_API_KEY
  
  if (!apiKey) {
    console.log('❌ BIRDEYE_API_KEY not found in .env')
    console.log('   Add: BIRDEYE_API_KEY=your_key_here')
    return
  }
  
  console.log('✅ API Key found')
  console.log(`📊 Testing token: ${TEST_TOKEN}\n`)
  
  try {
    const response = await axios.get(
      `https://public-api.birdeye.so/defi/token_overview?address=${TEST_TOKEN}`,
      {
        timeout: 10000,
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      }
    )
    
    console.log('✅ API Response received')
    console.log('Status:', response.status)
    console.log('\n📦 Response structure:')
    console.log('- success:', response.data?.success)
    console.log('- data exists:', !!response.data?.data)
    
    const data = response.data?.data
    
    if (!data) {
      console.log('\n❌ No data in response')
      console.log('Full response:', JSON.stringify(response.data, null, 2))
      return
    }
    
    console.log('\n💰 Market Data:')
    console.log('- Price USD:', data.price || data.priceUsd || 'N/A')
    console.log('- Market Cap:', data.mc || data.market_cap || data.marketCap || 'N/A')
    console.log('- Liquidity:', data.liquidity || 'N/A')
    console.log('- Volume 24h:', data.v24hUSD || data.volume_24h_usd || data.volume24h || 'N/A')
    console.log('- Price Change 24h:', data.priceChange24h || data.price_change_24h_percent || 'N/A')
    
    console.log('\n📋 Available fields:')
    console.log(Object.keys(data).join(', '))
    
    console.log('\n✅ Birdeye API integration working!')
    
  } catch (error: any) {
    console.log('\n❌ API Error:')
    
    if (error.response) {
      console.log('Status:', error.response.status)
      console.log('Status Text:', error.response.statusText)
      console.log('Data:', JSON.stringify(error.response.data, null, 2))
      
      if (error.response.status === 401) {
        console.log('\n⚠️  Invalid API key')
      } else if (error.response.status === 429) {
        console.log('\n⚠️  Rate limit exceeded')
      }
    } else if (error.request) {
      console.log('No response received')
      console.log('Error:', error.message)
    } else {
      console.log('Error:', error.message)
    }
  }
}

testBirdeyeAPI()
