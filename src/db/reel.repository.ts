import { Env, Reel } from '@/db/types';
import {
  generateId,
  boolToNumber,
  numberToBool,
  now,
  queryFirst,
  queryAll,
  execute,
  parseJSON,
  stringifyJSON,
} from '@/db/db';

export class ReelRepository {
  /**
   * Find reel by ID
   */
  static async findById(env: Env, id: string): Promise<Reel | null> {
    const reel = await queryFirst<Reel>(
      env,
      'SELECT * FROM reels WHERE id = ? LIMIT 1',
      id
    );
    if (reel && reel.productIds) {
      reel.productIds = parseJSON<string[]>(reel.productIds) || [];
    }
    return reel;
  }

  /**
   * Create new reel
   */
  static async create(env: Env, data: {
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
      `INSERT INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, orderNum, createdAt, updatedAt)
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
  static async update(env: Env, id: string, data: Partial<Reel>): Promise<Reel | null> {
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
      values.push(boolToNumber(data.isActive));
    }
    if (data.orderNum !== undefined) {
      updates.push('orderNum = ?');
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
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM reels WHERE id = ?', id);
  }

  /**
   * Get all active reels
   */
  static async findAllActive(env: Env): Promise<Reel[]> {
    const reels = await queryAll<Reel>(
      env,
      'SELECT * FROM reels WHERE isActive = 1 ORDER BY orderNum ASC, createdAt DESC'
    );
    return reels.map(r => ({
      ...r,
      isActive: numberToBool(r.isActive),
      productIds: parseJSON<string[]>(r.productIds) || [],
    }));
  }

  /**
   * Get all reels (with pagination)
   */
  static async findAll(env: Env): Promise<Reel[]> {
    const reels = await queryAll<Reel>(
      env,
      'SELECT * FROM reels ORDER BY orderNum ASC, createdAt DESC'
    );
    return reels.map(r => ({
      ...r,
      isActive: numberToBool(r.isActive),
      productIds: parseJSON<string[]>(r.productIds) || [],
    }));
  }

  /**
   * Reorder reels
   */
  static async reorder(env: Env, reelIds: string[]): Promise<void> {
    for (let i = 0; i < reelIds.length; i++) {
      await execute(
        env,
        'UPDATE reels SET orderNum = ?, updatedAt = ? WHERE id = ?',
        i,
        now(),
        reelIds[i]
      );
    }
  }
}
