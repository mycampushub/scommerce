import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { parseJSON } from '@/db/db'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { jsPDF } from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify user authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff', 'user'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params
    const user = userOrResponse as any

    // Fetch order
    const order = await OrderRepository.findById(env, id)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify user owns this order
    if (order.userId && order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this invoice' },
        { status: 403 }
      )
    }

    // Fetch order items
    const items = await OrderRepository.getItems(env, id)

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
      if (value === null || value === undefined) return '৳0.00'
      const formattedValue = value.toLocaleString('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `৳${formattedValue}`
    }

    // Format address
    const formatAddress = (address: any) => {
      if (!address) return 'N/A'
      const parts = [
        address.address || address.addressLine1 || '',
        address.addressLine2 || '',
        address.city || '',
        address.district || '',
        address.division || address.state || '',
        address.zipCode || '',
        address.country || ''
      ].filter(Boolean)
      return parts.join(', ')
    }

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Add custom font (fallback to standard fonts)
    doc.setFont('helvetica')

    // Colors - defined as tuples to satisfy TypeScript
    const primaryColor: [number, number, number] = [236, 72, 153] // Pink
    const textColor: [number, number, number] = [51, 51, 51]
    const grayColor: [number, number, number] = [102, 102, 102]
    const lightGrayColor: [number, number, number] = [243, 244, 246]

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Header
    doc.setFontSize(32)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('SCOMMERCE', margin, 30)

    doc.setFontSize(12)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.setFont('helvetica', 'normal')
    doc.text('E-Commerce Store', margin, 38)

    // Invoice Info (right aligned)
    doc.setFontSize(18)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth - margin, 30, { align: 'right' })

    doc.setFontSize(12)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.setFont('helvetica', 'normal')
    const invoiceX = pageWidth - margin
    doc.text(`Invoice #: ${order.orderNumber}`, invoiceX, 38, { align: 'right' })
    doc.text(`Date: ${formatDate(order.createdAt)}`, invoiceX, 44, { align: 'right' })
    doc.text(`Status: ${order.status.replace(/_/g, ' ')}`, invoiceX, 50, { align: 'right' })
    doc.text(`Payment: ${order.paymentStatus}`, invoiceX, 56, { align: 'right' })

    // Divider line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(margin, 65, pageWidth - margin, 65)

    let yPos = 75

    // Customer & Shipping Info
    doc.setFontSize(14)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('BILL TO / SHIP TO', margin, yPos)
    yPos += 8

    // Customer info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Customer:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text(order.customerName, margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.text(order.customerEmail, margin, yPos)
    yPos += 5
    if (order.customerPhone) {
      doc.text(order.customerPhone, margin, yPos)
      yPos += 5
    }

    // Shipping address
    yPos += 3
    doc.setFont('helvetica', 'normal')
    doc.text('Shipping Address:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    const shippingAddressText = formatAddress(shippingAddress)
    const splitAddress = doc.splitTextToSize(shippingAddressText, contentWidth / 2 - 10)
    doc.text(splitAddress, margin, yPos)
    yPos += splitAddress.length * 4 + 8

    // Order Items Table
    doc.setFontSize(14)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('ORDER ITEMS', margin, yPos)
    yPos += 8

    // Table header
    doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
    doc.rect(margin, yPos, contentWidth, 8, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Product', margin + 2, yPos + 5)
    doc.text('Qty', margin + 100, yPos + 5)
    doc.text('Unit Price', margin + 120, yPos + 5)
    doc.text('Total', pageWidth - margin - 2, yPos + 5, { align: 'right' })

    yPos += 8

    // Table rows
    doc.setFont('helvetica', 'normal')
    items.forEach((item, index) => {
      if (yPos > pageHeight - 50) {
        doc.addPage()
        yPos = 20
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, yPos, contentWidth, 8, 'F')
      }

      // Product name
      const productName = item.productName
      const productDetails = [
        item.variantSku ? `SKU: ${item.variantSku}` : null,
        [item.variantSize, item.variantColor, item.variantMaterial].filter(Boolean).join(' / ')
      ].filter(Boolean).join(' | ')

      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('helvetica', 'bold')
      doc.text(productName.substring(0, 50), margin + 2, yPos + 5)

      if (productDetails) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        doc.text(productDetails.substring(0, 50), margin + 2, yPos + 8)
        doc.setFontSize(9)
      }

      // Qty
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('helvetica', 'normal')
      doc.text(String(item.quantity), margin + 100, yPos + 5)

      // Unit Price
      doc.text(formatCurrency(item.price), margin + 120, yPos + 5)

      // Total
      doc.text(formatCurrency(item.price * item.quantity), pageWidth - margin - 2, yPos + 5, { align: 'right' })

      yPos += productDetails ? 12 : 8
    })

    yPos += 10

    // Order Summary
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('ORDER SUMMARY', margin, yPos)
    yPos += 8

    const summaryX = pageWidth - margin - 80

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('Subtotal:', summaryX, yPos)
    doc.text(formatCurrency(order.subtotal), pageWidth - margin, yPos, { align: 'right' })
    yPos += 6

    doc.text('Shipping:', summaryX, yPos)
    doc.text(formatCurrency(order.shipping), pageWidth - margin, yPos, { align: 'right' })
    yPos += 6

    doc.text('Tax:', summaryX, yPos)
    doc.text(formatCurrency(order.tax), pageWidth - margin, yPos, { align: 'right' })
    yPos += 6

    if (order.discount > 0) {
      doc.setTextColor(16, 185, 129) // Green
      doc.text('Discount:', summaryX, yPos)
      doc.text(`-${formatCurrency(order.discount)}`, pageWidth - margin, yPos, { align: 'right' })
      yPos += 6
    }

    // Total
    yPos += 4
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.line(summaryX, yPos, pageWidth - margin, yPos)
    yPos += 6

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Total:', summaryX, yPos)
    doc.text(formatCurrency(order.total), pageWidth - margin, yPos, { align: 'right' })
    yPos += 15

    // Tracking Info
    if (order.trackingNumber || order.trackingStatus) {
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text('TRACKING INFORMATION', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])

      if (order.trackingNumber) {
        doc.text(`Tracking Number: ${order.trackingNumber}`, margin, yPos)
        yPos += 6
      }

      if (order.trackingStatus) {
        doc.text(`Tracking Status: ${order.trackingStatus.replace(/_/g, ' ')}`, margin, yPos)
        yPos += 6
      }

      if (order.estimatedDeliveryDate) {
        doc.text(`Estimated Delivery: ${formatDate(order.estimatedDeliveryDate)}`, margin, yPos)
        yPos += 6
      }

      yPos += 10
    }

    // Notes
    if (order.notes) {
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text('NOTES', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      const splitNotes = doc.splitTextToSize(order.notes, contentWidth)
      doc.text(splitNotes, margin, yPos)
      yPos += splitNotes.length * 5 + 10
    }

    // Footer
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = pageHeight - 30
    }

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])

    const footerY = pageHeight - 20
    doc.text('Thank you for your business!', margin, footerY, { align: 'center' })
    doc.text(`Invoice generated on ${new Date().toLocaleString()}`, margin, footerY + 5, { align: 'center' })

    if (order.paymentMethod) {
      doc.text(`Payment Method: ${order.paymentMethod.replace(/_/g, ' ')}`, margin, footerY + 10, { align: 'center' })
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
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
