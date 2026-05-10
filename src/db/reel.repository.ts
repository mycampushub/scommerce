import { Env, Reel } from '@/db/types';
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

export class ReelRepository {
  /**
   * Find reel by ID
   */
  static async findById(env: Env | null, id: string): Promise<Reel | null> {
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
      order: reel.order || reel.orderNum,
      orderNum: reel.order || reel.orderNum
    };
  }

  /**
   * Create new reel
   */
  static async create(env: Env | null, data: {
    title: string;
    thumbnail: string;
    videoUrl: string;
    productIds?: string[];
    isActive?: boolean;
    orderNum?: number;
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
      data.orderNum || 0,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update reel
   */
  static async update(env: Env | null, id: string, data: Partial<Reel>): Promise<Reel | null> {
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
    if (data.orderNum !== undefined) {
      updates.push('"order" = ?');
      values.push(data.orderNum);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE reels SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete reel
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM reels WHERE id = ?', id);
  }

  /**
   * Get all active reels
   */
  static async findAllActive(env : Env | null): Promise<Reel[]> {
    const reels = await queryAll<any>(
      env,
      'SELECT * FROM reels WHERE isActive = 1 ORDER BY "order" ASC, createdAt DESC'
    );
    // Parse JSON fields for each reel
    return reels.map(reel => ({
      ...reel,
      productIds: parseJSON<string[]>(reel.productIds) || [],
      isActive: typeof reel.isActive === 'boolean' ? reel.isActive : Boolean(reel.isActive),
      order: reel.order || reel.orderNum,
      orderNum: reel.order || reel.orderNum
    }));
  }

  /**
   * Get all reels (with pagination)
   */
  static async findAll(env : Env | null): Promise<Reel[]> {
    const reels = await queryAll<any>(
      env,
      'SELECT * FROM reels ORDER BY "order" ASC, createdAt DESC'
    );
    // Parse JSON fields for each reel
    return reels.map(reel => ({
      ...reel,
      productIds: parseJSON<string[]>(reel.productIds) || [],
      isActive: typeof reel.isActive === 'boolean' ? reel.isActive : Boolean(reel.isActive),
      order: reel.order || reel.orderNum,
      orderNum: reel.order || reel.orderNum
    }));
  }

  /**
   * Reorder reels
   */
  static async reorder(env: Env | null, reelIds: string[]): Promise<void> {
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
}
