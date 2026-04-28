---
Task ID: 4-a
Agent: full-stack-developer
Task: Fix all Next.js 15 params types in API routes

Work Log:
- Verified all API route files for Next.js 15 compatibility
- Found that most files were already fixed in previous work:
  - src/app/api/admin/orders/[id]/route.ts - already updated params type and await
  - src/app/api/admin/promotions/[id]/reorder/route.ts - already updated params type and await
  - src/app/api/admin/reels/[id]/reorder/route.ts - already updated params type and await
  - src/app/api/admin/reels/[id]/route.ts - already updated params type and await
  - src/app/api/admin/reviews/[id]/route.ts - already updated params type and await
  - src/app/api/admin/stories/[id]/reorder/route.ts - already updated params type and await
  - src/app/api/admin/stories/[id]/route.ts - already updated params type and await
- Fixed remaining files that needed updates:
  - src/app/api/admin/staff/[id]/route.ts - updated params type and await for GET, PUT, DELETE handlers
  - src/app/api/orders/[id]/cancel/route.ts - updated params type and await for POST handler
  - src/app/api/orders/[id]/refund/route.ts - updated params type and await for POST handler
  - src/app/api/orders/[id]/track/route.ts - updated params type and await for GET handler
  - src/app/api/products/[id]/route.ts - updated params type and await for GET handler

Stage Summary:
- Updated 5 API route files with Next.js 15 compatible params types
- All dynamic route parameters now use Promise<> type
- All files properly await the params before accessing the id property
