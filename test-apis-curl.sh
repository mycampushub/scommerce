#!/bin/bash

# API Test Script using curl
# Usage: ./test-apis-curl.sh [URL] [AUTH_TOKEN]
# Example: ./test-apis-curl.sh https://your-domain.com "your-auth-token"

# Configuration
API_BASE="${1:-http://localhost:3000}"
AUTH_TOKEN="${2:-}"
VERBOSE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# ============================================
# UTILITY FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo "============================================================"
    echo "$1"
    echo "============================================================"
}

print_test_start() {
    print_header "📡 Testing: $1"
    echo "   Method: $2"
    echo "   URL: $3"
}

print_test_result() {
    TOTAL=$((TOTAL + 1))
    
    if [ $1 -ge 200 ] && [ $1 -lt 300 ]; then
        echo ""
        echo -e "${GREEN}✅ Status: $1${NC}"
        echo "   Duration: ${2}ms"
        echo "   Success: true"
        PASSED=$((PASSED + 1))
    else
        echo ""
        echo -e "${RED}❌ Status: $1${NC}"
        echo "   Duration: ${2}ms"
        echo "   Success: false"
        FAILED=$((FAILED + 1))
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo "   Response: $3"
    fi
}

test_api() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local body="$4"
    
    local url="${API_BASE}${endpoint}"
    
    print_test_start "$name" "$method" "$url"
    
    local start_time=$(date +%s%3N)
    local response
    local http_code
    
    if [ -n "$AUTH_TOKEN" ]; then
        local headers="-H 'Authorization: Bearer $AUTH_TOKEN'"
    else
        local headers=""
    fi
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$body" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            $headers \
            "$url")
    fi
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    http_code=$(echo "$response" | tail -n1)
    local body_response=$(echo "$response" | sed '$d')
    
    print_test_result "$http_code" "$duration" "$body_response"
}

print_summary() {
    print_header "📊 TEST SUMMARY"
    
    echo ""
    echo "Total Tests: $TOTAL"
    echo -e "${GREEN}✅ Passed: $PASSED${NC}"
    echo -e "${RED}❌ Failed: $FAILED${NC}"
    
    if [ $TOTAL -gt 0 ]; then
        local pass_rate=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)
        echo "📈 Pass Rate: ${pass_rate}%"
    fi
    
    echo ""
    echo "============================================================"
    echo ""
}

# ============================================
# TEST SUITES
# ============================================

test_health_check() {
    test_api "Health Check" "/api/health"
}

test_products() {
    test_api "Get All Products" "/api/products"
    test_api "Get Product by ID" "/api/products/1"
    test_api "Get Product Variants" "/api/products/1/variants"
    test_api "Product Recommendations" "/api/products/recommendations"
}

test_categories() {
    test_api "Get All Categories" "/api/categories"
}

test_suppliers() {
    test_api "Get All Suppliers" "/api/admin/suppliers"
    test_api "Get Supplier by ID" "/api/admin/suppliers/supplier-001"
    test_api "Create Supplier" "/api/admin/suppliers" "POST" \
        '{"name":"Test Supplier","email":"test@supplier.com","phone":"+1-555-9999","address":"123 Test Street","status":"ACTIVE","paymentTerms":"NET_30"}'
}

test_purchase_orders() {
    test_api "Get All Purchase Orders" "/api/admin/purchase-orders"
    test_api "Get Purchase Order by ID" "/api/admin/purchase-orders/PO-2024-001"
    test_api "Create Purchase Order" "/api/admin/purchase-orders" "POST" \
        '{"supplierId":"supplier-001","expectedDate":"'$(( $(date +%s) + 604800 ))'000","notes":"Test purchase order","items":[{"productId":"1","quantity":10,"unitCost":100}]}'
}

test_inventory_reports() {
    test_api "Stock Report" "/api/admin/inventory/reports/stock"
    test_api "Movement Report" "/api/admin/inventory/reports/movement"
    test_api "Purchase Report" "/api/admin/inventory/reports/purchase"
    test_api "Valuation Report" "/api/admin/inventory/reports/valuation"
    test_api "Cost Analysis Report" "/api/admin/inventory/reports/cost-analysis"
}

test_inventory_adjustments() {
    test_api "Get All Inventory Adjustments" "/api/admin/inventory/adjustments"
    test_api "Get Adjustment by ID" "/api/admin/inventory/adjustments/1"
    test_api "Create Adjustment" "/api/admin/inventory/adjustments" "POST" \
        '{"type":"ADDITION","reason":"TEST","notes":"Test adjustment","items":[{"productId":"1","quantity":5,"reason":"TEST","notes":"Test item"}]}'
}

test_orders() {
    test_api "Get All Orders" "/api/admin/orders"
    test_api "Get Order by ID" "/api/admin/orders/1"
}

test_analytics() {
    test_api "Get Analytics Data" "/api/admin/analytics"
    test_api "Get Admin Stats" "/api/admin/stats"
}

# ============================================
# MAIN
# ============================================

print_header "🚀 Starting API Tests"
echo "🌐 Server: $API_BASE"
echo "🔐 Auth: $([ -n "$AUTH_TOKEN" ] && echo "Enabled" || echo "Disabled")"
echo "📝 Verbose: $VERBOSE"

# Run tests
test_health_check
test_products
test_categories
test_suppliers
test_purchase_orders
test_inventory_reports
test_inventory_adjustments
test_orders
test_analytics

# Print summary
print_summary

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
