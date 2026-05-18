import { Env, Story, Reel } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  stringifyJSON,
  parseJSON,
} from '@/db/db';

/**
 * MediaRepository - Unified repository for Stories and Reels
 * Handles both story and reel operations with type safety
 */
export class MediaRepository {
  // ==================== STORY METHODS ====================
  /**
   * Find story by ID
   */
  static async findStoryById(env: Env | null, id: string): Promise<Story | null> {
    const story = await queryFirst<any>(
      env,
      'SELECT * FROM stories WHERE id = ? LIMIT 1',
      id
    );
    if (!story) return null;

    // Parse JSON fields
    return {
      ...story,
      images: parseJSON<string[]>(story.images) || [],
      isActive: typeof story.isActive === 'boolean' ? story.isActive : Boolean(story.isActive),
      order: story.order || 0,
    };
  }

  /**
   * Create new story
   */
  static async createStory(env: Env | null, data: {
    title: string;
    thumbnail: string;
    images: string[];
    isActive?: boolean;
    order?: number;
  }): Promise<Story> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO stories (id, title, thumbnail, images, isActive, "order", createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.title,
      data.thumbnail,
      stringifyJSON(data.images),
      boolToNumber(data.isActive !== undefined ? data.isActive : true),
      data.order || 0,
      currentTime,
      currentTime
    );

