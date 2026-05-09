/**
 * Reel Repository - Prisma-based for local development
 * Falls back to Prisma when D1 is not available
 */

import { prisma } from '@/lib/database';
import { Env } from '@/db/types';
import { generateId, now, boolToNumber, parseJSON, stringifyJSON } from '@/db/db';

export interface Reel {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  productIds: string[];
  isActive: boolean;
  order: number;
  orderNum: number;
  createdAt: string;
  updatedAt: string;
}

export class ReelRepositoryPrisma {
  /**
   * Find reel by ID
   */
  static async findById(_env: Env | null, id: string): Promise<Reel | null> {
    try {
      const reel = await prisma.reel.findUnique({
        where: { id }
      });

      if (!reel) return null;

      return {
        id: reel.id,
        title: reel.title,
        thumbnail: reel.thumbnail,
        videoUrl: reel.videoUrl,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: reel.isActive === 1,
        order: reel.order,
        orderNum: reel.order,
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('[ReelRepositoryPrisma] findById error:', error);
      return null;
    }
  }

  /**
   * Create new reel
   */
  static async create(_env: Env | null, data: {
    title: string;
    thumbnail: string;
    videoUrl: string;
    productIds?: string[];
    isActive?: boolean;
    orderNum?: number;
  }): Promise<Reel | null> {
    try {
      const orderNum = data.orderNum || 0;

      const reel = await prisma.reel.create({
        data: {
          id: generateId(),
          title: data.title,
          thumbnail: data.thumbnail,
          videoUrl: data.videoUrl,
          productIds: data.productIds ? stringifyJSON(data.productIds) : null,
          isActive: boolToNumber(data.isActive !== undefined ? data.isActive : true),
          order: orderNum
        }
      });

      return {
        id: reel.id,
        title: reel.title,
        thumbnail: reel.thumbnail,
        videoUrl: reel.videoUrl,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: reel.isActive === 1,
        order: reel.order,
        orderNum: reel.order,
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('[ReelRepositoryPrisma] create error:', error);
      return null;
    }
  }

  /**
   * Update reel
   */
  static async update(_env: Env | null, id: string, data: Partial<Reel>): Promise<Reel | null> {
    try {
      const updates: any = {};

      if (data.title !== undefined) updates.title = data.title;
      if (data.thumbnail !== undefined) updates.thumbnail = data.thumbnail;
      if (data.videoUrl !== undefined) updates.videoUrl = data.videoUrl;
      if (data.productIds !== undefined) updates.productIds = stringifyJSON(data.productIds);
      if (data.isActive !== undefined) updates.isActive = boolToNumber(data.isActive);
      if (data.orderNum !== undefined) updates.order = data.orderNum;

      const reel = await prisma.reel.update({
        where: { id },
        data: updates
      });

      return {
        id: reel.id,
        title: reel.title,
        thumbnail: reel.thumbnail,
        videoUrl: reel.videoUrl,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: reel.isActive === 1,
        order: reel.order,
        orderNum: reel.order,
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('[ReelRepositoryPrisma] update error:', error);
      return null;
    }
  }

  /**
   * Delete reel
   */
  static async delete(_env: Env | null, id: string): Promise<void> {
    try {
      await prisma.reel.delete({
        where: { id }
      });
    } catch (error) {
      console.error('[ReelRepositoryPrisma] delete error:', error);
    }
  }

  /**
   * Get all active reels
   */
  static async findAllActive(_env: Env | null): Promise<Reel[]> {
    try {
      const reels = await prisma.reel.findMany({
        where: { isActive: 1 },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });

      return reels.map(reel => ({
        id: reel.id,
        title: reel.title,
        thumbnail: reel.thumbnail,
        videoUrl: reel.videoUrl,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: reel.isActive === 1,
        order: reel.order,
        orderNum: reel.order,
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('[ReelRepositoryPrisma] findAllActive error:', error);
      return [];
    }
  }

  /**
   * Get all reels
   */
  static async findAll(_env: Env | null): Promise<Reel[]> {
    try {
      const reels = await prisma.reel.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });

      return reels.map(reel => ({
        id: reel.id,
        title: reel.title,
        thumbnail: reel.thumbnail,
        videoUrl: reel.videoUrl,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: reel.isActive === 1,
        order: reel.order,
        orderNum: reel.order,
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('[ReelRepositoryPrisma] findAll error:', error);
      return [];
    }
  }

  /**
   * Reorder reels
   */
  static async reorder(_env: Env | null, reelIds: string[]): Promise<void> {
    try {
      await prisma.$transaction(
        reelIds.map((id, index) =>
          prisma.reel.update({
            where: { id },
            data: { order: index }
          })
        )
      );
    } catch (error) {
      console.error('[ReelRepositoryPrisma] reorder error:', error);
    }
  }
}
