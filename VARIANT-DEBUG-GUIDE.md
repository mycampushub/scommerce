# Variant Visibility Debug Guide

## Issue: Variants Not Showing on Product Detail Page

### ✅ What I've Verified

1. **Database is correct:**
   - Red Bridal Lehenga exists with `hasVariants = 1`
   - 3 active variants exist (Size S, M, L)
   - All variants have size, color, and material attributes

2. **API is correct:**
   - Product API converts `hasVariants` to boolean properly
   - Variants API returns all 3 variants with correct data

3. **Code logic is correct:**
   - Condition `hasVariants = product?.hasVariants && variants.length > 0` evaluates to `true`
   - Variant selectors should render when `hasVariants` is `true`

### 🔍 Debug Steps Added

I've added comprehensive debugging to help identify the issue:

#### 1. Console Logs
Open your browser's Developer Tools (F12) and check the Console tab. You should see:

```
[Product Page] Product data received: {
  id: "prod-lh-001",
  name: "Red Bridal Lehenga",
  hasVariants: true,
  hasVariantsType: "boolean",
  slug: "red-bridal-lehenga"
}

[Product Page] Fetched variants: 3 variants

[Product Page] Selected default variant: {
  id: "pv-lh-001-1",
  sku: "LH-RED-S",
  size: "S",
  color: "Red",
  material: "Velvet",
  isDefault: true,
  ...
}

[Product Page] Variant attributes: {
  hasVariants: true,
  variantsCount: 3,
  availableSizes: ["S", "M", "L"],
  availableColors: ["Red"],
  availableMaterials: ["Velvet"],
  willShowSizeSelector: true,
  willShowColorSelector: true,
  willShowMaterialSelector: true
}
```

#### 2. Visible Debug Panel
A yellow debug panel will appear on the product page (in development mode) showing:
- `hasVariants`: Should be `true`
- `product.hasVariants`: Should be `true` (type: boolean)
- `variants.length`: Should be `3`
- `loadingVariants`: Should be `false`
- `availableSizes`: Should show `S, M, L`
- `availableColors`: Should show `Red`
- `availableMaterials`: Should show `Velvet`

### 📋 What to Check

#### Step 1: Check Browser Console
1. Open the product page: `/product/red-bridal-lehenga`
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Look for the log messages mentioned above
5. **Report back what you see**

#### Step 2: Check Visible Debug Panel
1. Look for a yellow debug box on the product page
2. **Report back what values it shows**

#### Step 3: Check Network Tab
1. In Developer Tools, go to the Network tab
2. Refresh the page
3. Look for these API calls:
   - `/api/products/red-bridal-lehenga` (should return 200)
   - `/api/products/red-bridal-lehenga/variants` (should return 200)
4. Click on each response and check the JSON
5. **Report back what the API responses contain**

### 🎯 Possible Issues

Based on the analysis, here are the most likely issues:

#### Issue 1: API Not Returning Data
**Symptom:** Console shows "Variants API returned non-OK status"
**Solution:** Check the API endpoint is working correctly

#### Issue 2: hasVariants is False
**Symptom:** Debug panel shows `hasVariants: false`
**Solution:** The product API might not be converting the value correctly

#### Issue 3: No Variants Loaded
**Symptom:** Debug panel shows `variants.length: 0`
**Solution:** The variants API might be returning empty array

#### Issue 4: CSS/Rendering Issue
**Symptom:** Debug shows all correct values, but selectors not visible
**Solution:** Check for CSS errors or z-index issues

#### Issue 5: Production Build Issue
**Symptom:** Works in development but not in production
**Solution:** Rebuild the application

### 🚀 Next Steps

Please:

1. **Restart the dev server:**
   ```bash
   # Kill any existing server
   pkill -f "next dev"

   # Start fresh
   bun run dev
   ```

2. **Clear browser cache:**
   - Open Developer Tools (F12)
   - Right-click on the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Visit the product page:**
   - Go to `/product/red-bridal-lehenga`
   - Check the console logs
   - Check the yellow debug panel

4. **Report back:**
   - What does the console show?
   - What does the debug panel show?
   - What do the API responses look like?
   - Are there any errors in the console?

### 🔧 Quick Fixes

If you identify the issue, here are quick fixes:

#### Fix 1: Re-seed Database
```bash
bun run prisma/seed-bun.ts
```

#### Fix 2: Rebuild
```bash
bun run build
bun run dev
```

#### Fix 3: Clear Next.js Cache
```bash
rm -rf .next
bun run dev
```

### 📊 Expected Behavior

When everything works correctly, you should see:

```
🟢 Product loads successfully
🟢 Console shows: "hasVariants: true"
🟢 Console shows: "Fetched variants: 3 variants"
🟢 Debug panel shows all correct values
🟢 Size selector appears with buttons: S, M, L
🟢 Color selector appears with button: Red
🟢 Material selector appears with button: Velvet
```

### 📝 Files Modified

1. `src/app/product/[slug]/page.tsx`
   - Added console logging for product data (line 164-170)
   - Enhanced console logging for variant attributes (line 276-294)
   - Added visible debug panel (line 628-642)

---

**Last Updated:** Check the debug output and report back for further assistance!
