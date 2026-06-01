// Re-export admin-auth from the correct location
export { verifyAdminAuth } from '@/lib/admin-auth';

// Re-export with alias for the new API routes
export { verifyAdminAuth as verifyAdmin } from '@/lib/admin-auth';
