const axios = require('axios');

const API_KEY = '01cc3985a30a4502ab6c75e116bc993b';
const TEST_TOKEN = 'So11111111111111111111111111111111111111112'; // Wrapped SOL

console.log('🦅 Testing Birdeye API\n');

axios.get(
  `https://public-api.birdeye.so/defi/token_overview?address=${TEST_TOKEN}`,
  {
    timeout: 10000,
    headers: {
      'X-API-KEY': API_KEY,
      'Accept': 'application/json',
    },
  }
)
.then(response => {
  console.log('✅ API Response received');
  console.log('Status:', response.status);
  
  const data = response.data?.data;
  
  if (!data) {
    console.log('\n❌ No data in response');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  }
  
  console.log('\n💰 Market Data:');
  console.log('- Price USD:', data.price || data.priceUsd || 'N/A');
  console.log('- Market Cap:', data.mc || data.marketCap || 'N/A');
  console.log('- Liquidity:', data.liquidity || 'N/A');
  console.log('- Volume 24h:', data.v24hUSD || data.volume24h || 'N/A');
  console.log('- Price Change 24h:', data.priceChange24h + '%' || 'N/A');
  
  console.log('\n📋 Available fields:');
  console.log(Object.keys(data).join(', '));
  
  console.log('\n✅ Birdeye API working perfectly!');
})
.catch(error => {
  console.log('\n❌ API Error:');
  
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Status Text:', error.response.statusText);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
    
    if (error.response.status === 401) {
      console.log('\n⚠️  Invalid API key');
    } else if (error.response.status === 429) {
      console.log('\n⚠️  Rate limit exceeded');
    }
  } else {
    console.log('Error:', error.message);
  }
});
