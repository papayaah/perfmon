/**
 * Manual test script to verify queue integration
 * This script tests the queue functionality by making concurrent requests
 */

const testUrl = 'http://localhost:3001/api/analyze';

async function makeRequest(id, url = 'https://example.com', deviceType = 'desktop') {
  console.log(`[Request ${id}] Starting...`);
  const startTime = Date.now();
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, deviceType })
    });
    
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    if (response.ok) {
      console.log(`[Request ${id}] ✓ Success in ${duration}ms - Scores:`, data.scores);
    } else {
      console.log(`[Request ${id}] ✗ Failed with status ${response.status}:`, data.error || data.message);
    }
    
    return { id, success: response.ok, status: response.status, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[Request ${id}] ✗ Error after ${duration}ms:`, error.message);
    return { id, success: false, error: error.message, duration };
  }
}

async function testQueueIntegration() {
  console.log('=== Testing Queue Integration ===\n');
  
  // Test 1: Single request (should work immediately)
  console.log('Test 1: Single request');
  await makeRequest(1);
  console.log('');
  
  // Test 2: Concurrent requests (should queue)
  console.log('Test 2: Three concurrent requests (with MAX_CONCURRENT=1, two should queue)');
  const promises = [
    makeRequest(2),
    makeRequest(3),
    makeRequest(4)
  ];
  
  await Promise.all(promises);
  console.log('');
  
  console.log('=== Tests Complete ===');
}

// Run tests
testQueueIntegration().catch(console.error);
