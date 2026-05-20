import { db } from '@/lib/db';
import { brands } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type BrandCreateInput = Omit<Prisma.brandsCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type BrandUpdateInput = Partial<BrandCreateInput>;

class BrandRepository {
  async findById(id: string): Promise<brands | null> {
    return db.brands.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<brands | null> {
    return db.brands.findUnique({
      where: { slug },
    });
  }

  async findAll(options?: {
    activeOnly?: boolean;
    featuredOnly?: boolean;
    includeProductCount?: boolean;
  }): Promise<(brands & { productCount?: number })[]> {
    const { activeOnly = false, featuredOnly = false, includeProductCount = false } = options || {};

    let where: any = {};
    if (activeOnly) {
      where.isActive = 1;
    }
    if (featuredOnly) {
      where.featured = 1;
    }

    const brands = await db.brands.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    if (includeProductCount) {
      const brandsWithCount = await Promise.all(
        brands.map(async (brand) => {
          const productCount = await db.products.count({
            where: { brandId: brand.id },
          });
          return {
            ...brand,
            productCount,
          };
        })
      );
      return brandsWithCount;
    }

    return brands;
  }

  async search(query: string, activeOnly: boolean = false): Promise<brands[]> {
    let where: any = {
      OR: [
        { name: { contains: query } },
        { slug: { contains: query.toLowerCase() } },
      ],
    };

    if (activeOnly) {
      where.isActive = 1;
    }

    return db.brands.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      take: 20,
    });
  }

  async create(data: BrandCreateInput): Promise<brands> {
    return db.brands.create({
      data: {
        ...data,
        id: `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, data: BrandUpdateInput): Promise<brands | null> {
    return db.brands.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<brands | null> {
    return db.brands.delete({
      where: { id },
    });
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const { activeOnly = false } = options || {};

    const where = activeOnly ? { isActive: 1 } : {};

    return db.brands.count({ where });
  }

  async checkUsage(id: string): Promise<{ products: number }> {
    const products = await db.products.count({
      where: { brandId: id },
    });

    return { products };
  }

  async getFeatured(limit?: number): Promise<brands[]> {
    return db.brands.findMany({
      where: {
        isActive: 1,
        featured: 1,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      take: limit,
    });
  }
}

export const brandRepository = new BrandRepository();
