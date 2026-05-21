#!/usr/bin/env node

/**
 * Test script for brand creation
 */

async function testBrandCreation() {
  console.log('Testing brand creation...');

  try {
    // Test 1: Create a brand
    console.log('\n1. Creating a new brand...');
    const createResponse = await fetch('http://localhost:3000/api/admin/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Brand ' + Date.now(),
      }),
    });

    const createResult = await createResponse.json();
    console.log('Create response status:', createResponse.status);
    console.log('Create response body:', JSON.stringify(createResult, null, 2));

    if (createResult.success && createResult.data) {
      console.log('✓ Brand created successfully');
      console.log('  Brand ID:', createResult.data.id);
      console.log('  Brand Name:', createResult.data.name);
    } else {
      console.log('✗ Brand creation failed');
      console.log('  Error:', createResult.error);
    }

    // Test 2: Fetch all brands
    console.log('\n2. Fetching all brands...');
    const fetchResponse = await fetch('http://localhost:3000/api/admin/brands');
    const fetchResult = await fetchResponse.json();
    console.log('Fetch response body:', JSON.stringify(fetchResult, null, 2));

    if (fetchResult.success) {
      console.log(`✓ Fetched ${fetchResult.count} brands`);
      fetchResult.data.forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.name} (ID: ${brand.id})`);
      });
    } else {
      console.log('✗ Failed to fetch brands');
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testBrandCreation();
