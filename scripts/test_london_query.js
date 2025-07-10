#!/usr/bin/env node
/**
 * Test the exact London area query used by ingest service
 */

const https = require('https');

// Test our London area query
const londonQuery = `
[out:json][timeout:30];
(
  area["name"="Greater London"]["admin_level"="4"];
)->.searchArea;
(
  node["amenity"="toilets"](area.searchArea);
);
out 3;
`;

const postData = londonQuery.trim();

const options = {
  hostname: 'overpass-api.de',
  port: 443,
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'CityPee/1.0 (https://github.com/example/citypee)'
  }
};

console.log('🔍 Testing London area query:');
console.log(londonQuery);
console.log('\n📡 Making request...');

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
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
      
      if (json.elements?.length === 0) {
        console.log('\n🔍 Debugging: Let\'s check if the area exists...');
        testAreaQuery();
      }
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

function testAreaQuery() {
  const areaTestQuery = `
[out:json][timeout:10];
(
  area["name"~"London"]["admin_level"~"4|6"];
);
out;
`;

  console.log('\n🔍 Testing area search:');
  console.log(areaTestQuery);

  const testReq = https.request({
    ...options,
    headers: {
      ...options.headers,
      'Content-Length': Buffer.byteLength(areaTestQuery.trim())
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('\n📄 Area search results:');
        json.elements?.forEach(area => {
          console.log(`- ${area.tags?.name || 'unnamed'} (admin_level: ${area.tags?.admin_level})`);
        });
      } catch (e) {
        console.log('❌ Invalid JSON in area test');
      }
    });
  });

  testReq.write(areaTestQuery.trim());
  testReq.end();
}