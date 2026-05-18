import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { parseJSON, queryAll } from '@/db/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params

    // Fetch order
    const order = await OrderRepository.findById(env, id)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Fetch order items
    const items = await OrderRepository.getItems(env, id)

    // Fetch user if exists
    const user = order.userId ? await UserRepository.findById(env, order.userId) : null

    // Parse addresses
    let shippingAddress: any = null
    let billingAddress: any = null
    try {
      shippingAddress = typeof order.shippingAddress === 'string'
        ? parseJSON(order.shippingAddress)
        : order.shippingAddress
      billingAddress = typeof order.billingAddress === 'string'
        ? parseJSON(order.billingAddress)
        : order.billingAddress
    } catch {
      // Keep as-is if parsing fails
    }

    // Format date
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'N/A'
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    // Format currency
    const formatCurrency = (value: number | null) => {
      if (value === null || value === undefined) return '0.00'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value)
    }

    // Generate HTML invoice
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    .invoice {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
    }

    .logo h1 {
      color: #3b82f6;
      font-size: 32px;
      font-weight: 700;
    }

    .invoice-info {
      text-align: right;
    }

    .invoice-info h2 {
      color: #666;
      font-size: 18px;
      margin-bottom: 10px;
    }

    .invoice-info p {
      color: #888;
      margin: 5px 0;
    }

    .invoice-number {
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .customer-info, .shipping-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .info-box {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
    }

    .info-box p {
      margin: 5px 0;
      color: #555;
    }

    .info-box strong {
      color: #333;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .items-table thead {
      background: #f3f4f6;
    }

    .items-table th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e5e7eb;
    }

    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #555;
    }

    .items-table .qty {
      text-align: center;
    }

    .items-table .price, .items-table .total {
      text-align: right;
    }

    .items-table tbody tr:hover {
      background: #f9fafb;
    }

    .summary {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }

    .summary-table {
      width: 300px;
    }

    .summary-table td {
      padding: 8px 0;
      text-align: right;
    }

    .summary-table .total-row {
      font-size: 18px;
      font-weight: 700;
      color: #3b82f6;
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
      padding-top: 10px;
    }

    .summary-table .label {
      color: #666;
    }

    .summary-table .discount {
      color: #10b981;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #888;
      font-size: 12px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-PENDING { background: #fef3c7; color: #92400e; }
    .status-CONFIRMED { background: #dbeafe; color: #1e40af; }
    .status-PROCESSING { background: #e0e7ff; color: #3730a3; }
    .status-SHIPPED { background: #e0e7ff; color: #4338ca; }
    .status-DELIVERED { background: #d1fae5; color: #065f46; }
    .status-CANCELLED { background: #fee2e2; color: #991b1b; }
    .status-REFUNDED { background: #f3f4f6; color: #4b5563; }

    .payment-status-COMPLETED { background: #d1fae5; color: #065f46; }
    .payment-status-PENDING { background: #fef3c7; color: #92400e; }
    .payment-status-FAILED { background: #fee2e2; color: #991b1b; }
    .payment-status-REFUNDED { background: #f3f4f6; color: #4b5563; }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice {
        box-shadow: none;
        padding: 20px;
      }
    }

    @media (max-width: 640px) {
      .invoice {
        padding: 20px;
      }
      .header {
        flex-direction: column;
        gap: 20px;
      }
      .invoice-info {
        text-align: left;
      }
      .customer-info, .shipping-info {
        grid-template-columns: 1fr;
        gap: 15px;
      }
      .summary {
        justify-content: flex-start;
      }
      .summary-table {
        width: 100%;
      }
      .items-table th:nth-child(3),
      .items-table td:nth-child(3) {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <h1>SCOMMERCE</h1>
        <p style="color: #666; margin-top: 5px;">E-Commerce Store</p>
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p class="invoice-number">${order.orderNumber}</p>
        <p>Date: ${formatDate(order.createdAt)}</p>
        <p>
          Status: <span class="status-badge status-${order.status}">${order.status.replace(/_/g, ' ')}</span>
        </p>
        <p>
          Payment: <span class="status-badge payment-status-${order.paymentStatus}">${order.paymentStatus}</span>
        </p>
      </div>
    </div>

    <!-- Customer & Shipping Info -->
    <div class="section">
      <h3>Bill To / Ship To</h3>
      <div class="customer-info">
        <div class="info-box">
          <p><strong>Customer:</strong></p>
          <p>${order.customerName}</p>
          <p>${order.customerEmail}</p>
          ${order.customerPhone ? `<p>${order.customerPhone}</p>` : ''}
        </div>
        <div class="info-box">
          <p><strong>Shipping Address:</strong></p>
          ${shippingAddress ? `
            <p>${shippingAddress.address || shippingAddress.addressLine1 || ''}</p>
            ${shippingAddress.addressLine2 ? `<p>${shippingAddress.addressLine2}</p>` : ''}
            ${shippingAddress.city ? `<p>${shippingAddress.city}</p>` : ''}
            ${shippingAddress.district ? `<p>${shippingAddress.district}</p>` : ''}
            ${shippingAddress.division || shippingAddress.state ? `<p>${shippingAddress.division || shippingAddress.state}</p>` : ''}
            ${shippingAddress.zipCode ? `<p>${shippingAddress.zipCode}</p>` : ''}
            ${shippingAddress.country ? `<p>${shippingAddress.country}</p>` : ''}
          ` : '<p>N/A</p>'}
        </div>
      </div>
    </div>

    <!-- Order Items -->
    <div class="section">
      <h3>Order Items</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th class="qty">Qty</th>
            <th class="price">Unit Price</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                <strong>${item.productName}</strong>
                ${item.variantSku ? `<br><small>SKU: ${item.variantSku}</small>` : ''}
                ${item.variantSize || item.variantColor ? `
                  <br><small>${[item.variantSize, item.variantColor, item.variantMaterial].filter(Boolean).join(' / ')}</small>
                ` : ''}
              </td>
              <td class="qty">${item.quantity}</td>
              <td class="price">${formatCurrency(item.price)}</td>
              <td class="total">${formatCurrency(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Order Summary -->
    <div class="summary">
      <table class="summary-table">
        <tr>
          <td class="label">Subtotal:</td>
          <td>${formatCurrency(order.subtotal)}</td>
        </tr>
        <tr>
          <td class="label">Shipping:</td>
          <td>${formatCurrency(order.shipping)}</td>
        </tr>
        <tr>
          <td class="label">Tax:</td>
          <td>${formatCurrency(order.tax)}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr class="discount">
          <td class="label">Discount:</td>
          <td>-${formatCurrency(order.discount)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td class="label">Total:</td>
          <td>${formatCurrency(order.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Tracking Info -->
    ${order.trackingNumber || order.trackingStatus ? `
    <div class="section">
      <h3>Tracking Information</h3>
      <div class="info-box">
        ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        ${order.trackingStatus ? `<p><strong>Tracking Status:</strong> ${order.trackingStatus.replace(/_/g, ' ')}</p>` : ''}
        ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${formatDate(order.estimatedDeliveryDate)}</p>` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Notes -->
    ${order.notes ? `
    <div class="section">
      <h3>Notes</h3>
      <div class="info-box">
        <p>${order.notes}</p>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Invoice generated on ${new Date().toLocaleString()}</p>
      ${order.paymentMethod ? `<p>Payment Method: ${order.paymentMethod.replace(/_/g, ' ')}</p>` : ''}
    </div>
  </div>
</body>
</html>
    `.trim()

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
