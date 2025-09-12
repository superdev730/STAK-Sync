#!/usr/bin/env node

// Simple test script to verify match signals generation
// Run this script after completing the interview flow to test if match signals are created

const https = require('https');
const http = require('http');

// Configuration
const HOST = 'localhost';
const PORT = 5000;
const PROTOCOL = 'http';

// You need to get a valid session cookie first by logging in
// For testing, we'll assume you have a session
const SESSION_COOKIE = process.env.SESSION_COOKIE || 'connect.sid=YOUR_SESSION_COOKIE_HERE';

async function makeRequest(path, method = 'GET', body = null) {
  const protocol = PROTOCOL === 'https' ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Cookie': SESSION_COOKIE,
        'Content-Type': 'application/json',
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testMatchSignalsGeneration() {
  console.log('🧪 Testing Match Signals Generation\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Check current interview status
    console.log('\n📊 Checking interview status...');
    const statusResponse = await makeRequest('/api/interview/status');
    console.log(`Status: ${statusResponse.status}`);
    console.log('Response:', JSON.stringify(statusResponse.data, null, 2));
    
    if (statusResponse.data.profileStatus === 'complete') {
      console.log('✅ Profile is already complete');
    } else {
      console.log('⚠️  Profile is not complete. You need to complete the interview first.');
      console.log('   Current status:', statusResponse.data.profileStatus);
      console.log('   Next step:', statusResponse.data.nextStep);
    }
    
    // Step 2: Try to mark interview as complete (this should trigger match signals generation)
    console.log('\n🚀 Attempting to mark interview as complete...');
    const completeResponse = await makeRequest('/api/interview/complete', 'POST');
    console.log(`Status: ${completeResponse.status}`);
    console.log('Response:', JSON.stringify(completeResponse.data, null, 2));
    
    if (completeResponse.status === 200) {
      console.log('\n✅ Interview marked as complete successfully!');
      console.log('   Match signals should be generated in the background.');
      console.log('   Check server logs for match signals generation details.');
    } else if (completeResponse.status === 401) {
      console.log('\n❌ Authentication failed. You need to be logged in.');
      console.log('   Please set SESSION_COOKIE environment variable with a valid session.');
    } else {
      console.log('\n⚠️  Unexpected response:', completeResponse.status);
    }
    
    // Step 3: Verify in database (would need direct DB access)
    console.log('\n📝 To verify match signals were created:');
    console.log('   1. Check server logs for "Generating match signals" messages');
    console.log('   2. Query the match_signals table in the database');
    console.log('   3. Look for the user ID and verify the fields are populated');
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('Test completed.');
}

// Instructions
console.log('Match Signals Generation Test');
console.log('=' .repeat(50));
console.log('\nThis script tests the match signals generation after profile completion.');
console.log('\nPrerequisites:');
console.log('1. The server should be running on ' + HOST + ':' + PORT);
console.log('2. You need to be logged in (set SESSION_COOKIE env variable)');
console.log('3. The interview flow should be at least partially completed');
console.log('\nTo get your session cookie:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Application/Storage > Cookies');
console.log('3. Find "connect.sid" cookie value');
console.log('4. Run: SESSION_COOKIE="connect.sid=YOUR_VALUE" node test-match-signals.js');
console.log('\n' + '=' .repeat(50));

// Run test if SESSION_COOKIE is provided
if (SESSION_COOKIE !== 'connect.sid=YOUR_SESSION_COOKIE_HERE') {
  console.log('\n🚀 Starting test with provided session cookie...\n');
  testMatchSignalsGeneration();
} else {
  console.log('\n⚠️  Please provide a valid SESSION_COOKIE to run the test.');
}