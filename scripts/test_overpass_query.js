#!/usr/bin/env node
/**
 * Test Overpass API query manually to debug the issue
 */

const https = require('https');

// Very simple test query for just a few toilets in central London
const testQuery = `
[out:json][timeout:10];
(
  node["amenity"="toilets"](51.5,-0.2,51.6,-0.1);
);
out 3;
`;

const postData = testQuery.trim();

const options = {
  hostname: 'overpass-api.de',
  port: 443,
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'CityPee/1.0.0 (https://github.com/user/citypee)'
  }
};

console.log('🔍 Testing Overpass API with query:');
console.log(testQuery);
console.log('\n📡 Making request...');

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      console.log(`\n✅ Found ${json.elements?.length || 0} elements`);
    } catch (e) {
      console.log('❌ Invalid JSON response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(postData);
req.end();