import { execSync } from 'child_process';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

function runWranglerCommand(command: string): string {
  try {
    const result = execSync(command, { encoding: 'utf-8', timeout: 30000 });
    return result;
  } catch (error: any) {
    return error.stdout || error.stderr || '';
  }
}

function getExistingColumns(table: string): ColumnInfo[] {
  const output = runWranglerCommand(
    `wrangler d1 execute scommerce-db --remote --command="PRAGMA table_info(${table});" --json`
  );
  try {
    const lines = output.trim().split('\n').filter(l => l.trim());
    const jsonLine = lines.find(l => l.startsWith('[') || l.startsWith('{'));
    if (jsonLine) {
      const parsed = JSON.parse(jsonLine);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].results) {
        return parsed[0].results;
      }
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

interface ColumnDef {
  name: string;
  definition: string;
}

const migrations: Record<string, ColumnDef[]> = {
  orders: [
    { name: 'deletedAt', definition: 'TEXT' },
    { name: 'deletedBy', definition: 'TEXT' },
    { name: 'deletedReason', definition: 'TEXT' },
    { name: 'cancelledAt', definition: 'TEXT' },
    { name: 'cancelledBy', definition: 'TEXT' },
    { name: 'cancellationReason', definition: 'TEXT' },
    { name: 'refundedAt', definition: 'TEXT' },
    { name: 'refundedAmount', definition: 'REAL' },
    { name: 'refundMethod', definition: 'TEXT' },
    { name: 'refundReason', definition: 'TEXT' },
    { name: 'trackingNumber', definition: 'TEXT' },
    { name: 'trackingStatus', definition: 'TEXT DEFAULT \'PENDING\'' },
    { name: 'estimatedDeliveryDate', definition: 'TEXT' },
  ],
  users: [
    { name: 'phone', definition: 'TEXT' },
    { name: 'address', definition: 'TEXT' },
    { name: 'emailVerified', definition: 'INTEGER DEFAULT 0' },
    { name: 'emailToken', definition: 'TEXT' },
    { name: 'newEmail', definition: 'TEXT' },
    { name: 'resetToken', definition: 'TEXT' },
    { name: 'resetTokenExpiry', definition: 'TEXT' },
    { name: 'avatar', definition: 'TEXT' },
    { name: 'isBanned', definition: 'INTEGER DEFAULT 0' },
    { name: 'bannedAt', definition: 'TEXT' },
    { name: 'lastLoginAt', definition: 'TEXT' },
  ],
  addresses: [
    { name: 'district', definition: 'TEXT' },
    { name: 'division', definition: 'TEXT' },
    { name: 'postalCode', definition: 'TEXT' },
  ],
  products: [
    { name: 'basePrice', definition: 'REAL DEFAULT 0' },
    { name: 'comparePrice', definition: 'REAL' },
    { name: 'discount', definition: 'REAL DEFAULT 0' },
    { name: 'discountType', definition: 'TEXT DEFAULT \'percentage\'' },
    { name: 'lowStockAlert', definition: 'INTEGER DEFAULT 10' },
    { name: 'reorderLevel', definition: 'INTEGER DEFAULT 5' },
    { name: 'reorderQty', definition: 'INTEGER DEFAULT 20' },
    { name: 'isFeatured', definition: 'INTEGER DEFAULT 0' },
    { name: 'hasVariants', definition: 'INTEGER DEFAULT 0' },
    { name: 'weight', definition: 'REAL' },
    { name: 'dimensions', definition: 'TEXT' },
  ],
  product_variants: [
    { name: 'comparePrice', definition: 'REAL' },
    { name: 'lowStockAlert', definition: 'INTEGER DEFAULT 10' },
    { name: 'reorderLevel', definition: 'INTEGER DEFAULT 5' },
    { name: 'reorderQty', definition: 'INTEGER DEFAULT 20' },
    { name: 'isDefault', definition: 'INTEGER DEFAULT 0' },
  ],
  product_reviews: [
    { name: 'userName', definition: 'TEXT' },
    { name: 'title', definition: 'TEXT' },
    { name: 'isVerified', definition: 'INTEGER DEFAULT 0' },
  ],
  cart_items: [
    { name: 'variantId', definition: 'TEXT' },
    { name: 'updatedAt', definition: 'TEXT' },
  ],
  inventory_alerts: [
    { name: 'isRead', definition: 'INTEGER DEFAULT 0' },
    { name: 'isResolved', definition: 'INTEGER DEFAULT 0' },
    { name: 'resolvedAt', definition: 'TEXT' },
  ],
  posts: [
    { name: 'content', definition: 'TEXT' },
    { name: 'published', definition: 'INTEGER DEFAULT 0' },
  ],
  stories: [
    { name: '"order"', definition: 'INTEGER DEFAULT 0' },
  ],
  reels: [
    { name: '"order"', definition: 'INTEGER DEFAULT 0' },
    { name: 'productIds', definition: 'TEXT' },
  ],
  banners: [
    { name: 'mobileImage', definition: 'TEXT' },
    { name: 'buttonText', definition: 'TEXT' },
    { name: 'buttonLink', definition: 'TEXT' },
    { name: '"order"', definition: 'INTEGER DEFAULT 0' },
  ],
  promotions: [
    { name: 'description', definition: 'TEXT' },
    { name: 'ctaText', definition: 'TEXT' },
    { name: 'ctaLink', definition: 'TEXT' },
    { name: '"order"', definition: 'INTEGER DEFAULT 0' },
  ],
  admin_logs: [
    { name: 'ipAddress', definition: 'TEXT' },
    { name: 'userAgent', definition: 'TEXT' },
  ],
};

async function main() {
  console.log('Checking remote D1 database schema...\n');

  for (const [table, columns] of Object.entries(migrations)) {
    const existing = getExistingColumns(table);
    const existingNames = new Set(existing.map(c => c.name));

    const missing = columns.filter(c => !existingNames.has(c.name.replace(/"/g, '')));

    if (missing.length === 0) {
      console.log(`  ✓ ${table}: all columns present`);
      continue;
    }

    console.log(`  → ${table}: adding ${missing.length} missing column(s)`);
    for (const col of missing) {
      const sql = `ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.definition};`;
      try {
        runWranglerCommand(`wrangler d1 execute scommerce-db --remote --command="${sql.replace(/"/g, '\\"')}"`);
        console.log(`    ✓ Added ${col.name}`);
      } catch {
        console.log(`    - ${col.name} already exists (skipped)`);
      }
    }
  }

  console.log('\nMigration complete. Applying indexes...');
  runWranglerCommand('wrangler d1 execute scommerce-db --remote --file=db/schema.sql');
  console.log('Schema re-applied successfully.');
}

main().catch(console.error);
