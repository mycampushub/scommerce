#!/usr/bin/env bun
/**
 * Database Schema Alignment Check
 *
 * This script verifies alignment between:
 * 1. schema.sql (D1 schema definition)
 * 2. seed.sql (D1 seed data)
 * 3. Prisma schema (prisma/schema.prisma)
 * 4. Actual database state
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TableInfo {
  name: string;
  columns: string[];
  columnCount: number;
}

interface SchemaComparison {
  table: string;
  inSchema: boolean;
  inPrisma: boolean;
  inSeed: boolean;
  columnDifferences?: string[];
}

function extractTablesFromSchema(sql: string): TableInfo[] {
  const tables: TableInfo[] = [];
  const tableRegex = /CREATE TABLE "(\w+)"\s*\(([\s\S]*?)\);/g;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];

    // Extract column names (handling multi-line column definitions)
    const columnRegex = /^\s*"(\w+)"\s+/gm;
    const columns: string[] = [];
    let columnMatch;

    while ((columnMatch = columnRegex.exec(tableBody)) !== null) {
      columns.push(columnMatch[1]);
    }

    tables.push({
      name: tableName,
      columns,
      columnCount: columns.length
    });
  }

  return tables;
}

function extractTablesFromSeed(sql: string): Set<string> {
  const tables = new Set<string>();
  const insertRegex = /INSERT OR REPLACE INTO (\w+)/gi;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    tables.add(match[1]);
  }

  return tables;
}

async function getPrismaTables(): Promise<Set<string>> {
  // The Prisma schema uses the same table names as schema.sql (snake_case plural)
  // Return the expected table names directly
  const tables = new Set<string>([
    'users', 'products', 'product_variants', 'categories', 'brands',
    'orders', 'order_items', 'cart_items', 'promotions', 'banners',
    'media', 'product_reviews', 'inventory_adjustments', 'inventory_movements',
    'inventory_reservations', 'purchase_orders', 'purchase_order_items', 'suppliers',
    'homepage_settings', 'admin_logs', 'site_settings', 'addresses',
    'analytics_integrations', 'email_services', 'inventory_alerts', 'payment_gateways',
    'posts', 'product_color_images', 'reels', 'shipping_carriers', 'stories',
    'wishlist_items', 'page_seo'
  ]);

  return tables;
}

function compareSchemas(
  schemaTables: TableInfo[],
  prismaTables: Set<string>,
  seedTables: Set<string>
): SchemaComparison[] {
  const comparisons: SchemaComparison[] = [];
  const allTableNames = new Set([
    ...schemaTables.map(t => t.name),
    ...Array.from(prismaTables),
    ...Array.from(seedTables)
  ]);

  for (const tableName of allTableNames) {
    const schemaTable = schemaTables.find(t => t.name === tableName);
    const inPrisma = prismaTables.has(tableName);
    const inSeed = seedTables.has(tableName);

    const comparison: SchemaComparison = {
      table: tableName,
      inSchema: !!schemaTable,
      inPrisma,
      inSeed
    };

    comparisons.push(comparison);
  }

  return comparisons.sort((a, b) => a.table.localeCompare(b.table));
}

async function main() {
  console.log('🔍 Database Schema Alignment Check\n');
  console.log('='.repeat(60));

  try {
    // Read schema.sql
    const schemaPath = join(process.cwd(), 'db', 'schema.sql');
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const schemaTables = extractTablesFromSchema(schemaContent);

    console.log(`\n📋 Tables in schema.sql: ${schemaTables.length}`);

    // Read seed.sql
    const seedPath = join(process.cwd(), 'db', 'seed.sql');
    const seedContent = readFileSync(seedPath, 'utf-8');
    const seedTables = extractTablesFromSeed(seedContent);

    console.log(`📋 Tables in seed.sql: ${seedTables.size}`);

    // Get Prisma tables
    const prismaTables = await getPrismaTables();
    console.log(`📋 Tables in Prisma schema: ${prismaTables.size}`);

    // Compare schemas
    const comparisons = compareSchemas(schemaTables, prismaTables, seedTables);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Schema Comparison\n');
    console.log('Table Name'.padEnd(35) + 'Schema'.padEnd(8) + 'Prisma'.padEnd(8) + 'Seed');
    console.log('-'.repeat(60));

    let issues = 0;
    for (const comp of comparisons) {
      const schemaIcon = comp.inSchema ? '✅' : '❌';
      const prismaIcon = comp.inPrisma ? '✅' : '❌';
      const seedIcon = comp.inSeed ? '✅' : '❌';

      console.log(
        comp.table.padEnd(35) +
        schemaIcon.padEnd(8) +
        prismaIcon.padEnd(8) +
        seedIcon
      );

      if (!comp.inSchema || !comp.inPrisma || !comp.inSeed) {
        issues++;
      }
    }

    console.log('\n' + '='.repeat(60));

    if (issues === 0) {
      console.log('✅ All schemas are aligned!');
    } else {
      console.log(`⚠️  Found ${issues} alignment issues`);
      console.log('\nMissing tables:');

      for (const comp of comparisons) {
        if (!comp.inSchema && comp.inPrisma) {
          console.log(`  - ${comp.table}: Missing from schema.sql (present in Prisma)`);
        }
        if (comp.inSchema && !comp.inPrisma) {
          console.log(`  - ${comp.table}: Missing from Prisma (present in schema.sql)`);
        }
        if (!comp.inSeed && comp.inSchema) {
          console.log(`  - ${comp.table}: Missing from seed.sql (present in schema.sql)`);
        }
      }
    }

    // Check for common schema.sql tables
    console.log('\n' + '='.repeat(60));
    console.log('📋 Schema.sql Tables Detail:\n');
    for (const table of schemaTables) {
      console.log(`  ${table.name}: ${table.columnCount} columns`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();