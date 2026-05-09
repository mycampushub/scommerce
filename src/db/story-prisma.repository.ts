/**
 * Story Repository - Prisma-based for local development
 * Falls back to Prisma when D1 is not available
 */

import { prisma } from '@/lib/database';
import { Env } from '@/db/types';
import { generateId, now, boolToNumber, parseJSON, stringifyJSON } from '@/db/db';

export interface Story {
  id: string;
  title: string;
  thumbnail: string;
  images: string[];
  isActive: boolean;
  order: number;
  orderNum: number;
  createdAt: string;
  updatedAt: string;
}

export class StoryRepositoryPrisma {
  /**
   * Find story by ID
   */
  static async findById(_env: Env | null, id: string): Promise<Story | null> {
    try {
      const story = await prisma.story.findUnique({
        where: { id }
      });

      if (!story) return null;

      return {
        id: story.id,
        title: story.title,
        thumbnail: story.thumbnail,
        images: parseJSON<string[]>(story.images) || [],
        isActive: story.isActive === 1,
        order: story.order,
        orderNum: story.order,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('[StoryRepositoryPrisma] findById error:', error);
      return null;
    }
  }

  /**
   * Create new story
   */
  static async create(_env: Env | null, data: {
    title: string;
    thumbnail: string;
    images: string[];
    isActive?: boolean;
    orderNum?: number;
  }): Promise<Story | null> {
    try {
      const orderNum = data.orderNum || 0;

      const story = await prisma.story.create({
        data: {
          id: generateId(),
          title: data.title,
          thumbnail: data.thumbnail,
          images: stringifyJSON(data.images),
          isActive: boolToNumber(data.isActive !== undefined ? data.isActive : true),
          order: orderNum
        }
      });

      return {
        id: story.id,
        title: story.title,
        thumbnail: story.thumbnail,
        images: parseJSON<string[]>(story.images) || [],
        isActive: story.isActive === 1,
        order: story.order,
        orderNum: story.order,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('[StoryRepositoryPrisma] create error:', error);
      return null;
    }
  }

  /**
   * Update story
   */
  static async update(_env: Env | null, id: string, data: Partial<Story>): Promise<Story | null> {
    try {
      const updates: any = {};

      if (data.title !== undefined) updates.title = data.title;
      if (data.thumbnail !== undefined) updates.thumbnail = data.thumbnail;
      if (data.images !== undefined) updates.images = stringifyJSON(data.images);
      if (data.isActive !== undefined) updates.isActive = boolToNumber(data.isActive);
      if (data.orderNum !== undefined) updates.order = data.orderNum;

      const story = await prisma.story.update({
        where: { id },
        data: updates
      });

      return {
        id: story.id,
        title: story.title,
        thumbnail: story.thumbnail,
        images: parseJSON<string[]>(story.images) || [],
        isActive: story.isActive === 1,
        order: story.order,
        orderNum: story.order,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('[StoryRepositoryPrisma] update error:', error);
      return null;
    }
  }

  /**
   * Delete story
   */
  static async delete(_env: Env | null, id: string): Promise<void> {
    try {
      await prisma.story.delete({
        where: { id }
      });
    } catch (error) {
      console.error('[StoryRepositoryPrisma] delete error:', error);
    }
  }

  /**
   * Get all active stories
   */
  static async findAllActive(_env: Env | null): Promise<Story[]> {
    try {
      const stories = await prisma.story.findMany({
        where: { isActive: 1 },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });

      return stories.map(story => ({
        id: story.id,
        title: story.title,
        thumbnail: story.thumbnail,
        images: parseJSON<string[]>(story.images) || [],
        isActive: story.isActive === 1,
        order: story.order,
        orderNum: story.order,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('[StoryRepositoryPrisma] findAllActive error:', error);
      return [];
    }
  }

  /**
   * Get all stories
   */
  static async findAll(_env: Env | null): Promise<Story[]> {
    try {
      const stories = await prisma.story.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });

      return stories.map(story => ({
        id: story.id,
        title: story.title,
        thumbnail: story.thumbnail,
        images: parseJSON<string[]>(story.images) || [],
        isActive: story.isActive === 1,
        order: story.order,
        orderNum: story.order,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('[StoryRepositoryPrisma] findAll error:', error);
      return [];
    }
  }

  /**
   * Reorder stories
   */
  static async reorder(_env: Env | null, storyIds: string[]): Promise<void> {
    try {
      await prisma.$transaction(
        storyIds.map((id, index) =>
          prisma.story.update({
            where: { id },
            data: { order: index }
          })
        )
      );
    } catch (error) {
      console.error('[StoryRepositoryPrisma] reorder error:', error);
    }
  }
}