    return (await this.findStoryById(env, id))!;
  }

  /**
   * Update story
   */
  static async updateStory(env: Env | null, id: string, data: Partial<Story>): Promise<Story | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      values.push(data.thumbnail);
    }
    if (data.images !== undefined) {
      updates.push('images = ?');
      values.push(stringifyJSON(Array.isArray(data.images) ? data.images : []));
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(typeof data.isActive === 'boolean' ? boolToNumber(data.isActive) : data.isActive);
    }
    if (data.order !== undefined) {
      updates.push('"order" = ?');
      values.push(data.order);
    }

    if (updates.length === 0) return this.findStoryById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE stories SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findStoryById(env, id);
  }

  /**
   * Delete story
   */
  static async deleteStory(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM stories WHERE id = ?', id);
  }

  /**
   * Get all active stories
   */
  static async findAllActiveStories(env: Env | null): Promise<Story[]> {
    try {
      const stories = await queryAll<any>(
        env,
        'SELECT * FROM stories WHERE isActive = 1 ORDER BY "order" ASC, createdAt DESC'
      );
      // Ensure stories is always an array
      const storiesArray = Array.isArray(stories) ? stories : [];
      // Parse JSON fields for each story
      return storiesArray.map(story => ({
        ...story,
        images: parseJSON<string[]>(story.images) || [],
        isActive: typeof story.isActive === 'boolean' ? story.isActive : Boolean(story.isActive),
        order: story.order || 0,
      }));
    } catch (error) {
      console.error('[MediaRepository] Error fetching active stories:', error);
      return [];
    }
  }

  /**
   * Get all stories (with pagination)
   */
  static async findAllStories(env: Env | null): Promise<Story[]> {
    try {
      const stories = await queryAll<any>(
        env,
        'SELECT * FROM stories ORDER BY "order" ASC, createdAt DESC'
      );
      // Ensure stories is always an array
      const storiesArray = Array.isArray(stories) ? stories : [];
      // Parse JSON fields for each story
      return storiesArray.map(story => ({
        ...story,
        images: parseJSON<string[]>(story.images) || [],
        isActive: typeof story.isActive === 'boolean' ? story.isActive : Boolean(story.isActive),
        order: story.order || 0,
      }));
    } catch (error) {
      console.error('[MediaRepository] Error fetching stories:', error);
      return [];
    }
  }

  /**
   * Reorder stories
   */
  static async reorderStories(env: Env | null, storyIds: string[]): Promise<void> {
    for (let i = 0; i < storyIds.length; i++) {
      await execute(
        env,
        'UPDATE stories SET "order" = ?, updatedAt = ? WHERE id = ?',
        i,
        now(),
        storyIds[i]
      );
    }
  }

  // ==================== REEL METHODS ====================
  /**
   * Find reel by ID
   */
  static async findReelById(env: Env | null, id: string): Promise<Reel | null> {
    const reel = await queryFirst<any>(
      env,
      'SELECT * FROM reels WHERE id = ? LIMIT 1',
      id
    );
    if (!reel) return null;

    // Parse JSON fields
    return {
      ...reel,
      productIds: parseJSON<string[]>(reel.productIds) || [],
      isActive: typeof reel.isActive === 'boolean' ? reel.isActive : Boolean(reel.isActive),
      order: reel.order || 0,
    };
  }

  /**
   * Create new reel
   */
  static async createReel(env: Env | null, data: {
    title: string;
    thumbnail: string;
    videoUrl: string;
    productIds?: string[];
    isActive?: boolean;
    order?: number;
  }): Promise<Reel> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, "order", createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.title,
      data.thumbnail,
      data.videoUrl,
      data.productIds ? stringifyJSON(data.productIds) : null,
      boolToNumber(data.isActive !== undefined ? data.isActive : true),
      data.order || 0,
      currentTime,
      currentTime
    );

    return (await this.findReelById(env, id))!;
  }

  /**
   * Update reel
   */
  static async updateReel(env: Env | null, id: string, data: Partial<Reel>): Promise<Reel | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      values.push(data.thumbnail);
    }
    if (data.videoUrl !== undefined) {
      updates.push('videoUrl = ?');
      values.push(data.videoUrl);
    }
    if (data.productIds !== undefined) {
      updates.push('productIds = ?');
      values.push(stringifyJSON(data.productIds));
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(typeof data.isActive === 'boolean' ? boolToNumber(data.isActive) : data.isActive);
    }
    if (data.order !== undefined) {
      updates.push('"order" = ?');
      values.push(data.order);
    }

    if (updates.length === 0) return this.findReelById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE reels SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findReelById(env, id);
  }

  /**
   * Delete reel
   */
  static async deleteReel(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM reels WHERE id = ?', id);
  }

  /**
   * Get all active reels
   */
  static async findAllActiveReels(env: Env | null): Promise<Reel[]> {
    try {
      const reels = await queryAll<any>(
        env,
        'SELECT * FROM reels WHERE isActive = 1 ORDER BY "order" ASC, createdAt DESC'
      );
      // Ensure reels is always an array
      const reelsArray = Array.isArray(reels) ? reels : [];
      // Parse JSON fields for each reel
      return reelsArray.map(reel => ({
        ...reel,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: typeof reel.isActive === 'boolean' ? reel.isActive : Boolean(reel.isActive),
        order: reel.order || 0,
      }));
    } catch (error) {
      console.error('[MediaRepository] Error fetching active reels:', error);
      return [];
    }
  }

  /**
   * Get all reels (with pagination)
   */
  static async findAllReels(env: Env | null): Promise<Reel[]> {
    try {
      const reels = await queryAll<any>(
        env,
        'SELECT * FROM reels ORDER BY "order" ASC, createdAt DESC'
      );
      // Ensure reels is always an array
      const reelsArray = Array.isArray(reels) ? reels : [];
      // Parse JSON fields for each reel
      return reelsArray.map(reel => ({
        ...reel,
        productIds: parseJSON<string[]>(reel.productIds) || [],
        isActive: typeof reel.isActive === 'boolean' ? reel.isActive : Boolean(reel.isActive),
        order: reel.order || 0,
      }));
    } catch (error) {
      console.error('[MediaRepository] Error fetching reels:', error);
      return [];
    }
  }

  /**
   * Reorder reels
   */
  static async reorderReels(env: Env | null, reelIds: string[]): Promise<void> {
    for (let i = 0; i < reelIds.length; i++) {
      await execute(
        env,
        'UPDATE reels SET "order" = ?, updatedAt = ? WHERE id = ?',
        i,
        now(),
        reelIds[i]
      );
    }
  }

  // ==================== BACKWARD COMPATIBILITY ====================
  /**
   * Backward compatibility: Old StoryRepository class
   * @deprecated Use MediaRepository instead
   */
  static findById = this.findStoryById;
  static create = this.createStory;
  static update = this.updateStory;
  static delete = this.deleteStory;
  static findAllActive = this.findAllActiveStories;
  static findAll = this.findAllStories;
  static reorder = this.reorderStories;
}

/**
 * Backward compatibility: Export StoryRepository alias
 * @deprecated Use MediaRepository instead
 */
export const StoryRepository = MediaRepository;

/**
 * Backward compatibility: Export ReelRepository alias
 * @deprecated Use MediaRepository instead
 */
export class ReelRepository {
  static findById = MediaRepository.findReelById;
  static create = MediaRepository.createReel;
  static update = MediaRepository.updateReel;
  static delete = MediaRepository.deleteReel;
  static findAllActive = MediaRepository.findAllActiveReels;
  static findAll = MediaRepository.findAllReels;
  static reorder = MediaRepository.reorderReels;
}
