// Test script for product creation
const API_BASE = 'http://localhost:3000';

async function testProductCreation() {
  console.log('Testing Product Creation...\n');

  try {
    // Step 1: Get categories first
    console.log('1. Fetching categories...');
    const categoryResponse = await fetch(`${API_BASE}/api/admin/categories`);
    const categoryResult = await categoryResponse.json();

    if (!categoryResult.success || !categoryResult.data || categoryResult.data.length === 0) {
      throw new Error('No categories found. Please create a category first.');
    }

    const categoryId = categoryResult.data[0].id;
    console.log(`✓ Using category: ${categoryResult.data[0].name} (ID: ${categoryId})\n`);

    // Step 2: Create a simple product without variants
    console.log('2. Creating product without variants...');
    const simpleProduct = {
      name: 'Test Product - Simple T-Shirt',
      slug: 'test-product-simple-t-shirt',
      description: 'A simple test product for testing the product creation functionality.',
      basePrice: 599.00,
      comparePrice: 799.00,
      costPrice: 300.00,
      categoryId: categoryId,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
      stock: 50,
      hasVariants: false,
      isActive: true,
      isFeatured: false,
      brandId: null,
      brandName: 'Test Brand',
      brandLogo: null,
      countryOfOrigin: 'BD',
      sizeType: 'label',
      sizeValue: null,
      sizeUnit: null,
      sizeLabel: 'M',
    };

    const response = await fetch(`${API_BASE}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simpleProduct),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('✗ Failed to create product:', result.error);
      return;
    }

    const productId = result.data?.id || result.products?.id;
    console.log(`✓ Product created successfully! ID: ${productId}`);
    console.log(`  Name: ${result.data?.name || result.products?.name}`);
    console.log(`  Price: ৳${result.data?.price || result.products?.price}`);
    console.log(`  Stock: ${result.data?.stock || result.products?.stock}\n`);

    // Step 3: Create a product with variants
    console.log('3. Creating product with variants...');
    const variantProduct = {
      name: 'Test Product - Polo Shirt',
      slug: 'test-product-polo-shirt',
      description: 'A test product with multiple variants (sizes and colors).',
      basePrice: 899.00,
      comparePrice: 1199.00,
      costPrice: 450.00,
      categoryId: categoryId,
      images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800'],
      stock: 0, // Stock is managed in variants
      hasVariants: true,
      isActive: true,
      isFeatured: false,
      brandId: null,
      brandName: 'Test Brand',
      brandLogo: null,
      countryOfOrigin: 'BD',
      sizeType: null,
      sizeValue: null,
      sizeUnit: null,
      sizeLabel: null,
    };

    const variantResponse = await fetch(`${API_BASE}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variantProduct),
    });

    const variantResult = await variantResponse.json();

    if (!variantResult.success) {
      console.error('✗ Failed to create product with variants:', variantResult.error);
      return;
    }

    const variantProductId = variantResult.data?.id || variantResult.products?.id;
    console.log(`✓ Product with variants created successfully! ID: ${variantProductId}`);

    // Step 4: Add variants to the product
    console.log('\n4. Creating variants...');

    const variants = [
      {
        name: 'S / Red / Cotton',
        sku: `POLO-${Date.now()}-1`,
        price: 899.00,
        comparePrice: 1199.00,
        costPrice: 450.00,
        stock: 20,
        size: 'S',
        color: 'Red',
        material: 'Cotton',
        images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800'],
        isDefault: true,
        isActive: true,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
      },
      {
        name: 'M / Blue / Cotton',
        sku: `POLO-${Date.now()}-2`,
        price: 899.00,
        comparePrice: 1199.00,
        costPrice: 450.00,
        stock: 15,
        size: 'M',
        color: 'Blue',
        material: 'Cotton',
        images: null,
        isDefault: false,
        isActive: true,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
      },
      {
        name: 'L / Green / Cotton',
        sku: `POLO-${Date.now()}-3`,
        price: 999.00, // Different price
        comparePrice: 1299.00,
        costPrice: 500.00,
        stock: 10,
        size: 'L',
        color: 'Green',
        material: 'Cotton',
        images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800'],
        isDefault: false,
        isActive: true,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
      },
    ];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const variantCreateResponse = await fetch(
        `${API_BASE}/api/admin/products/${variantProductId}/variants`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variant),
        }
      );

      const variantCreateResult = await variantCreateResponse.json();

      if (!variantCreateResult.success) {
        console.error(`✗ Failed to create variant ${i + 1}:`, variantCreateResult.error);
      } else {
        console.log(`✓ Variant ${i + 1} created: ${variant.name}`);
        console.log(`   SKU: ${variant.sku}`);
        console.log(`   Price: ৳${variant.price}`);
        console.log(`   Stock: ${variant.stock}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ All tests completed successfully!');
    console.log('='.repeat(60));
    console.log(`\nProduct 1 (No Variants) ID: ${productId}`);
    console.log(`Product 2 (With Variants) ID: ${variantProductId}`);
    console.log(`\nYou can view these products in the admin panel at:`);
    console.log(`${API_BASE}/admin/products\n`);

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testProductCreation();
