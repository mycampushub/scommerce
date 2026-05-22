import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll } from '@/db/db'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()

    // Check the actual schema of the promotions table
    const schemaInfo = await queryAll<any>(
      env,
      'SELECT name, type, "notnull", dflt_value, pk FROM pragma_table_info("promotions") ORDER BY cid'
    )

    // Count the columns
    const columnCount = schemaInfo.length

    return NextResponse.json({
      success: true,
      data: {
        columnCount,
        columns: schemaInfo,
        columnNames: schemaInfo.map((c: any) => c.name)
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack
    }, { status: 500 })
  }
}
